import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleCard } from "@/components/RoleCard";
import { StatsCard } from "@/components/StatsCard";
import { Testimonials } from "@/components/Testimonials";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProductPreview } from "@/components/ProductPreview";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, BookOpen, GraduationCap, Award, UserCheck, BookMarked, Crown, UserPlus,
  ClipboardCheck, BarChart3, Bell, MessageSquare, Calendar,
  ArrowRight, ChevronDown,
} from "lucide-react";
import { FadeIn, FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const roleConfigs = [
  { titleKey: "roles.student", descKey: "roleDescriptions.student", icon: Users, href: "/student/login", colorClass: "bg-role-student" },
  { titleKey: "roles.teacher", descKey: "roleDescriptions.teacher", icon: BookOpen, href: "/teacher/login", colorClass: "bg-role-teacher" },
  { titleKey: "roles.classTeacher", descKey: "roleDescriptions.classTeacher", icon: UserCheck, href: "/class-teacher/login", colorClass: "bg-role-class-teacher" },
  { titleKey: "roles.coordinator", descKey: "roleDescriptions.coordinator", icon: BookMarked, href: "/coordinator/login", colorClass: "bg-role-coordinator" },
  { titleKey: "roles.principal", descKey: "roleDescriptions.principal", icon: Crown, href: "/principal/login", colorClass: "bg-role-principal" },
  { titleKey: "roles.parent", descKey: "roleDescriptions.parent", icon: UserPlus, href: "/parent/login", colorClass: "bg-role-parent" },
];

const featureConfigs = [
  { icon: ClipboardCheck, titleKey: "features.dailyAttendance", descKey: "features.dailyAttendanceDesc" },
  { icon: BookOpen, titleKey: "features.homework", descKey: "features.homeworkDesc" },
  { icon: BarChart3, titleKey: "features.marksResults", descKey: "features.marksResultsDesc" },
  { icon: Bell, titleKey: "features.announcements", descKey: "features.announcementsDesc" },
  { icon: MessageSquare, titleKey: "features.communication", descKey: "features.communicationDesc" },
  { icon: Calendar, titleKey: "features.calendar", descKey: "features.calendarDesc" },
];

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  schools: number;
}

const FAQ_COUNT = 12;

const Index = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const { data: stats = { students: 0, teachers: 0, classes: 0, schools: 0 }, isLoading } = useQuery<Stats>({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [studentsResult, teachersResult, classesResult, schoolsResult] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["teacher", "class_teacher"]),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("schools").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        students: studentsResult.count || 0,
        teachers: teachersResult.count || 0,
        classes: classesResult.count || 0,
        schools: schoolsResult.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const faqs = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`landing.faq${i + 1}q`),
    a: t(`landing.faq${i + 1}a`),
  }));

  const statsData = [
    { icon: Users, value: stats.students.toLocaleString(), label: t("landing.students") },
    { icon: GraduationCap, value: stats.teachers.toLocaleString(), label: t("landing.teachers") },
    { icon: BookOpen, value: stats.classes.toLocaleString(), label: t("landing.classes") },
    { icon: Award, value: stats.schools.toLocaleString(), label: t("landing.schools") },
  ];

  return (
    <div className="min-h-screen flex flex-col homepage-narrow">
      <Helmet>
        <title>School Management System — Complete School Management Platform</title>
        <meta name="description" content="School Management System is a complete school management platform. Manage students, teachers, attendance, homework, exams, and more with role-based dashboards for principals, coordinators, teachers, students, and parents." />
        <meta name="keywords" content="school management system, student information system, school software, attendance management, homework tracking, student portal, teacher dashboard, parent portal, school ERP" />
        <meta property="og:title" content="School Management System — Complete School Management Platform" />
        <meta property="og:description" content="A modern, comprehensive school management platform. Role-based dashboards, real-time messaging, attendance tracking, and analytics." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="School Management System" />
        <meta name="twitter:description" content="Complete school management platform with seven role-based portals" />
        <link rel="canonical" href="https://school-management-system.vercel.app/" />
      </Helmet>
      <Header />

      {/* Hero Section */}
      <main id="main-content">
      <section className="relative overflow-hidden">
        {/* Fine grid backdrop, masked to fade out — replaces the animated blobs */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:56px_56px] opacity-40 [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_75%)]"
        />

        <div className="container mx-auto px-4 pt-16 pb-16 lg:pt-24 lg:pb-24">
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 lg:gap-16 items-center">
            <FadeIn delay={0.1}>
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />
                  {t("landing.welcomeBadge")}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-[1.04] tracking-[-0.03em]">
                  {t("landing.heroTitle")}
                </h1>
                <p className="text-base lg:text-lg text-muted-foreground mb-8 leading-relaxed">
                  {t("landing.heroSubtitle")}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="h-11 px-6 text-sm font-semibold">
                    <a href="#portals">
                      {t("landing.getStarted")}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-11 px-6 text-sm font-semibold">
                    <a href="#features">{t("landing.learnMore")}</a>
                  </Button>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.25}>
              <ProductPreview />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-14 lg:py-16 bg-background relative">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-10">
              <h2 className="text-xl lg:text-2xl font-extrabold text-foreground">
                {t("landing.portalOverview")}
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
      </section>

      {/* Portal Selection */}
      <section id="portals" className="py-20 lg:py-24 bg-background relative">
        <div className="container mx-auto px-4 relative z-10">
          <FadeInView>
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 bg-primary/10 dark:bg-primary/15 text-primary rounded-full text-xs font-medium mb-3 border border-transparent dark:border-primary/20">{t("landing.loginAs")}</span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground mb-3">
                {t("landing.accessPortal")}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                {t("landing.selectRoleDesc")}
              </p>
            </div>
          </FadeInView>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {roleConfigs.map((role) => (
              <StaggerItem key={role.titleKey}>
                <RoleCard title={t(role.titleKey)} description={t(role.descKey)} icon={role.icon} href={role.href} colorClass={role.colorClass} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 bg-primary/10 dark:bg-primary/15 text-primary rounded-full text-xs font-medium mb-3 border border-transparent dark:border-primary/20">{t("landing.portalFeatures")}</span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground mb-3">
                {t("landing.whatYouCanDo")}
              </h2>
              <p className="text-muted-foreground text-base">
                {t("landing.portalFeaturesDesc")}
              </p>
            </div>
          </FadeInView>

          {/* Six features across three columns — two even rows */}
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {featureConfigs.map((feature) => (
              <StaggerItem key={feature.titleKey}>
                <div className="h-full rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{t(feature.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-24 bg-background relative">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 bg-primary/10 dark:bg-primary/15 text-primary rounded-full text-xs font-medium mb-3 border border-transparent dark:border-primary/20">{t("landing.helpSupport")}</span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground mb-3">
                {t("landing.faqTitle")}
              </h2>
              <p className="text-muted-foreground text-base">
                {t("landing.faqCommonIssues")}
              </p>
            </div>
          </FadeInView>

          <div className="max-w-3xl mx-auto space-y-3">
            {(showAllFaqs ? faqs : faqs.slice(0, 5)).map((faq, i) => (
              <FadeInView key={i} delay={i * 0.03}>
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 dark:hover:border-primary/15">
                  <button
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-sm text-foreground pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-muted-foreground text-xs leading-relaxed">{faq.a}</p>
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
                  {t("landing.showMoreFaqs")}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </FadeInView>
          )}

          <FadeInView delay={0.4}>
            <div className="text-center mt-10">
              <p className="text-muted-foreground text-sm">
                {t("landing.stillNeedHelp")}
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
