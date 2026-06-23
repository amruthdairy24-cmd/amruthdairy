"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center">
        <div className="w-4 h-4 bg-cream-200 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-9 h-9 rounded-full bg-cream-100 text-brown-600 hover:text-amber-500 hover:bg-cream-200 transition-all flex items-center justify-center border border-border/50 shadow-sm overflow-hidden cursor-pointer"
      aria-label="Toggle Theme"
    >
      <div className={`transition-transform duration-500 absolute ${theme === 'dark' ? '-translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <Sun size={18} />
      </div>
      <div className={`transition-transform duration-500 absolute ${theme === 'dark' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <Moon size={18} />
      </div>
    </button>
  );
}
