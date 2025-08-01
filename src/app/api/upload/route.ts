import { NextResponse, NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';
import { parseSchedule } from '@/lib/parseSchedule';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Parse XLSX with xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert worksheet to JSON
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Parse rows into shift objects
    const allShifts = parseSchedule(rows as unknown[][]);
    
    console.log('Debug: User name from auth:', authUser.name);
    console.log('Debug: All employee names found:', [...new Set(allShifts.map(s => s.employeeName).filter(Boolean))]);
    console.log('Debug: Total shifts parsed:', allShifts.length);
    
    // Filter shifts to only include those for the current authenticated user
    // Match by name (handle both "First Last" and "Last, First" formats)
    const userShifts = allShifts.filter(shift => {
      if (!shift.employeeName) return false;
      
      const shiftName = shift.employeeName.toLowerCase().trim();
      const userName = authUser.name.toLowerCase().trim();
      
      console.log(`Debug: Comparing "${shiftName}" with "${userName}"`);
      
      // Check direct match
      if (shiftName === userName) {
        console.log('Debug: Direct match found!');
        return true;
      }
      
      // Handle "Last, First" format in spreadsheet vs "First Last" in registration
      const userNameParts = userName.split(' ');
      if (userNameParts.length >= 2) {
        // Create "Last, First" from "First Last"
        const lastName = userNameParts[userNameParts.length - 1];
        const firstName = userNameParts.slice(0, -1).join(' ');
        const reversedUserName = `${lastName}, ${firstName}`.toLowerCase();
        
        console.log(`Debug: Trying reversed format "${reversedUserName}"`);
        if (shiftName === reversedUserName) {
          console.log('Debug: Reversed match found!');
          return true;
        }
      }
      
      // Handle "First Last" format in spreadsheet (from parseSchedule conversion)
      if (shiftName === userName) return true;
      
      // Check if shift name contains user's first AND last name
      const nameWords = userName.split(' ').filter((word: string) => word.length > 2);
      const allWordsMatch = nameWords.every((word: string) => shiftName.includes(word.toLowerCase()));
      
      if (allWordsMatch && nameWords.length >= 2) {
        console.log('Debug: Partial word match found!');
        return true;
      }
      
      return false;
    });

    if (userShifts.length === 0) {
      return NextResponse.json({ 
        error: `No shifts found for user "${authUser.name}". Please make sure your name in the schedule matches your registered name.`,
        totalShiftsFound: allShifts.length,
        allEmployeeNames: [...new Set(allShifts.map(s => s.employeeName).filter(Boolean))]
      }, { status: 400 });
    }

    // Save shifts to database for the authenticated user using raw SQL
    const createdShifts = await Promise.all(
      userShifts.map(shift => 
        prisma.$queryRaw`
          INSERT INTO "Shift" (id, date, "startTime", "endTime", coworkers, notes, uploaded, "createdAt", "userId")
          VALUES (gen_random_uuid(), ${shift.date}, ${shift.startTime}, ${shift.endTime}, ${shift.coworkers}, ${shift.notes || ''}, false, NOW(), ${authUser.userId})
          RETURNING id, date, "startTime", "endTime", coworkers, notes, uploaded
        `
      )
    );

    return NextResponse.json({ 
      message: 'File parsed and shifts saved successfully',
      count: createdShifts.length,
      rows: rows.length 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}