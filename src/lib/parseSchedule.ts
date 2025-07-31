interface DayColumn {
  index: number;
  day: string;
  date: string | null;
}

interface ParsedShift {
  date: string;
  startTime: string;
  endTime: string;
  coworkers: string;
  notes?: string;
  employeeName?: string;
}

export function parseSchedule(data: any[][]): ParsedShift[] {
  const shifts: ParsedShift[] = [];
  
  console.log('Debug parseSchedule: Data length:', data?.length);
  console.log('Debug parseSchedule: First few rows:', data?.slice(0, 5));
  console.log('Debug parseSchedule: Full data dump:', JSON.stringify(data, null, 2));
  
  if (!data || data.length < 2) return shifts;
  
  // Find the header row with days/dates (it's not necessarily the first row)
  let headerRowIndex = -1;
  let headerRow = null;
  
  // Enhanced day name patterns - includes short and full day names
  const dayPatterns = [
    /sun(day)?/i, /mon(day)?/i, /tue(sday)?/i, /wed(nesday)?/i, 
    /thu(rsday)?/i, /fri(day)?/i, /sat(urday)?/i
  ];
  
  // Also look for date patterns that might indicate column headers
  const datePatterns = [
    /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/, // MM/DD/YYYY or MM-DD-YYYY
    /\d{1,2}[-\/]\d{1,2}/, // MM/DD or MM-DD
    /\d{4}-\d{1,2}-\d{1,2}/, // YYYY-MM-DD
    /\w+\s+\d{1,2}/, // "July 31" format
  ];
  
  // Helper function to check if a value is an Excel serial date number
  const isExcelSerialDate = (value: any): boolean => {
    if (typeof value === 'number') {
      // Excel dates are typically between 1 (1900-01-01) and 50000+ (future dates)
      // For 2025, we expect values around 45000-46000
      return value > 40000 && value < 50000;
    }
    return false;
  };
  
  // Helper function to convert Excel serial date to readable date
  const excelSerialToDate = (serial: number): string => {
    // Excel serial date starts from 1900-01-01, but Excel incorrectly treats 1900 as a leap year
    // So we need to account for this quirk
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    
    // Format as YYYY-MM-DD (required for calendar component)
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${year}-${month}-${day}`;
  };
  
  // Helper function to convert various date formats to YYYY-MM-DD
  const normalizeDate = (dateStr: string): string => {
    try {
      // Handle MM/DD/YYYY or MM-DD-YYYY format
      const mmddyyyy = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
      if (mmddyyyy) {
        const [, month, day, year] = mmddyyyy;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Handle MM/DD or MM-DD format (assume current year)
      const mmdd = dateStr.match(/(\d{1,2})[-\/](\d{1,2})/);
      if (mmdd) {
        const [, month, day] = mmdd;
        const year = new Date().getFullYear();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // Fallback: try parsing as Date and format
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
        const day = parsed.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return dateStr; // Return original if can't parse
    } catch {
      return dateStr; // Return original if error
    }
  };
  
  // Search through the first 50 rows to find the header with days/dates
  // Handle both single-row headers and split headers (days in one row, dates in next)
  let bestHeaderRow = -1;
  let bestHeaderScore = 0;
  
  for (let i = 0; i < Math.min(data.length, 50); i++) {
    const row = data[i];
    if (row && Array.isArray(row)) {
      console.log(`Debug parseSchedule: Checking potential header row ${i}:`, row);
      
      // Count cells that look like day names, dates, or Excel serial dates
      let dayDateCount = 0;
      let hasDatePattern = false;
      let dayCount = 0;
      let excelDateCount = 0;
      
      for (const cell of row) {
        if (cell && typeof cell === 'string') {
          const cellStr = cell.toString().trim();
          
          // Check for day patterns
          const matchesDay = dayPatterns.some(pattern => pattern.test(cellStr));
          
          // Check for date patterns
          const matchesDate = datePatterns.some(pattern => pattern.test(cellStr));
          
          if (matchesDay) {
            dayCount++;
            dayDateCount++;
          }
          if (matchesDate) {
            dayDateCount++;
            hasDatePattern = true;
          }
        } else if (isExcelSerialDate(cell)) {
          // Found an Excel serial date number
          excelDateCount++;
          dayDateCount++;
          hasDatePattern = true;
        }
      }

      console.log(`Debug parseSchedule: Row ${i} day/date count: ${dayDateCount}, day count: ${dayCount}, excel date count: ${excelDateCount}, has date pattern: ${hasDatePattern}`);

      // Calculate a score for this row based on how likely it is to be a header
      // Prioritize rows with more consecutive dates (like a weekly schedule)
      let score = 0;
      if (excelDateCount >= 5) score += 100; // Weekly schedule should have 7 days, but at least 5
      else if (excelDateCount >= 3) score += 50;
      else if (dayDateCount >= 3) score += 25;
      
      // Bonus for having many Excel dates (indicating a proper schedule header)
      score += excelDateCount * 10;
      
      // Penalty for rows that look like metadata
      if (row.some(cell => cell && typeof cell === 'string' && 
          (cell.toString().toLowerCase().includes('time period') ||
           cell.toString().toLowerCase().includes('executed') ||
           cell.toString().toLowerCase().includes('printed')))) {
        score -= 75;
      }
      
      console.log(`Debug parseSchedule: Row ${i} score: ${score} (best so far: ${bestHeaderScore})`);
      
      // Update best header if this row scores higher
      if (score > bestHeaderScore && dayDateCount >= 3) {
        bestHeaderScore = score;
        bestHeaderRow = i;
        console.log(`Debug parseSchedule: New best header candidate at row ${i} with score ${score}`);
      }
      
      // Special case: Found a row with 3+ day names but no dates
      // Check if the next row has dates (split header format)
      if (dayCount >= 3 && !hasDatePattern && i + 1 < data.length) {
        const nextRow = data[i + 1];
        if (nextRow && Array.isArray(nextRow)) {
          let nextRowDateCount = 0;
          for (const cell of nextRow) {
            if (cell && typeof cell === 'string') {
              const cellStr = cell.toString().trim();
              const matchesDate = datePatterns.some(pattern => pattern.test(cellStr));
              if (matchesDate) nextRowDateCount++;
            } else if (isExcelSerialDate(cell)) {
              nextRowDateCount++;
            }
          }
          
          console.log(`Debug parseSchedule: Row ${i} has ${dayCount} days, next row ${i + 1} has ${nextRowDateCount} dates`);
          
          if (nextRowDateCount >= 3) {
            // Found split header: days in row i, dates in row i+1
            const splitScore = 75 + nextRowDateCount * 10;
            if (splitScore > bestHeaderScore) {
              bestHeaderScore = splitScore;
              bestHeaderRow = i;
              console.log(`Debug parseSchedule: Found split header - days at row ${i}, dates at row ${i + 1} with score ${splitScore}`);
            }
          }
        }
      }
    }
  }
  
  // Use the best header found
  if (bestHeaderRow >= 0) {
    headerRowIndex = bestHeaderRow;
    headerRow = data[bestHeaderRow];
    console.log(`Debug parseSchedule: Selected best header row at index ${headerRowIndex} with score ${bestHeaderScore}:`, headerRow);
  }

  // Enhanced fallback: Look for employee data patterns more robustly
  if (!headerRow || headerRowIndex === -1) {
    console.log('Debug parseSchedule: No header row with days/dates found. Attempting enhanced fallback detection.');
    
    let firstEmployeeRowIndex = -1;
    
    // Look for the first row that has employee name pattern
    for (let i = 0; i < Math.min(data.length, 50); i++) {
      const row = data[i];
      if (row && Array.isArray(row) && row.length > 2) {
        const firstCell = row[0];
        
        if (firstCell && typeof firstCell === 'string') {
          const cellStr = firstCell.toString().trim();
          
          // Check if this looks like an employee name (has comma or multiple words)
          // But exclude obvious metadata rows
          const looksLikeEmployeeName = (cellStr.includes(',') || 
                                      (cellStr.split(' ').length >= 2 && cellStr.length > 3)) &&
                                      !cellStr.toLowerCase().includes('time period') &&
                                      !cellStr.toLowerCase().includes('query') &&
                                      !cellStr.toLowerCase().includes('currency') &&
                                      !cellStr.toLowerCase().includes('executed') &&
                                      !cellStr.toLowerCase().includes('printed') &&
                                      !cellStr.toLowerCase().includes('schedule') &&
                                      cellStr.length < 50; // Employee names shouldn't be extremely long
          
          // Check if the row has time-like patterns in other columns
          const hasTimePattern = row.some((cell, index) => {
            if (index === 0) return false; // Skip the name column
            if (cell && typeof cell === 'string') {
              const timeStr = cell.toString().trim();
              return /\d{1,2}:\d{2}/.test(timeStr) || 
                     /\d{1,2}(?:AM|PM)/i.test(timeStr) ||
                     /\d{1,2}:\d{2}\s*(?:AM|PM)/i.test(timeStr);
            }
            return false;
          });
          
          if (looksLikeEmployeeName && hasTimePattern) {
            firstEmployeeRowIndex = i;
            console.log(`Debug parseSchedule: Found first employee row at index ${i}:`, row);
            break;
          }
        }
      }
    }
    
    // If we found employee data, look backwards for a potential header
    if (firstEmployeeRowIndex > 0) {
      for (let i = firstEmployeeRowIndex - 1; i >= 0; i--) {
        const row = data[i];
        if (row && Array.isArray(row) && row.length > 2) {
          // Check if this row could be a header (not employee data)
          const firstCell = row[0];
          const looksLikeHeader = !firstCell || 
                                firstCell.toString().trim().toLowerCase().includes('name') ||
                                firstCell.toString().trim().toLowerCase().includes('employee') ||
                                firstCell.toString().trim() === '';
          
          if (looksLikeHeader) {
            headerRowIndex = i;
            headerRow = row;
            console.log(`Debug parseSchedule: Fallback detected header row at index ${i}:`, row);
            break;
          }
        }
      }
    }
  }
  
  if (!headerRow || headerRowIndex === -1) {
    console.log('Debug parseSchedule: No valid header row found. Data inspected:', JSON.stringify(data.slice(0, 10), null, 2));
    return shifts;
  }
  
  const dayColumns: DayColumn[] = [];
  
  // Enhanced day column detection - handle split headers
  const dateRow = data[headerRowIndex + 1]; // Check if dates are in the next row
  let hasSplitHeader = false;
  
  // Check if we have a split header (days in headerRow, dates in next row)
  if (dateRow && Array.isArray(dateRow)) {
    let dateCount = 0;
    for (const cell of dateRow) {
      if (cell && typeof cell === 'string') {
        const cellStr = cell.toString().trim();
        const matchesDate = datePatterns.some(pattern => pattern.test(cellStr));
        if (matchesDate) dateCount++;
      } else if (isExcelSerialDate(cell)) {
        dateCount++;
      }
    }
    
    if (dateCount >= 3) {
      hasSplitHeader = true;
      console.log(`Debug parseSchedule: Detected split header - dates in row ${headerRowIndex + 1}`);
    }
  }
  
  headerRow.forEach((cell: any, index: number) => {
    console.log(`Debug parseSchedule: Checking cell ${index}: "${cell}" (type: ${typeof cell})`);
    
    let foundDay = '';
    let date: string | null = null;
    
    // Handle Excel serial dates (numbers)
    if (isExcelSerialDate(cell)) {
      const convertedDate = excelSerialToDate(cell);
      const parsedDate = new Date(convertedDate);
      
      if (!isNaN(parsedDate.getTime())) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        foundDay = dayNames[parsedDate.getDay()];
        date = convertedDate;
        
        console.log(`Debug parseSchedule: Found Excel serial date ${cell} -> ${convertedDate} -> ${foundDay}`);
        
        dayColumns.push({
          index,
          day: foundDay,
          date: date
        });
      }
    }
    // Handle string cells that might contain day names or dates
    else if (cell && typeof cell === 'string') {
      const cellStr = cell.toString().trim();
      
      // Check for day patterns
      if (/sun(day)?/i.test(cellStr)) foundDay = 'Sunday';
      else if (/mon(day)?/i.test(cellStr)) foundDay = 'Monday';
      else if (/tue(sday)?/i.test(cellStr)) foundDay = 'Tuesday';
      else if (/wed(nesday)?/i.test(cellStr)) foundDay = 'Wednesday';
      else if (/thu(rsday)?/i.test(cellStr)) foundDay = 'Thursday';
      else if (/fri(day)?/i.test(cellStr)) foundDay = 'Friday';
      else if (/sat(urday)?/i.test(cellStr)) foundDay = 'Saturday';
      
      if (foundDay) {
        console.log(`Debug parseSchedule: Found day ${foundDay} in column ${index}`);
        
        // If we have a split header, get the date from the next row
        if (hasSplitHeader && dateRow && dateRow[index]) {
          const dateCell = dateRow[index];
          if (isExcelSerialDate(dateCell)) {
            date = excelSerialToDate(dateCell);
            console.log(`Debug parseSchedule: Found Excel date ${dateCell} -> ${date} for ${foundDay} from split header`);
          } else if (dateCell && typeof dateCell === 'string') {
            const dateCellStr = dateCell.toString().trim();
            const dateMatch = dateCellStr.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
            if (dateMatch) {
              date = normalizeDate(dateMatch[1]);
              console.log(`Debug parseSchedule: Found date ${dateMatch[1]} -> ${date} for ${foundDay} from split header`);
            }
          }
        } else {
          // Try to extract date from the same cell (single row header)
          let dateMatch = cellStr.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
          if (dateMatch) {
            date = normalizeDate(dateMatch[1]);
          } else {
            // Format: "Sun 7-27" (assume current year)
            dateMatch = cellStr.match(/(\d{1,2}[-\/]\d{1,2})/);
            if (dateMatch) {
              date = normalizeDate(`${dateMatch[1]}-${new Date().getFullYear()}`);
            }
          }
        }
        
        dayColumns.push({
          index,
          day: foundDay,
          date: date
        });
      } else if (!hasSplitHeader) {
        // Only check for date-only columns if we don't have a split header
        // Check if it's just a date without day name
        const dateOnlyMatch = cellStr.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
        if (dateOnlyMatch) {
          // Try to determine the day of week from the date
          try {
            const normalizedDate = normalizeDate(dateOnlyMatch[1]);
            const parsedDate = new Date(normalizedDate);
            if (!isNaN(parsedDate.getTime())) {
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              foundDay = dayNames[parsedDate.getDay()];
              date = normalizedDate;
              
              console.log(`Debug parseSchedule: Found date-only column ${index}: "${cellStr}" -> ${foundDay}, ${date}`);
              
              dayColumns.push({
                index,
                day: foundDay,
                date: date
              });
            }
          } catch (e) {
            console.log(`Debug parseSchedule: Could not parse date from "${cellStr}"`);
          }
        }
      }
    }
  });
  
  console.log('Debug parseSchedule: Day columns found:', dayColumns);
  
  if (dayColumns.length === 0) {
    console.log('Debug parseSchedule: No day columns found');
    return shifts;
  }
  
  // Determine the starting row for employee data
  // If we have a split header, skip both the day row and date row
  const employeeStartRow = hasSplitHeader ? headerRowIndex + 2 : headerRowIndex + 1;
  console.log(`Debug parseSchedule: Employee data starts at row ${employeeStartRow} (split header: ${hasSplitHeader})`);
  
  // Process each employee row
  for (let rowIndex = employeeStartRow; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!row || !Array.isArray(row)) continue;
    
    const employeeName = row[0] ? row[0].toString().trim() : '';
    const position = row[1] ? row[1].toString().trim() : '';
    
    console.log(`Debug parseSchedule: Processing row ${rowIndex}, employee: "${employeeName}", position: "${position}"`);
    console.log('Debug parseSchedule: Processing row', rowIndex, 'Content:', JSON.stringify(row));
    
    // Skip empty rows or rows that don't look like employee data
    if (!employeeName || employeeName.length < 2) {
      console.log(`Debug parseSchedule: Skipping row ${rowIndex} due to missing/short employee name. Row content:`, JSON.stringify(row));
      continue;
    }
    
    // Skip rows that might be headers or section dividers
    if (employeeName.toLowerCase().includes('employee') || 
        employeeName.toLowerCase().includes('name') ||
        employeeName.toLowerCase().includes('schedule') ||
        employeeName.toLowerCase().includes('week')) {
      console.log(`Debug parseSchedule: Skipping row ${rowIndex} - appears to be header/divider: "${employeeName}"`);
      continue;
    }
    
    // Convert "Last, First" to "First Last" format
    let displayName = employeeName;
    if (employeeName.includes(',')) {
      const parts = employeeName.split(',').map((s: string) => s.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        displayName = `${parts[1]} ${parts[0]}`;
      }
    }
    
    console.log(`Debug parseSchedule: Employee name converted from "${employeeName}" to "${displayName}"`);
    
    // Check each day column for this employee
    dayColumns.forEach((dayInfo: DayColumn) => {
      const timeCell = row[dayInfo.index];
      console.log(`Debug parseSchedule: Checking ${employeeName} for ${dayInfo.day} (column ${dayInfo.index}):`, JSON.stringify(timeCell));
      
      if (timeCell && timeCell.toString().trim()) {
        const timeStr = timeCell.toString().trim();
        
        // Enhanced time parsing - handle various formats
        let timeMatch = null;
        
        // Clean up the time string - remove extra whitespace
        const cleanTimeStr = timeStr.replace(/\s+/g, ' ').trim();
        
        // Try standard format: "9:00 AM - 6:00 PM"
        timeMatch = cleanTimeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
        
        // Try format without spaces: "9:00AM-6:00PM"
        if (!timeMatch) {
          timeMatch = cleanTimeStr.match(/(\d{1,2}:\d{2}(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}(?:AM|PM))/i);
        }
        
        // Try format with extra spaces: "9:00  AM  -  6:00  PM"
        if (!timeMatch) {
          timeMatch = cleanTimeStr.match(/(\d{1,2}:\d{2}\s+(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s+(?:AM|PM))/i);
        }
        
        // Try 24-hour format: "09:00-18:00"
        if (!timeMatch) {
          const match24 = cleanTimeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
          if (match24) {
            // Convert to 12-hour format
            const [, start24, end24] = match24;
            const startTime = convertTo12Hour(start24);
            const endTime = convertTo12Hour(end24);
            if (startTime && endTime) {
              timeMatch = [cleanTimeStr, startTime, endTime];
            }
          }
        }
        
        // Try single time format (assume 8-hour shift): "9:00 AM" or "9AM"
        if (!timeMatch) {
          const singleMatch = cleanTimeStr.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
          if (singleMatch) {
            const startTime = singleMatch[1];
            // Assume 8-hour shift
            const endTime = addHours(startTime, 8);
            if (endTime) {
              timeMatch = [cleanTimeStr, startTime, endTime];
            }
          }
        }
        
        console.log(`Debug parseSchedule: Time string "${timeStr}", match:`, timeMatch);
        
        if (timeMatch && dayInfo.date) {
          console.log(`Debug parseSchedule: Valid time range found for ${displayName} on ${dayInfo.date}:`, timeMatch);
          const [, startTime, endTime] = timeMatch;
          
          // Get other employees working the same day with their time ranges
          const coworkerDetails: { name: string; startTime: string; endTime: string }[] = [];
          for (let otherRowIndex = employeeStartRow; otherRowIndex < data.length; otherRowIndex++) {
            if (otherRowIndex === rowIndex) continue;
            
            const otherRow = data[otherRowIndex];
            if (!otherRow || !Array.isArray(otherRow)) continue;
            
            const otherName = otherRow[0] ? otherRow[0].toString().trim() : '';
            const otherTimeCell = otherRow[dayInfo.index];
            
            if (otherName && otherName.length > 2 && otherTimeCell && otherTimeCell.toString().trim()) {
              let otherDisplayName = otherName;
              if (otherName.includes(',')) {
                const parts = otherName.split(',').map((s: string) => s.trim());
                if (parts.length >= 2 && parts[0] && parts[1]) {
                  otherDisplayName = `${parts[1]} ${parts[0]}`;
                }
              }
              
              // Parse the other employee's time
              const otherTimeStr = otherTimeCell.toString().trim();
              const otherTimeMatch = otherTimeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
              
              if (otherTimeMatch) {
                const [, otherStartTime, otherEndTime] = otherTimeMatch;
                coworkerDetails.push({
                  name: otherDisplayName,
                  startTime: otherStartTime.trim(),
                  endTime: otherEndTime.trim()
                });
              }
            }
          }
          
          // Create a structured coworkers string with time info
          const coworkersInfo = coworkerDetails.length > 0 
            ? JSON.stringify(coworkerDetails)
            : '';
          
          console.log(`Debug parseSchedule: Creating shift for ${displayName} on ${dayInfo.date} from ${startTime} to ${endTime}`);
          console.log(`Debug parseSchedule: Coworkers info:`, coworkersInfo);
          
          shifts.push({
            date: dayInfo.date,
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            coworkers: coworkersInfo,
            notes: position ? `Position: ${position}` : '',
            employeeName: displayName
          });
        } else {
          console.log(`Debug parseSchedule: Invalid or missing time range for ${displayName} on ${dayInfo.date}. Time cell content:`, JSON.stringify(timeCell));
        }
      }
    });
  }
  
  return shifts;
}

// Helper function to convert 24-hour time to 12-hour format
function convertTo12Hour(time24: string): string | null {
  try {
    const [hours, minutes] = time24.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return null;
  }
}

// Helper function to add hours to a time string
function addHours(timeStr: string, hoursToAdd: number): string | null {
  try {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (!match) return null;
    
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2] || '0');
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour format
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) hours24 += 12;
    if (period === 'AM' && hours === 12) hours24 = 0;
    
    // Add hours
    const newHours24 = (hours24 + hoursToAdd) % 24;
    
    // Convert back to 12-hour format
    const newPeriod = newHours24 >= 12 ? 'PM' : 'AM';
    const newHours12 = newHours24 === 0 ? 12 : newHours24 > 12 ? newHours24 - 12 : newHours24;
    
    return `${newHours12}:${minutes.toString().padStart(2, '0')} ${newPeriod}`;
  } catch {
    return null;
  }
}