import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleCard } from "@/components/RoleCard";
import { StatsCard } from "@/components/StatsCard";
import {
  Users, BookOpen, GraduationCap, Award, UserCheck, BookMarked, Crown, UserPlus,
  ClipboardCheck, BarChart3, Bell, Shield, MessageSquare, Calendar,
  ArrowRight,
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

const stats = [
  { icon: Users, value: "1200+", label: "Students Enrolled" },
  { icon: GraduationCap, value: "85+", label: "Dedicated Teachers" },
  { icon: BookOpen, value: "50+", label: "Active Classes" },
  { icon: Award, value: "25+", label: "Years of Excellence" },
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

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-16 lg:py-24 overflow-hidden">
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeIn delay={0.1}>
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Welcome to Our School Portal
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Excellence in{" "}
                  <span className="text-gradient">Education</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Access your academic records, homework, attendance, and stay connected with teachers and school activities through our integrated portal system.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg" className="bg-gradient-primary text-white shadow-button hover:shadow-lg hover:-translate-y-0.5 transition-all h-12 px-8">
                    <a href="#portals">
                      Login to Portal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 px-8">
                    <a href="#features">Explore Features</a>
                  </Button>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-3xl opacity-20 -z-10 scale-95" />
                <div className="rounded-2xl overflow-hidden shadow-card-hover border border-border">
                  <img
                    src={heroImage}
                    alt="Students in classroom"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Our School at a Glance
              </h2>
            </div>
          </FadeInView>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <StatsCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Portal Selection - Moved up for quick access */}
      <section id="portals" className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">Login</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Access Your Portal
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
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">Portal Features</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                What You Can Do
              </h2>
              <p className="text-muted-foreground text-lg">
                Our school portal provides comprehensive tools for students, parents, and teachers to stay connected and informed.
              </p>
            </div>
          </FadeInView>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="bg-background rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 h-full group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
