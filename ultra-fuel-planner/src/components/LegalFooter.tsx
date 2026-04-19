import Link from "next/link";
import { UFPLockupCompact } from "@/components/brand";

interface LegalFooterProps {
  /** If true, omit the brand tagline — useful for inner app pages */
  compact?: boolean;
}

export function LegalFooter({ compact = false }: LegalFooterProps) {
  return (
    <footer className="border-t border-rule/60 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-ink-3 text-sm">
            <UFPLockupCompact className="h-10 w-auto text-ink-2 opacity-80" />
            {!compact && (
              <span className="hidden sm:inline">— route-aware fuelling for trail and ultra runners.</span>
            )}
          </div>
          <nav className="flex items-center gap-4 text-xs text-ink-3">
            <Link href="/terms" className="hover:text-ink-2 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink-2 transition-colors">
              Privacy
            </Link>
            <Link href="/disclaimer" className="hover:text-ink-2 transition-colors">
              Disclaimer
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
