export interface WorkingHours {
  [key: string]: DayConfiguration;
}

export interface DayConfiguration {
  enabled: boolean;
  morning: TimeSlot;
  afternoon: TimeSlot;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Configuration {
  workingHours: WorkingHours;
  defaultDuration: number;
  slotDuration: number;
  holidays: string[];
  clinicInfo: ClinicInfo;
}

export interface WorkingDayInfo {
  date: string;
  dayOfWeek: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
  workingHours?: {
    morning: TimeSlot;
    afternoon: TimeSlot;
  };
}
