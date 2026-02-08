import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { FadeInView } from "@/components/ui/motion-wrapper";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-gradient-footer text-white border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <FadeInView>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">{t("footer.brandName")}</h3>
                  <p className="text-xs opacity-80">{t("footer.brandDesc")}</p>
                </div>
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("footer.quickLinks")}</h4>
              <ul className="space-y-2.5 text-sm opacity-80">
                <li><a href="#features" className="hover:opacity-100 transition-opacity">{t("header.features")}</a></li>
                <li><a href="#portals" className="hover:opacity-100 transition-opacity">{t("header.portals")}</a></li>
                <li><a href="#faq" className="hover:opacity-100 transition-opacity">{t("header.faq")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("footer.portals")}</h4>
              <ul className="space-y-2.5 text-sm opacity-80">
                <li><Link to="/student/login" className="hover:opacity-100 transition-opacity">{t("login.studentLogin")}</Link></li>
                <li><Link to="/teacher/login" className="hover:opacity-100 transition-opacity">{t("login.teacherLogin")}</Link></li>
                <li><Link to="/parent/login" className="hover:opacity-100 transition-opacity">{t("login.parentLogin")}</Link></li>
                <li><Link to="/principal/login" className="hover:opacity-100 transition-opacity">{t("login.principalLogin")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("footer.contact")}</h4>
              <ul className="space-y-2.5 text-sm opacity-80">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {t("footer.location")}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  {t("footer.phone")}
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  {t("footer.email")}
                </li>
              </ul>
            </div>
          </div>
        </FadeInView>

        <div className="border-t border-white/20 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm opacity-80">
          <p>&copy; {t("footer.copyright")}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:opacity-100 transition-opacity">{t("footer.privacyPolicy")}</a>
            <a href="#" className="hover:opacity-100 transition-opacity">{t("footer.termsOfService")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
