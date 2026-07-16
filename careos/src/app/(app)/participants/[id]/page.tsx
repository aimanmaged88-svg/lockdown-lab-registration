import { notFound } from "next/navigation";
import { getParticipant, participantIds } from "@/data/participants";
import { getTimeline } from "@/data/timeline";
import { ParticipantProfile } from "@/components/participants/participant-profile";

export function generateStaticParams() {
  return participantIds.map((id) => ({ id }));
}

export default async function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = getParticipant(id);
  if (!participant) notFound();

  const timeline = getTimeline(id);
  return <ParticipantProfile participant={participant} timeline={timeline} />;
}
