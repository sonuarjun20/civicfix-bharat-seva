import { Layout } from "@/components/Layout";
import { IssueReportForm } from "@/components/IssueReportForm";

const ReportIssue = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-govt-blue mb-4">Report a Civic Issue</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Help improve your community by reporting local issues. Our system will automatically 
            route your report to the appropriate local officials for quick resolution.
          </p>
        </div>
        <IssueReportForm />
      </div>
    </Layout>
  );
};

export default ReportIssue;