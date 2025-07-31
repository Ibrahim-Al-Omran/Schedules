export interface Shift {
  id?: string;
  userId: string;
  date: string;        // YYYY-MM-DD format
  startTime: string;   // HH:MM format
  endTime: string;     // HH:MM format
  coworkers: string;   // Comma-separated string of coworker names
  notes?: string;      // Optional notes about the shift
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}