import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleCard } from "@/components/RoleCard";
import { StatsCard } from "@/components/StatsCard";
import { Testimonials } from "@/components/Testimonials";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WaveDivider, CurveDivider } from "@/components/ui/section-divider";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, BookOpen, GraduationCap, Award, UserCheck, BookMarked, Crown, UserPlus,
  ClipboardCheck, BarChart3, Bell, MessageSquare, Calendar,
  ArrowRight, ChevronDown,
} from "lucide-react";
import { FadeIn, FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-classroom.jpg";

const roles = [
  {
    title: "Student",
    description: "View homework, attendance, marks, and school notices",
    icon: Users,
    href: "/student/login",
    colorClass: "bg-role-student",
  },
  {
    title: "Teacher",
    description: "Manage classes, upload homework, and enter marks",
    icon: BookOpen,
    href: "/teacher/login",
    colorClass: "bg-role-teacher",
  },
  {
    title: "Class Teacher",
    description: "Mark attendance, add students, and manage your class",
    icon: UserCheck,
    href: "/class-teacher/login",
    colorClass: "bg-role-class-teacher",
  },
  {
    title: "Section Head / Coordinator",
    description: "Manage teachers, class teachers, and section staff",
    icon: BookMarked,
    href: "/coordinator/login",
    colorClass: "bg-role-coordinator",
  },
  {
    title: "Principal",
    description: "Oversee school administration and view analytics",
    icon: Crown,
    href: "/principal/login",
    colorClass: "bg-role-principal",
  },
  {
    title: "Parent",
    description: "Monitor your child's academics, attendance, and progress",
    icon: UserPlus,
    href: "/parent/login",
    colorClass: "bg-role-parent",
  },
];

const features = [
  {
    icon: ClipboardCheck,
    title: "Daily Attendance",
    description: "Real-time attendance tracking for every class. Parents receive instant notifications when their child is marked absent.",
  },
  {
    icon: BookOpen,
    title: "Homework & Assignments",
    description: "Teachers post homework with deadlines. Students can submit work online. Parents stay informed about pending tasks.",
  },
  {
    icon: BarChart3,
    title: "Marks & Result Cards",
    description: "Complete academic records including weekly tests, monthly exams, and term results. Download printable result cards anytime.",
  },
  {
    icon: Bell,
    title: "School Announcements",
    description: "Important notices, event updates, and school news delivered directly to students and parents through the portal.",
  },
  {
    icon: MessageSquare,
    title: "Parent-Teacher Communication",
    description: "Direct messaging between parents and teachers. Stay connected about your child's progress and any concerns.",
  },
  {
    icon: Calendar,
    title: "Academic Calendar",
    description: "View exam schedules, holidays, events, and important dates. Never miss a school activity or deadline.",
  },
];

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  schools: number;
}

const faqs = [
  {
    q: "I can't login - it says 'Invalid credentials' or 'Student ID not found'",
    a: "Make sure you're using the correct portal for your role (e.g., students should use Student Portal, not Teacher Portal). Double-check your Student ID or email for typos. If you're a new user, your account may not be set up yet - contact your class teacher or school office.",
  },
  {
    q: "How do I reset my password if I forgot it?",
    a: "Click 'Forgot Password?' on any login page. Enter your registered email address and you'll receive a reset link. Check your spam folder if you don't see it. The link expires after 1 hour, so use it promptly. If you never received initial credentials, contact your school administration.",
  },
  {
    q: "My homework file won't upload - what should I do?",
    a: "Check that your file is under 10MB and in an accepted format (PDF, Word documents, or images like JPG/PNG). If your file is too large, try compressing it or converting to PDF. Make sure you have a stable internet connection and try again.",
  },
  {
    q: "I submitted homework but my teacher says they don't see it",
    a: "The upload may not have completed successfully. Go back to the homework section, check if it shows 'Submitted' status, and try re-uploading if needed. Ask your teacher to refresh their page. If the problem persists, contact your class teacher.",
  },
  {
    q: "Why can't I see my marks or attendance?",
    a: "Your class teacher needs to add you to subjects and mark your attendance first. If you're newly enrolled, wait for your class teacher to complete the setup. If you've been a student for a while and still see no data, contact your class teacher to verify your enrollment.",
  },
  {
    q: "As a parent, how do I link my account to my child?",
    a: "Parent-student linking is done by the school administration. Contact the school office with your child's name and class to have them link your accounts. Once linked, you'll see your child's information automatically when you login.",
  },
  {
    q: "The page shows 'Network Error' or won't load properly",
    a: "Check your internet connection and try refreshing the page. If the problem continues, try clearing your browser cache or using a different browser. Wait a few minutes and try again - the server may be temporarily busy.",
  },
  {
    q: "I'm getting 'Access Denied' even with correct login",
    a: "This means your account exists but doesn't have the required role. Make sure you're using the correct portal for your role. If you recently changed roles (e.g., became a class teacher), contact school administration to update your permissions.",
  },
  {
    q: "How do I change my password after logging in?",
    a: "Go to your Account Settings (usually accessible from the profile menu or settings icon). Select 'Change Password', enter your current password, then your new password twice. Your new password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.",
  },
  {
    q: "Why is my attendance showing incorrectly?",
    a: "Attendance is marked daily by your class teacher. If you believe there's an error, contact your class teacher directly - they can review and correct attendance records. Keep track of dates you were present in case verification is needed.",
  },
  {
    q: "Can I print my result card?",
    a: "Yes! Go to the 'Yearly Results' or 'Result Card' section in your dashboard. Click the 'Print Result Card' button to generate a printable version. You can print it directly or save as PDF for your records.",
  },
  {
    q: "As a teacher, why can't I mark attendance?",
    a: "Only Class Teachers can mark attendance, not subject teachers. If you're a subject teacher and need attendance for your class, ask the assigned class teacher for that information. If you should be a class teacher, contact your coordinator to update your role.",
  },
];

const Index = () => {
  const [stats, setStats] = useState<Stats>({ students: 0, teachers: 0, classes: 0, schools: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentsResult, teachersResult, classesResult, schoolsResult] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["teacher", "class_teacher"]),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("schools").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      setStats({
        students: studentsResult.count || 0,
        teachers: teachersResult.count || 0,
        classes: classesResult.count || 0,
        schools: schoolsResult.count || 0,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsData = [
    { icon: Users, value: stats.students.toLocaleString(), label: "Students Enrolled" },
    { icon: GraduationCap, value: stats.teachers.toLocaleString(), label: "Teachers" },
    { icon: BookOpen, value: stats.classes.toLocaleString(), label: "Active Classes" },
    { icon: Award, value: stats.schools.toLocaleString(), label: "Schools" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <main id="main-content">
      <section className="relative bg-gradient-hero min-h-[85vh] flex items-center py-16 lg:py-24 overflow-hidden noise-overlay">
        {/* Animated mesh gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="hero-blob" />
          <div className="hero-blob" />
          <div className="hero-blob" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn delay={0.1}>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/30 text-primary text-sm font-medium mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Welcome to Our School Portal
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
                  Excellence in{" "}
                  <span className="text-gradient">Education</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Access your academic records, homework, attendance, and stay connected with teachers and school activities through our integrated portal system.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg" className="btn-gradient-animated text-white shadow-button hover:shadow-lg hover:-translate-y-0.5 transition-all h-12 px-8 text-base">
                    <a href="#portals">
                      Login to Portal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base backdrop-blur-sm">
                    <a href="#features">Explore Features</a>
                  </Button>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 dark:opacity-25 -z-10 scale-95" />
                <div className="rounded-3xl overflow-hidden shadow-card-hover border border-white/20 dark:border-white/[0.08]">
                  <img
                    src={heroImage}
                    alt="Students in classroom"
                    className="w-full h-auto object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Wave divider into Stats section */}
        <WaveDivider fill="hsl(var(--card))" />
      </section>

      {/* Stats Bar */}
      <section className="py-16 pt-24 bg-card relative">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground">
                Platform <span className="heading-gradient">Overview</span>
              </h2>
            </div>
          </FadeInView>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {statsData.map((stat) => (
              <StatsCard
                key={stat.label}
                icon={stat.icon}
                value={isLoading ? "..." : stat.value}
                label={stat.label}
              />
            ))}
          </div>
        </div>
        <CurveDivider fill="hsl(var(--background))" />
      </section>

      {/* Portal Selection */}
      <section id="portals" className="py-20 pt-24 bg-gradient-hero relative noise-overlay">
        <div className="container mx-auto px-4 relative z-10">
          <FadeInView>
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/15 text-primary rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-transparent dark:border-primary/20">Login</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
                Access Your <span className="heading-gradient">Portal</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Select your role to login and access your personalized dashboard
              </p>
            </div>
          </FadeInView>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {roles.map((role) => (
              <StaggerItem key={role.title}>
                <RoleCard {...role} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        <WaveDivider fill="hsl(var(--card))" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 pt-24 bg-card relative">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/15 text-primary rounded-full text-sm font-medium mb-4 border border-transparent dark:border-primary/20">Portal Features</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
                What You <span className="heading-gradient">Can Do</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Our school portal provides comprehensive tools for students, parents, and teachers to stay connected and informed.
              </p>
            </div>
          </FadeInView>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="relative bg-card/80 dark:bg-card/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-white/[0.08] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 h-full group overflow-hidden dark:hover:border-primary/20">
                  {/* Gradient border glow on hover */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 dark:from-primary/15 dark:to-accent/15" />
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        <CurveDivider fill="hsl(var(--background))" />
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-card relative">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-primary/15 text-primary rounded-full text-sm font-medium mb-4 border border-transparent dark:border-primary/20">Help & Support</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
                Frequently Asked <span className="heading-gradient">Questions</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Common issues and solutions for students, teachers, and parents
              </p>
            </div>
          </FadeInView>

          <div className="max-w-3xl mx-auto space-y-3">
            {(showAllFaqs ? faqs : faqs.slice(0, 5)).map((faq, i) => (
              <FadeInView key={i} delay={i * 0.03}>
                <div className="bg-card/80 dark:bg-card/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/[0.08] overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 dark:hover:border-primary/15">
                  <button
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-foreground pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              </FadeInView>
            ))}
          </div>

          {!showAllFaqs && faqs.length > 5 && (
            <FadeInView delay={0.2}>
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAllFaqs(true)}
                  className="gap-2"
                >
                  Show More Questions
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </FadeInView>
          )}

          <FadeInView delay={0.4}>
            <div className="text-center mt-10">
              <p className="text-muted-foreground text-sm">
                Still need help? Contact your class teacher or school administration for assistance.
              </p>
            </div>
          </FadeInView>
        </div>
      </section>

      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
