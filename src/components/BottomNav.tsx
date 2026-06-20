"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/home", label: "今日", icon: "◎" },
  { href: "/calendar", label: "カレンダー", icon: "▦" },
  { href: "/stats", label: "集計", icon: "▤" },
  { href: "/manual", label: "記録追加", icon: "✎" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-lg justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium ${
                active
                  ? "text-violet-600"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
