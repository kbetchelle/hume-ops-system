import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Shield, Zap, Code2 } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Database Ready",
    description: "Lovable Cloud provides a powerful PostgreSQL database with real-time subscriptions.",
  },
  {
    icon: Shield,
    title: "Authentication",
    description: "Secure user authentication with email/password, and row-level security built-in.",
  },
  {
    icon: Zap,
    title: "React Query",
    description: "Efficient data fetching with caching, background updates, and optimistic UI.",
  },
  {
    icon: Code2,
    title: "TypeScript",
    description: "Full type safety across your frontend and backend for a better developer experience.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.primary/0.1),transparent)]" />
        
        <Container className="text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="gradient-text">Modern React</span>
              <br />
              <span className="text-foreground">Starter Template</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              A production-ready foundation with Lovable Cloud, shadcn/ui, 
              React Query, and TypeScript. Start building your app today.
            </p>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="shadow-glow">
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                View Documentation
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Built with modern best practices and a carefully selected tech stack.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 py-20">
        <Container size="md" className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to build something amazing?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start customizing this template to bring your ideas to life.
          </p>
          <Button className="mt-8" size="lg">
            Start Building
          </Button>
        </Container>
      </section>
    </div>
  );
};

export default Index;
