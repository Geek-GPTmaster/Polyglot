"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  BookMarked,
  RotateCcw,
  Bookmark,
  Settings,
  Menu,
  X,
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_LINKS: NavLink[] = [
  { href: "/articles",   label: "Articles",    icon: <BookOpen   size={18} /> },
  { href: "/vocabulary", label: "Vocabulary",  icon: <BookMarked size={18} /> },
  { href: "/review",     label: "Review",      icon: <RotateCcw  size={18} /> },
  { href: "/saves",      label: "Saves",       icon: <Bookmark   size={18} /> },
  { href: "/settings",   label: "Settings",    icon: <Settings   size={18} /> },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      style={{
        position:     "sticky",
        top:          0,
        zIndex:       100,
        height:       "56px",
        background:   "var(--color-paper-dark)",
        borderBottom: "1px solid var(--color-paper-darker)",
        boxShadow:    "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          maxWidth:      "var(--max-width-content)",
          margin:        "0 auto",
          padding:       "0 var(--space-6)",
          height:        "100%",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"space-between",
          gap:           "var(--space-6)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily:  "var(--font-serif)",
            fontSize:    "var(--text-lg)",
            fontWeight:  "var(--font-semibold)",
            color:       "var(--color-ink)",
            textDecoration: "none",
            flexShrink:  0,
          }}
        >
          Polyglot
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            "var(--space-2)",
                  fontFamily:     "var(--font-sans)",
                  fontSize:       "var(--text-sm)",
                  fontWeight:     "var(--font-medium)",
                  color:          active ? "var(--color-accent)" : "var(--color-ink-light)",
                  borderBottom:   active ? "2px solid var(--color-accent)" : "2px solid transparent",
                  padding:        "var(--space-2) var(--space-3)",
                  textDecoration: "none",
                  transition:     "color 150ms ease",
                  whiteSpace:     "nowrap",
                }}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>

        {/* Language switcher + mobile hamburger */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {/* Hamburger — mobile only */}
          <button
            className="flex md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              background:   "transparent",
              border:       "none",
              cursor:       "pointer",
              color:        "var(--color-ink-light)",
              padding:      "var(--space-2)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            position:   "absolute",
            top:        "56px",
            left:       0,
            right:      0,
            background: "var(--color-paper-dark)",
            borderBottom: "1px solid var(--color-paper-darker)",
            boxShadow:  "var(--shadow-md)",
            zIndex:     99,
          }}
        >
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         "var(--space-3)",
                  fontFamily:  "var(--font-sans)",
                  fontSize:    "var(--text-base)",
                  fontWeight:  active ? "var(--font-semibold)" : "var(--font-regular)",
                  color:       active ? "var(--color-accent)" : "var(--color-ink)",
                  padding:     "var(--space-4) var(--space-6)",
                  textDecoration: "none",
                  borderLeft:  active ? "3px solid var(--color-accent)" : "3px solid transparent",
                  background:  active ? "var(--color-accent-faint)" : "transparent",
                }}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
