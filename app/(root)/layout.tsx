import type { ReactNode } from "react";
import Header from "@/components/Header";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

const Layout = async ({ children }: { children: ReactNode }) => {
  let session;
  try {
    const auth = await getAuth();
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    // headers() signals dynamic rendering by throwing; let Next handle it.
    unstable_rethrow(error);
    console.error("Failed to read auth session; redirecting to sign-in:", error);
    redirect("/sign-in");
  }

  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <main className="min-h-screen text-gray-400">
      <Header user={user} />
      <div className="container py-10">{children}</div>
    </main>
  );
};

export default Layout;
