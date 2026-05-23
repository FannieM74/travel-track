"use client";

import { useState } from "react";

export default function NavMenu({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/trips", label: "Trips" },
    { href: "/vehicles", label: "Vehicles" },
    { href: "/reports", label: "Reports" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 -mr-2 relative z-50 text-gray-700"
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
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-40 h-full w-64 bg-white shadow-2xl border-l transform transition-transform duration-200 md:static md:h-auto md:w-auto md:shadow-none md:border-l-0 md:transform-none md:bg-transparent md:flex md:items-center md:gap-4 ${open ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col pt-20 px-6 gap-2 md:pt-0 md:px-0 md:flex-row md:items-center md:gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm hover:underline py-2 md:py-0 text-gray-900"
            >
              {link.label}
            </a>
          ))}
          <span className="text-sm text-gray-500 hidden md:inline">{userEmail}</span>
          <a
            href="/api/auth/signout"
            onClick={() => setOpen(false)}
            className="text-sm text-red-600 hover:underline py-2 md:py-0"
          >
            Sign out
          </a>
          <span className="text-sm text-gray-500 border-t pt-4 mt-2 md:hidden">{userEmail}</span>
        </div>
      </div>
    </>
  );
}
