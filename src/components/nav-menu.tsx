"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NavMenu({ user }: { user: { email: string } | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/trips", label: "Trips" },
        { href: "/vehicles", label: "Vehicles" },
        { href: "/reports", label: "Reports" },
      ]
    : [];

  const rightLinks = user
    ? [
        { href: "/api/auth/signout", label: "Sign out", red: true },
      ]
    : [{ href: "/auth/login", label: "Sign In" }];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 -mr-2 relative z-50"
        aria-label="Toggle menu"
      >
        <div className="w-5 h-4 relative">
          <span className={`absolute left-0 top-0 w-5 h-0.5 bg-current transition-all duration-200 ${open ? "top-1/2 -translate-y-1/2 rotate-45" : ""}`} />
          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-current transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 bottom-0 w-5 h-0.5 bg-current transition-all duration-200 ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : ""}`} />
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-40 h-full w-64 bg-white shadow-xl border-l transform transition-transform duration-200 md:static md:h-auto md:w-auto md:shadow-none md:border-l-0 md:transform-none md:bg-transparent md:flex md:items-center md:gap-4 ${open ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col pt-20 px-6 gap-2 md:pt-0 md:px-0 md:flex-row md:items-center md:gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm hover:underline py-2 md:py-0"
            >
              {link.label}
            </a>
          ))}
          {user && (
            <span className="text-sm text-gray-500 hidden md:inline">{user.email}</span>
          )}
          {rightLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-sm hover:underline py-2 md:py-0 ${link.red ? "text-red-600" : ""}`}
            >
              {link.label}
            </a>
          ))}
          {user && (
            <span className="text-sm text-gray-500 border-t pt-4 mt-2 md:hidden">{user.email}</span>
          )}
        </div>
      </div>
    </>
  );
}
