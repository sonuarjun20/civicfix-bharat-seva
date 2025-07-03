import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/issues" element={<ViewIssues />} />
          <Route path="/map" element={<IssueMap />} />
          <Route path="/track" element={<TrackIssue />} />
          <Route path="/officials" element={<Officials />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
