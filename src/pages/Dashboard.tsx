import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, Users, MapPin, TrendingUp, FileText, Calendar, UserX } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  status: string;
  created_at: string;
  resolved_at?: string;
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

        <Tabs defaultValue="assigned" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="assigned">My Issues ({assignedIssues.length})</TabsTrigger>
            <TabsTrigger value="locality">By Locality</TabsTrigger>
            <TabsTrigger value="constituency">Constituency</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* My Assigned Issues Tab */}
          <TabsContent value="assigned" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Pending ({pendingIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingIssues.slice(0, 3).map((issue) => (
                    <div key={issue.id} className="flex justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{issue.title}</span>
                      <Badge className="bg-red-100 text-red-800 text-xs">{issue.issue_type}</Badge>
                    </div>
                  ))}
                  {pendingIssues.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{pendingIssues.length - 3} more</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    In Progress ({inProgressIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inProgressIssues.slice(0, 3).map((issue) => (
                    <div key={issue.id} className="flex justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{issue.title}</span>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">{issue.issue_type}</Badge>
                    </div>
                  ))}
                  {inProgressIssues.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{inProgressIssues.length - 3} more</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Resolved ({resolvedIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {resolvedIssues.slice(0, 3).map((issue) => (
                    <div key={issue.id} className="flex justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{issue.title}</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">{issue.issue_type}</Badge>
                    </div>
                  ))}
                  {resolvedIssues.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{resolvedIssues.length - 3} more</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Issues Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Assigned Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{issue.issue_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(issue.status)}
                            <Badge className={getStatusColor(issue.status)}>
                              {issue.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {issue.ward}, {issue.city}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(issue.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Locality Tab */}
          <TabsContent value="locality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Issues by Locality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    assignedIssues.reduce((acc, issue) => {
                      const location = `${issue.ward || 'Unknown Ward'}, ${issue.city || 'Unknown City'}`;
                      if (!acc[location]) acc[location] = [];
                      acc[location].push(issue);
                      return acc;
                    }, {} as Record<string, typeof assignedIssues>)
                  ).map(([location, issues]) => (
                    <Card key={location} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{location}</CardTitle>
                          <Badge variant="secondary">{issues.length} issues</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-red-600 font-bold">
                              {issues.filter(i => i.status === 'pending').length}
                            </div>
                            <div className="text-muted-foreground">Pending</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-600 font-bold">
                              {issues.filter(i => i.status === 'in_progress').length}
                            </div>
                            <div className="text-muted-foreground">In Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-bold">
                              {issues.filter(i => i.status === 'resolved').length}
                            </div>
                            <div className="text-muted-foreground">Resolved</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Constituency Tab */}
          <TabsContent value="constituency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Constituency Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{assignedIssues.length}</div>
                    <div className="text-sm text-muted-foreground">Total Issues</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((resolvedIssues.length / assignedIssues.length) * 100) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Resolution Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {assignedIssues.length > 0 ? Math.round(
                        assignedIssues
                          .filter(i => i.status === 'resolved' && i.resolved_at)
                          .reduce((acc, issue) => {
                            const days = Math.floor(
                              (new Date(issue.resolved_at!).getTime() - new Date(issue.created_at).getTime()) 
                              / (1000 * 60 * 60 * 24)
                            );
                            return acc + days;
                          }, 0) / resolvedIssues.length
                      ) : 0} days
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Response Time</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {new Set(assignedIssues.map(i => i.issue_type)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Issue Categories</div>
                  </div>
                </div>

                {/* Issue Types Breakdown */}
                <div className="space-y-3">
                  {Object.entries(
                    assignedIssues.reduce((acc, issue) => {
                      if (!acc[issue.issue_type]) acc[issue.issue_type] = 0;
                      acc[issue.issue_type]++;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded">
                      <span className="capitalize font-medium">{type}</span>
                      <Badge variant="secondary">{count} issues</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Monthly Trends</h4>
                    <div className="space-y-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
                        <div key={month} className="flex justify-between items-center">
                          <span>{month}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${Math.random() * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(Math.random() * 20)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Category Breakdown</h4>
                    <div className="space-y-2">
                      {['Road', 'Water', 'Electricity', 'Garbage', 'Other'].map((category) => {
                        const count = assignedIssues.filter(i => 
                          i.issue_type.toLowerCase() === category.toLowerCase()
                        ).length;
                        const percentage = assignedIssues.length > 0 ? 
                          Math.round((count / assignedIssues.length) * 100) : 0;
                        
                        return (
                          <div key={category} className="flex justify-between items-center">
                            <span>{category}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reports & Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Quick Reports</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Monthly Summary Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <MapPin className="h-4 w-4 mr-2" />
                        Locality-wise Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance Analytics
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Export Options</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Export to PDF
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Export to CSV
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Public Report
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h5 className="font-semibold mb-2">Report Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{assignedIssues.length}</div>
                      <div className="text-muted-foreground">Total Issues</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-600">{resolvedIssues.length}</div>
                      <div className="text-muted-foreground">Resolved</div>
                    </div>
                    <div>
                      <div className="font-medium text-red-600">{pendingIssues.length}</div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">{inProgressIssues.length}</div>
                      <div className="text-muted-foreground">In Progress</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            <span className="font-medium">Reported by: Anonymous</span>
          </div>
          <p>
            📍 {issue.area && `${issue.area}, `}{issue.city}, {issue.state}
          </p>
        </div>

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