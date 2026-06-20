"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/week", label: "Week", icon: "M3 7h18M3 12h18M3 17h18" },
  {
    href: "/settings",
    label: "Settings",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.4-2.4 1a7.9 7.9 0 00-1.7-1l-.3-2.6h-4l-.3 2.6a7.9 7.9 0 00-1.7 1l-2.4-1-2 3.4L4.6 11a7.9 7.9 0 000 2l-2 1.5 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.3 2.6h4l.3-2.6c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.5z",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sea-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {items.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition ${
                active ? "text-sea-600" : "text-mist"
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={it.icon} />
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
