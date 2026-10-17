import { redirect } from "next/navigation";
import ProductApplication from "../../components/product-application";
import { defaultScreenForRole, getScreen, type RoleKey } from "../../lib/navigation";

const availableRoles: RoleKey[] = ["tourist", "partner", "ambassador", "regional", "admin"];

export default async function PortalPage({
  params,
}: {
  params: Promise<{ role: string; screen?: string[] }>;
}) {
  const { role: rawRole, screen } = await params;
  if (!availableRoles.includes(rawRole as RoleKey)) redirect("/tourist/welcome");

  const role = rawRole as RoleKey;
  const requestedSlug = screen?.[0] ?? defaultScreenForRole(role);
  const activeScreen = getScreen(role, requestedSlug);

  return <ProductApplication role={role} slug={activeScreen.slug} />;
}
