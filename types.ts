
export enum HomeworkStatus {
  SUBMITTED = "submitted",
  MISSING = "missing",
  LATE = "late",
  NEEDS_CORRECTION = "needs_correction",
  CORRECTED = "corrected"
}

export interface Student {
  id: number;
  name: string;
  group: number;
}

export interface HomeworkRecord {
  id: string;
  date: string;
  homeworkName: string;
  studentId: number;
  status: HomeworkStatus;
  updatedAt: number;
}

export interface HomeworkItem {
  id: string;
  name: string;
}

export type ViewMode = "HOME" | "GROUP_ENTRY" | "TEACHER_LOGIN" | "TEACHER_DASHBOARD" | "TEACHER_HOMEWORK_MGMT";
