import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Users,
  BookOpen,
  Award,
  Megaphone,
  ChevronRight,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug, slugToName } from "@/lib/utils/slug";

interface SchoolData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
}

interface PublicNotice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

const SchoolPublicPage = () => {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [stats, setStats] = useState<SchoolStats>({ totalStudents: 0, totalTeachers: 0, totalClasses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (schoolSlug) {
      fetchSchoolData();
    }
  }, [schoolSlug]);

  const fetchSchoolData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, fetch all active schools and match by slug
      const { data: allSchools, error: schoolsError } = await supabase
        .from("schools")
        .select("id, name, address, phone, email, logo_url, created_at")
        .eq("is_active", true);

      if (schoolsError) throw schoolsError;

      // Find school by matching slug
      const matchedSchool = allSchools?.find(s => generateSlug(s.name) === schoolSlug);

      if (!matchedSchool) {
        // Try by ID as fallback
        const { data: schoolById, error: idError } = await supabase
          .from("schools")
          .select("id, name, address, phone, email, logo_url, created_at")
          .eq("id", schoolSlug)
          .eq("is_active", true)
          .single();

        if (idError || !schoolById) {
          setError(t("schoolPublicPage.schoolNotFound"));
          return;
        }
        setSchool(schoolById);
        await fetchSchoolDetails(schoolById.id);
      } else {
        setSchool(matchedSchool);
        await fetchSchoolDetails(matchedSchool.id);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error fetching school:", err);
      setError(t("schoolPublicPage.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchoolDetails = async (schoolId: string) => {
    // Fetch public notices
    const { data: noticesData } = await supabase
      .from("notices")
      .select("id, title, content, created_at")
      .eq("school_id", schoolId)
      .is("target_class_id", null) // Only school-wide notices
      .order("created_at", { ascending: false })
      .limit(5);

    setNotices((noticesData || []) as PublicNotice[]);

    // Fetch stats
    const [studentsResult, teachersResult, classesResult] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("school_id", schoolId).in("role", ["teacher", "class_teacher"]),
      supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    ]);

    setStats({
      totalStudents: studentsResult.count || 0,
      totalTeachers: teachersResult.count || 0,
      totalClasses: classesResult.count || 0,
    });
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === "ur" ? "ur-PK" : "en-US";
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("schoolPublicPage.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <School className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">{t("schoolPublicPage.notFoundTitle")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("schoolPublicPage.notFoundDesc")}
            </p>
            <Link to="/">
              <Button>{t("notFound.backHome")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>School Profile — School Smart Pakistan</title></Helmet>
      {/* Hero Section */}
      <header className="relative bg-primary text-primary-foreground py-16 md:py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white p-2 object-contain"
                loading="lazy"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-12 h-12 md:w-16 md:h-16" />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                {school.name}
              </h1>
              <p className="text-lg opacity-90">
                {t("schoolPublicPage.welcomePortal")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalStudents}</p>
              <p className="text-sm text-muted-foreground">{t("schoolPublicPage.students")}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalTeachers}</p>
              <p className="text-sm text-muted-foreground">{t("schoolPublicPage.teachers")}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalClasses}</p>
              <p className="text-sm text-muted-foreground">{t("schoolPublicPage.classes")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5 text-primary" />
                  {t("schoolPublicPage.aboutSchool")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {t("schoolPublicPage.aboutSchoolDesc", { name: school.name })}
                </p>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  {t("schoolPublicPage.latestAnnouncements")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t("schoolPublicPage.noAnnouncements")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {notices.map((notice) => (
                      <div
                        key={notice.id}
                        className="border-l-4 border-primary pl-4 py-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground">{notice.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notice.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(notice.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("schoolPublicPage.contactInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {school.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{school.address}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <a href={`tel:${school.phone}`} className="text-muted-foreground hover:text-primary">
                      {school.phone}
                    </a>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <a href={`mailto:${school.email}`} className="text-muted-foreground hover:text-primary">
                      {school.email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Login Portal Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("schoolPublicPage.portalAccess")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/student/login" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    {t("schoolPublicPage.studentPortal")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/parent/login" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    {t("schoolPublicPage.parentPortal")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/teacher/login" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    {t("schoolPublicPage.teacherPortal")}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-footer text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="opacity-80">
            &copy; {new Date().getFullYear()} {school.name}{`. ${t("schoolPublicPage.allRightsReserved")}`}
          </p>
          <p className="opacity-60 text-sm mt-2">
            {t("schoolPublicPage.poweredBy")}{" "}
            <Link to="/" className="hover:underline">
              School Smart Pakistan
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SchoolPublicPage;
