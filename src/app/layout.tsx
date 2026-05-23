import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import SessionProvider from "@/components/session-provider";

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
          <nav className="border-b px-6 py-3 flex items-center justify-between">
            <a href="/" className="font-bold text-lg">TravelTrack</a>
            <div className="flex gap-4 items-center">
              {session?.user ? (
                <>
                  <a href="/dashboard" className="text-sm hover:underline">Dashboard</a>
                  <a href="/trips" className="text-sm hover:underline">Trips</a>
                  <a href="/vehicles" className="text-sm hover:underline">Vehicles</a>
                  <a href="/reports" className="text-sm hover:underline">Reports</a>
                  <span className="text-sm text-gray-500">{session.user.email}</span>
                  <a href="/api/auth/signout" className="text-sm text-red-600 hover:underline">Sign out</a>
                </>
              ) : (
                <a href="/auth/login" className="text-sm hover:underline">Sign In</a>
              )}
            </div>
          </nav>
          <main className="min-h-[calc(100vh-57px)]">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
