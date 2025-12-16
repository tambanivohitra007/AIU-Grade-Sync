import React from 'react';
import { MatchedStudent, ProcessingConfig, ColumnMapping } from '../types';
import { getLetterGrade, getGradeColorInfo } from '../services/gradeUtils';

interface GradeDetailModalProps {
  student: MatchedStudent | null;
  config: ProcessingConfig;
  mapping: ColumnMapping;
  isOpen: boolean;
  onClose: () => void;
}

const GradeDetailModal: React.FC<GradeDetailModalProps> = ({ student, config, mapping, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  const weightedDaily = student.daily * (config.dailyPercentage / 100);
  const weightedMidterm = student.midterm * (config.midtermPercentage / 100);
  const weightedFinal = student.final * (config.finalPercentage / 100);
  const totalRaw = weightedDaily + weightedMidterm + weightedFinal;
  const totalRounded = Math.ceil(totalRaw);
  
  const grade = getLetterGrade(totalRounded);
  const colorInfo = getGradeColorInfo(totalRounded, config.passingGrade);

  // Filter out empty or irrelevant keys from raw data for display
  const rawData = Object.entries(student.raw || {})
    .filter(([key, value]) => key && value && value.trim() !== '')
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in transition-opacity" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform scale-100 transition-all border border-slate-200 dark:border-slate-700 animate-[fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950 p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start shrink-0">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                     <i className="fas fa-user-graduate"></i>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{student.firstName} {student.lastName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: {student.id}</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
            >
                <i className="fas fa-times text-lg"></i>
            </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* LEFT: Grade Calculation */}
                <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                        <i className="fas fa-calculator mr-2"></i> Calculation Logic
                    </h4>
                    
                    <div className="space-y-4">
                        {/* Breakdown Item: Daily */}
                        <div className="group">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center"><i className="fas fa-book-open w-5 text-center mr-1 text-xs opacity-70"></i> Daily</span>
                                <div className="text-right">
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{student.daily.toFixed(1)}</span>
                                    <span className="text-xs text-slate-400 ml-1">raw</span>
                                </div>
                            </div>
                            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                                <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(student.daily, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-slate-700/50">
                                <span><span className="font-semibold text-blue-600 dark:text-blue-400">{config.dailyPercentage}%</span> weight</span>
                                <span className="font-mono text-slate-600 dark:text-slate-300">+{weightedDaily.toFixed(2)} pts</span>
                            </div>
                        </div>

                        {/* Breakdown Item: Midterm */}
                        <div className="group">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center"><i className="fas fa-file-alt w-5 text-center mr-1 text-xs opacity-70"></i> Midterm</span>
                                <div className="text-right">
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{student.midterm.toFixed(1)}</span>
                                    <span className="text-xs text-slate-400 ml-1">raw</span>
                                </div>
                            </div>
                            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                                <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(student.midterm, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-slate-700/50">
                                <span><span className="font-semibold text-purple-600 dark:text-purple-400">{config.midtermPercentage}%</span> weight</span>
                                <span className="font-mono text-slate-600 dark:text-slate-300">+{weightedMidterm.toFixed(2)} pts</span>
                            </div>
                        </div>

                        {/* Breakdown Item: Final */}
                        <div className="group">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center"><i className="fas fa-flag-checkered w-5 text-center mr-1 text-xs opacity-70"></i> Final</span>
                                <div className="text-right">
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{student.final.toFixed(1)}</span>
                                    <span className="text-xs text-slate-400 ml-1">raw</span>
                                </div>
                            </div>
                            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                                <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(student.final, 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-slate-700/50">
                                <span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{config.finalPercentage}%</span> weight</span>
                                <span className="font-mono text-slate-600 dark:text-slate-300">+{weightedFinal.toFixed(2)} pts</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Calculation */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sum (Exact)</span>
                            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                                {weightedDaily.toFixed(2)} + {weightedMidterm.toFixed(2)} + {weightedFinal.toFixed(2)} = <span className="font-bold text-slate-800 dark:text-slate-200">{totalRaw.toFixed(2)}</span>
                            </span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 mb-4 mt-2"></div>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-xs text-slate-400 block mb-0.5">Final Grade</span>
                                <div className={`text-3xl font-bold ${colorInfo.css}`}>
                                    {grade}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 block mb-0.5">Rounded Total</span>
                                <div className={`text-3xl font-bold ${colorInfo.css}`}>
                                    {totalRounded}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Source Data */}
                <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                        <i className="fas fa-database mr-2"></i> CSV Source Data
                    </h4>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Column Name</th>
                                    <th className="px-4 py-3 font-semibold">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {rawData.map(([key, value]) => {
                                    // Highlight logic
                                    let highlightClass = "";
                                    let badge = null;

                                    if (key === mapping.daily) {
                                        highlightClass = "bg-blue-50 dark:bg-blue-900/10";
                                        badge = <span className="ml-2 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Daily</span>;
                                    } else if (key === mapping.midterm) {
                                        highlightClass = "bg-purple-50 dark:bg-purple-900/10";
                                        badge = <span className="ml-2 text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Midterm</span>;
                                    } else if (key === mapping.final) {
                                        highlightClass = "bg-emerald-50 dark:bg-emerald-900/10";
                                        badge = <span className="ml-2 text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Final</span>;
                                    }

                                    return (
                                        <tr key={key} className={`hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors ${highlightClass}`}>
                                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium break-words max-w-[150px]">
                                                {key}
                                                {badge}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-mono break-all">
                                                {value}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {rawData.length === 0 && (
                            <div className="p-4 text-center text-slate-500 italic">No CSV data available.</div>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 italic">
                        * Highlighted rows indicate the columns currently mapped for grade calculation. Other rows are shown for context/proof.
                    </p>
                </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
                Close Details
            </button>
        </div>
      </div>
    </div>
  );
};

export default GradeDetailModal;