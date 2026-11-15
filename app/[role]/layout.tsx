import type { ReactNode } from "react";
import { TouristRuntimeProvider } from "../lib/tourist-runtime";

// A Next.js role layout stays mounted while the tourist moves between screens.
// Keep the authenticated user and QR origin here, not inside every page.
export default async function RoleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  return role === "tourist"
    ? <TouristRuntimeProvider>{children}</TouristRuntimeProvider>
    : <>{children}</>;
}
