"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, LayoutDashboard, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/errands", label: "Browse", icon: Search },
  { href: "/create", label: "Post", icon: Plus },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? "bg-primary/10" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
