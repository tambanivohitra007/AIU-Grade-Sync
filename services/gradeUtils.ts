
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

    return { argb: null, css: 'text-purple-600 dark:text-purple-300', isFailing: false };
};
