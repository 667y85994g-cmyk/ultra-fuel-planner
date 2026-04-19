"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";
import { UFPLockupNav } from "@/components/brand";
import { cn } from "@/lib/utils";

interface SiteNavProps {
  /** Show the ghost-ochre planner CTA. Defaults to true. False on the planner itself. */
  showPlannerLink?: boolean;
  /** Label for the planner CTA. Defaults to "Start planning". 404 uses "Open the planner". */
  plannerLabel?: string;
  /** Additional className applied to the <nav> element */
  className?: string;
}

export function SiteNav({
  showPlannerLink = true,
  plannerLabel = "Start planning",
  className,
}: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 w-full border-b border-rule/60 bg-paper/80 backdrop-blur-sm",
          className,
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">

          {/* Brand lockup — signature surface, left-anchored */}
          <Link
            href="/"
            className="flex items-center shrink-0 transition-opacity hover:opacity-75"
            aria-label="Ultra Fuel Planner — home"
          >
            <UFPLockupNav className="h-11 w-auto" />
          </Link>

          {/* Editorial links — desktop only, centred in the remaining space */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/how-to-fuel-an-ultra"
              className="text-sm text-ink-2 transition-colors hover:text-ochre hover:underline hover:underline-offset-2"
            >
              How to fuel
            </Link>
            <Link
              href="/log"
              className="text-sm text-ink-2 transition-colors hover:text-ochre hover:underline hover:underline-offset-2"
            >
              The Log
            </Link>
          </div>

          {/* Right: ghost CTA + mobile hamburger */}
          <div className="flex items-center gap-2">
            {showPlannerLink && (
              <Link
                href="/planner"
                className={cn(
                  "inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  "px-4 py-2 text-sm font-medium",
                  "text-ochre border-[1.5px] border-ochre rounded bg-paper",
                  "hover:bg-ochre/8 active:bg-ochre/15",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                  "transition-colors",
                )}
              >
                {plannerLabel}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}

            {/* Hamburger — visible only below sm breakpoint */}
            <button
              onClick={() => setMenuOpen(true)}
              className="sm:hidden p-2 -mr-2 text-ink-2 hover:text-ochre transition-colors"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer — paper sheet from right, no backdrop-blur per brand */}
      {menuOpen && (
        <>
          {/* Dim backdrop */}
          <div
            className="fixed inset-0 z-50 bg-ink/20"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            role="dialog"
            aria-label="Navigation menu"
            className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-paper border-l border-rule shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-3">
                Menu
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1 text-ink-3 hover:text-ochre transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col px-4 py-4">
              <Link
                href="/how-to-fuel-an-ultra"
                onClick={() => setMenuOpen(false)}
                className="px-2 py-3.5 text-base text-ink-2 border-b border-rule/60 hover:text-ochre transition-colors"
              >
                How to fuel
              </Link>
              <Link
                href="/log"
                onClick={() => setMenuOpen(false)}
                className="px-2 py-3.5 text-base text-ink-2 border-b border-rule/60 hover:text-ochre transition-colors"
              >
                The Log
              </Link>
              {showPlannerLink && (
                <Link
                  href="/planner"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 mx-2 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-ochre border-[1.5px] border-ochre rounded bg-paper hover:bg-ochre/8 transition-colors"
                >
                  {plannerLabel}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
