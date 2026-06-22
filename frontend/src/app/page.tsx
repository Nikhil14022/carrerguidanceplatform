import { Navbar, Hero, Features, Experts, ClientFlow, Services } from '@/components/LandingPage';

export default function Home() {
  return (
    <main className="min-h-screen mesh-gradient selection:bg-amber-500/20">
      <Navbar />
      <Hero />
      <Features />
      <Experts />
      <ClientFlow />
      <Services />

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 mt-20 bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-3">
            {/* Holistree-inspired Colorful Tree Logo */}
            <svg className="w-9 h-9 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Trunk */}
                <path d="M48 85 L48 55 Q48 45 52 40 L52 35" stroke="#78716C" strokeWidth="6" strokeLinecap="round"/>
                <path d="M52 85 L52 58 Q52 48 45 42 L42 38" stroke="#78716C" strokeWidth="5" strokeLinecap="round"/>
                {/* Leaves / Branches */}
                {/* Top Leaf - Green */}
                <circle cx="50" cy="22" r="11" fill="#10B981" opacity="0.95"/>
                {/* Left Leaf - Blue */}
                <circle cx="34" cy="38" r="10" fill="#3B82F6" opacity="0.95"/>
                {/* Right Leaf - Yellow */}
                <circle cx="66" cy="36" r="10" fill="#F1B317" opacity="0.95"/>
                {/* Bottom Left Leaf - Orange */}
                <circle cx="40" cy="54" r="9" fill="#F97316" opacity="0.95"/>
                {/* Bottom Right Leaf - Red/Pink */}
                <circle cx="60" cy="52" r="9" fill="#EF4444" opacity="0.95"/>
            </svg>
            <span className="font-extrabold text-slate-100 text-lg md:text-xl">
                Career <span className="text-[var(--color-brand-yellow)]">Explore</span> Journey
            </span>
          </div>

          <div className="flex gap-10 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>

          <div className="text-sm text-slate-600">
            © 2026 Career Explore Journey. Vetted for Holistree.
          </div>
        </div>
      </footer>
    </main>
  );
}
