import React, { useState, useMemo } from 'react';
import { MatchedStudent, ProcessingConfig } from '../types';
import { calculateTotal, getLetterGrade, getGradeColorInfo } from '../services/gradeUtils';

interface PreviewTableProps {
  matches: MatchedStudent[];
  config: ProcessingConfig;
}

const ITEMS_PER_PAGE = 10;

const PreviewTable: React.FC<PreviewTableProps> = ({ matches, config }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Grade Distribution Calculation
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = { 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0 };
    matches.forEach(m => {
        const grade = getLetterGrade(calculateTotal(m, config));
        if (dist[grade] !== undefined) dist[grade]++;
    });
    return dist;
  }, [matches, config]);
  
  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1);

  // Pagination Logic
  const totalPages = Math.ceil(matches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMatches = matches.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 bg-purple-500/5 pointer-events-none"></div>
            <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-300 relative z-10 mb-4">
                <i className="fas fa-chart-pie drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]"></i>
                <span className="font-semibold text-sm tracking-wide">Config Summary</span>
            </div>
            <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400"><span>Daily:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{config.dailyPercentage}%</span></div>
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400"><span>Midterm:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{config.midtermPercentage}%</span></div>
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400"><span>Final:</span> <span className="font-bold text-slate-700 dark:text-slate-200">{config.finalPercentage}%</span></div>
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400"><span>Min. Passing:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">{config.passingGrade}</span></div>
                <div className="h-px bg-slate-200 dark:bg-slate-700/50 my-2"></div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Matches:</span>
                    <span className="text-xs text-purple-700 dark:text-purple-200 font-bold bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                        {matches.length} Students
                    </span>
                </div>
            </div>
        </div>

        {/* Grade Distribution Chart */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>
             <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-300 relative z-10 mb-4">
                <i className="fas fa-chart-bar drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></i>
                <span className="font-semibold text-sm tracking-wide">Grade Analytics</span>
            </div>
            <div className="flex items-end justify-between h-32 gap-2 relative z-10 px-2">
                {Object.keys(gradeDistribution).map((grade) => {
                    const count = gradeDistribution[grade];
                    const heightPercent = (count / maxGradeCount) * 100;
                    return (
                        <div key={grade} className="flex flex-col items-center flex-1 group">
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{count}</div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-sm relative h-full flex items-end overflow-hidden">
                                <div 
                                    className={`w-full bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-900 dark:to-emerald-500 transition-all duration-1000 ease-out hover:brightness-110 ${count > 0 ? 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' : ''}`}
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                            </div>
                            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{grade}</div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xl dark:shadow-2xl">
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
                        <th className="px-6 py-4 text-right bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-300 font-bold border-l border-slate-200 dark:border-slate-800">Total</th>
                        <th className="px-6 py-4 text-center bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-300 font-bold">Grade</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {matches.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-600">
                                <div className="flex flex-col items-center">
                                    <i className="fas fa-search text-3xl mb-3 text-slate-300 dark:text-slate-700"></i>
                                    <span>No students matched in the template. Please check your IDs.</span>
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
                                    <td className={`px-6 py-4 text-right font-mono font-bold border-l border-slate-200 dark:border-slate-800 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/10 transition-colors ${colorInfo.isFailing ? colorInfo.css : 'text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/5'}`}>
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
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        {matches.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Showing <span className="font-medium text-slate-700 dark:text-slate-300">{startIndex + 1}</span> to <span className="font-medium text-slate-700 dark:text-slate-300">{Math.min(startIndex + ITEMS_PER_PAGE, matches.length)}</span> of <span className="font-medium text-slate-700 dark:text-slate-300">{matches.length}</span> results
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