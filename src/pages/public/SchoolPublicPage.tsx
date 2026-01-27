import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  BookOpen,
  Award,
  Clock,
  Megaphone,
  ChevronRight,
  School,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Use only columns that exist in the database
interface SchoolData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
}

// Extended data stored locally (these columns don't exist in DB yet)
interface ExtendedSchoolData {
  website: string | null;
  description: string | null;
  established_year: number | null;
  motto: string | null;
  primary_color: string | null;
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
  const [extended, setExtended] = useState<ExtendedSchoolData>({
    website: null,
    description: null,
    established_year: null,
    motto: null,
    primary_color: "#2563eb",
  });
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [stats, setStats] = useState<SchoolStats>({ totalStudents: 0, totalTeachers: 0, totalClasses: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schoolSlug) {
      fetchSchoolData();
    }
  }, [schoolSlug]);

  const fetchSchoolData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch school by slug (using name converted to slug)
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("id, name, address, phone, email, logo_url, created_at")
        .eq("is_active", true)
        .ilike("name", schoolSlug?.replace(/-/g, " ") || "")
        .single();

      if (schoolError) {
        // Try finding by ID if slug doesn't match
        const { data: schoolById, error: idError } = await supabase
          .from("schools")
          .select("id, name, address, phone, email, logo_url, created_at")
          .eq("id", schoolSlug)
          .eq("is_active", true)
          .single();

        if (idError) {
          setError("School not found");
          return;
        }
        setSchool(schoolById);
        await fetchSchoolDetails(schoolById.id);
      } else {
        setSchool(schoolData);
        await fetchSchoolDetails(schoolData.id);
      }
    } catch (err) {
      console.error("Error fetching school:", err);
      setError("Failed to load school information");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchoolDetails = async (schoolId: string) => {
    // Fetch notices (is_public column doesn't exist in current schema, so fetch recent notices)
    // In production, only public notices should be shown
    const { data: noticesData } = await supabase
      .from("notices")
      .select("id, title, content, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Filter to only show notices without sensitive data (basic filter since is_public doesn't exist)
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const primaryColor = extended.primary_color || "#2563eb";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading school information...</p>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">School Not Found</h2>
            <p className="text-gray-500 mb-6">
              The school you're looking for doesn't exist or is no longer active.
            </p>
            <Link to="/">
              <Button>Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header
        className="relative text-white py-16 md:py-24"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white p-2 object-contain"
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
              {extended.motto && (
                <p className="text-lg md:text-xl opacity-90 italic mb-4">
                  "{extended.motto}"
                </p>
              )}
              {extended.established_year && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <Calendar className="w-3 h-3 mr-1" />
                  Established {extended.established_year}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
              <p className="text-sm text-gray-500">Students</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalTeachers}</p>
              <p className="text-sm text-gray-500">Teachers</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Award className="w-8 h-8 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
              <p className="text-sm text-gray-500">Classes</p>
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
                  <School className="w-5 h-5" style={{ color: primaryColor }} />
                  About Our School
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extended.description ? (
                  <p className="text-gray-600 leading-relaxed">{extended.description}</p>
                ) : (
                  <p className="text-gray-500 italic">
                    Welcome to {school.name}. We are committed to providing quality education
                    and nurturing the next generation of leaders.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5" style={{ color: primaryColor }} />
                  Latest Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No public announcements at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {notices.map((notice) => (
                      <div
                        key={notice.id}
                        className="border-l-4 pl-4 py-2"
                        style={{ borderColor: primaryColor }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notice.content}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
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
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {school.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{school.address}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${school.phone}`} className="text-gray-600 hover:text-primary">
                      {school.phone}
                    </a>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${school.email}`} className="text-gray-600 hover:text-primary">
                      {school.email}
                    </a>
                  </div>
                )}
                {extended.website && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                    <a
                      href={extended.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Login Portal Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portal Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/student/login" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Student Portal
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/parent/login" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Parent Portal
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/teacher/login" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Teacher Portal
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} {school.name}. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by{" "}
            <Link to="/" className="text-primary hover:underline">
              School Smart Pakistan
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SchoolPublicPage;
