import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
  description: "Your generated fuelling plan — schedule, carry plan, and race card.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
