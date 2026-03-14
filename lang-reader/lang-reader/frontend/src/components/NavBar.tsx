/**
 * components/NavBar.tsx — 顶部导航栏
 * 链接：首页 / 生词本 / 复习
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/",           label: "文章" },
  { href: "/vocabulary", label: "生词本" },
  { href: "/review",     label: "复习" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav>
      <Link href="/">
        <strong>LangReader</strong>
      </Link>
      <div>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            data-active={pathname === link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
