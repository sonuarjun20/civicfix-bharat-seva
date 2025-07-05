import { Layout } from "@/components/Layout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Filter, Search } from "lucide-react";
import { format } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  status: string;
  created_at: string;
  address: string;
  city: string;
  state: string;
  ward?: string;
  area?: string;
  media_urls?: string[];
}

const ViewIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
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
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const filteredIssues = issues.filter(issue => {
    const matchesType = filterType === 'all' || issue.issue_type === filterType;
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading issues...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-govt-blue mb-4">All Reported Issues</h1>
          <p className="text-muted-foreground">
            View and track all civic issues reported by citizens across the platform.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
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
          </div>
        </div>

        {/* Issues Grid */}
        <div className="grid gap-6">
          {filteredIssues.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No issues found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredIssues.map((issue) => (
              <Card key={issue.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-govt-blue mb-2">
                        {issue.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="border-govt-blue text-govt-blue">
                          {getIssueTypeLabel(issue.issue_type)}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {issue.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
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
                  </div>

                  {issue.media_urls && issue.media_urls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        📎 {issue.media_urls.length} attachment(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="text-2xl font-bold text-govt-blue">{issues.length}</div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="text-2xl font-bold text-red-600">
              {issues.filter(i => i.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="text-2xl font-bold text-blue-600">
              {issues.filter(i => i.status === 'in_progress').length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="text-2xl font-bold text-green-600">
              {issues.filter(i => i.status === 'resolved').length}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewIssues;