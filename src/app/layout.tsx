import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import SessionProvider from "@/components/session-provider";
import NavMenu from "@/components/nav-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TravelTrack - SARS Travel Logbook",
  description: "Track business trips and generate SARS-compliant travel logbook reports",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider session={session}>
          <nav className="border-b border-gray-200 shadow-sm px-4 md:px-6 py-3 flex items-center justify-between">
            <a href="/" className="font-bold text-lg">TravelTrack</a>
            {session?.user ? (
              <NavMenu userEmail={session.user?.email} />
            ) : (
              <a href="/auth/login" className="text-sm hover:underline">Sign In</a>
            )}
          </nav>
          <main className="min-h-[calc(100vh-57px)]">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
