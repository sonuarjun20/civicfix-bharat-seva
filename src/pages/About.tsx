import { Layout } from "@/components/Layout";

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-center mb-8">About CivicFix</h1>
        <div className="max-w-4xl mx-auto prose prose-lg">
          <p>
            CivicFix is a digital platform designed to bridge the gap between citizens and government officials 
            in resolving local civic issues across India.
          </p>
          <p>
            Our mission is to create a transparent, efficient, and accountable system where every citizen 
            can report problems in their locality and track their resolution in real-time.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;