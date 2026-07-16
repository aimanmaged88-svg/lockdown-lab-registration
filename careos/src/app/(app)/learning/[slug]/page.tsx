import { notFound } from "next/navigation";
import { getTopic, learningTopics } from "@/data/learning";
import { LearningTopicView } from "@/components/learning/learning-topic-view";

export function generateStaticParams() {
  return learningTopics.map((t) => ({ slug: t.slug }));
}

export default async function LearningTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  return <LearningTopicView topic={topic} />;
}
