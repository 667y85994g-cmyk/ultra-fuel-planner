"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/doctrine", label: "The Doctrine" },
  { href: "/training", label: "Training Ground" },
  { href: "/stories", label: "Member Stories" },
  { href: "/organisations", label: "For Organisations" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-th-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-th-white font-sans text-lg tracking-tight hover:text-sandstone transition-colors duration-200"
          style={{ fontFamily: '"Cal Sans", system-ui, sans-serif' }}
        >
          Trail Hustle.
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-xs tracking-widest uppercase transition-colors duration-200 font-body ${
                pathname === l.href
                  ? "text-sandstone"
                  : "text-white/60 hover:text-white"
              }`}
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Apply CTA */}
        <div className="hidden md:block">
          <Link
            href="/apply"
            className="text-xs tracking-widest uppercase bg-burnt-ochre text-white px-5 py-2.5 hover:bg-sandstone transition-colors duration-200"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            Apply
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <div className={`w-5 h-px bg-white transition-transform duration-300 mb-1.5 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <div className={`w-5 h-px bg-white transition-opacity duration-300 mb-1.5 ${open ? "opacity-0" : ""}`} />
          <div className={`w-5 h-px bg-white transition-transform duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-th-black border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-xs tracking-widest uppercase text-white/70 hover:text-white transition-colors"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/apply"
            onClick={() => setOpen(false)}
            className="text-xs tracking-widest uppercase bg-burnt-ochre text-white px-5 py-3 text-center hover:bg-sandstone transition-colors"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            Apply
          </Link>
        </div>
      )}
    </nav>
  );
}
