import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleCard } from "@/components/RoleCard";
import { StatsCard } from "@/components/StatsCard";
import { Users, BookOpen, GraduationCap, Award, UserCheck, BookMarked, Crown, Building, UserPlus } from "lucide-react";
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
    colorClass: "bg-purple-600",
  },
];

const stats = [
  { icon: Users, value: "5,000+", label: "Active Students" },
  { icon: BookOpen, value: "100+", label: "Classes" },
  { icon: GraduationCap, value: "200+", label: "Teachers" },
  { icon: Award, value: "15+", label: "Years of Excellence" },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Welcome to <span className="text-primary">School Smart Pakistan</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Complete school management system for Pakistani schools. Manage homework, attendance, marks, and stay connected. Simple, fast, and works everywhere.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#portals"
                  className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-6 py-3 rounded-lg font-medium shadow-button hover:opacity-90 transition-opacity"
                >
                  Get Started
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="rounded-2xl overflow-hidden shadow-card-hover">
                <img
                  src={heroImage}
                  alt="Students learning in classroom"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Selection */}
      <section id="portals" className="py-16 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium mb-4">
              Quick Access
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Choose Your Portal
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select your role to access your personalized dashboard
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {roles.map((role) => (
              <RoleCard key={role.title} {...role} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <StatsCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
