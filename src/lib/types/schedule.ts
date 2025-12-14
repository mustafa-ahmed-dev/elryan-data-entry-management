export type ScheduleStatus = "pending_approval" | "approved" | "rejected";

export interface DaySchedule {
  start: string; // HH:mm format
  end: string; // HH:mm format
  isWorking: boolean;
}

export interface WeekSchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface Schedule {
  id: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  weekStartDate: string; // ISO date string
  weekEndDate: string; // ISO date string
  schedule: WeekSchedule;
  status: ScheduleStatus;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleFilters {
  status?: ScheduleStatus;
  userId?: number;
  weekStartDate?: string;
  weekEndDate?: string;
}

export interface ScheduleStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
