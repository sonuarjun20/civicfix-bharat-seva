import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";

interface OfficialData {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  phone?: string;
  district?: string;
  ward?: string;
  state?: string;
  is_verified: boolean;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  city?: string;
  state?: string;
  ward?: string;
  area?: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  issue_id: string;
}

const OfficialProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [official, setOfficial] = useState<OfficialData | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOfficialData();
    }
  }, [id]);

  const fetchOfficialData = async () => {
    try {
      // Fetch official profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .eq('role', 'official')
        .single();

      if (profileError) throw profileError;
      setOfficial(profileData);

      // Fetch issues assigned to this official
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .or(`assigned_official_id.eq.${id},suggested_official_id.eq.${id}`)
        .order('created_at', { ascending: false });

      if (issuesError) throw issuesError;
      setIssues(issuesData || []);

      // Fetch reviews for resolved issues
      if (issuesData && issuesData.length > 0) {
        const resolvedIssueIds = issuesData
          .filter(issue => issue.status === 'resolved')
          .map(issue => issue.id);

        if (resolvedIssueIds.length > 0) {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .in('issue_id', resolvedIssueIds)
            .order('created_at', { ascending: false });

          if (!reviewsError) {
            setReviews(reviewsData || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching official data:', error);
    } finally {
      setLoading(false);
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

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const pendingIssues = issues.filter(issue => issue.status === 'pending');
  const inProgressIssues = issues.filter(issue => issue.status === 'in_progress');
  const resolvedIssues = issues.filter(issue => issue.status === 'resolved');

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading official profile...</div>
        </div>
      </Layout>
    );
  }

  if (!official) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Official Not Found</h1>
            <p className="text-muted-foreground">The requested official profile could not be found.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Official Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {official.full_name?.charAt(0) || 'O'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{official.full_name}</h1>
                  {official.is_verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 text-muted-foreground">
                  <p className="text-lg font-medium text-primary">{official.role}</p>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[official.ward, official.district, official.state]
                        .filter(Boolean)
                        .join(', ') || 'Location not specified'}
                    </span>
                  </div>
                  
                  {official.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{official.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{issues.length}</div>
                  <div className="text-sm text-muted-foreground">Total Issues</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{resolvedIssues.length}</div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((resolvedIssues.length / Math.max(issues.length, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-2xl font-bold">
                      {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Pending Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{pendingIssues.length}</div>
                  <div className="space-y-2">
                    {pendingIssues.slice(0, 3).map((issue) => (
                      <div key={issue.id} className="text-sm">
                        <div className="font-medium truncate">{issue.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {pendingIssues.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{pendingIssues.length - 3} more pending
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Clock className="h-5 w-5" />
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{inProgressIssues.length}</div>
                  <div className="space-y-2">
                    {inProgressIssues.slice(0, 3).map((issue) => (
                      <div key={issue.id} className="text-sm">
                        <div className="font-medium truncate">{issue.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {inProgressIssues.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{inProgressIssues.length - 3} more in progress
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Recently Resolved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{resolvedIssues.length}</div>
                  <div className="space-y-2">
                    {resolvedIssues.slice(0, 3).map((issue) => (
                      <div key={issue.id} className="text-sm">
                        <div className="font-medium truncate">{issue.title}</div>
                        <div className="text-muted-foreground text-xs">
                          Resolved: {issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                    {resolvedIssues.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{resolvedIssues.length - 3} more resolved
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Area Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Issues by Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Area</TableHead>
                      <TableHead>Total Issues</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Resolved</TableHead>
                      <TableHead>Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(
                      issues.reduce((acc, issue) => {
                        const area = `${issue.ward || 'Unknown'}, ${issue.city || 'Unknown'}`;
                        if (!acc[area]) {
                          acc[area] = { total: 0, pending: 0, resolved: 0 };
                        }
                        acc[area].total++;
                        if (issue.status === 'pending') acc[area].pending++;
                        if (issue.status === 'resolved') acc[area].resolved++;
                        return acc;
                      }, {} as Record<string, { total: number; pending: number; resolved: number }>)
                    ).map(([area, stats]) => (
                      <TableRow key={area}>
                        <TableCell className="font-medium">{area}</TableCell>
                        <TableCell>{stats.total}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">{stats.pending}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{stats.resolved}</Badge>
                        </TableCell>
                        <TableCell>
                          {Math.round((stats.resolved / stats.total) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Issues</CardTitle>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{issue.issue_type}</Badge>
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
                          <div className="text-sm">
                            <div>Created: {new Date(issue.created_at).toLocaleDateString()}</div>
                            {issue.resolved_at && (
                              <div className="text-muted-foreground">
                                Resolved: {new Date(issue.resolved_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Citizen Reviews
                </CardTitle>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= averageRating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reviews yet. Reviews will appear when citizens rate resolved issues.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resolution Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Issues Handled</span>
                      <span className="font-bold">{issues.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Successfully Resolved</span>
                      <span className="font-bold text-green-600">{resolvedIssues.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Currently Pending</span>
                      <span className="font-bold text-red-600">{pendingIssues.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Success Rate</span>
                      <span className="font-bold text-primary">
                        {Math.round((resolvedIssues.length / Math.max(issues.length, 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Issue Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      issues.reduce((acc, issue) => {
                        if (!acc[issue.issue_type]) acc[issue.issue_type] = 0;
                        acc[issue.issue_type]++;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${(count / issues.length) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OfficialProfile;