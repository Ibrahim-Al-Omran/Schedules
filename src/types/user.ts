export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional because we won't include it in API responses
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  googleAccessToken?: boolean; // Indicates if user has Google Calendar connected
}