import { Helmet } from "react-helmet-async";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeInView, StaggerContainer, StaggerItem, HoverScale } from "@/components/ui/motion-wrapper";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SwipeableTabContent } from "@/components/ui/swipeable-tabs";
import {
  Bell, LogOut, UserPlus, Users, Trash2, BookMarked, Settings,
  Sparkles, RefreshCw, GraduationCap, School, BookOpen,
  Plus, Edit2, Check, X, Link2, Megaphone, BarChart3
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AccountSettings from "@/components/account/AccountSettings";
import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import AnnouncementManager from "@/components/announcements/AnnouncementManager";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import ChangePassword from "@/components/account/ChangePassword";
import LoginHistory from "@/components/account/LoginHistory";
import { useTour } from "@/hooks/useTour";
import { TourHelpButton } from "@/components/onboarding/TourHelpButton";
import { getCoordinatorTourSteps } from "@/components/onboarding/tour-configs";

// Interfaces
interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  role: "teacher" | "class_teacher";
  phone: string | null;
  is_active: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string | null;
  class_teacher_id: string | null;
  class_teacher_name?: string | null;
  student_count?: number;
  subject_count?: number;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
}

interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  subject_name?: string;
  periods_per_week: number | null;
  is_mandatory: boolean;
}

interface TeacherAssignment {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  class_id: string;
  class_name?: string;
  class_section?: string | null;
  subject: string;
}

// Types for Supabase joined queries
interface TeacherClassJoinResult {
  id: string;
  teacher_id: string;
  class_id: string;
  subject: string;
  classes: {
    name: string;
    section: string | null;
    school_id: string;
  };
}

interface ClassSubjectJoinResult {
  id: string;
  class_id: string;
  subject_id: string;
  periods_per_week: number | null;
  is_mandatory: boolean;
  subjects: {
    name: string;
  } | null;
}

// Class name options
const CLASS_NAMES = [
  "Nursery", "KG", "Prep",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"
];

// Default sections seeded for new schools
const DEFAULT_SECTIONS = ["A", "B", "C", "D", "E", "F"];

// Common subjects
const COMMON_SUBJECTS = [
  "English", "Urdu", "Mathematics", "Science", "Social Studies",
  "Islamiat", "Computer Science", "Physics", "Chemistry", "Biology",
  "Pakistan Studies", "General Knowledge", "Art", "Physical Education"
];

const CoordinatorDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("classes");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff state
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [teacherType, setTeacherType] = useState<"teacher" | "class_teacher">("teacher");
  const [selectedClassIdForTeacher, setSelectedClassIdForTeacher] = useState("");

  // Classes state
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSections, setNewClassSections] = useState<string[]>(["A"]);
  const [showAddClassDialog, setShowAddClassDialog] = useState(false);

  // Custom sections state
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [showManageSectionsDialog, setShowManageSectionsDialog] = useState(false);

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Class subjects state
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [allClassSubjects, setAllClassSubjects] = useState<{class_id: string; subject_id: string}[]>([]);
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState("");
  const [showAssignSubjectsDialog, setShowAssignSubjectsDialog] = useState(false);
  const [selectedSubjectsToAssign, setSelectedSubjectsToAssign] = useState<string[]>([]);

  // Teacher assignments state
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [showAssignTeacherDialog, setShowAssignTeacherDialog] = useState(false);
  const [assignTeacherClassId, setAssignTeacherClassId] = useState("");
  const [assignTeacherSubject, setAssignTeacherSubject] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isCoordinator, loading } = useAuth();
  const tourSteps = useMemo(() => getCoordinatorTourSteps(), []);
  const { startTour, hasCompletedTour } = useTour("coordinator", tourSteps);

  // Redirect if not coordinator
  useEffect(() => {
    if (!loading && !isCoordinator) {
      navigate("/");
    }
  }, [loading, isCoordinator, navigate]);

  useEffect(() => {
    if (!loading && !isLoading && !hasCompletedTour) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, isLoading, hasCompletedTour, startTour]);

  // Load all data
  useEffect(() => {
    if (profile?.school_id) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.school_id]);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadClasses(),
      loadSubjects(),
      loadStaff(),
      loadTeacherAssignments(),
      loadCustomSections(),
      loadAllClassSubjects(),
    ]);
    setIsLoading(false);
  };

  const loadCustomSections = async () => {
    if (!profile?.school_id) return;
    try {
      const { data, error } = await supabase
        .from('custom_sections')
        .select('name')
        .eq('school_id', profile.school_id)
        .order('created_at');

      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed default sections for this school
        const defaults = DEFAULT_SECTIONS.map(name => ({
          school_id: profile.school_id,
          name,
        }));
        const { error: seedError } = await supabase
          .from('custom_sections')
          .insert(defaults);

        if (!seedError) {
          setCustomSections(DEFAULT_SECTIONS);
        }
      } else {
        setCustomSections(data.map(s => s.name));
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error loading custom sections:", error);
    }
  };

  const handleAddCustomSection = async () => {
    const trimmed = newSectionName.trim();
    if (!trimmed || !profile?.school_id) return;

    if (customSections.includes(trimmed)) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastDuplicateSection"),
        description: t("coordinatorDashboard.toastDuplicateSectionDesc", { name: trimmed }),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_sections')
        .insert({ school_id: profile.school_id, name: trimmed });

      if (error) throw error;

      setCustomSections([...customSections, trimmed]);
      setNewSectionName("");
      toast({
        title: t("coordinatorDashboard.toastSectionAdded"),
        description: t("coordinatorDashboard.toastSectionAddedDesc", { name: trimmed }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: t("coordinatorDashboard.toastSectionAddFailed"),
      });
    }
  };

  const handleDeleteCustomSection = async (sectionName: string) => {
    if (!profile?.school_id) return;

    // Check if section is in use by any class
    const { count } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .eq('section', sectionName);

    if (count && count > 0) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastCannotDelete"),
        description: t("coordinatorDashboard.toastCannotDeleteDesc", { name: sectionName, count: count }),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_sections')
        .delete()
        .eq('school_id', profile.school_id)
        .eq('name', sectionName);

      if (error) throw error;

      setCustomSections(customSections.filter(s => s !== sectionName));
      // Also remove from selected sections in add class dialog if present
      setNewClassSections(newClassSections.filter(s => s !== sectionName));
      toast({
        title: t("coordinatorDashboard.toastSectionDeleted"),
        description: t("coordinatorDashboard.toastSectionDeletedDesc", { name: sectionName }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: t("coordinatorDashboard.toastSectionDeleteFailed"),
      });
    }
  };

  const loadClasses = async () => {
    if (!profile?.school_id) return;
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section, class_teacher_id')
        .eq('school_id', profile.school_id)
        .order('name')
        .order('section');

      if (error) throw error;

      // Batch fetch teacher names, student counts, and subject counts
      const classIds = (data || []).map(c => c.id);
      const teacherIds = (data || []).map(c => c.class_teacher_id).filter(Boolean) as string[];

      const [teacherProfiles, studentRows, subjectRows] = await Promise.all([
        teacherIds.length > 0
          ? supabase.from('profiles').select('id, full_name').in('id', teacherIds).then(r => r.data)
          : Promise.resolve([]),
        classIds.length > 0
          ? supabase.from('students').select('class_id').in('class_id', classIds).then(r => r.data)
          : Promise.resolve([]),
        classIds.length > 0
          ? supabase.from('class_subjects').select('class_id').in('class_id', classIds).then(r => r.data)
          : Promise.resolve([]),
      ]);

      const teacherMap = new Map((teacherProfiles || []).map(p => [p.id, p.full_name]));
      const studentCountMap = new Map<string, number>();
      (studentRows || []).forEach(s => studentCountMap.set(s.class_id, (studentCountMap.get(s.class_id) || 0) + 1));
      const subjectCountMap = new Map<string, number>();
      (subjectRows || []).forEach(s => subjectCountMap.set(s.class_id, (subjectCountMap.get(s.class_id) || 0) + 1));

      const classesWithDetails = (data || []).map(cls => ({
        ...cls,
        class_teacher_name: cls.class_teacher_id ? teacherMap.get(cls.class_teacher_id) || null : null,
        student_count: studentCountMap.get(cls.id) || 0,
        subject_count: subjectCountMap.get(cls.id) || 0,
      }));

      setClasses(classesWithDetails);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading classes:', error);
    }
  };

  const loadSubjects = async () => {
    if (!profile?.school_id) return;
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading subjects:', error);
    }
  };

  const loadStaff = async () => {
    if (!profile?.school_id) return;
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, is_active')
        .eq('school_id', profile.school_id)
        .in('role', ['teacher', 'class_teacher'])
        .eq('is_active', true);

      if (roleError) throw roleError;
      if (!roleData || roleData.length === 0) {
        setStaff([]);
        return;
      }

      const userIds = roleData.map(r => r.user_id);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', userIds);

      const staffList: StaffMember[] = roleData.map(role => {
        const userProfile = profileData?.find(p => p.id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          full_name: userProfile?.full_name || 'Unknown',
          email: userProfile?.email || null,
          role: role.role as "teacher" | "class_teacher",
          phone: userProfile?.phone || null,
          is_active: role.is_active,
        };
      });

      setStaff(staffList);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading staff:', error);
    }
  };

  const loadTeacherAssignments = async () => {
    if (!profile?.school_id) return;
    try {
      const { data, error } = await supabase
        .from('teacher_classes')
        .select(`
          id, teacher_id, class_id, subject,
          classes!inner(name, section, school_id)
        `)
        .eq('classes.school_id', profile.school_id);

      if (error) throw error;

      // Batch fetch teacher names
      const assignmentTeacherIds = [...new Set((data as TeacherClassJoinResult[] || []).map(a => a.teacher_id))];
      const { data: assignmentProfiles } = assignmentTeacherIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', assignmentTeacherIds)
        : { data: [] };
      const assignmentTeacherMap = new Map((assignmentProfiles || []).map(p => [p.id, p.full_name]));

      const assignmentsWithNames = (data as TeacherClassJoinResult[] || []).map(assignment => ({
        id: assignment.id,
        teacher_id: assignment.teacher_id,
        teacher_name: assignmentTeacherMap.get(assignment.teacher_id) || 'Unknown',
        class_id: assignment.class_id,
        class_name: assignment.classes.name,
        class_section: assignment.classes.section,
        subject: assignment.subject,
      }));

      setTeacherAssignments(assignmentsWithNames);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading assignments:', error);
    }
  };

  const loadAllClassSubjects = async () => {
    if (!profile?.school_id) return;
    try {
      const classIds = classes.map(c => c.id);
      if (classIds.length === 0) return;

      const { data, error } = await supabase
        .from('class_subjects')
        .select('class_id, subject_id')
        .in('class_id', classIds);

      if (error) throw error;
      setAllClassSubjects(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading all class subjects:', error);
    }
  };

  const loadClassSubjects = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_subjects')
        .select(`
          id, class_id, subject_id, periods_per_week, is_mandatory,
          subjects(name)
        `)
        .eq('class_id', classId);

      if (error) throw error;

      const subjectsWithNames = (data as ClassSubjectJoinResult[] || []).map((cs) => ({
        ...cs,
        subject_name: cs.subjects?.name || 'Unknown',
      }));

      setClassSubjects(subjectsWithNames);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading class subjects:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // ==================== CLASS MANAGEMENT ====================

  const handleAddClass = async () => {
    if (!newClassName || newClassSections.length === 0) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastMissingInfo"),
        description: t("coordinatorDashboard.toastSelectSections"),
      });
      return;
    }

    if (!profile?.school_id) return;

    setIsSubmitting(true);
    try {
      // Create classes for each selected section
      const classesToCreate = newClassSections.map(section => ({
        school_id: profile.school_id,
        name: newClassName,
        section: section,
      }));

      const { error } = await supabase
        .from('classes')
        .insert(classesToCreate);

      if (error) {
        if (error.code === '23505') {
          throw new Error(t("coordinatorDashboard.toastSomeSectionsExist"));
        }
        throw error;
      }

      toast({
        title: t("coordinatorDashboard.toastClassesCreated"),
        description: t("coordinatorDashboard.toastClassesCreatedDesc", { count: newClassSections.length, name: newClassName }),
      });

      setNewClassName("");
      setNewClassSections(["A"]);
      setShowAddClassDialog(false);
      loadClasses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastClassCreateFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classInfo: ClassInfo) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classInfo.id);

      if (error) throw error;

      toast({
        title: t("coordinatorDashboard.toastClassDeleted"),
        description: t("coordinatorDashboard.toastClassDeletedDesc", { name: classInfo.name + (classInfo.section ? `-${classInfo.section}` : '') }),
      });

      loadClasses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastClassDeleteFailed"),
      });
    }
  };

  // ==================== SUBJECT MANAGEMENT ====================

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastMissingInfo"),
        description: t("coordinatorDashboard.toastEnterSubjectName"),
      });
      return;
    }

    if (!profile?.school_id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('subjects')
        .insert({
          school_id: profile.school_id,
          name: newSubjectName.trim(),
          code: newSubjectCode.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error(t("coordinatorDashboard.toastSubjectAddFailed"));
        }
        throw error;
      }

      toast({
        title: t("coordinatorDashboard.toastSubjectAdded"),
        description: t("coordinatorDashboard.toastSubjectAddedDesc", { name: newSubjectName }),
      });

      setNewSubjectName("");
      setNewSubjectCode("");
      setShowAddSubjectDialog(false);
      loadSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastSubjectAddFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCommonSubjects = async () => {
    if (!profile?.school_id) return;

    setIsSubmitting(true);
    try {
      const subjectsToAdd = COMMON_SUBJECTS.map(name => ({
        school_id: profile.school_id,
        name: name,
      }));

      const { error } = await supabase
        .from('subjects')
        .upsert(subjectsToAdd, { onConflict: 'school_id,name' });

      if (error) throw error;

      toast({
        title: t("coordinatorDashboard.toastSubjectsAdded"),
        description: t("coordinatorDashboard.toastSubjectsAddedDesc"),
      });

      loadSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastSubjectsAddFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ is_active: false })
        .eq('id', subject.id);

      if (error) throw error;

      toast({
        title: t("coordinatorDashboard.toastSubjectRemoved"),
        description: t("coordinatorDashboard.toastSubjectRemovedDesc", { name: subject.name }),
      });

      loadSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastSubjectRemoveFailed"),
      });
    }
  };

  // ==================== ASSIGN SUBJECTS TO CLASS ====================

  const handleOpenAssignSubjects = async (classInfo: ClassInfo) => {
    setSelectedClassForSubjects(classInfo.id);
    await loadClassSubjects(classInfo.id);

    // Pre-select already assigned subjects
    const { data } = await supabase
      .from('class_subjects')
      .select('subject_id')
      .eq('class_id', classInfo.id);

    setSelectedSubjectsToAssign((data || []).map(cs => cs.subject_id));
    setShowAssignSubjectsDialog(true);
  };

  const handleAssignSubjectsToClass = async () => {
    if (!selectedClassForSubjects) return;

    setIsSubmitting(true);
    try {
      // First, remove all existing assignments for this class
      await supabase
        .from('class_subjects')
        .delete()
        .eq('class_id', selectedClassForSubjects);

      // Then add new assignments
      if (selectedSubjectsToAssign.length > 0) {
        const assignments = selectedSubjectsToAssign.map(subjectId => ({
          class_id: selectedClassForSubjects,
          subject_id: subjectId,
        }));

        const { error } = await supabase
          .from('class_subjects')
          .insert(assignments);

        if (error) throw error;
      }

      toast({
        title: t("coordinatorDashboard.toastSubjectsAssigned"),
        description: t("coordinatorDashboard.toastSubjectsAssignedDesc", { count: selectedSubjectsToAssign.length }),
      });

      setShowAssignSubjectsDialog(false);
      setSelectedClassForSubjects("");
      setSelectedSubjectsToAssign([]);
      loadClasses();
      loadAllClassSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastSubjectsAssignFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== TEACHER ASSIGNMENTS ====================

  const handleAssignTeacher = async () => {
    if (!assignTeacherClassId || !assignTeacherSubject || !assignTeacherId) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastMissingInfo"),
        description: t("coordinatorDashboard.toastSelectAll"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('teacher_classes')
        .insert({
          teacher_id: assignTeacherId,
          class_id: assignTeacherClassId,
          subject: assignTeacherSubject,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error(t("coordinatorDashboard.toastTeacherAlreadyAssigned"));
        }
        throw error;
      }

      toast({
        title: t("coordinatorDashboard.toastTeacherAssigned"),
        description: t("coordinatorDashboard.toastTeacherAssignedDesc"),
      });

      setShowAssignTeacherDialog(false);
      setAssignTeacherClassId("");
      setAssignTeacherSubject("");
      setAssignTeacherId("");
      loadTeacherAssignments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastTeacherAssignFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTeacherAssignment = async (assignment: TeacherAssignment) => {
    try {
      const { error } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;

      toast({
        title: t("coordinatorDashboard.toastAssignmentRemoved"),
        description: t("coordinatorDashboard.toastAssignmentRemovedDesc"),
      });

      loadTeacherAssignments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastAssignmentRemoveFailed"),
      });
    }
  };

  // ==================== STAFF MANAGEMENT ====================

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastMissingInfo"),
        description: t("coordinatorDashboard.toastFillAllFields"),
      });
      return;
    }

    if (newTeacherPassword.length < 8) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastPasswordTooShort"),
        description: t("coordinatorDashboard.toastPasswordMin8"),
      });
      return;
    }

    if (teacherType === "class_teacher" && !selectedClassIdForTeacher) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastMissingClass"),
        description: t("coordinatorDashboard.toastSelectClassForTeacher"),
      });
      return;
    }

    if (!profile?.school_id) return;

    setIsSubmitting(true);
    try {
      // Check if class already has a teacher
      if (teacherType === "class_teacher" && selectedClassIdForTeacher) {
        const { data: existingClass } = await supabase
          .from('classes')
          .select('class_teacher_id, name, section')
          .eq('id', selectedClassIdForTeacher)
          .single();

        if (existingClass?.class_teacher_id) {
          const { data: existingTeacher } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', existingClass.class_teacher_id)
            .single();

          toast({
            variant: "destructive",
            title: t("coordinatorDashboard.toastClassHasTeacher"),
            description: t("coordinatorDashboard.toastClassHasTeacherDesc", { class: existingClass.name + (existingClass.section ? `-${existingClass.section}` : ''), teacher: existingTeacher?.full_name || 'another teacher' }),
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-school-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          email: newTeacherEmail.toLowerCase().trim(),
          password: newTeacherPassword,
          fullName: newTeacherName.trim(),
          role: teacherType,
          schoolId: profile.school_id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to create user (${res.status})`);
      }

      const userId = data.userId;

      if (teacherType === "class_teacher" && selectedClassIdForTeacher && userId) {
        await supabase
          .from('classes')
          .update({ class_teacher_id: userId })
          .eq('id', selectedClassIdForTeacher);
      }

      toast({
        title: t("coordinatorDashboard.toastStaffAdded"),
        description: t("coordinatorDashboard.toastStaffAddedDesc", { name: newTeacherName }),
      });

      setNewTeacherName("");
      setNewTeacherEmail("");
      setNewTeacherPassword("");
      setSelectedClassIdForTeacher("");
      loadStaff();
      loadClasses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastStaffAddFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffMember: StaffMember) => {
    try {
      await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', staffMember.id);

      if (staffMember.role === "class_teacher") {
        await supabase
          .from('classes')
          .update({ class_teacher_id: null })
          .eq('class_teacher_id', staffMember.user_id);
      }

      toast({
        title: t("coordinatorDashboard.toastStaffRemoved"),
        description: t("coordinatorDashboard.toastStaffRemovedDesc", { name: staffMember.full_name }),
      });

      loadStaff();
      loadClasses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("coordinatorDashboard.toastError"),
        description: error instanceof Error ? error.message : t("coordinatorDashboard.toastStaffRemoveFailed"),
      });
    }
  };

  // Stats
  const teacherCount = staff.filter(s => s.role === "teacher").length;
  const classTeacherCount = staff.filter(s => s.role === "class_teacher").length;

  // Get subjects for a class (for teacher assignment dropdown)
  const getSubjectsForClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return subjects;

    // Get subjects assigned to this class from the full list
    const filtered = subjects.filter(s =>
      allClassSubjects.some(cs => cs.class_id === classId && cs.subject_id === s.id)
    );
    return filtered.length > 0 ? filtered : subjects;
  };

  if (loading || isLoading) {
    return <DashboardSkeleton roleColor="bg-role-coordinator" />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Helmet><title>Coordinator Dashboard — School Smart Pakistan</title></Helmet>
      {/* Header */}
      <header className="w-full bg-role-coordinator text-primary-foreground sticky top-0 z-50" data-tour="coord-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("coordinatorDashboard.title")}</h1>
              <p className="text-xs opacity-80 truncate max-w-[150px] sm:max-w-none">{profile?.full_name || t("coordinatorDashboard.coordinator")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <LanguageToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/20" />
            <Button
              variant="ghost"
              size="icon"
              onClick={loadAllData}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <motion.main
        id="main-content"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Stats Cards */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StaggerItem>
            <HoverScale>
              <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <School className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{classes.length}</p>
                    <p className="text-sm text-muted-foreground">{t("coordinatorDashboard.statsClasses")}</p>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
          <StaggerItem>
            <HoverScale>
              <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
                    <p className="text-sm text-muted-foreground">{t("coordinatorDashboard.statsSubjects")}</p>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
          <StaggerItem>
            <HoverScale>
              <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-role-teacher/10 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-role-teacher" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{teacherCount}</p>
                    <p className="text-sm text-muted-foreground">{t("coordinatorDashboard.statsTeachers")}</p>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
          <StaggerItem>
            <HoverScale>
              <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-role-class-teacher/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-role-class-teacher" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{classTeacherCount}</p>
                    <p className="text-sm text-muted-foreground">{t("coordinatorDashboard.statsClassTeachers")}</p>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
        </StaggerContainer>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tabs - hidden on mobile where MobileNav handles navigation */}
          <TabsList className="hidden md:grid w-full max-w-4xl mx-auto grid-cols-7 mb-8 bg-card shadow-card" data-tour="coord-tabs">
            <TabsTrigger value="classes" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <School className="w-4 h-4 mr-1" />
              {t("coordinatorDashboard.tabs.classes")}
            </TabsTrigger>
            <TabsTrigger value="subjects" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-1" />
              {t("coordinatorDashboard.tabs.subjects")}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Link2 className="w-4 h-4 mr-1" />
              {t("coordinatorDashboard.tabs.assign")}
            </TabsTrigger>
            <TabsTrigger value="staff" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-1" />
              {t("coordinatorDashboard.tabs.staff")}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4 mr-1" />
              {t("coordinatorDashboard.tabs.announce")}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-1" />
              {t("coordinatorDashboard.tabs.analytics")}
            </TabsTrigger>
            <TabsTrigger value="account" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4 mr-1" />
              {t("coordinatorDashboard.tabs.account")}
            </TabsTrigger>
          </TabsList>

          {/* Mobile quick-access tabs for items not in bottom MobileNav */}
          <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === "assignments" ? "bg-role-coordinator text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              <Link2 className="w-4 h-4" />
              {t("coordinatorDashboard.tabs.assign")}
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === "announcements" ? "bg-role-coordinator text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              {t("coordinatorDashboard.tabs.announce")}
            </button>
          </div>

          <SwipeableTabContent activeTab={activeTab} tabOrder={["classes", "subjects", "assignments", "staff", "announcements", "analytics", "account"]} onTabChange={setActiveTab}>
          {/* CLASSES TAB */}
          <TabsContent value="classes" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-foreground">{t("coordinatorDashboard.classesSections")}</h2>
              <div className="flex gap-2">
                {/* Manage Sections Dialog */}
                <Dialog open={showManageSectionsDialog} onOpenChange={setShowManageSectionsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t("coordinatorDashboard.manageSections")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("coordinatorDashboard.manageSectionNames")}</DialogTitle>
                      <DialogDescription>
                        {t("coordinatorDashboard.manageSectionsDesc")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t("coordinatorDashboard.newSectionPlaceholder")}
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomSection();
                            }
                          }}
                        />
                        <Button
                          onClick={handleAddCustomSection}
                          className="bg-role-coordinator text-primary-foreground shrink-0"
                          disabled={!newSectionName.trim()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {t("coordinatorDashboard.add")}
                        </Button>
                      </div>
                      {customSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("coordinatorDashboard.noSectionsDefined")}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {customSections.map(section => (
                            <span
                              key={section}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm font-medium"
                            >
                              {section}
                              <button
                                onClick={() => handleDeleteCustomSection(section)}
                                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                title={`Delete section ${section}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowManageSectionsDialog(false)}>
                        {t("coordinatorDashboard.done")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Add Class Dialog */}
                <Dialog open={showAddClassDialog} onOpenChange={setShowAddClassDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-role-coordinator text-primary-foreground" data-tour="coord-add-class">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("coordinatorDashboard.addClass")}
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("coordinatorDashboard.createNewClass")}</DialogTitle>
                    <DialogDescription>
                      {t("coordinatorDashboard.createNewClassDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t("coordinatorDashboard.className")}</Label>
                      <Select value={newClassName} onValueChange={setNewClassName}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("coordinatorDashboard.selectClass")} />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_NAMES.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("coordinatorDashboard.sections")}</Label>
                      {customSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t("coordinatorDashboard.noSectionsForClass")}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {customSections.map(section => (
                            <label key={section} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={newClassSections.includes(section)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewClassSections([...newClassSections, section]);
                                  } else {
                                    setNewClassSections(newClassSections.filter(s => s !== section));
                                  }
                                }}
                              />
                              <span>{t("coordinatorDashboard.sectionLabel", { name: section })}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddClassDialog(false)}>
                      {t("coordinatorDashboard.cancel")}
                    </Button>
                    <LoadingButton
                      onClick={handleAddClass}
                      loading={isSubmitting}
                      className="bg-role-coordinator text-primary-foreground"
                    >
                      {t("coordinatorDashboard.create")}
                    </LoadingButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="bg-card rounded-xl p-8 shadow-card border border-border">
                <EmptyState
                  icon={School}
                  title={t("coordinatorDashboard.noClassesYet")}
                  description={t("coordinatorDashboard.noClassesYetDesc")}
                />
              </div>
            ) : (
              <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(cls => (
                  <StaggerItem key={cls.id}>
                    <HoverScale>
                      <div className="bg-card rounded-xl p-4 shadow-card border border-border h-full">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-foreground text-lg">
                          {cls.name}{cls.section ? `-${cls.section}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("coordinatorDashboard.studentsSubjectsCount", { students: cls.student_count, subjects: cls.subject_count })}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("coordinatorDashboard.deleteClass")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("coordinatorDashboard.deleteClassDesc", { name: cls.name + (cls.section ? `-${cls.section}` : '') })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("coordinatorDashboard.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => handleDeleteClass(cls)}
                            >
                              {t("coordinatorDashboard.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("coordinatorDashboard.classTeacherLabel")}</span>
                        <span className="font-medium text-foreground">
                          {cls.class_teacher_name || t("coordinatorDashboard.notAssigned")}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenAssignSubjects(cls)}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t("coordinatorDashboard.manageSubjects")}
                      </Button>
                    </div>
                  </div>
                    </HoverScale>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}

            {/* Assign Subjects Dialog */}
            <Dialog open={showAssignSubjectsDialog} onOpenChange={setShowAssignSubjectsDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("coordinatorDashboard.assignSubjectsToClass")}</DialogTitle>
                  <DialogDescription>
                    {t("coordinatorDashboard.assignSubjectsDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("coordinatorDashboard.noSubjectsAvailable")}
                    </p>
                  ) : (
                    subjects.map(subject => (
                      <label key={subject.id} className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded cursor-pointer">
                        <Checkbox
                          checked={selectedSubjectsToAssign.includes(subject.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubjectsToAssign([...selectedSubjectsToAssign, subject.id]);
                            } else {
                              setSelectedSubjectsToAssign(selectedSubjectsToAssign.filter(id => id !== subject.id));
                            }
                          }}
                        />
                        <span className="text-foreground">{subject.name}</span>
                        {subject.code && (
                          <span className="text-xs text-muted-foreground">({subject.code})</span>
                        )}
                      </label>
                    ))
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAssignSubjectsDialog(false)}>
                    {t("coordinatorDashboard.cancel")}
                  </Button>
                  <LoadingButton
                    onClick={handleAssignSubjectsToClass}
                    loading={isSubmitting}
                    className="bg-role-coordinator text-primary-foreground"
                  >
                    {t("coordinatorDashboard.save")}
                  </LoadingButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* SUBJECTS TAB */}
          <TabsContent value="subjects" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">{t("coordinatorDashboard.subjects")}</h2>
              <div className="flex gap-2">
                {subjects.length === 0 && (
                  <LoadingButton
                    variant="outline"
                    onClick={handleAddCommonSubjects}
                    loading={isSubmitting}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("coordinatorDashboard.addCommonSubjects")}
                  </LoadingButton>
                )}
                <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-role-coordinator text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("coordinatorDashboard.addSubject")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("coordinatorDashboard.addNewSubject")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>{t("coordinatorDashboard.subjectName")}</Label>
                        <Input
                          placeholder={t("coordinatorDashboard.subjectNamePlaceholder")}
                          value={newSubjectName}
                          onChange={e => setNewSubjectName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("coordinatorDashboard.subjectCode")}</Label>
                        <Input
                          placeholder={t("coordinatorDashboard.subjectCodePlaceholder")}
                          value={newSubjectCode}
                          onChange={e => setNewSubjectCode(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddSubjectDialog(false)}>
                        {t("coordinatorDashboard.cancel")}
                      </Button>
                      <LoadingButton
                        onClick={handleAddSubject}
                        loading={isSubmitting}
                        className="bg-role-coordinator text-primary-foreground"
                      >
                        {t("coordinatorDashboard.add")}
                      </LoadingButton>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="bg-card rounded-xl p-8 shadow-card border border-border">
                <EmptyState
                  icon={BookOpen}
                  title={t("coordinatorDashboard.noSubjectsYet")}
                  description={t("coordinatorDashboard.noSubjectsYetDesc")}
                />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => (
                  <div key={subject.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-foreground">{subject.name}</p>
                      {subject.code && (
                        <p className="text-sm text-muted-foreground">{subject.code}</p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("coordinatorDashboard.removeSubject")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("coordinatorDashboard.removeSubjectDesc", { name: subject.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("coordinatorDashboard.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => handleDeleteSubject(subject)}
                          >
                            {t("coordinatorDashboard.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TEACHER ASSIGNMENTS TAB */}
          <TabsContent value="assignments" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">{t("coordinatorDashboard.teacherAssignments")}</h2>
              <Dialog open={showAssignTeacherDialog} onOpenChange={setShowAssignTeacherDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-role-coordinator text-primary-foreground" data-tour="coord-assign-teacher">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("coordinatorDashboard.assignTeacher")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("coordinatorDashboard.assignTeacherToClass")}</DialogTitle>
                    <DialogDescription>
                      {t("coordinatorDashboard.assignTeacherDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t("coordinatorDashboard.class")}</Label>
                      <Select value={assignTeacherClassId} onValueChange={setAssignTeacherClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("coordinatorDashboard.selectClass")} />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}{cls.section ? `-${cls.section}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("coordinatorDashboard.subject")}</Label>
                      <Select value={assignTeacherSubject} onValueChange={setAssignTeacherSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("coordinatorDashboard.selectSubject")} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("coordinatorDashboard.teacher")}</Label>
                      <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("coordinatorDashboard.selectTeacher")} />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map(teacher => (
                            <SelectItem key={teacher.user_id} value={teacher.user_id}>
                              {teacher.full_name} ({teacher.role === 'class_teacher' ? t("coordinatorDashboard.classTeacherRole") : t("coordinatorDashboard.teacherRole")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAssignTeacherDialog(false)}>
                      {t("coordinatorDashboard.cancel")}
                    </Button>
                    <LoadingButton
                      onClick={handleAssignTeacher}
                      loading={isSubmitting}
                      className="bg-role-coordinator text-primary-foreground"
                    >
                      {t("coordinatorDashboard.assign")}
                    </LoadingButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {teacherAssignments.length === 0 ? (
              <div className="bg-card rounded-xl p-8 shadow-card border border-border">
                <EmptyState
                  icon={Link2}
                  title={t("coordinatorDashboard.noAssignmentsYet")}
                  description={t("coordinatorDashboard.noAssignmentsYetDesc")}
                />
              </div>
            ) : (
              <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {teacherAssignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="bg-card rounded-xl p-4 shadow-card border border-border card-pressable"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{assignment.teacher_name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                            {assignment.class_name}{assignment.class_section ? `-${assignment.class_section}` : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">{assignment.subject}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 shrink-0" aria-label="Remove assignment">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("coordinatorDashboard.removeAssignment")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("coordinatorDashboard.removeAssignmentDesc", { teacher: assignment.teacher_name, subject: assignment.subject, class: assignment.class_name + (assignment.class_section ? `-${assignment.class_section}` : '') })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("coordinatorDashboard.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => handleRemoveTeacherAssignment(assignment)}
                            >
                              {t("coordinatorDashboard.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-card rounded-xl shadow-card border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">{t("coordinatorDashboard.tableTeacher")}</th>
                        <th className="text-left p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">{t("coordinatorDashboard.tableClass")}</th>
                        <th className="text-left p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">{t("coordinatorDashboard.tableSubject")}</th>
                        <th className="text-right p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">{t("coordinatorDashboard.tableActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherAssignments.map(assignment => (
                        <tr key={assignment.id} className="border-t border-border">
                          <td className="p-2 sm:p-4 text-foreground text-sm sm:text-base">{assignment.teacher_name}</td>
                          <td className="p-2 sm:p-4 text-foreground text-sm sm:text-base">
                            {assignment.class_name}{assignment.class_section ? `-${assignment.class_section}` : ''}
                          </td>
                          <td className="p-2 sm:p-4 text-foreground text-sm sm:text-base">{assignment.subject}</td>
                          <td className="p-2 sm:p-4 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" aria-label="Remove assignment">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("coordinatorDashboard.removeAssignment")}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("coordinatorDashboard.removeAssignmentDesc", { teacher: assignment.teacher_name, subject: assignment.subject, class: assignment.class_name + (assignment.class_section ? `-${assignment.class_section}` : '') })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("coordinatorDashboard.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground"
                                    onClick={() => handleRemoveTeacherAssignment(assignment)}
                                  >
                                    {t("coordinatorDashboard.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            )}
          </TabsContent>

          {/* STAFF TAB */}
          <TabsContent value="staff" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Add Staff Form */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border" data-tour="coord-add-staff">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-coordinator" />
                  {t("coordinatorDashboard.addNewStaff")}
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("coordinatorDashboard.staffType")}</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="staffType"
                          value="teacher"
                          checked={teacherType === "teacher"}
                          onChange={() => {
                            setTeacherType("teacher");
                            setSelectedClassIdForTeacher("");
                          }}
                          className="w-4 h-4"
                          disabled={isSubmitting}
                        />
                        <span className="text-foreground">{t("coordinatorDashboard.teacherRole")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="staffType"
                          value="class_teacher"
                          checked={teacherType === "class_teacher"}
                          onChange={() => setTeacherType("class_teacher")}
                          className="w-4 h-4"
                          disabled={isSubmitting}
                        />
                        <span className="text-foreground">{t("coordinatorDashboard.classTeacherRole")}</span>
                      </label>
                    </div>
                  </div>

                  {teacherType === "class_teacher" && (
                    <div className="space-y-2">
                      <Label>{t("coordinatorDashboard.assignToClass")}</Label>
                      <Select value={selectedClassIdForTeacher} onValueChange={setSelectedClassIdForTeacher} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("coordinatorDashboard.selectAClass")} />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.filter(c => !c.class_teacher_id).map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}{cls.section ? ` - ${cls.section}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {classes.filter(c => !c.class_teacher_id).length === 0 && (
                        <p className="text-xs text-muted-foreground">{t("coordinatorDashboard.allClassesHaveTeachers")}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t("coordinatorDashboard.fullName")}</Label>
                    <Input
                      placeholder={t("coordinatorDashboard.enterFullName")}
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("coordinatorDashboard.email")}</Label>
                    <Input
                      type="email"
                      placeholder={t("coordinatorDashboard.enterEmail")}
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("coordinatorDashboard.password")}</Label>
                    <Input
                      type="password"
                      placeholder={t("coordinatorDashboard.setInitialPassword")}
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <LoadingButton
                    className="w-full bg-role-coordinator text-primary-foreground hover:opacity-90"
                    onClick={handleAddTeacher}
                    loading={isSubmitting}
                    loadingText="Adding..."
                  >
                    {t("coordinatorDashboard.addStaff")}
                  </LoadingButton>
                </div>
              </div>

              {/* Staff List */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-role-coordinator" />
                  {t("coordinatorDashboard.staffMembersCount", { count: staff.length })}
                </h2>

                {staff.length === 0 ? (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <EmptyState
                      icon={Users}
                      title={t("coordinatorDashboard.noStaffYet")}
                      description={t("coordinatorDashboard.noStaffYetDesc")}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staff.map((member) => (
                      <div key={member.id} className="bg-card rounded-xl p-4 shadow-card border border-border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{member.full_name}</p>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                member.role === "teacher" ? 'bg-role-teacher/10 text-role-teacher' : 'bg-role-class-teacher/10 text-role-class-teacher'
                              }`}>
                                {member.role === "teacher" ? t("coordinatorDashboard.teacherRole") : t("coordinatorDashboard.classTeacherRole")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email || t("coordinatorDashboard.noEmail")}</p>
                          </div>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("coordinatorDashboard.removeStaffMember")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("coordinatorDashboard.removeStaffDesc", { name: member.full_name })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("coordinatorDashboard.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleRemoveStaff(member)}
                                >
                                  {t("coordinatorDashboard.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ANNOUNCEMENTS TAB */}
          <TabsContent value="announcements" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-4xl mx-auto">
              {profile?.school_id && (
                <AnnouncementManager schoolId={profile.school_id} />
              )}
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-6">{t("coordinatorDashboard.sectionAnalytics")}</h2>
            {profile?.school_id && (
              <AnalyticsDashboard schoolId={profile.school_id} userRole="coordinator" />
            )}
          </TabsContent>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" forceMount className="data-[state=inactive]:hidden animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">{t("common.accountSettings")}</h2>
                <p className="text-muted-foreground text-sm">{t("common.manageProfile")}</p>
              </div>
              <AccountSettings roleColor="bg-role-coordinator" />
              <ChangePassword />
              <LoginHistory />
            </div>
          </TabsContent>
          </SwipeableTabContent>
        </Tabs>
      </motion.main>

      <TourHelpButton onClick={startTour} />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        data-tour="coord-mobile-nav"
        items={[
          { id: "classes", label: t("coordinatorDashboard.tabs.classes"), icon: School },
          { id: "subjects", label: t("coordinatorDashboard.tabs.subjects"), icon: BookOpen },
          { id: "staff", label: t("coordinatorDashboard.tabs.staff"), icon: Users },
          { id: "analytics", label: t("coordinatorDashboard.tabs.analytics"), icon: BarChart3 },
          { id: "account", label: t("coordinatorDashboard.tabs.account"), icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="bg-role-coordinator"
      />
    </div>
  );
};

export default CoordinatorDashboard;
