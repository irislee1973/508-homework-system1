import { Student, HomeworkStatus } from "./types";

export const STUDENTS: Student[] = [
  { id: 12, name: "杰薰", group: 1 },
  { id: 3, name: "李秉宸", group: 1 },
  { id: 8, name: "何品諺", group: 1 },
  { id: 17, name: "鄒宜彤", group: 1 },
  { id: 26, name: "鄭舒云", group: 1 },
  
  { id: 9, name: "陳庭宇", group: 2 },
  { id: 1, name: "林田能", group: 2 },
  { id: 24, name: "謝靚橙", group: 2 },
  { id: 15, name: "林子晴", group: 2 },
  { id: 18, name: "葉雯鏵", group: 2 },
  
  { id: 2, name: "程競弘", group: 3 },
  { id: 6, name: "曾恆昱", group: 3 },
  { id: 22, name: "王若和", group: 3 },
  { id: 25, name: "蕭禾婕", group: 3 },
  { id: 16, name: "鄒采妤", group: 3 },
  { id: 13, name: "許芮棠", group: 3 },
  
  { id: 11, name: "游子靖", group: 4 },
  { id: 4, name: "劉岱儒", group: 4 },
  { id: 19, name: "林苡媗", group: 4 },
  { id: 21, name: "莊芝棋", group: 4 },
  { id: 14, name: "劉紜瑄", group: 4 },
  
  { id: 7, name: "朱予行", group: 5 },
  { id: 10, name: "池向毅", group: 5 },
  { id: 5, name: "童宥森", group: 5 },
  { id: 20, name: "吳予潔", group: 5 },
  { id: 23, name: "黃品瑜", group: 5 }
];

export const STATUS_CONFIG = {
  [HomeworkStatus.SUBMITTED]: { label: "已交", color: "bg-emerald-500", text: "text-white" },
  [HomeworkStatus.MISSING]: { label: "缺交", color: "bg-rose-500", text: "text-white" },
  [HomeworkStatus.LATE]: { label: "補交", color: "bg-amber-500", text: "text-white" },
  [HomeworkStatus.NEEDS_CORRECTION]: { label: "需訂正", color: "bg-indigo-500", text: "text-white" },
  [HomeworkStatus.CORRECTED]: { label: "已訂正", color: "bg-sky-500", text: "text-white" },
};

export const TEACHER_PIN = "1234";
