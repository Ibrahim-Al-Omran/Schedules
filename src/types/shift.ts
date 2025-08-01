export interface Shift {
  id: string;
  date: string;       // YYYY-MM-DD format
  startTime: string;  // HH:MM format
  endTime: string;    // HH:MM format
  coworkers: string;
  notes?: string;
  uploaded?: boolean; // Whether shift has been uploaded to Google Calendar
  createdAt: string;
  userId: string;
}