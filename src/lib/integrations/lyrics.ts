/**
 * Build supportive, confidence-building affirmation-style lyrics for Prime mode
 * from the meeting context. Important: never narrate the person's name — keep it
 * second-person, supportive, and grounded in the purpose / company facts.
 */
export function buildPrimeLyrics(ctx: {
  who?: string | null;
  what?: string | null;
  purpose?: string | null;
  companyFacts?: string[] | null;
}): string {
  const purpose = (ctx.purpose ?? "").trim();
  const what = (ctx.what ?? "").trim();
  const facts = (ctx.companyFacts ?? []).filter(Boolean).slice(0, 2);

  const lines: string[] = [];
  lines.push("You've done the work, you know your worth,");
  lines.push("Walk in steady, own the room.");
  if (purpose) {
    lines.push(`You're here to ${purpose.toLowerCase().replace(/\.$/, "")},`);
    lines.push("and you're more than ready now.");
  } else {
    lines.push("Take a breath, the moment's yours,");
    lines.push("and you're more than ready now.");
  }
  lines.push("");
  lines.push("Stand tall, speak clear, let it land,");
  lines.push("Every answer's in your hands.");
  if (what) {
    lines.push("You understand what matters most,");
    lines.push("Bring the value, hold your ground.");
  }
  if (facts.length) {
    lines.push("");
    lines.push("You did your homework, you came prepared,");
    lines.push("Confidence is earned, not feared.");
  }
  lines.push("");
  lines.push("This is your time — rise up, shine,");
  lines.push("You've got this, one breath at a time.");

  return lines.join("\n");
}
