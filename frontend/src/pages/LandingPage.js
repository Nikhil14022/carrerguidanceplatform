import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Users, FileText, TrendingUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1594712935503-679d14106757?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1pbmltYWwlMjBqb3VybmV5JTIwcGF0aHxlbnwwfHx8fDE3NzE5MjI1OTd8MA&ixlib=rb-4.1.0&q=85')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0" style={{background: 'linear-gradient(180deg, rgba(26, 77, 46, 0.0) 0%, rgba(26, 77, 46, 0.1) 100%)'}}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-primary mb-6">
              Your Journey to Success,<br />
              <span className="text-accent">Guided Every Step</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-12">
              Transform your client management with our stage-driven platform. Track progress, collect insights, and deliver exceptional results through structured guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGoogleLogin}
                data-testid="get-started-btn"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-6 text-lg font-medium"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-primary mb-4">
              Everything You Need
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed for structured client journeys
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="group bg-card border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-primary mb-4">Stage-Based Progress</h3>
              <p className="text-base leading-relaxed text-foreground/90">
                Guide clients through structured stages with locked progression, ensuring thorough completion at each step.
              </p>
            </div>
            
            <div className="group bg-card border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-primary mb-4">Smart Questionnaires</h3>
              <p className="text-base leading-relaxed text-foreground/90">
                Collect detailed information through customizable questionnaires with multiple question types and conditional logic.
              </p>
            </div>
            
            <div className="group bg-card border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-medium text-primary mb-4">Actionable Reports</h3>
              <p className="text-base leading-relaxed text-foreground/90">
                Generate professional reports with insights and action plans, helping clients move forward with clarity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 md:py-32 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-primary mb-4">
              How It Works
            </h2>
          </div>
          
          <div className="relative pl-8 border-l-2 border-muted space-y-12 max-w-3xl mx-auto">
            {[
              { step: 1, title: "Register & Onboard", desc: "Create your account and complete initial setup" },
              { step: 2, title: "Complete Stages", desc: "Progress through structured questionnaires at your own pace" },
              { step: 3, title: "Meet with Your Team", desc: "Engage in scheduled meetings at key checkpoints" },
              { step: 4, title: "Receive Your Plan", desc: "Get comprehensive reports and actionable next steps" },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="absolute -left-[41px] top-0 h-8 w-8 rounded-full bg-primary border-4 border-background shadow-[0_0_0_4px_rgba(26,77,46,0.2)]"></div>
                <div className="ml-4">
                  <div className="text-sm font-medium tracking-wide uppercase text-muted-foreground mb-2">Step {item.step}</div>
                  <h3 className="text-2xl md:text-3xl font-medium text-primary mb-2">{item.title}</h3>
                  <p className="text-base leading-relaxed text-foreground/90">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Ready to Transform Your Journey?
          </h2>
          <p className="text-lg md:text-xl leading-relaxed mb-8 opacity-90">
            Join hundreds of clients achieving their goals through structured guidance
          </p>
          <Button 
            onClick={handleGoogleLogin}
            data-testid="cta-get-started-btn"
            className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-8 py-6 text-lg font-medium"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
