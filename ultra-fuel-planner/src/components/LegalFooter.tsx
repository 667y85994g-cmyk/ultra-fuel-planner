import Link from "next/link";
import { Mountain } from "lucide-react";

interface LegalFooterProps {
  /** If true, omit the brand tagline — useful for inner app pages */
  compact?: boolean;
}

export function LegalFooter({ compact = false }: LegalFooterProps) {
  return (
    <footer className="border-t border-stone-800/60 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Mountain className="h-4 w-4" />
            {compact ? (
              <span>Ultra Fuel Planner</span>
            ) : (
              <span>Ultra Fuel Planner — route-aware fuelling for trail and ultra runners.</span>
            )}
          </div>
          <div className="flex items-center gap-5">
            <nav className="flex items-center gap-4 text-xs text-stone-600">
              <Link href="/terms" className="hover:text-stone-400 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-stone-400 transition-colors">
                Privacy
              </Link>
              <Link href="/disclaimer" className="hover:text-stone-400 transition-colors">
                Disclaimer
              </Link>
            </nav>
            <span className="text-xs text-stone-700">v2.29</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
