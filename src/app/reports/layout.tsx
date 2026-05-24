import InactivityLogout from "@/components/inactivity-logout";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
