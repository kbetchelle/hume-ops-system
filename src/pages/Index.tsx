import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="container flex h-16 items-center justify-between px-8">
          <span className="text-[10px] uppercase tracking-widest">Essentials</span>
          <nav className="flex items-center gap-8">
            <Link 
              to="/login" 
              className="text-[10px] uppercase tracking-widest hover:opacity-70 transition-opacity duration-300"
            >
              Sign In
            </Link>
            <Button onClick={() => navigate("/signup")} size="sm">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-8">
        <div className="container max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-sm uppercase tracking-[0.15em] font-normal">
            Workforce Management
          </h1>
          <p className="text-xs text-muted-foreground tracking-wide max-w-md mx-auto leading-relaxed">
            A refined platform for managing your team with role-based access control. 
            Designed for clarity and efficiency.
          </p>
          <div className="flex items-center justify-center gap-4 pt-8">
            <Button onClick={() => navigate("/signup")}>
              Create Account
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8 border-t border-border">
        <div className="container max-w-5xl mx-auto">
          <div className="grid gap-16 md:grid-cols-3">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">01</p>
              <h3 className="text-xs uppercase tracking-[0.15em]">Role-Based Access</h3>
              <p className="text-xs text-muted-foreground tracking-wide leading-relaxed">
                Assign specific roles to team members with granular permissions for each function.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">02</p>
              <h3 className="text-xs uppercase tracking-[0.15em]">Unified Dashboard</h3>
              <p className="text-xs text-muted-foreground tracking-wide leading-relaxed">
                Each role gets a tailored dashboard with relevant information and actions.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">03</p>
              <h3 className="text-xs uppercase tracking-[0.15em]">Secure Authentication</h3>
              <p className="text-xs text-muted-foreground tracking-wide leading-relaxed">
                Enterprise-grade security with row-level policies and encrypted sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-8 border-t border-border">
        <div className="container max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.15em]">Supported Roles</h2>
            <p className="text-xs text-muted-foreground tracking-wide">
              Comprehensive coverage for your entire team structure
            </p>
          </div>
          <div className="grid gap-8 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {['Admin', 'Manager', 'Concierge', 'Trainer', 'Female Spa', 'Male Spa', 'Floater'].map((role, i) => (
              <div key={role} className="text-center space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">0{i + 1}</p>
                <p className="text-[10px] uppercase tracking-widest">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 border-t border-border">
        <div className="container max-w-md mx-auto text-center space-y-8">
          <h2 className="text-xs uppercase tracking-[0.15em]">Get Started Today</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Create your account and set up your team in minutes.
          </p>
          <Button onClick={() => navigate("/signup")}>
            Create Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-border">
        <div className="container flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            © 2026 Essentials
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Built with precision
          </span>
        </div>
      </footer>
    </div>
  );
}
