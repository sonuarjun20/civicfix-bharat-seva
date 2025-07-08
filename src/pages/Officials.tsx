import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Star, MapPin, Phone, Mail, User, CheckCircle, AlertCircle, Clock, TrendingUp } from "lucide-react";

interface Official {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  city?: string;
  state?: string;
  ward?: string;
  area?: string;
  district?: string;
  role: string;
  is_verified: boolean;
  solved_issues?: number;
  unsolved_issues?: number;
  total_issues?: number;
  success_rate?: number;
}

const Officials = () => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    try {
      // Fetch officials
      const { data: officialsData, error: officialsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'official')
        .eq('is_verified', true)
        .order('full_name');

      if (officialsError) throw officialsError;

      // Fetch issue statistics for each official
      const officialsWithStats = await Promise.all(
        (officialsData || []).map(async (official) => {
          const { data: issuesData, error: issuesError } = await supabase
            .from('issues')
            .select('id, status')
            .or(`assigned_official_id.eq.${official.user_id},suggested_official_id.eq.${official.user_id}`);

          if (issuesError) {
            console.error('Error fetching issues for official:', official.user_id, issuesError);
            return {
              ...official,
              solved_issues: 0,
              unsolved_issues: 0,
              total_issues: 0,
              success_rate: 0,
            };
          }

          const issues = issuesData || [];
          const solved = issues.filter(issue => issue.status === 'resolved').length;
          const unsolved = issues.filter(issue => 
            issue.status === 'pending' || 
            issue.status === 'assigned' || 
            issue.status === 'in_progress'
          ).length;
          const total = issues.length;
          const successRate = total > 0 ? Math.round((solved / total) * 100) : 0;

          return {
            ...official,
            solved_issues: solved,
            unsolved_issues: unsolved,
            total_issues: total,
            success_rate: successRate,
          };
        })
      );

      setOfficials(officialsWithStats);
    } catch (error) {
      console.error('Error fetching officials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOfficials = officials
    .filter(official => {
      const matchesSearch = official.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        official.ward?.toLowerCase().includes(searchTerm.toLowerCase());
      
      switch (filterBy) {
        case 'high_performer':
          return matchesSearch && (official.success_rate || 0) >= 80;
        case 'active':
          return matchesSearch && (official.total_issues || 0) > 0;
        case 'new':
          return matchesSearch && (official.total_issues || 0) === 0;
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'success_rate':
          return (b.success_rate || 0) - (a.success_rate || 0);
        case 'total_issues':
          return (b.total_issues || 0) - (a.total_issues || 0);
        case 'solved_issues':
          return (b.solved_issues || 0) - (a.solved_issues || 0);
        default:
          return (a.full_name || '').localeCompare(b.full_name || '');
      }
    });

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading officials...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Government Officials</h1>
          <p className="text-muted-foreground">
            Connect with verified government officials in your area to get your civic issues resolved.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, city, ward, district, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">All Officials</SelectItem>
                  <SelectItem value="high_performer">High Performers (80%+)</SelectItem>
                  <SelectItem value="active">Active (Has Issues)</SelectItem>
                  <SelectItem value="new">New Officials</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="success_rate">Success Rate</SelectItem>
                  <SelectItem value="total_issues">Total Issues</SelectItem>
                  <SelectItem value="solved_issues">Solved Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{officials.length}</div>
                <div className="text-sm text-muted-foreground">Total Officials</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {officials.reduce((sum, official) => sum + (official.solved_issues || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Solved</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {officials.reduce((sum, official) => sum + (official.unsolved_issues || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Pending</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {officials.length > 0 ? Math.round(
                    officials.reduce((sum, official) => sum + (official.success_rate || 0), 0) / officials.length
                  ) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Success Rate</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Officials Grid */}
        {filteredOfficials.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🏛️</div>
              <h3 className="text-xl font-semibold mb-2">No Officials Found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search terms."
                  : "No verified officials are currently registered in the system."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOfficials.map((official) => (
              <Card key={official.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{official.full_name || "Official"}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          ✓ Verified {official.role || 'Official'}
                        </Badge>
                        {(official.success_rate || 0) >= 80 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            ⭐ Top Performer
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Area Information */}
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center text-sm font-medium mb-1">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span>Jurisdiction Area</span>
                    </div>
                    <div className="text-sm text-muted-foreground ml-6">
                      {official.district && (
                        <div>📍 District: <span className="font-medium">{official.district}</span></div>
                      )}
                      {official.ward && (
                        <div>🏘️ Ward: <span className="font-medium">{official.ward}</span></div>
                      )}
                      {official.area && (
                        <div>📍 Area: <span className="font-medium">{official.area}</span></div>
                      )}
                      {official.city && (
                        <div>🏙️ City: <span className="font-medium">{official.city}, {official.state}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Issue Statistics */}
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center text-sm font-medium mb-2">
                      <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                      <span>Performance Stats</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-green-50 rounded border">
                        <div className="font-bold text-green-600 text-lg">
                          {official.solved_issues || 0}
                        </div>
                        <div className="text-green-700">Solved</div>
                      </div>
                      <div className="p-2 bg-red-50 rounded border">
                        <div className="font-bold text-red-600 text-lg">
                          {official.unsolved_issues || 0}
                        </div>
                        <div className="text-red-700">Pending</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded border">
                        <div className="font-bold text-blue-600 text-lg">
                          {official.success_rate || 0}%
                        </div>
                        <div className="text-blue-700">Success</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Resolution Progress</span>
                        <span>{official.total_issues || 0} total issues</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${official.total_issues ? ((official.solved_issues || 0) / official.total_issues) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                     
                  {/* Contact Information */}
                  {official.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{official.phone}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/official/${official.user_id}`}>
                        View Detailed Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-muted/50 p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">How to Connect with Officials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">📱 Direct Contact</h4>
              <p className="text-muted-foreground">
                Use the provided phone numbers to reach out directly to officials for urgent matters.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📋 Report Issues</h4>
              <p className="text-muted-foreground">
                Report civic issues through our platform, and they'll be automatically assigned to relevant officials.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">⭐ Rate & Review</h4>
              <p className="text-muted-foreground">
                After issue resolution, rate the service to help improve civic governance.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔔 Stay Updated</h4>
              <p className="text-muted-foreground">
                Get real-time notifications about your issue status and resolution progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Officials;