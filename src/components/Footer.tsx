import { GraduationCap } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gradient-footer text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">School Portal</h3>
                <p className="text-xs opacity-80">Education Hub</p>
              </div>
            </div>
            <p className="text-sm opacity-80">
              Providing quality education and fostering student success.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100 transition-opacity">About Us</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Classes</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100 transition-opacity">Library</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Portal Help</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>Your City, Pakistan</li>
              <li>+92-XXX-XXXXXXX</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
          © 2026 School Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
