import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Star, MapPin, Phone, Mail, User } from "lucide-react";

interface Official {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  city?: string;
  state?: string;
  ward?: string;
  area?: string;
  role: string;
  is_verified: boolean;
}

const Officials = () => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'official')
        .eq('is_verified', true)
        .order('full_name');

      if (error) throw error;
      setOfficials(data || []);
    } catch (error) {
      console.error('Error fetching officials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOfficials = officials.filter(official =>
    official.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    official.area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md">
            <Input
              placeholder="Search by name, city, or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
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
              <Card key={official.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{official.full_name || "Official"}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        ✓ Verified Official
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(official.area || official.city) && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>
                          {official.area && `${official.area}, `}
                          {official.city}, {official.state}
                          {official.ward && ` (Ward: ${official.ward})`}
                        </span>
                      </div>
                    )}
                    
                    {official.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{official.phone}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/official/${official.user_id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </div>
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