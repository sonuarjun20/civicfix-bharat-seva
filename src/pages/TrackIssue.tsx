import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "react-router-dom";
import { MapPin, Clock, Eye } from "lucide-react";
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
}

const TrackIssue = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserIssues();
    }
  }, [user]);

  const fetchUserIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching user issues:', error);
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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your issues...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Track Your Issues</h1>
          <p className="text-muted-foreground">
            Keep track of all the civic issues you've reported and their resolution progress.
          </p>
        </div>

        {issues.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No Issues Reported Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start making a difference by reporting your first civic issue.
              </p>
              <Button asChild>
                <Link to="/report">Report an Issue</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {issues.map((issue) => (
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
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {issue.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
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

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/issues/${issue.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                    {issue.status === 'resolved' && (
                      <Button size="sm" asChild>
                        <Link to={`/review/${issue.id}`}>Rate & Review</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Status Legend */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-4">Status Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">PENDING</Badge>
              <span>Received & Under Review</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">ASSIGNED</Badge>
              <span>Assigned to Official</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">IN PROGRESS</Badge>
              <span>Work in Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">RESOLVED</Badge>
              <span>Issue Fixed</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-800">CLOSED</Badge>
              <span>Case Closed</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TrackIssue;