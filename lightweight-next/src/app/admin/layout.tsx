import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Navigation } from "@/components/nav/navigation";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/");

  return (
    <>
      <Navigation />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
