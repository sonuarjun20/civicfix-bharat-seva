import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <>
      <div className="tricolor-bar"></div>
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">CF</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">CivicFix</h1>
                <p className="text-xs text-muted-foreground">नागरिक सेवा पोर्टल</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/issues" className="text-foreground hover:text-accent font-medium">
                View Issues
              </Link>
              <Link to="/map" className="text-foreground hover:text-accent font-medium">
                Issue Map
              </Link>
              <Link to="/officials" className="text-foreground hover:text-accent font-medium">
                Officials
              </Link>
              <Link to="/about" className="text-foreground hover:text-accent font-medium">
                About
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/report">Report Issue</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};