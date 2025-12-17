
import { MatchedStudent, ProcessingConfig } from "../types";

export const GRADE_SCALE = [
  { label: 'A', min: 80 },
  { label: 'B+', min: 75 },
  { label: 'B', min: 70 },
  { label: 'C+', min: 65 },
  { label: 'C', min: 60 },
  { label: 'D+', min: 55 },
  { label: 'D', min: 50 },
  { label: 'F', min: 0 },
];

export const calculateTotal = (s: MatchedStudent, config: ProcessingConfig): number => {
    const weightedDaily = s.daily * (config.dailyPercentage / 100);
    const weightedMidterm = s.midterm * (config.midtermPercentage / 100);
    const weightedFinal = s.final * (config.finalPercentage / 100);
    return Math.ceil(weightedDaily + weightedMidterm + weightedFinal);
};

export const getLetterGrade = (total: number): string => {
    for (const grade of GRADE_SCALE) {
        if (total >= grade.min) return grade.label;
    }
    return 'F';
};

/**
 * Returns ARGB hex code for Excel or CSS color string
 * Red: FFFF0000 (Excel ARGB)
 * OrangeRed: FFFF4500 (Excel ARGB)
 */
export const getGradeColorInfo = (total: number, passingGradeLabel: string) => {
    const grade = getLetterGrade(total);
    
    // Rule 1: F is always Red
    if (grade === 'F') {
        return { argb: 'FFFF0000', css: 'text-red-600 dark:text-red-500', isFailing: true }; 
    }

    // Rule 2: Check if below passing grade
    const passingThreshold = GRADE_SCALE.find(g => g.label === passingGradeLabel)?.min || 50;
    
    if (total < passingThreshold) {
        return { argb: 'FFFF4500', css: 'text-orange-600 dark:text-orange-500', isFailing: true };
    }

    // Use dark purple (900) for light mode, light purple (300) for dark mode
    return { argb: null, css: 'text-purple-900 dark:text-purple-300', isFailing: false };
};

export const calculateStatistics = (matches: MatchedStudent[], config: ProcessingConfig) => {
    if (matches.length === 0) return null;

    const totals = matches.map(m => calculateTotal(m, config));
    const rawScores = {
        daily: matches.map(m => m.daily),
        midterm: matches.map(m => m.midterm),
        final: matches.map(m => m.final)
    };

    const sum = totals.reduce((a, b) => a + b, 0);
    const avg = sum / totals.length;
    
    // Sort for stats
    const sortedTotals = [...totals].sort((a, b) => a - b);
    const min = sortedTotals[0];
    const max = sortedTotals[sortedTotals.length - 1];
    const median = sortedTotals[Math.floor(sortedTotals.length / 2)];

    const passingThreshold = GRADE_SCALE.find(g => g.label === config.passingGrade)?.min || 50;
    const passCount = totals.filter(t => t >= passingThreshold).length;
    const failCount = totals.length - passCount;

    const gradeDist: Record<string, number> = {};
    GRADE_SCALE.forEach(g => gradeDist[g.label] = 0);
    totals.forEach(t => {
        const grade = getLetterGrade(t);
        if (gradeDist[grade] !== undefined) gradeDist[grade]++;
    });

    // Component Averages (Raw)
    const avgDaily = rawScores.daily.reduce((a, b) => a + b, 0) / matches.length;
    const avgMidterm = rawScores.midterm.reduce((a, b) => a + b, 0) / matches.length;
    const avgFinal = rawScores.final.reduce((a, b) => a + b, 0) / matches.length;

    return {
        count: matches.length,
        average: avg,
        median,
        highest: max,
        lowest: min,
        passRate: (passCount / matches.length) * 100,
        passCount,
        failCount,
        gradeDistribution: gradeDist,
        components: {
            daily: avgDaily,
            midterm: avgMidterm,
            final: avgFinal
        }
    };
};
