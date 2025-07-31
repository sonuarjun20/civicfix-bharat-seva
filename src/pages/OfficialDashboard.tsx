import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  MapPin, 
  TrendingUp, 
  FileText, 
  Calendar,
  UserX,
  Search,
  Filter,
  MessageSquare,
  Camera,
  Save
} from "lucide-react";
import { format } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  address: string;
  city: string;
  state: string;
  ward?: string;
  area?: string;
  district?: string;
  pincode?: string;
  media_urls?: string[];
  resolution_notes?: string;
  resolution_media_urls?: string[];
  user_id: string;
}

const OfficialDashboard = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);

  useEffect(() => {
    if (user && userRole === 'official') {
      fetchAssignedIssues();
    }
  }, [user, userRole]);

  const fetchAssignedIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .or(`assigned_official_id.eq.${user?.id},suggested_official_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned issues",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        if (resolutionNotes) {
          updateData.resolution_notes = resolutionNotes;
        }
        // In production, handle file uploads here
        if (resolutionFiles.length > 0) {
          updateData.resolution_media_urls = resolutionFiles.map(f => f.name);
        }
      }

      const { error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', issueId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Issue status updated to ${newStatus.replace('_', ' ')}`,
      });

      fetchAssignedIssues();
      setSelectedIssue(null);
      setResolutionNotes('');
      setResolutionFiles([]);
    } catch (error) {
      console.error('Error updating issue:', error);
      toast({
        title: "Error",
        description: "Failed to update issue status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      road: 'Road & Infrastructure',
      water: 'Water Supply',
      electricity: 'Electricity',
      garbage: 'Garbage & Waste',
      streetlight: 'Street Lighting',
      sewage: 'Sewage & Drainage',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setResolutionFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setResolutionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesType = filterType === 'all' || issue.issue_type === filterType;
    const matchesSearch = searchTerm === '' || 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    thisMonth: issues.filter(i => {
      const issueDate = new Date(i.created_at);
      const now = new Date();
      return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear();
    }).length
  };

  if (userRole !== 'official') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">This page is only accessible to government officials.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your assigned issues...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">🏛️ Government Official Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and resolve civic issues assigned to your jurisdiction
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Assigned</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search issues by title, description, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="road">Road & Infrastructure</SelectItem>
                  <SelectItem value="water">Water Supply</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="garbage">Garbage & Waste</SelectItem>
                  <SelectItem value="streetlight">Street Lighting</SelectItem>
                  <SelectItem value="sewage">Sewage & Drainage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Issues Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Issues ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredIssues.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No issues found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredIssues.map((issue) => (
                  <Card key={issue.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-primary mb-2">
                            {issue.title}
                          </CardTitle>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="outline" className="border-primary text-primary">
                              {getIssueTypeLabel(issue.issue_type)}
                            </Badge>
                            <Badge className={getStatusColor(issue.status)}>
                              {issue.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedIssue(issue)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Update Status
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Update Issue Status</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold text-primary mb-2">{issue.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-4">{issue.description}</p>
                                </div>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="status">Update Status</Label>
                                    <Select 
                                      onValueChange={(value) => {
                                        if (value !== 'resolved') {
                                          updateIssueStatus(issue.id, value);
                                        }
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select new status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="resolution-notes">Resolution Notes (Optional)</Label>
                                    <Textarea
                                      id="resolution-notes"
                                      placeholder="Add notes about the resolution or work done..."
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  <div>
                                    <Label>Upload Resolution Photos/Videos (Optional)</Label>
                                    <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 text-center">
                                      <input
                                        type="file"
                                        id="resolution-media"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                      />
                                      <label htmlFor="resolution-media" className="cursor-pointer">
                                        <Camera className="h-6 w-6 text-primary mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                          Click to upload proof of resolution
                                        </p>
                                      </label>
                                    </div>

                                    {resolutionFiles.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {resolutionFiles.map((file, index) => (
                                          <div key={index} className="flex items-center justify-between bg-primary/5 p-2 rounded">
                                            <span className="text-sm">{file.name}</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeFile(index)}
                                              className="text-destructive hover:text-destructive"
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <Button 
                                    onClick={() => updateIssueStatus(issue.id, 'resolved')}
                                    className="w-full"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Mark as Resolved
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{issue.description}</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          <span className="font-medium">Reported by: Anonymous</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {issue.area && `${issue.area}, `}
                            {issue.city}, {issue.state}
                            {issue.ward && ` (Ward: ${issue.ward})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Reported on {format(new Date(issue.created_at), 'PPP')}
                          </span>
                        </div>
                        {issue.resolved_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              Resolved on {format(new Date(issue.resolved_at), 'PPP')}
                            </span>
                          </div>
                        )}
                      </div>

                      {issue.resolution_notes && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                          <h4 className="font-medium text-green-800 mb-1">Resolution Notes:</h4>
                          <p className="text-sm text-green-700">{issue.resolution_notes}</p>
                        </div>
                      )}

                      {issue.media_urls && issue.media_urls.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">
                            📎 {issue.media_urls.length} attachment(s) from citizen
                          </p>
                        </div>
                      )}

                      {issue.resolution_media_urls && issue.resolution_media_urls.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600">
                            ✅ {issue.resolution_media_urls.length} resolution proof(s) uploaded
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Similar TabsContent for other status filters */}
          {['pending', 'in_progress', 'resolved', 'closed'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4">
              <div className="grid gap-4">
                {filteredIssues.filter(i => i.status === status).map((issue) => (
                  <Card key={issue.id} className="hover:shadow-md transition-shadow">
                    {/* Same card content as above */}
                    <CardHeader>
                      <CardTitle className="text-lg text-primary">{issue.title}</CardTitle>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{issue.description}</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          <span className="font-medium">Reported by: Anonymous</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{issue.area && `${issue.area}, `}{issue.city}, {issue.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Reported on {format(new Date(issue.created_at), 'PPP')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
};

export default OfficialDashboard;