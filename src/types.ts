export interface Shift {
  id: string;
  code: string;
  title: string;
  start: string;
  end: string;
  color: string;
  isOff: boolean;
  hourlyRate: number;
}

export interface RosterEntry {
  date: string;
  day: string;
  shift: string;
  startTime: string;
  endTime: string;
  eventTitle: string;
  location: string;
  notes: string;
}

export interface TeamData {
  name: string;
  members: Record<string, RosterEntry[]>;
}
