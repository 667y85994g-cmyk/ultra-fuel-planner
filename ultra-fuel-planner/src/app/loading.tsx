import { UFPMark } from "@/components/brand/UFPMark";

export default function Loading() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <UFPMark className="w-16 h-10 animate-pulse opacity-50" />
    </div>
  );
}
