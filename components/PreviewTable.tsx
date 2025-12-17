import React, { useState, useMemo, useEffect } from 'react';
import { MatchedStudent, ProcessingConfig, ColumnMapping } from '../types';
import { calculateTotal, getLetterGrade, getGradeColorInfo } from '../services/gradeUtils';
import GradeDetailModal from './GradeDetailModal';
import Dashboard from './Dashboard';

interface PreviewTableProps {
  matches: MatchedStudent[];
  config: ProcessingConfig;
  mapping: ColumnMapping;
}

const ITEMS_PER_PAGE = 10;

const PreviewTable: React.FC<PreviewTableProps> = ({ matches, config, mapping }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<MatchedStudent | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('All');

  // Extract unique sheet names
  const uniqueSheets = useMemo(() => {
    const sheets = new Set(matches.map(m => m.sheetName));
    return Array.from(sheets).sort();
  }, [matches]);

  // Filter matches based on selection
  const filteredMatches = useMemo(() => {
    if (selectedSheet === 'All') return matches;
    return matches.filter(m => m.sheetName === selectedSheet);
  }, [matches, selectedSheet]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSheet]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMatches = filteredMatches.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="space-y-6">
      <GradeDetailModal 
        isOpen={!!selectedStudent}
        student={selectedStudent}
        config={config}
        mapping={mapping}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Sheet Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-2">
        <div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-white">Preview & Statistics</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400">Review calculated grades before exporting.</p>
        </div>
        
        {uniqueSheets.length > 0 && (
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Filter Sheet:</span>
                <select 
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none outline-none text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-lg py-1.5 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-purple-500/50"
                >
                    <option value="All">All Sheets ({matches.length})</option>
                    {uniqueSheets.map(sheet => (
                        <option key={sheet} value={sheet}>
                            {sheet} ({matches.filter(m => m.sheetName === sheet).length})
                        </option>
                    ))}
                </select>
            </div>
        )}
      </div>

      {/* DASHBOARD - Now responsive to filter */}
      <Dashboard matches={filteredMatches} config={config} />

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
           <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center">
             <i className="fas fa-table mr-2 text-slate-400"></i> 
             {selectedSheet === 'All' ? 'Detailed Grade Sheet' : `Grades for ${selectedSheet}`}
           </h3>
           <span className="text-xs text-slate-500 font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full">
             {filteredMatches.length} Students
           </span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-500 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-950/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold tracking-wider text-slate-600 dark:text-slate-400">ID</th>
                        <th className="px-6 py-4 font-semibold tracking-wider text-slate-600 dark:text-slate-400">Student Name</th>
                        <th className="px-6 py-4 font-semibold tracking-wider text-slate-600 dark:text-slate-400">Sheet</th>
                        <th className="px-6 py-4 text-right font-semibold tracking-wider text-slate-600 dark:text-slate-400">Daily</th>
                        <th className="px-6 py-4 text-right font-semibold tracking-wider text-slate-600 dark:text-slate-400">Midterm</th>
                        <th className="px-6 py-4 text-right font-semibold tracking-wider text-slate-600 dark:text-slate-400">Final</th>
                        <th className="px-6 py-4 text-right bg-purple-50 dark:bg-purple-900/10 text-purple-900 dark:text-purple-300 font-bold border-l border-slate-200 dark:border-slate-800">Total</th>
                        <th className="px-6 py-4 text-center bg-purple-50 dark:bg-purple-900/10 text-purple-900 dark:text-purple-300 font-bold">Grade</th>
                        <th className="px-6 py-4 text-center font-semibold tracking-wider text-slate-600 dark:text-slate-400">Proof</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredMatches.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-6 py-12 text-center text-slate-500 dark:text-slate-600">
                                <div className="flex flex-col items-center">
                                    <i className="fas fa-search text-3xl mb-3 text-slate-300 dark:text-slate-700"></i>
                                    <span>No students found in {selectedSheet === 'All' ? 'the template' : 'this sheet'}.</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        currentMatches.map((student, idx) => {
                            const total = calculateTotal(student, config);
                            const grade = getLetterGrade(total);
                            const colorInfo = getGradeColorInfo(total, config.passingGrade);
                            
                            return (
                                <tr key={`${student.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{student.id}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
                                        {student.firstName} {student.lastName}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-600">{student.sheetName}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-500">{student.daily.toFixed(1)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-500">{student.midterm.toFixed(1)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-500">{student.final.toFixed(1)}</td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold border-l border-slate-200 dark:border-slate-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/10 transition-colors ${colorInfo.isFailing ? colorInfo.css : 'text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/5'}`}>
                                        {total}
                                    </td>
                                    <td className="px-6 py-4 text-center bg-purple-50 dark:bg-purple-500/5 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/10 transition-colors">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shadow-sm ${
                                            grade === 'F' ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 shadow-[0_0_5px_rgba(239,68,68,0.2)]' :
                                            colorInfo.isFailing ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/20 shadow-[0_0_5px_rgba(249,115,22,0.2)]' :
                                            grade.startsWith('A') ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-[0_0_5px_rgba(16,185,129,0.2)]' :
                                            'bg-slate-200 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600/50'
                                        }`}>
                                            {grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => setSelectedStudent(student)}
                                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-900 dark:hover:text-purple-300 transition-all flex items-center justify-center mx-auto shadow-sm hover:shadow-md hover:scale-105"
                                            title="View Details"
                                        >
                                            <i className="fas fa-list text-xs"></i>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        {filteredMatches.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Showing <span className="font-medium text-slate-700 dark:text-slate-300">{startIndex + 1}</span> to <span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(startIndex + ITEMS_PER_PAGE, filteredMatches.length)}</span> of <span className="font-medium text-slate-700 dark:text-slate-300">{filteredMatches.length}</span> results
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewTable;