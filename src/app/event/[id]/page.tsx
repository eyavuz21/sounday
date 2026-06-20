import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateUser, serializeEvent } from "@/lib/data";
import { publicConfig } from "@/lib/config";
import EventDetail from "@/components/event/EventDetail";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
  });
  if (!event) notFound();

  const user = await getOrCreateUser();
  const cfg = publicConfig();

  return (
    <EventDetail
      event={serializeEvent(event)}
      vapiPublicKey={cfg.vapiPublicKey}
      integrations={cfg.integrations}
      hasPhone={Boolean(user.phone)}
    />
  );
}
