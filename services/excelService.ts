import Papa from "papaparse";
import ExcelJS from "exceljs";
import { ColumnMapping, ProcessingConfig, ProcessingResult, StudentGrade, MatchedStudent } from "../types";
import { calculateTotal, getGradeColorInfo } from "./gradeUtils";

const parseDouble = (value: any): number => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const str = value.toString().trim();
  if (str === "-" || str === "") return 0;
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper to safely extract string value from any Excel cell type
const getCellValueAsString = (cell: ExcelJS.Cell): string => {
    if (cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object') {
        // Handle Rich Text
        if ('richText' in cell.value) {
            return (cell.value as any).richText.map((t: any) => t.text).join('');
        }
        // Handle Hyperlink
        if ('text' in cell.value) {
             return (cell.value as any).text.toString();
        }
        // Handle Formula (use result if available)
        if ('result' in cell.value) {
            return (cell.value as any).result?.toString() || '';
        }
    }
    return cell.value.toString();
};

export const parseMoodleCSV = (
  file: File,
  mapping: ColumnMapping
): Promise<StudentGrade[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const grades: StudentGrade[] = results.data.map((row: any) => ({
            id: row[mapping.id]?.toString().trim() || "",
            firstName: row[mapping.firstName]?.toString().trim() || "",
            lastName: row[mapping.lastName]?.toString().trim() || "",
            daily: parseDouble(row[mapping.daily]),
            midterm: parseDouble(row[mapping.midterm]),
            final: parseDouble(row[mapping.final]),
          })).filter(s => s.id); 
          resolve(grades);
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => reject(err),
    });
  });
};

export const getCSVHeaders = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      preview: 1, 
      header: false,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          resolve(results.data[0] as string[]);
        } else {
          resolve([]);
        }
      },
      error: (err) => reject(err),
    });
  });
};

/**
 * Scans the template to find which rows correspond to which students.
 * Uses intelligent matching by pre-validating against known CSV IDs 
 * to ensure robust matching even with misplaced rows or unstructured data.
 */
export const matchStudentsToTemplate = async (
  templateFile: File,
  grades: StudentGrade[]
): Promise<{ matches: MatchedStudent[], logs: string[] }> => {
  const logs: string[] = [];
  const matches: MatchedStudent[] = [];

  try {
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // 1. Create a Set of normalized IDs from the source (CSV) for O(1) lookup.
    // This allows us to strictly identify if a cell in Excel contains a valid Student ID.
    const sourceIds = new Set<string>();
    grades.forEach(g => {
        if (g.id) sourceIds.add(g.id.toString().trim().toLowerCase());
    });

    workbook.eachSheet((worksheet) => {
      // Map Normalized ID -> Row Number
      const sheetIdMap = new Map<string, number>();
      
      // Intelligent Scan:
      // Iterate through rows and cells to find values that match our Source IDs.
      // This handles "misplaced" rows (unsorted) or IDs in unexpected columns.
      worksheet.eachRow((row, rowNumber) => {
        // Optimization: Scan first 30 columns. IDs are rarely beyond this.
        for(let col = 1; col <= 30; col++) {
           const cell = row.getCell(col);
           const cellValue = getCellValueAsString(cell);
           const normalizedVal = cellValue.trim().toLowerCase();
           
           // Only map if this value is KNOWN to be a student ID from our CSV.
           // This prevents false positives (e.g. a grade value of "100" matching a student ID "100").
           if (normalizedVal.length > 0 && sourceIds.has(normalizedVal)) {
               // We found a student ID in this row.
               sheetIdMap.set(normalizedVal, rowNumber);
               break; 
           }
        }
      });

      // Link Source Grades to Found Excel Rows
      grades.forEach((student) => {
        const key = student.id.toString().trim().toLowerCase();
        const rowNumber = sheetIdMap.get(key);
        
        if (rowNumber) {
          matches.push({
            ...student,
            rowNumber,
            sheetName: worksheet.name
          });
        }
      });
      
      if (sheetIdMap.size > 0) {
          logs.push(`Matched ${sheetIdMap.size} students in sheet '${worksheet.name}'`);
      }
    });
    
    return { matches, logs };
  } catch (error: any) {
    console.error("Error matching template", error);
    throw new Error("Failed to analyze template structure: " + error.message);
  }
};

/**
 * Writes the final data to the Excel file.
 */
export const writeGradesToTemplate = async (
  templateFile: File,
  matches: MatchedStudent[],
  config: ProcessingConfig
): Promise<ProcessingResult> => {
  const logs: string[] = [];

  try {
    logs.push("Reloading template for writing...");
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Force calculation on load to ensure formulas update when opened in Excel
    workbook.calcProperties.fullCalcOnLoad = true;

    // Group matches by sheet to minimize sheet iteration
    const matchesBySheet = new Map<string, MatchedStudent[]>();
    matches.forEach(m => {
        if (!matchesBySheet.has(m.sheetName)) matchesBySheet.set(m.sheetName, []);
        matchesBySheet.get(m.sheetName)?.push(m);
    });

    workbook.eachSheet((worksheet) => {
      // 1. Update Percentages (Daily, Midterm, Final labels)
      const scanRows = Math.min(50, worksheet.rowCount);
      const scanCols = 20;

      for (let r = 1; r <= scanRows; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= scanCols; c++) {
          const cell = row.getCell(c);
          const val = getCellValueAsString(cell);
          
          if (val === "Daily") {
            const target = worksheet.getRow(r + 1).getCell(6); 
            target.value = config.dailyPercentage / 100;
          }
          if (val === "Midterm") {
            const target = worksheet.getRow(r + 1).getCell(8); 
            target.value = config.midtermPercentage / 100;
          }
          if (val === "Final") {
            const target = worksheet.getRow(r + 1).getCell(10); 
            target.value = config.finalPercentage / 100;
          }
        }
      }

      // 2. Write Student Data
      const sheetMatches = matchesBySheet.get(worksheet.name);
      if (sheetMatches) {
          sheetMatches.forEach(student => {
             const row = worksheet.getRow(student.rowNumber);
             
             // Calculate metrics for styling
             const total = calculateTotal(student, config);
             const colorInfo = getGradeColorInfo(total, config.passingGrade);
             const fontStyle = colorInfo.argb ? { color: { argb: colorInfo.argb } } : undefined;

             // Write Daily Value (Col 5)
             const daily = row.getCell(5);
             daily.value = student.daily;
             
             const dailyPct = row.getCell(6);
             dailyPct.numFmt = "#,#0.0";

             // Write Midterm Value (Col 7)
             const mid = row.getCell(7);
             mid.value = student.midterm;
             
             const midPct = row.getCell(8);
             midPct.numFmt = "#,#0.0";

             // Write Final Value (Col 9)
             const final = row.getCell(9);
             final.value = student.final;
             
             const finalPct = row.getCell(10);
             finalPct.numFmt = "#,#0.0";

             // Update total column format (Col 11)
             const totalCell = row.getCell(11);
             totalCell.numFmt = "0";
             
             // Apply colors if failing
             if (fontStyle) {
                 [5, 6, 7, 8, 9, 10, 11].forEach(colIndex => {
                     const cell = row.getCell(colIndex);
                     // Preserve existing font properties like bold/italic, only change color
                     cell.font = { ...cell.font, ...fontStyle };
                 });
             }
          });
          logs.push(`Updated ${sheetMatches.length} records in ${worksheet.name}`);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      success: true,
      message: "Processing complete",
      blob: new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      logs
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Unknown error during processing",
      logs
    };
  }
};
