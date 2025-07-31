import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ReportIssue from "./pages/ReportIssue";
import ViewIssues from "./pages/ViewIssues";
import IssueMap from "./pages/IssueMap";
import TrackIssue from "./pages/TrackIssue";
import Officials from "./pages/Officials";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import OfficialProfile from "./pages/OfficialProfile";
import OfficialDashboard from "./pages/OfficialDashboard";
import ReviewIssue from "./pages/ReviewIssue";
import AdminPanel from "./pages/AdminPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/issues" element={<ViewIssues />} />
            <Route path="/map" element={<IssueMap />} />
            <Route path="/about" element={<About />} />
            <Route path="/officials" element={<Officials />} />
            <Route path="/official/:id" element={<OfficialProfile />} />
            <Route 
              path="/report" 
              element={
                <ProtectedRoute>
                  <ReportIssue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/track" 
              element={
                <ProtectedRoute>
                  <TrackIssue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireRole="official">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/official-dashboard" 
              element={
                <ProtectedRoute requireRole="official">
                  <OfficialDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/review/:issueId" 
              element={
                <ProtectedRoute>
                  <ReviewIssue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
