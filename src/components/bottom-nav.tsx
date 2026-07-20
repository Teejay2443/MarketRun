"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/errands", label: "Browse", icon: Search },
  { href: "/create", label: "Post", icon: Plus, accent: true },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-1 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? item.accent
                      ? "text-primary-foreground"
                    : "text-primary"
                  : "text-muted-foreground active:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-indicator"
                    className={`absolute inset-0 rounded-2xl ${
                      item.accent
                        ? "bg-primary shadow-lg shadow-primary/25"
                        : "bg-primary/10"
                    }`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <Icon className={`w-5 h-5 ${item.accent && isActive ? "text-primary-foreground" : ""}`} />
                </div>
                <span className={`text-[10px] font-semibold relative z-10 ${item.accent && isActive ? "text-primary-foreground" : ""}`}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
