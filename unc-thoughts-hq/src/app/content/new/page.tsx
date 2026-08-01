import { ContentForm } from "@/components/content-form";
import { isoDate } from "@/lib/time";

export default function NewContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">One useful idea, one real question</p>
        <h1>New content</h1>
      </div>
      <ContentForm initial={{ pillar: "Mindset", audience: "General", format: "Reel", status: "Idea", plannedDate: isoDate(new Date()) }} />
    </div>
  );
}
