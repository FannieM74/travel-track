import InactivityLogout from "@/components/inactivity-logout";

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
