import React, { useState, useEffect } from 'react';
import StepIndicator from './components/StepIndicator';
import FileUpload from './components/FileUpload';
import PreviewTable from './components/PreviewTable';
import ApiKeyModal from './components/ApiKeyModal';
import { Step, ColumnMapping, ProcessingConfig, ProcessingResult, MatchedStudent } from './types';
import { determineColumnMapping } from './services/geminiService';
import { getCSVHeaders, parseMoodleCSV, matchStudentsToTemplate, writeGradesToTemplate } from './services/excelService';
import { GRADE_SCALE } from './services/gradeUtils';

const App: React.FC = () => {
  // State
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  const [mapping, setMapping] = useState<ColumnMapping>({
    id: '', firstName: '', lastName: '', daily: '', midterm: '', final: ''
  });
  
  const [config, setConfig] = useState<ProcessingConfig>({
    dailyPercentage: 10,
    midtermPercentage: 40,
    finalPercentage: 50,
    passingGrade: 'D'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<MatchedStudent[]>([]);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Config, Theme & API Key from LocalStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('gradeSync_config');
    const savedTheme = localStorage.getItem('gradeSync_theme');
    const savedKey = localStorage.getItem('gradeSync_apiKey');
    
    if (savedConfig) {
        try { 
            const parsed = JSON.parse(savedConfig);
            if (!parsed.passingGrade) parsed.passingGrade = 'D';
            setConfig(parsed); 
        } catch (e) { console.error("Failed to load config", e); }
    }

    if (savedKey) {
        setApiKey(savedKey);
    } else {
        // Prompt for key on first load
        setIsKeyModalOpen(true);
    }

    if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
    } else {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);
    }
  }, []);

  // Persist Theme and Config
  useEffect(() => {
    localStorage.setItem('gradeSync_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('gradeSync_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('gradeSync_theme', 'light');
    }
  }, [isDarkMode]);

  // Validation
  const totalPercentage = parseFloat((config.dailyPercentage + config.midtermPercentage + config.finalPercentage).toFixed(2));
  const isWeightError = totalPercentage > 100;
  const isMappingComplete = Object.values(mapping).every(val => val && val.trim() !== '');

  // Effects: Analyze CSV
  useEffect(() => {
    const analyzeCSV = async () => {
      if (csvFile && step === Step.UPLOAD) {
        try {
          setIsLoading(true);
          const headers = await getCSVHeaders(csvFile);
          setCsvHeaders(headers);
          
          try {
            if (apiKey) {
                const suggestedMapping = await determineColumnMapping(headers, apiKey);
                setMapping(suggestedMapping);
            } else {
                // If no key yet, we can't auto-map, but we don't crash. 
                // The user will be prompted or can set manually.
                console.warn("Skipping AI mapping: No API Key");
                setIsKeyModalOpen(true);
            }
          } catch (err) {
            console.error("Auto-mapping failed, falling back to manual", err);
            // Don't show error message to user, just let them map manually
          }
          
          setIsLoading(false);
        } catch (err) {
          setErrorMsg("Failed to read CSV file.");
          setIsLoading(false);
        }
      }
    };

    if (csvFile && templateFile && csvHeaders.length === 0) {
       analyzeCSV();
    }
  }, [csvFile, templateFile, step, apiKey]);

  // Handlers
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gradeSync_apiKey', key);
    setIsKeyModalOpen(false);
  };

  const handleNextToConfigure = () => {
    if (!csvFile || !templateFile) {
        setErrorMsg("Please upload both files.");
        return;
    }
    setErrorMsg(null);
    setStep(Step.CONFIGURE);
  };

  const handlePreview = async () => {
    if (!csvFile || !templateFile) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
        const grades = await parseMoodleCSV(csvFile, mapping);
        if (grades.length === 0) {
            throw new Error("No valid student data found in CSV based on current mapping.");
        }

        const matchResult = await matchStudentsToTemplate(templateFile, grades);
        setMatches(matchResult.matches);
        setStep(Step.PREVIEW);
    } catch (e: any) {
        setErrorMsg(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!templateFile) return;
    setIsLoading(true);

    try {
        const result = await writeGradesToTemplate(templateFile, matches, config);
        setProcessingResult(result);
        if (result.success) {
            setStep(Step.COMPLETE);
        } else {
            setErrorMsg(result.message);
        }
    } catch (e: any) {
        setErrorMsg(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const downloadResult = () => {
    if (processingResult?.blob && templateFile) {
        const url = window.URL.createObjectURL(processingResult.blob);
        const a = document.createElement('a');
        a.href = url;
        const originalName = templateFile.name;
        const extension = originalName.endsWith('.xlsm') ? '.xlsm' : '.xlsx';
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `Processed_Grades_${dateStr}${extension}`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
  };

  const reset = () => {
    setStep(Step.UPLOAD);
    setCsvFile(null);
    setTemplateFile(null);
    setCsvHeaders([]);
    setProcessingResult(null);
    setErrorMsg(null);
    setMatches([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 transition-colors duration-500 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-100 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      
      <ApiKeyModal 
        isOpen={isKeyModalOpen}
        onSave={handleSaveApiKey}
        onClose={() => setIsKeyModalOpen(false)}
        hasKey={!!apiKey}
      />

      {/* Header Buttons */}
      <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
        <button 
            onClick={() => setIsKeyModalOpen(true)}
            className="w-10 h-10 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-110 transition-all group"
            title="Configure API Key"
        >
            <i className={`fas fa-key text-lg ${!apiKey ? 'text-red-500 animate-pulse' : 'text-purple-500'}`}></i>
        </button>
        <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-10 h-10 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-110 transition-all group"
        >
            <i className={`fas ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-500'} text-lg transition-transform duration-500 rotate-0 dark:rotate-180`}></i>
        </button>
      </div>

      <div className="max-w-5xl w-full mx-auto">
        <header className="mb-10 text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-600/10 dark:bg-purple-600/20 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-900 rounded-lg mb-5 ring-1 ring-purple-500/30 shadow-[0_0_30px_rgba(192,132,252,0.15)] transition-colors duration-300">
                <i className="fas fa-graduation-cap text-3xl text-purple-900 dark:text-primary drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]"></i>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-purple-900 dark:via-purple-100 to-slate-500 dark:to-slate-400 tracking-tight drop-shadow-sm">GradeSync AI</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-light tracking-wide">Moodle <span className="text-purple-900 dark:text-purple-400 mx-1">→</span> Excel</p>
        </header>

        <div className="w-full bg-white/60 dark:bg-slate-900/60 rounded-lg shadow-xl dark:shadow-2xl border border-white/50 dark:border-slate-800/60 overflow-hidden backdrop-blur-xl relative transition-all duration-300">
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

            <div className="p-8 md:p-10">
                <StepIndicator currentStep={step} />

                {/* ERROR MESSAGE */}
                {errorMsg && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 p-4 mb-8 rounded animate-fade-in shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <i className="fas fa-exclamation-circle text-red-500 dark:text-red-400 mt-0.5"></i>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 dark:text-red-200">{errorMsg}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 1: UPLOAD */}
                {step === Step.UPLOAD && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUpload 
                                label="1. Moodle Grades (CSV)" 
                                accept=".csv" 
                                selectedFile={csvFile}
                                onFileSelect={setCsvFile}
                                iconClass="fas fa-file-csv"
                            />
                            <FileUpload 
                                label="2. Registrar Template (Excel)" 
                                accept=".xlsx" 
                                selectedFile={templateFile}
                                onFileSelect={setTemplateFile}
                                iconClass="fas fa-file-excel"
                            />
                        </div>
                        
                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleNextToConfigure}
                                disabled={!csvFile || !templateFile || isLoading}
                                className={`px-8 py-3.5 rounded-md font-bold flex items-center space-x-2 transition-all duration-300 ${
                                    !csvFile || !templateFile || isLoading
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700' 
                                    : 'bg-gradient-to-r from-purple-900 to-purple-800 dark:from-purple-600 dark:to-purple-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] active:scale-95 border border-purple-400/20'
                                }`}
                            >
                                {isLoading ? <span>Analyzing...</span> : <span>Next Step</span>}
                                {!isLoading && <i className="fas fa-arrow-right ml-1"></i>}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: CONFIGURE */}
                {step === Step.CONFIGURE && (
                    <div className="space-y-10 animate-fade-in">
                        
                        {/* Percentage Config */}
                        <div className={`bg-slate-50 dark:bg-slate-800/30 p-6 rounded-md border relative overflow-hidden group transition-colors duration-300 ${isWeightError ? 'border-red-500/50' : 'border-slate-200 dark:border-slate-700/50'}`}>
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${isWeightError ? 'bg-red-500/5' : 'bg-purple-500/5'}`}></div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3 gap-4">
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                                    <i className={`fas fa-sliders-h mr-3 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)] ${isWeightError ? 'text-red-500 dark:text-red-400' : 'text-purple-900 dark:text-primary'}`}></i> Grade Weights
                                </h3>
                                
                                <div className="flex items-center space-x-4 w-full md:w-auto">
                                    {/* Visual Progress Bar */}
                                    <div className="h-3 w-full md:w-48 bg-slate-200 dark:bg-slate-900 rounded-sm overflow-hidden border border-slate-300 dark:border-slate-700 relative">
                                        <div 
                                            className={`h-full rounded-sm transition-all duration-500 ${
                                                isWeightError ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 
                                                totalPercentage === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 
                                                'bg-amber-400 dark:bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                                            }`}
                                            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className={`text-sm font-bold flex items-center whitespace-nowrap ${isWeightError ? 'text-red-500 dark:text-red-400' : totalPercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-yellow-500'}`}>
                                        <span>{totalPercentage}%</span>
                                        {isWeightError && <i className="fas fa-exclamation-triangle ml-2"></i>}
                                        {!isWeightError && totalPercentage === 100 && <i className="fas fa-check-circle ml-2"></i>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                                {['daily', 'midterm', 'final'].map((key) => (
                                    <div key={key}>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${isWeightError ? 'text-red-400 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {key} (%)
                                        </label>
                                        <div className="relative group/input">
                                            <input 
                                                type="number" 
                                                min="0"
                                                max="100"
                                                value={(config as any)[`${key}Percentage`]}
                                                onChange={(e) => setConfig({...config, [`${key}Percentage`]: parseFloat(e.target.value) || 0})}
                                                className={`w-full px-4 py-3 bg-white dark:bg-slate-900/80 rounded border text-slate-800 dark:text-white outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 ${
                                                    isWeightError 
                                                    ? 'border-red-300 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50' 
                                                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 group-hover/input:border-slate-400 dark:group-hover/input:border-slate-600'
                                                }`}
                                            />
                                            <span className="absolute right-4 top-3 text-slate-400 dark:text-slate-500">%</span>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Passing Grade Selector */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-500 dark:text-slate-400">
                                        Min. Passing
                                    </label>
                                    <div className="relative group/input">
                                        <select
                                            value={config.passingGrade}
                                            onChange={(e) => setConfig({...config, passingGrade: e.target.value})}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/80 rounded border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white outline-none transition-all cursor-pointer focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 hover:border-slate-400 dark:hover:border-slate-600 appearance-none"
                                        >
                                            {GRADE_SCALE.filter(g => g.label !== 'F').map(g => (
                                                <option key={g.label} value={g.label}>{g.label} ({g.min}+)</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isWeightError && (
                                <div className="mt-4 text-xs text-red-500 dark:text-red-400 font-medium flex items-center animate-pulse">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Total percentage exceeds 100%. Please adjust the weights.
                                </div>
                            )}
                        </div>

                        {/* Column Mapping */}
                        <div>
                            <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-800/50 pb-3">
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                                    <i className="fas fa-robot mr-3 text-purple-900 dark:text-primary drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"></i> Column Mapping
                                </h3>
                                {isLoading ? (
                                    <span className="text-xs text-purple-900 dark:text-primary font-medium flex items-center animate-pulse drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]">
                                        <i className="fas fa-circle-notch fa-spin mr-2"></i> AI Analyzing...
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            if(!apiKey) { setIsKeyModalOpen(true); return; }
                                            setIsLoading(true);
                                            determineColumnMapping(csvHeaders, apiKey)
                                                .then(setMapping)
                                                .catch(err => console.error(err))
                                                .finally(() => setIsLoading(false));
                                        }}
                                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-purple-900 dark:hover:text-primary font-medium transition-colors flex items-center"
                                    >
                                        <i className="fas fa-magic mr-1.5"></i> Regenerate AI Mapping
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {Object.keys(mapping).map((field) => (
                                    <div key={field} className="relative group">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 transition-colors group-hover:text-purple-900 dark:group-hover:text-purple-300/70">
                                            {field.replace(/([A-Z])/g, ' $1').trim()}
                                            {!mapping[field as keyof ColumnMapping] && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={(mapping as any)[field]}
                                                onChange={(e) => setMapping({...mapping, [field]: e.target.value})}
                                                className={`w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 rounded border text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none appearance-none transition-all cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 ${!(mapping as any)[field] ? 'border-red-300 dark:border-red-500/30' : 'border-slate-300 dark:border-slate-700'}`}
                                            >
                                                <option value="">Select Column...</option>
                                                {csvHeaders.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                                                <i className="fas fa-chevron-down text-xs"></i>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800/50">
                            <button 
                                onClick={() => setStep(Step.UPLOAD)}
                                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium px-4 py-2 transition-colors hover:drop-shadow-[0_0_5px_rgba(0,0,0,0.1)] dark:hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handlePreview}
                                disabled={isLoading || isWeightError || !isMappingComplete}
                                className={`px-8 py-3 rounded-md font-bold transition-all flex items-center space-x-2 border border-transparent ${
                                    isLoading || isWeightError || !isMappingComplete
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-700'
                                    : 'bg-gradient-to-r from-purple-900 to-purple-800 dark:from-purple-600 dark:to-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:brightness-110 active:scale-95 border-purple-400/20'
                                }`}
                            >
                                {isLoading ? <span>Matching...</span> : <span>Preview Changes</span>}
                                {!isLoading && <i className="fas fa-table"></i>}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: PREVIEW */}
                {step === Step.PREVIEW && (
                    <div className="space-y-8 animate-fade-in">
                        <PreviewTable 
                            matches={matches} 
                            config={config} 
                            mapping={mapping} 
                        />
                        
                        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800/50">
                            <button 
                                onClick={() => setStep(Step.CONFIGURE)}
                                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium px-4 py-2 transition-colors hover:drop-shadow-[0_0_5px_rgba(0,0,0,0.1)] dark:hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleProcess}
                                disabled={isLoading}
                                className={`px-8 py-3 rounded-md font-bold transition-all flex items-center space-x-2 border border-transparent ${
                                    isLoading
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-300 dark:border-slate-700'
                                    : 'bg-gradient-to-r from-purple-900 to-purple-800 dark:from-purple-600 dark:to-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:brightness-110 active:scale-95 border-purple-400/20'
                                }`}
                            >
                                {isLoading ? <span>Processing...</span> : <span>Export Excel</span>}
                                {!isLoading && <i className="fas fa-file-export"></i>}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: COMPLETE */}
                {step === Step.COMPLETE && processingResult && (
                    <div className="text-center space-y-6 py-8 animate-fade-in relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                        <div className="relative inline-flex items-center justify-center w-24 h-24 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl ring-1 ring-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                            <i className="fas fa-check text-4xl text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"></i>
                        </div>
                        
                        <div className="relative">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white drop-shadow-md">Success!</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">
                                Your grades have been synchronized and are ready for download.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-10 relative z-10">
                            <button 
                                onClick={downloadResult}
                                className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-4 rounded-md font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 transition-all flex items-center justify-center space-x-2 border border-emerald-400/20"
                            >
                                <i className="fas fa-download"></i>
                                <span>Download Updated Excel</span>
                            </button>
                            
                            <button 
                                onClick={reset}
                                className="w-full md:w-auto border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 px-6 py-4 rounded-md font-semibold hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition-all hover:border-slate-400 dark:hover:border-slate-500"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;