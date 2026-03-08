import Link from "next/link";
import { Mountain } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata = {
  title: "Privacy — Ultra Fuel Planner",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-stone-800/60 bg-stone-950">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <Mountain className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Ultra Fuel Planner</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-stone-50 mb-2">Privacy</h1>
        <p className="text-sm text-stone-500 mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-stone-400 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">What you enter into the planner</h2>
            <p>
              The planner collects the following information as you work through
              the planning steps:
            </p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                "Athlete profile — bodyweight, experience level, carb and fluid targets, preferences",
                "Prior race and training efforts — distance, time, elevation, notes",
                "Route data — GPX file contents used to generate terrain and elevation analysis",
                "Fuel inventory — product names, nutritional values, quantities",
                "Aid station details — locations and available supplies",
                "Planner outputs — the generated fuelling schedule and carry plan",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">How planner data is stored</h2>
            <p>
              Your planner inputs and outputs are saved to your browser&apos;s
              local storage. This means the data is stored on your device, in your
              browser, and is not sent to or saved on any external server or
              database by the planner itself.
            </p>
            <p className="mt-3">
              Clearing your browser storage will remove your saved plan data.
              There is no cloud save or account sync.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">No accounts, no database</h2>
            <p>
              Ultra Fuel Planner does not require an account. We do not collect
              your name, email address or any identifying information. There is no
              user database associated with this tool.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">GPX file processing</h2>
            <p>
              When you upload a GPX file, its contents are parsed to extract
              elevation and route data. This processing may involve a server-side
              route. GPX file data is not stored in a database and is not retained
              beyond the current session.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Hosting and infrastructure</h2>
            <p>
              Ultra Fuel Planner is hosted via Vercel and managed via GitHub.
              Normal web server logging may occur at the infrastructure level —
              for example, IP addresses or request logs that hosting providers
              routinely capture. These are governed by the relevant providers&apos;
              privacy policies, not ours.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Analytics</h2>
            <p>
              We do not currently use analytics tools or advertising trackers in
              the planner. If this changes, this page will be updated.
            </p>
          </section>

          <div className="border-t border-stone-800" />

          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-3">Contact</h2>
            <p>
              For privacy questions, contact:{" "}
              <span className="text-stone-300">[contact email]</span>
            </p>
          </section>

        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
