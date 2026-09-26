import { auth } from "@/auth";
import { redirect } from "next/navigation";
import config from "@/config/site.config";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/signin?callbackUrl=/admin");

  return (
    <main className="admin-wrap">
      <h1>Admin Dashboard</h1>
      <p>Signed in as {session.user.email}</p>
      <a className="btn" href="/admin/entries/new">+ Add entry</a>
      <AdminDashboard categories={config.categories} />
    </main>
  );
}
