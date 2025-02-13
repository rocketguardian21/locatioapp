export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface User {
  id: string;
  role: 'A' | 'B';
}