import InactivityLogout from "@/components/inactivity-logout";

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <InactivityLogout />
      {children}
    </>
  );
}
