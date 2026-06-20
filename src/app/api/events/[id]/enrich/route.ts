import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichCompany } from "@/lib/integrations/cala";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!event.company) {
    return NextResponse.json(
      { error: "No company on this event" },
      { status: 400 },
    );
  }

  const result = await enrichCompany(event.company);

  // Auto-fill "What do they do?" only when empty, so we never overwrite the user.
  let contextWhat = event.contextWhat;
  if (!contextWhat && result.description) {
    contextWhat = result.description;
    await prisma.calendarEvent.update({
      where: { id: params.id },
      data: { contextWhat },
    });
  }

  return NextResponse.json({
    company: result.company,
    summary: result.summary,
    description: result.description,
    facts: result.facts,
    source: result.source,
    note: result.note ?? null,
    contextWhat,
  });
}
