import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, Users } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  status: string;
  created_at: string;
  city: string;
  state: string;
  ward?: string;
  area?: string;
  user_id: string;
}

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole === 'official') {
      fetchAssignedIssues();
    }
  }, [user, userRole]);

  const fetchAssignedIssues = async () => {
    try {
      // For now, show all issues in the area - this would need proper assignment logic
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignedIssues(data || []);
    } catch (error) {
      console.error('Error fetching assigned issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (notes) {
        updates.resolution_notes = notes;
      }
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', issueId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Issue status updated successfully.",
      });

      fetchAssignedIssues();
      setSelectedIssue(null);
      setResolutionNotes("");
      setNewStatus("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'assigned':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  const pendingIssues = assignedIssues.filter(issue => issue.status === 'pending');
  const inProgressIssues = assignedIssues.filter(issue => issue.status === 'in_progress');
  const resolvedIssues = assignedIssues.filter(issue => issue.status === 'resolved');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Official Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and resolve civic issues assigned to your area.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold">{assignedIssues.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-red-600">{pendingIssues.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{inProgressIssues.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{resolvedIssues.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending ({pendingIssues.length})</TabsTrigger>
            <TabsTrigger value="progress">In Progress ({inProgressIssues.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedIssues.length})</TabsTrigger>
            <TabsTrigger value="all">All Issues ({assignedIssues.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingIssues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No pending issues</p>
                </CardContent>
              </Card>
            ) : (
              pendingIssues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onUpdateStatus={updateIssueStatus}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {inProgressIssues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No issues in progress</p>
                </CardContent>
              </Card>
            ) : (
              inProgressIssues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onUpdateStatus={updateIssueStatus}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedIssues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No resolved issues</p>
                </CardContent>
              </Card>
            ) : (
              resolvedIssues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onUpdateStatus={updateIssueStatus}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {assignedIssues.map((issue) => (
              <IssueCard 
                key={issue.id} 
                issue={issue} 
                onUpdateStatus={updateIssueStatus}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const IssueCard = ({ issue, onUpdateStatus, getStatusIcon, getStatusColor }: {
  issue: Issue;
  onUpdateStatus: (id: string, status: string, notes?: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newStatus, setNewStatus] = useState(issue.status);
  const [notes, setNotes] = useState("");

  const handleUpdate = () => {
    onUpdateStatus(issue.id, newStatus, notes);
    setShowUpdateForm(false);
    setNotes("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{issue.title}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(issue.status)}
              <Badge className={getStatusColor(issue.status)}>
                {issue.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => setShowUpdateForm(!showUpdateForm)}
          >
            Update Status
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{issue.description}</p>
        <p className="text-sm text-muted-foreground">
          📍 {issue.area && `${issue.area}, `}{issue.city}, {issue.state}
        </p>

        {showUpdateForm && (
          <div className="mt-4 p-4 border rounded-lg space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Resolution Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the resolution..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate}>Update</Button>
              <Button variant="outline" onClick={() => setShowUpdateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;