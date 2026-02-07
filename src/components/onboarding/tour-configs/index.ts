import { getStudentTourSteps } from "./student-tour";
import { getTeacherTourSteps } from "./teacher-tour";
import { getClassTeacherTourSteps } from "./class-teacher-tour";
import { getCoordinatorTourSteps } from "./coordinator-tour";
import { getPrincipalTourSteps } from "./principal-tour";
import { getParentTourSteps } from "./parent-tour";
import type { DriveStep } from "driver.js";

export type TourRole = "student" | "teacher" | "class_teacher" | "coordinator" | "principal" | "parent";

export const tourStepsByRole: Record<TourRole, () => DriveStep[]> = {
  student: getStudentTourSteps,
  teacher: getTeacherTourSteps,
  class_teacher: getClassTeacherTourSteps,
  coordinator: getCoordinatorTourSteps,
  principal: getPrincipalTourSteps,
  parent: getParentTourSteps,
};
