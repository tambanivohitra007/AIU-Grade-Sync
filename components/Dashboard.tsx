import React, { useMemo } from 'react';
import { MatchedStudent, ProcessingConfig } from '../types';
import { calculateStatistics } from '../services/gradeUtils';

interface DashboardProps {
  matches: MatchedStudent[];
  config: ProcessingConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ matches, config }) => {
  const stats = useMemo(() => calculateStatistics(matches, config), [matches, config]);

  if (!stats) return null;

  const maxDistCount = Math.max(...Object.values(stats.gradeDistribution), 1);
  const pieCircumference = 2 * Math.PI * 40; // r=40
  const passOffset = pieCircumference - (stats.passRate / 100) * pieCircumference;

  return (
    <div className="space-y-6 mb-8">
      {/* Top Row: Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-calculator text-4xl text-purple-900 dark:text-purple-500"></i>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Class Average</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.average.toFixed(1)}</span>
            <span className="ml-2 text-xs font-medium text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Median */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-align-center text-4xl text-blue-500"></i>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Median Score</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.median}</span>
            <span className="ml-2 text-xs font-medium text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Highest */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-trophy text-4xl text-emerald-500"></i>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Highest Score</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.highest}</span>
            <span className="ml-2 text-xs font-medium text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Lowest */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500"></i>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lowest Score</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.lowest}</span>
            <span className="ml-2 text-xs font-medium text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3 text-purple-900 dark:text-purple-400">
                    <i className="fas fa-chart-bar"></i>
                </div>
                Grade Distribution
            </h3>
            
            <div className="flex-1 flex items-end justify-between gap-3 h-48 relative px-2">
                {Object.keys(stats.gradeDistribution).map((grade) => {
                    const count = stats.gradeDistribution[grade];
                    const heightPercent = (count / maxDistCount) * 100;
                    return (
                        <div key={grade} className="flex flex-col items-center flex-1 group h-full justify-end">
                             <div className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0 duration-300">
                                {count}
                             </div>
                             <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                <div 
                                    className={`w-full rounded-t-lg transition-all duration-1000 ease-out group-hover:brightness-110 ${
                                        grade === 'F' ? 'bg-red-500 dark:bg-red-500' :
                                        grade.startsWith('D') ? 'bg-orange-500 dark:bg-orange-500' :
                                        grade.startsWith('A') ? 'bg-emerald-600 dark:bg-emerald-500' :
                                        'bg-purple-800 dark:bg-purple-500'
                                    }`}
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                            </div>
                            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-3 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{grade}</div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Pass/Fail & Component Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3 text-emerald-600 dark:text-emerald-400">
                    <i className="fas fa-chart-pie"></i>
                </div>
                Performance Stats
            </h3>

            {/* Donut Chart */}
            <div className="flex items-center justify-center mb-6 relative">
                 <svg width="140" height="140" viewBox="0 0 100 100" className="transform -rotate-90">
                     {/* Background Circle */}
                     <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                     {/* Pass Segment */}
                     <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="10" fill="transparent" 
                        strokeDasharray={`${pieCircumference}`}
                        strokeDashoffset={passOffset}
                        strokeLinecap="round"
                        className="text-emerald-500 transition-all duration-1000 ease-out" 
                     />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-3xl font-bold text-slate-800 dark:text-white">{stats.passRate.toFixed(0)}%</span>
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Pass Rate</span>
                 </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">Passing</div>
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{stats.passCount}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2">
                    <div className="text-xs text-red-600 dark:text-red-400 font-bold mb-1">Failing</div>
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{stats.failCount}</div>
                </div>
            </div>

            {/* Averages Bars */}
            <div className="space-y-3">
                <div className="space-y-1">
                     <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                         <span>Avg Daily</span>
                         <span>{stats.components.daily.toFixed(1)}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(stats.components.daily, 100)}%` }}></div>
                     </div>
                </div>
                <div className="space-y-1">
                     <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                         <span>Avg Midterm</span>
                         <span>{stats.components.midterm.toFixed(1)}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-purple-800 dark:bg-purple-500 rounded-full" style={{ width: `${Math.min(stats.components.midterm, 100)}%` }}></div>
                     </div>
                </div>
                <div className="space-y-1">
                     <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                         <span>Avg Final</span>
                         <span>{stats.components.final.toFixed(1)}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(stats.components.final, 100)}%` }}></div>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;