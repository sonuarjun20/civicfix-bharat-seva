import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";

export const Header = () => {
  const { user, userRole, signOut } = useAuth();

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
              {user ? (
                <>
                   {userRole === 'official' && (
                     <>
                       <Button variant="outline" asChild>
                         <Link to="/dashboard">Analytics</Link>
                       </Button>
                       <Button asChild>
                         <Link to="/official-dashboard">Manage Issues</Link>
                       </Button>
                     </>
                   )}
                   {userRole === 'citizen' && (
                     <>
                       <Button variant="outline" asChild>
                         <Link to="/track">My Issues</Link>
                       </Button>
                       <Button asChild>
                         <Link to="/report">Report Issue</Link>
                       </Button>
                     </>
                   )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/report">Report Issue</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};