"use client";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";

const LINKS = [
  { href: "/dashboard", label: "🏠 Home" },
  { href: "/schedule", label: "🗓 Today's Schedule" },
  { href: "/calendar", label: "📅 Week/Month/Year" },
  { href: "/routine", label: "🔁 Routine" },
  { href: "/goals", label: "🎯 Goals" },
  { href: "/categories", label: "🏷 Categories" },
  { href: "/media", label: "📷 Media" },
  { href: "/money", label: "💰 Money" },
  { href: "/health", label: "❤️ Health" },
  { href: "/reports", label: "🤖 AI Reports" },
  { href: "/export", label: "⬇️ Filter & Export" },
  { href: "/hidden", label: "🔒 Private" },
  { href: "/settings", label: "⚙ Settings" },
  { href: "/admin", label: "🛠 Admin" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("light", savedTheme === "light");
    const savedHidden = localStorage.getItem("sidebarHidden") === "true";
    setDesktopHidden(savedHidden);
    document.documentElement.classList.toggle("sidebar-hidden", savedHidden);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  }

  function toggleDesktopSidebar() {
    const next = !desktopHidden;
    setDesktopHidden(next);
    localStorage.setItem("sidebarHidden", String(next));
    document.documentElement.classList.toggle("sidebar-hidden", next);
  }

  if (pathname === "/login") return null;

  const NavLinks = ({ onClick }) => (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          onClick={onClick}
          className={`text-sm px-3 py-2.5 rounded-lg ${
            pathname === l.href ? "bg-accent text-bg font-medium" : "text-gray-300 hover:bg-white/5"
          }`}
        >
          {l.label}
        </a>
      ))}
    </nav>
  );

  return (
    <>
      {/* Persistent desktop sidebar */}
      {!desktopHidden && (
        <div className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:h-screen md:w-64 bg-panel border-r border-gray-800 p-4 z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="font-semibold text-sm">Life Tracker</span>
            <button onClick={toggleDesktopSidebar} className="text-gray-500 hover:text-white text-xs" title="Hide sidebar">⟨⟨</button>
          </div>
          <NavLinks />
          <div className="mt-auto flex items-center gap-2 pt-4">
            <button onClick={toggleTheme} className="text-xs px-2 py-1.5 rounded-lg text-gray-400 hover:bg-white/5">{theme === "dark" ? "☀️" : "🌙"}</button>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs px-2.5 py-1.5 rounded-lg bg-warn/10 text-warn hover:bg-warn/20">Logout</button>
          </div>
        </div>
      )}
      {desktopHidden && (
        <button
          onClick={toggleDesktopSidebar}
          className="hidden md:flex fixed top-4 left-4 z-10 bg-panel border border-gray-800 rounded-lg px-2 py-2 text-xs text-gray-400"
          title="Show sidebar"
        >
          ⟩⟩
        </button>
      )}

      {/* Top bar: mobile always, desktop only for back/notifications/logout when sidebar hidden isn't needed since sidebar has them — but keep a slim top bar on mobile */}
      <div className={`sticky top-0 z-20 bg-panel/95 backdrop-blur border-b border-gray-800 mb-6 md:hidden`}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-xl px-1" aria-label="Open menu">☰</button>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/5" aria-label="Back">←</button>
          <span className="font-semibold text-sm">Life Tracker</span>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <button onClick={toggleTheme} className="text-xs px-2 py-1.5 rounded-lg text-gray-400 hover:bg-white/5" aria-label="Toggle theme">{theme === "dark" ? "☀️" : "🌙"}</button>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs px-2.5 py-1.5 rounded-lg bg-warn/10 text-warn hover:bg-warn/20">Logout</button>
          </div>
        </div>
      </div>

      {/* Small persistent top strip on desktop for back button + bell, since sidebar has nav/logout/theme already */}
      <div className="content-area hidden md:flex items-center gap-3 sticky top-0 z-10 bg-bg/80 backdrop-blur px-4 py-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/5" aria-label="Back">←</button>
        <div className="ml-auto"><NotificationBell /></div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-panel h-full p-4 overflow-y-auto border-r border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <NavLinks onClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
