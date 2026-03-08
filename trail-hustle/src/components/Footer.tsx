import Link from "next/link";
import TopographyLines from "./TopographyLines";

export default function Footer() {
  return (
    <footer className="relative bg-th-black text-th-white overflow-hidden">
      <TopographyLines color="white" opacity={0.05} lineCount={10} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div
              className="text-4xl mb-4 text-th-white"
              style={{ fontFamily: '"Cal Sans", system-ui, sans-serif' }}
            >
              Trail Hustle.
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm font-body">
              This is where the hustle meets the horizon. A structured training
              ground for ambitious professionals who understand that capacity is
              built, not granted.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p
              className="text-xs tracking-widest uppercase text-white/40 mb-5 font-body"
            >
              Navigate
            </p>
            <nav className="flex flex-col gap-3">
              {[
                { href: "/", label: "Home" },
                { href: "/doctrine", label: "The Doctrine" },
                { href: "/training", label: "Training Ground" },
                { href: "/stories", label: "Member Stories" },
                { href: "/organisations", label: "For Organisations" },
                { href: "/apply", label: "Apply" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-white/60 hover:text-sandstone transition-colors font-body"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p
              className="text-xs tracking-widest uppercase text-white/40 mb-5 font-body"
            >
              Contact
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:hello@trailhustle.com"
                className="text-sm text-white/60 hover:text-sandstone transition-colors font-body"
              >
                hello@trailhustle.com
              </a>
              <p className="text-sm text-white/40 font-body">United Kingdom</p>
            </div>
            <div className="mt-8">
              <Link href="/apply" className="th-btn-ghost-light text-sm">
                Apply Now →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-white/30 font-body tracking-wide">
            © 2026 Trail Hustle. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-white/30 font-body">
              Drive. Depth. Discovery.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
