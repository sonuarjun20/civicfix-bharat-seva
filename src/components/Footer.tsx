import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="tricolor-bar"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">CivicFix</h3>
            <p className="text-sm opacity-90">
              A digital platform to report and resolve civic issues across India. 
              Connecting citizens with their local representatives.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/issues" className="hover:text-accent">All Issues</Link></li>
              <li><Link to="/map" className="hover:text-accent">Issue Map</Link></li>
              <li><Link to="/officials" className="hover:text-accent">Find Officials</Link></li>
              <li><Link to="/track" className="hover:text-accent">Track Issue</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="hover:text-accent">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-accent">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-accent">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Contact Info</h4>
            <div className="text-sm space-y-2">
              <p>📧 support@civicfix.gov.in</p>
              <p>📞 1800-XXX-CIVIC (24842)</p>
              <p>🏛️ Ministry of Electronics & IT</p>
              <p>🇮🇳 Government of India</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm">
          <p>&copy; 2024 CivicFix - Government of India. All rights reserved.</p>
          <p className="mt-2 opacity-80">Made with 🇮🇳 for the people of India</p>
        </div>
      </div>
    </footer>
  );
};