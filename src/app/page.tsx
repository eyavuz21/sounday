import Link from "next/link";
import { prisma } from "@/lib/db";
import WaitlistForm from "@/components/landing/WaitlistForm";
import PrimeButton from "@/components/landing/PrimeButton";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Read your week",
    body: "Sounday scores each day's load from your meetings, gaps and high-stakes moments.",
  },
  {
    title: "Compose the mood",
    body: "Calm, low-energy tracks when you're overloaded — confident hype songs before the big ones.",
  },
  {
    title: "Pinged on time",
    body: "A prep track lands on your phone the night before, the morning of, and 15 minutes before.",
  },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { prime?: string };
}) {
  const count = await prisma.waitlistSignup.count();
  const primeSuccess = searchParams.prime === "success";

  return (
    <main className="app-shell pb-12">
      {primeSuccess && (
        <div className="card mb-5 animate-fade-up bg-teal-400/10 ring-teal-400/40">
          <p className="font-semibold text-teal-700">Prime mode unlocked 🎉</p>
          <p className="text-sm text-sea-700">
            Thanks for backing Sounday. Your hype tracks are ready.
          </p>
        </div>
      )}

      <header className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sea-500 to-teal-500 text-white shadow-glow">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-sea-500">
          Sounday
        </p>
        <h1 className="text-balance text-4xl font-bold leading-tight text-ink">
          Your calendar, turned into a personal soundtrack.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-balance text-base text-mist">
          Calm tracks when you&apos;re overloaded, a confidence-priming hype song
          before high-stakes meetings — pinged to your phone right when you need
          it.
        </p>
      </header>

      <div className="mb-6">
        <WaitlistForm initialCount={count} />
      </div>

      <div className="mb-8 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="card flex items-start gap-4 animate-fade-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sea-100 font-bold text-sea-600">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{s.title}</p>
              <p className="text-sm text-mist">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <PrimeButton />
      </div>

      <div className="flex flex-col gap-3 text-center">
        <Link href="/onboarding" className="btn-primary">
          Try the demo
        </Link>
        <Link
          href="/week"
          className="text-sm font-semibold text-sea-600 underline-offset-4 hover:underline"
        >
          Skip to my week →
        </Link>
      </div>

      <footer className="mt-10 text-center text-xs text-mist">
        Sounday · a calmer way to meet the week.
      </footer>
    </main>
  );
}
