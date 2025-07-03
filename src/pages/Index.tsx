import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="gov-header text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            CivicFix
          </h1>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            नागरिक समस्याओं का तुरंत समाधान
          </p>
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            Report local issues like road problems, water supply, electricity, and garbage collection. 
            Connect directly with verified government officials for quick resolution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/report">Report an Issue</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/issues">View All Issues</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">
            How CivicFix Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <CardTitle>Report Issue</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Take a photo, describe the problem, and pin your location. 
                  Your issue is automatically sent to the right local official.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <CardTitle>Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get real-time updates via SMS and email as your issue moves from 
                  "Received" to "Assigned" to "In Progress" to "Resolved".
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <CardTitle>Rate & Review</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Once resolved, rate the service and leave feedback. 
                  Help improve civic services for everyone in your community.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-accent mb-2">10,000+</div>
              <div className="text-muted-foreground">Issues Reported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">8,500+</div>
              <div className="text-muted-foreground">Issues Resolved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">500+</div>
              <div className="text-muted-foreground">Government Officials</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-2">85%</div>
              <div className="text-muted-foreground">Resolution Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Issue Types Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">
            What Issues Can You Report?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Road Issues", icon: "🛣️", description: "Potholes, broken roads" },
              { name: "Water Supply", icon: "💧", description: "No water, leakage" },
              { name: "Electricity", icon: "⚡", description: "Power cuts, streetlights" },
              { name: "Garbage", icon: "🗑️", description: "Collection, cleanliness" },
              { name: "Sewage", icon: "🚰", description: "Drainage, overflow" },
              { name: "Street Lights", icon: "💡", description: "Broken, not working" },
              { name: "Traffic", icon: "🚦", description: "Signals, congestion" },
              { name: "Other", icon: "📝", description: "Any civic issue" }
            ].map((type) => (
              <Card key={type.name} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of citizens who are actively improving their communities
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/report">Report Your First Issue</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
