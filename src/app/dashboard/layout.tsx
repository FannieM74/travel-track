import InactivityLogout from "@/components/inactivity-logout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
