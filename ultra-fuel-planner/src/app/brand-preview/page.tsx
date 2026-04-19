/**
 * brand-preview — Prompt 03b component verification page.
 * Gated to development only. Returns 404 in production.
 */
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <p className="mb-4 font-mono text-eyebrow uppercase tracking-widest text-ink-3">
        {title}
      </p>
      <div className="flex flex-wrap gap-4">{children}</div>
    </section>
  );
}

export default function BrandPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="min-h-screen bg-paper px-10 py-12">
      <h1 className="mb-2 font-display text-h2 text-ink">Component preview</h1>
      <p className="mb-10 text-body text-ink-3">
        Prompt 03b — card variants · progress tones · select states
      </p>

      {/* ── Card ────────────────────────────────────────────────── */}
      <Section title="Card · variant='default'">
        <Card className="w-72">
          <CardHeader>
            <CardTitle>Default card</CardTitle>
            <CardDescription>paper-2 surface, rule border</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-2">
              Body text at ink-2. This is the standard card used throughout the
              planner for form sections and result panels.
            </p>
          </CardContent>
        </Card>
      </Section>

      <Section title="Card · variant='sunken'">
        <Card variant="sunken" className="w-72">
          <CardHeader>
            <CardTitle>Sunken card</CardTitle>
            <CardDescription>paper-3 surface, no border</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-2">
              Sits visually below a default card. Use for nested content, data
              tables, or secondary panels inside a card.
            </p>
          </CardContent>
        </Card>
        <Card className="w-72">
          <CardHeader>
            <CardTitle>Parent card</CardTitle>
          </CardHeader>
          <CardContent>
            <Card variant="sunken" className="p-4">
              <p className="text-sm text-ink-2">Nested sunken card inside a default card.</p>
            </Card>
          </CardContent>
        </Card>
      </Section>

      <Section title="Card · variant='ghost'">
        <div className="w-72 divide-y divide-rule rounded border border-rule bg-paper-2">
          <Card variant="ghost" className="px-4 py-3">
            <p className="text-sm text-ink-2">Ghost row 1</p>
          </Card>
          <Card variant="ghost" className="px-4 py-3">
            <p className="text-sm text-ink-2">Ghost row 2</p>
          </Card>
          <Card variant="ghost" className="px-4 py-3">
            <p className="text-sm text-ink-3">Ghost row 3 — secondary</p>
          </Card>
        </div>
      </Section>

      {/* ── Progress ─────────────────────────────────────────────── */}
      <Section title="Progress · tone='fuel' (default)">
        <div className="flex w-72 flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs text-ink-3">0 %</p>
            <Progress value={0} tone="fuel" />
          </div>
          <div>
            <p className="mb-1.5 text-xs text-ink-3">42 %</p>
            <Progress value={42} tone="fuel" />
          </div>
          <div>
            <p className="mb-1.5 text-xs text-ink-3">100 %</p>
            <Progress value={100} tone="fuel" />
          </div>
        </div>
      </Section>

      <Section title="Progress · tone='progress'">
        <div className="flex w-72 flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs text-ink-3">0 %</p>
            <Progress value={0} tone="progress" />
          </div>
          <div>
            <p className="mb-1.5 text-xs text-ink-3">67 %</p>
            <Progress value={67} tone="progress" />
          </div>
          <div>
            <p className="mb-1.5 text-xs text-ink-3">100 %</p>
            <Progress value={100} tone="progress" />
          </div>
        </div>
      </Section>

      {/* ── Select ───────────────────────────────────────────────── */}
      <Section title="Select">
        <div className="w-56">
          <p className="mb-1.5 text-xs text-ink-3">Closed (default)</p>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select terrain type…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat runnable</SelectItem>
              <SelectItem value="rolling">Rolling</SelectItem>
              <SelectItem value="climb">Sustained climb</SelectItem>
              <SelectItem value="steep">Steep climb</SelectItem>
              <SelectItem value="descent">Runnable descent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-56">
          <p className="mb-1.5 text-xs text-ink-3">With value selected</p>
          <Select defaultValue="rolling">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat runnable</SelectItem>
              <SelectItem value="rolling">Rolling</SelectItem>
              <SelectItem value="climb">Sustained climb</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-56">
          <p className="mb-1.5 text-xs text-ink-3">Disabled</p>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Disabled" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat runnable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>
    </main>
  );
}
