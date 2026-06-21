import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import StressCurve, { type CurvePoint } from "@/components/week/StressCurve";
import { getOrCreateUser, getWeekEvents, type SerializedEvent } from "@/lib/data";
import { computeDayLoad, suggestDayMode } from "@/lib/stress";
import { modeConfig } from "@/lib/modes";
import { fmtTime, loadLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = (day + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function WeekPage({
  searchParams,
}: {
  searchParams?: { google?: string };
}) {
  const user = await getOrCreateUser();
  const events = await getWeekEvents(user.id);
  const justConnected = searchParams?.google === "connected";

  const base =
    events.length > 0
      ? startOfWeek(new Date(events[0].startISO))
      : startOfWeek(new Date());

  // Build 7 day buckets.
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(base);
    date.setDate(date.getDate() + i);
    const dayEvents = events.filter(
      (e) => new Date(e.startISO).toDateString() === date.toDateString(),
    );
    const load = computeDayLoad(
      dayEvents.map((e) => ({
        title: e.title,
        startDateTime: new Date(e.startISO),
        durationMinutes: e.durationMinutes,
        contextPurpose: e.contextPurpose,
      })),
    );
    return { date, label: DAY_LABELS[i], events: dayEvents, load };
  });

  const points: CurvePoint[] = days.map((d) => ({
    key: d.date.toISOString(),
    label: d.label,
    score: d.load.score,
    count: d.events.length,
  }));

  const visibleDays = days.filter((d) => d.events.length > 0);

  return (
    <>
      <main className="app-shell">
        <header className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-sea-500">
            Your week
          </p>
          <h1 className="text-3xl font-bold text-ink">This week in sound</h1>
        </header>

        {justConnected && (
          <div className="mb-4 rounded-2xl bg-teal-400/10 px-4 py-3 text-sm font-medium text-teal-700 ring-1 ring-teal-400/30">
            Google Calendar connected — your upcoming events are now in your week.
          </div>
        )}

        <section className="card mb-6 animate-fade-up">
          <StressCurve points={points} />
        </section>

        <div className="flex flex-col gap-5">
          {visibleDays.map((d) => {
            const lbl = loadLabel(d.load.score);
            const suggested = suggestDayMode(d.load.score);
            return (
              <section key={d.date.toISOString()} className="animate-fade-up">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-lg font-bold text-ink">
                      {d.date.toLocaleDateString([], {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </h2>
                    <p className={`text-sm font-semibold ${lbl.tone}`}>
                      {lbl.label} · load {d.load.score}
                      {d.load.score >= 60 && (
                        <span className="text-mist">
                          {" "}
                          · suggests {modeConfig(suggested).label}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {d.events.map((e) => (
                    <EventRow key={e.id} e={e} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function EventRow({ e }: { e: SerializedEvent }) {
  return (
    <Link
      href={`/event/${e.id}`}
      className="card flex items-center gap-3 p-4 transition hover:shadow-soft active:scale-[0.99]"
    >
      <div className="flex w-14 shrink-0 flex-col items-center">
        <span className="text-base font-bold text-sea-700">
          {fmtTime(e.startISO)}
        </span>
        <span className="text-[11px] text-mist">{e.durationMinutes}m</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{e.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {e.isHighStakes && (
            <span className="badge bg-rose-100 text-rose-600">High-stakes</span>
          )}
          <span
            className={`badge ${
              modeConfig(e.mode).accent === "amber"
                ? "bg-amber-100 text-amber-700"
                : "bg-sea-100 text-sea-700"
            }`}
          >
            {modeConfig(e.mode).label}
          </span>
          {e.company && (
            <span className="badge bg-teal-400/10 text-teal-600">
              {e.company}
            </span>
          )}
        </div>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9bb8c7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
