import { Navbar, Hero } from '@/components/LandingPage';

export default function Home() {
  return (
    <main className="min-h-screen mesh-gradient selection:bg-amber-500/20">
      <Navbar />
      <Hero />

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 mt-20 bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-3">
            <img src="/logo.jpg" alt="Logo" className="w-9 h-9 object-contain rounded-md shrink-0" />
            <span className="font-extrabold text-slate-100 text-lg md:text-xl">
                Career <span className="text-[var(--color-brand-yellow)]">Explore</span> Journey
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-10 text-sm text-slate-500 items-center">
            <a href="https://holistree.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>🌐</span> https://holistree.in/
            </a>
            <a href="tel:9833088838" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>📞</span> 9833088838
            </a>
            <a href="mailto:info@holistree.in" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>✉️</span> info@holistree.in
            </a>
          </div>

          <div className="text-sm text-slate-600">
            © 2026 Career Explore Journey. Vetted for Holistree.
          </div>
        </div>
      </footer>
    </main>
  );
}
