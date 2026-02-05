import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleCard } from "@/components/RoleCard";
import { StatsCard } from "@/components/StatsCard";
import {
  Users, BookOpen, GraduationCap, Award, UserCheck, BookMarked, Crown, UserPlus,
  ClipboardCheck, BarChart3, Bell, Shield, MessageSquare,
  ChevronDown, ArrowRight, Star,
} from "lucide-react";
import { FadeIn, FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
  { icon: Users, value: "5000+", label: "Active Students" },
  { icon: BookOpen, value: "100+", label: "Classes Managed" },
  { icon: GraduationCap, value: "200+", label: "Teachers" },
  { icon: Award, value: "15+", label: "Partner Schools" },
];

const features = [
  {
    icon: ClipboardCheck,
    title: "Smart Attendance",
    description: "One-tap daily attendance marking with automatic absence notifications sent to parents via email.",
  },
  {
    icon: BookOpen,
    title: "Homework Management",
    description: "Teachers assign homework with deadlines. Students submit files. Parents track completion status.",
  },
  {
    icon: BarChart3,
    title: "Marks & Result Cards",
    description: "Enter marks for weekly, monthly, and final exams. Auto-generated printable result cards with grades.",
  },
  {
    icon: Bell,
    title: "Announcements",
    description: "School-wide or class-specific announcements with instant notifications to all relevant users.",
  },
  {
    icon: MessageSquare,
    title: "Group Chat",
    description: "Built-in real-time messaging between teachers, parents, and coordinators. Role-based chat rooms.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "6 distinct portals - Student, Teacher, Class Teacher, Coordinator, Principal, and Parent. Each sees only their data.",
  },
];

const steps = [
  {
    number: "01",
    title: "Principal Sets Up",
    description: "The Principal creates classes and assigns Section Heads who manage their respective sections.",
  },
  {
    number: "02",
    title: "Teachers Get Assigned",
    description: "Section Heads assign teachers to classes and subjects. Class Teachers manage their class roster.",
  },
  {
    number: "03",
    title: "Everyone Connects",
    description: "Students, teachers, and parents log into their portals. Attendance, homework, and marks flow seamlessly.",
  },
];

const testimonials = [
  {
    name: "Ahmed Khan",
    role: "Principal, Lahore Grammar School",
    content: "School Smart transformed how we manage our school. Attendance tracking that used to take hours now takes minutes. Parents are more engaged than ever.",
    rating: 5,
  },
  {
    name: "Fatima Noor",
    role: "Teacher, Islamabad Model School",
    content: "Uploading homework and entering marks is so simple. I can see which students submitted and grade them all from one screen. It saves me 2 hours every day.",
    rating: 5,
  },
  {
    name: "Bilal Raza",
    role: "Parent",
    content: "I can finally see my son's attendance and homework status without calling the school. The result cards are professional and I get notified if he's absent.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "How long does it take to set up?",
    a: "Most schools are fully operational within 1-2 days. The Principal creates classes, assigns staff, and students are added by Class Teachers. No technical expertise required.",
  },
  {
    q: "Do parents need to install an app?",
    a: "No. School Smart works in any web browser on phones, tablets, and computers. Parents simply log in through the Parent Portal - no app download needed.",
  },
  {
    q: "Is our school data secure?",
    a: "Absolutely. We use Supabase with enterprise-grade encryption, row-level security, and role-based access controls. Each user only sees data they are authorized to access.",
  },
  {
    q: "Can we try it before paying?",
    a: "Yes! Our Starter plan is completely free for schools with up to 100 students. You can upgrade anytime as your school grows.",
  },
  {
    q: "What if we need help with setup?",
    a: "Professional and Enterprise plans include setup assistance. We also provide video tutorials and documentation for the free tier. Email support is available for all plans.",
  },
];

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
                  Trusted by 15+ schools across Pakistan
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  The Smarter Way to{" "}
                  <span className="text-gradient">Run Your School</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Attendance, homework, marks, result cards, parent communication - everything your school needs in one simple platform. Built for Pakistani schools.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg" className="bg-gradient-primary text-white shadow-button hover:shadow-lg hover:-translate-y-0.5 transition-all h-12 px-8">
                    <a href="#portals">
                      Login to Portal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 px-8">
                    <a href="#features">See Features</a>
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
                    alt="Students in a modern classroom"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <StatsCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">Features</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Everything Your School Needs
              </h2>
              <p className="text-muted-foreground text-lg">
                From daily attendance to annual result cards, we handle it all so you can focus on education.
              </p>
            </div>
          </FadeInView>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 h-full group">
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

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">How It Works</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Up and Running in 3 Steps
              </h2>
              <p className="text-muted-foreground text-lg">
                No complicated setup. No technical skills needed. Your school can be live in under a day.
              </p>
            </div>
          </FadeInView>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <FadeInView key={step.number} delay={i * 0.15}>
                <div className="text-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-5 shadow-button">
                    {step.number}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/20" />
                  )}
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Selection */}
      <section id="portals" className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">Quick Access</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Choose Your Portal
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Select your role to access your personalized dashboard
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

      {/* Testimonials */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">Testimonials</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Loved by Schools Across Pakistan
              </h2>
              <p className="text-muted-foreground text-lg">
                Hear from principals, teachers, and parents who use School Smart every day.
              </p>
            </div>
          </FadeInView>

          <StaggerContainer className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <div className="bg-background rounded-xl p-6 border border-border shadow-card h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed flex-1 mb-4">"{t.content}"</p>
                  <div className="border-t border-border pt-4">
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <FadeInView>
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">FAQ</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-lg">
                Got questions? We've got answers.
              </p>
            </div>
          </FadeInView>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <FadeInView key={i} delay={i * 0.05}>
                <div className="bg-background rounded-xl border border-border overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
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
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
