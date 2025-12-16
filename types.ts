
export interface StudentGrade {
  id: string;
  firstName: string;
  lastName: string;
  daily: number;
  midterm: number;
  final: number;
}

export interface MatchedStudent extends StudentGrade {
  rowNumber: number; // Row in the Excel file
  sheetName: string;
}

export interface ColumnMapping {
  id: string;
  firstName: string;
  lastName: string;
  daily: string;
  midterm: string;
  final: string;
}

export interface ProcessingConfig {
  dailyPercentage: number;
  midtermPercentage: number;
  finalPercentage: number;
  passingGrade: string;
}

export enum Step {
  UPLOAD = 1,
  CONFIGURE = 2,
  PREVIEW = 3,
  COMPLETE = 4,
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  blob?: Blob;
  logs: string[];
}
