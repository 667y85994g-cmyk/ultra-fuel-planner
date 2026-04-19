import { SiteNav } from "@/components/SiteNav";
import { LegalFooter } from "@/components/LegalFooter";

export const metadata = {
  title: "Privacy — Ultra Fuel Planner",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <SiteNav />

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-ink mb-2">Privacy</h1>
        <p className="text-sm text-ink-3 mb-12">Last updated: March 2026</p>

        <div className="space-y-10 text-ink-3 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-ink-2 mb-3">What you enter into the planner</h2>
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
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-ochre" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="text-lg font-semibold text-ink-2 mb-3">How planner data is stored</h2>
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

          <div className="border-t border-rule" />

          <section>
            <h2 className="text-lg font-semibold text-ink-2 mb-3">No accounts, no database</h2>
            <p>
              Ultra Fuel Planner does not require an account. We do not collect
              your name, email address or any identifying information. There is no
              user database associated with this tool.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="text-lg font-semibold text-ink-2 mb-3">GPX file processing</h2>
            <p>
              When you upload a GPX file, its contents are parsed to extract
              elevation and route data. This processing may involve a server-side
              route. GPX file data is not stored in a database and is not retained
              beyond the current session.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="text-lg font-semibold text-ink-2 mb-3">Hosting and infrastructure</h2>
            <p>
              Ultra Fuel Planner is hosted via Vercel and managed via GitHub.
              Normal web server logging may occur at the infrastructure level —
              for example, IP addresses or request logs that hosting providers
              routinely capture. These are governed by the relevant providers&apos;
              privacy policies, not ours.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="text-lg font-semibold text-ink-2 mb-3">Analytics</h2>
            <p>
              This site uses Google Analytics 4 to collect anonymised usage data —
              for example, which pages are visited and how the planner is used. This
              data is collected via the{" "}
              <span className="text-ink-2">gtag.js</span> script and sent to
              Google. No personally identifiable information (name, email, planner
              inputs) is included in these events.
            </p>
            <p className="mt-3">
              Google Analytics may set cookies in your browser. You can opt out
              using the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-2 hover:text-ink transition-colors"
              >
                Google Analytics opt-out browser add-on
              </a>
              , or by using a browser extension that blocks analytics scripts.
            </p>
            <p className="mt-3">
              We do not use advertising networks or sell any data to third parties.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="text-lg font-semibold text-ink-2 mb-3">Contact</h2>
            <p>
              For privacy questions, contact:{" "}
              <a href="mailto:ben@trailhustle.com" className="text-ink-2 hover:text-ink transition-colors">ben@trailhustle.com</a>
            </p>
          </section>

        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
