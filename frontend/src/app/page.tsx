import { Navbar, Hero, Features, Experts, Pricing, DashboardPreview } from '@/components/LandingPage';

export default function Home() {
  return (
    <main className="min-h-screen mesh-gradient selection:bg-indigo-500/30">
      <Navbar />
      <Hero />
      <Features />
      <Experts />
      <Pricing />
      <DashboardPreview />

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 mt-20 bg-slate-950/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm bg-white/20 rotate-45" />
            </div>
            <span>Career Path</span>
          </div>

          <div className="flex gap-10 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>

          <div className="text-sm text-slate-600">
            © 2026 Career Path AI. Built for the future.
          </div>
        </div>
      </footer>
    </main>
  );
}
