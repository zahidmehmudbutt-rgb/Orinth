import { useState, useEffect } from "react";
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
import AnnouncementManager from "@/components/announcements/AnnouncementManager";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import ChangePassword from "@/components/account/ChangePassword";
import LoginHistory from "@/components/account/LoginHistory";
import { useTour } from "@/hooks/useTour";
import { TourHelpButton } from "@/components/onboarding/TourHelpButton";

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
  const { startTour, hasCompletedTour } = useTour("coordinator");

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
        title: "Duplicate Section",
        description: `Section "${trimmed}" already exists.`,
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
        title: "Section Added",
        description: `Section "${trimmed}" has been created.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the section. The name may already exist.",
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
        title: "Cannot Delete",
        description: `Section "${sectionName}" is used by ${count} class(es). Remove those classes first.`,
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
        title: "Section Deleted",
        description: `Section "${sectionName}" has been removed.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete the section. It may still be assigned to a class.",
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

      // Get class teacher names and student counts
      const classesWithDetails = await Promise.all((data || []).map(async (cls) => {
        let class_teacher_name = null;
        if (cls.class_teacher_id) {
          const { data: teacherProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', cls.class_teacher_id)
            .single();
          class_teacher_name = teacherProfile?.full_name || null;
        }

        // Get student count
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id);

        // Get subject count
        const { count: subjectCount } = await supabase
          .from('class_subjects')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', cls.id);

        return {
          ...cls,
          class_teacher_name,
          student_count: studentCount || 0,
          subject_count: subjectCount || 0,
        };
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

      // Get teacher names
      const assignmentsWithNames = await Promise.all((data as TeacherClassJoinResult[] || []).map(async (assignment) => {
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', assignment.teacher_id)
          .single();

        return {
          id: assignment.id,
          teacher_id: assignment.teacher_id,
          teacher_name: teacherProfile?.full_name || 'Unknown',
          class_id: assignment.class_id,
          class_name: assignment.classes.name,
          class_section: assignment.classes.section,
          subject: assignment.subject,
        };
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
        title: "Missing Information",
        description: "Please select a class name and at least one section.",
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
          throw new Error("Some of these class sections already exist.");
        }
        throw error;
      }

      toast({
        title: "Classes Created",
        description: `Created ${newClassSections.length} section(s) for ${newClassName}.`,
      });

      setNewClassName("");
      setNewClassSections(["A"]);
      setShowAddClassDialog(false);
      loadClasses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not create the class. It may already exist with that section.",
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
        title: "Class Deleted",
        description: `${classInfo.name}${classInfo.section ? `-${classInfo.section}` : ''} has been deleted.`,
      });

      loadClasses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not delete the class. It may have students or subjects assigned.",
      });
    }
  };

  // ==================== SUBJECT MANAGEMENT ====================

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a subject name.",
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
          throw new Error("This subject already exists.");
        }
        throw error;
      }

      toast({
        title: "Subject Added",
        description: `${newSubjectName} has been added.`,
      });

      setNewSubjectName("");
      setNewSubjectCode("");
      setShowAddSubjectDialog(false);
      loadSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not add the subject. It may already exist.",
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
        title: "Subjects Added",
        description: "Common subjects have been added.",
      });

      loadSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not add common subjects. Some may already exist.",
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
        title: "Subject Removed",
        description: `${subject.name} has been removed.`,
      });

      loadSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not remove the subject. It may be assigned to classes.",
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
        title: "Subjects Assigned",
        description: `${selectedSubjectsToAssign.length} subject(s) assigned to the class.`,
      });

      setShowAssignSubjectsDialog(false);
      setSelectedClassForSubjects("");
      setSelectedSubjectsToAssign([]);
      loadClasses();
      loadAllClassSubjects();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not assign subjects to the class. Check your connection and try again.",
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
        title: "Missing Information",
        description: "Please select a class, subject, and teacher.",
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
          throw new Error("This teacher is already assigned to this subject in this class.");
        }
        throw error;
      }

      toast({
        title: "Teacher Assigned",
        description: "Teacher has been assigned to the class.",
      });

      setShowAssignTeacherDialog(false);
      setAssignTeacherClassId("");
      setAssignTeacherSubject("");
      setAssignTeacherId("");
      loadTeacherAssignments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not assign the teacher. They may already be assigned to this class-subject.",
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
        title: "Assignment Removed",
        description: "Teacher assignment has been removed.",
      });

      loadTeacherAssignments();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not remove the teacher assignment.",
      });
    }
  };

  // ==================== STAFF MANAGEMENT ====================

  const handleAddTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (newTeacherPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    if (teacherType === "class_teacher" && !selectedClassIdForTeacher) {
      toast({
        variant: "destructive",
        title: "Missing Class",
        description: "Please select a class for the class teacher.",
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
            title: "Class Already Has a Teacher",
            description: `${existingClass.name}${existingClass.section ? `-${existingClass.section}` : ''} is already assigned to ${existingTeacher?.full_name || 'another teacher'}.`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      const response = await supabase.functions.invoke('create-school-user', {
        body: {
          email: newTeacherEmail.toLowerCase().trim(),
          password: newTeacherPassword,
          fullName: newTeacherName.trim(),
          role: teacherType,
          schoolId: profile.school_id,
        },
      });

      if (response.error) {
        let errorData = null;
        try { errorData = response.error.context?.body ? JSON.parse(new TextDecoder().decode(response.error.context.body)) : null; } catch { /* ignore parse errors */ }
        throw new Error(errorData?.error || response.error.message || "Failed to create user");
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to create user");
      }

      const userId = response.data.userId;

      if (teacherType === "class_teacher" && selectedClassIdForTeacher && userId) {
        await supabase
          .from('classes')
          .update({ class_teacher_id: userId })
          .eq('id', selectedClassIdForTeacher);
      }

      toast({
        title: "Staff Added",
        description: `${newTeacherName} has been added.`,
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
        title: "Error",
        description: error instanceof Error ? error.message : "Could not add staff member. The email may already be in use.",
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
        title: "Staff Removed",
        description: `${staffMember.full_name} has been removed.`,
      });

      loadStaff();
      loadClasses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Could not remove the staff member.",
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
      {/* Header */}
      <header className="w-full bg-role-coordinator text-primary-foreground sticky top-0 z-50" data-tour="coord-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Section Head Dashboard</h1>
              <p className="text-xs opacity-80 truncate max-w-[150px] sm:max-w-none">{profile?.full_name || "Coordinator"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
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
                    <p className="text-sm text-muted-foreground">Classes</p>
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
                    <p className="text-sm text-muted-foreground">Subjects</p>
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
                    <p className="text-sm text-muted-foreground">Teachers</p>
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
                    <p className="text-sm text-muted-foreground">Class Teachers</p>
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
              Classes
            </TabsTrigger>
            <TabsTrigger value="subjects" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-1" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="assignments" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Link2 className="w-4 h-4 mr-1" />
              Assign
            </TabsTrigger>
            <TabsTrigger value="staff" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-1" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4 mr-1" />
              Announce
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="account" className="text-sm data-[state=active]:bg-role-coordinator data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4 mr-1" />
              Account
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
              Assign Teachers
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === "announcements" ? "bg-role-coordinator text-primary-foreground" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              Announcements
            </button>
          </div>

          <SwipeableTabContent activeTab={activeTab} tabOrder={["classes", "subjects", "assignments", "staff", "announcements", "analytics", "account"]} onTabChange={setActiveTab}>
          {/* CLASSES TAB */}
          <TabsContent value="classes" className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-foreground">Classes & Sections</h2>
              <div className="flex gap-2">
                {/* Manage Sections Dialog */}
                <Dialog open={showManageSectionsDialog} onOpenChange={setShowManageSectionsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Manage Sections
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage Section Names</DialogTitle>
                      <DialogDescription>
                        Add or remove section names. These will be available when creating new classes.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="New section name (e.g. G, Morning, Red)"
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
                          Add
                        </Button>
                      </div>
                      {customSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No sections defined. Add your first section above.
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
                        Done
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Add Class Dialog */}
                <Dialog open={showAddClassDialog} onOpenChange={setShowAddClassDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-role-coordinator text-primary-foreground" data-tour="coord-add-class">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>
                      Select a class name and the sections you want to create.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Class Name</Label>
                      <Select value={newClassName} onValueChange={setNewClassName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_NAMES.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sections</Label>
                      {customSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No sections defined. Use "Manage Sections" to add section names first.
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
                              <span>Section {section}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddClassDialog(false)}>
                      Cancel
                    </Button>
                    <LoadingButton
                      onClick={handleAddClass}
                      loading={isSubmitting}
                      className="bg-role-coordinator text-primary-foreground"
                    >
                      Create
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
                  title="No Classes Yet"
                  description="Create your first class to get started."
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
                          {cls.student_count} students, {cls.subject_count} subjects
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
                            <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {cls.name}{cls.section ? `-${cls.section}` : ''} and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => handleDeleteClass(cls)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Class Teacher:</span>
                        <span className="font-medium text-foreground">
                          {cls.class_teacher_name || "Not assigned"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenAssignSubjects(cls)}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Manage Subjects
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
                  <DialogTitle>Assign Subjects to Class</DialogTitle>
                  <DialogDescription>
                    Select which subjects will be taught in this class.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No subjects available. Add subjects first.
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
                    Cancel
                  </Button>
                  <LoadingButton
                    onClick={handleAssignSubjectsToClass}
                    loading={isSubmitting}
                    className="bg-role-coordinator text-primary-foreground"
                  >
                    Save
                  </LoadingButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* SUBJECTS TAB */}
          <TabsContent value="subjects" className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Subjects</h2>
              <div className="flex gap-2">
                {subjects.length === 0 && (
                  <LoadingButton
                    variant="outline"
                    onClick={handleAddCommonSubjects}
                    loading={isSubmitting}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Add Common Subjects
                  </LoadingButton>
                )}
                <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-role-coordinator text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subject</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Subject Name</Label>
                        <Input
                          placeholder="e.g., Mathematics"
                          value={newSubjectName}
                          onChange={e => setNewSubjectName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject Code (Optional)</Label>
                        <Input
                          placeholder="e.g., MATH"
                          value={newSubjectCode}
                          onChange={e => setNewSubjectCode(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddSubjectDialog(false)}>
                        Cancel
                      </Button>
                      <LoadingButton
                        onClick={handleAddSubject}
                        loading={isSubmitting}
                        className="bg-role-coordinator text-primary-foreground"
                      >
                        Add
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
                  title="No Subjects Yet"
                  description="Add subjects that will be taught in your school."
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
                          <AlertDialogTitle>Remove Subject?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {subject.name} from the subjects list.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => handleDeleteSubject(subject)}
                          >
                            Remove
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
          <TabsContent value="assignments" className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Teacher Assignments</h2>
              <Dialog open={showAssignTeacherDialog} onOpenChange={setShowAssignTeacherDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-role-coordinator text-primary-foreground" data-tour="coord-assign-teacher">
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Teacher to Class</DialogTitle>
                    <DialogDescription>
                      Select a class, subject, and teacher to create an assignment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select value={assignTeacherClassId} onValueChange={setAssignTeacherClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
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
                      <Label>Subject</Label>
                      <Select value={assignTeacherSubject} onValueChange={setAssignTeacherSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
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
                      <Label>Teacher</Label>
                      <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map(teacher => (
                            <SelectItem key={teacher.user_id} value={teacher.user_id}>
                              {teacher.full_name} ({teacher.role === 'class_teacher' ? 'Class Teacher' : 'Teacher'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAssignTeacherDialog(false)}>
                      Cancel
                    </Button>
                    <LoadingButton
                      onClick={handleAssignTeacher}
                      loading={isSubmitting}
                      className="bg-role-coordinator text-primary-foreground"
                    >
                      Assign
                    </LoadingButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {teacherAssignments.length === 0 ? (
              <div className="bg-card rounded-xl p-8 shadow-card border border-border">
                <EmptyState
                  icon={Link2}
                  title="No Assignments Yet"
                  description="Assign teachers to classes and subjects."
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
                            <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {assignment.teacher_name}'s assignment to teach {assignment.subject} in {assignment.class_name}{assignment.class_section ? `-${assignment.class_section}` : ''}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => handleRemoveTeacherAssignment(assignment)}
                            >
                              Remove
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
                        <th className="text-left p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">Teacher</th>
                        <th className="text-left p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">Class</th>
                        <th className="text-left p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">Subject</th>
                        <th className="text-right p-2 sm:p-4 font-semibold text-foreground text-sm sm:text-base">Actions</th>
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
                                  <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove {assignment.teacher_name}'s assignment to teach {assignment.subject} in {assignment.class_name}{assignment.class_section ? `-${assignment.class_section}` : ''}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground"
                                    onClick={() => handleRemoveTeacherAssignment(assignment)}
                                  >
                                    Remove
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
          <TabsContent value="staff" className="animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Add Staff Form */}
              <div className="bg-card rounded-xl p-6 shadow-card border border-border" data-tour="coord-add-staff">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-role-coordinator" />
                  Add New Staff
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Staff Type</Label>
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
                        <span className="text-foreground">Teacher</span>
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
                        <span className="text-foreground">Class Teacher</span>
                      </label>
                    </div>
                  </div>

                  {teacherType === "class_teacher" && (
                    <div className="space-y-2">
                      <Label>Assign to Class</Label>
                      <Select value={selectedClassIdForTeacher} onValueChange={setSelectedClassIdForTeacher} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
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
                        <p className="text-xs text-muted-foreground">All classes already have class teachers assigned.</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Enter full name"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Set initial password (min 8 chars)"
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
                    Add Staff
                  </LoadingButton>
                </div>
              </div>

              {/* Staff List */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-role-coordinator" />
                  Staff Members ({staff.length})
                </h2>

                {staff.length === 0 ? (
                  <div className="bg-card rounded-xl p-6 shadow-card border border-border">
                    <EmptyState
                      icon={Users}
                      title="No Staff Yet"
                      description="Add teachers and class teachers to your school."
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
                                {member.role === "teacher" ? "Teacher" : "Class Teacher"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                          </div>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will deactivate {member.full_name}'s account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground"
                                  onClick={() => handleRemoveStaff(member)}
                                >
                                  Remove
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
          <TabsContent value="announcements" className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              {profile?.school_id && (
                <AnnouncementManager schoolId={profile.school_id} />
              )}
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-6">Section Analytics</h2>
            {profile?.school_id && (
              <AnalyticsDashboard schoolId={profile.school_id} role="coordinator" />
            )}
          </TabsContent>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-2">Account Settings</h2>
                <p className="text-muted-foreground text-sm">Manage your profile and security settings</p>
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
          { id: "classes", label: "Classes", icon: School },
          { id: "subjects", label: "Subjects", icon: BookOpen },
          { id: "staff", label: "Staff", icon: Users },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "account", label: "Account", icon: Settings },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="bg-role-coordinator"
      />
    </div>
  );
};

export default CoordinatorDashboard;
