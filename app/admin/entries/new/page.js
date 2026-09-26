import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import config from "@/config/site.config";

export default async function ChooseCategoryPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/signin?callbackUrl=/admin/entries/new");

  return (
    <main className="admin-wrap">
      <a href="/admin">← Admin dashboard</a>
      <h1>Add Entry — choose a category</h1>
      <div className="cat-grid">
        {config.categories.map((c) => (
          <Link key={c.key} className="cat-card" style={{ minHeight: 260 }} href={`/admin/entries/new/${c.key}`}>
            <Image src={c.image} alt="" fill sizes="25vw" />
            <div className="cat-card-body">
              <span className="deva cat-mr">{c.marathi}</span>
              <h3>{c.label}</h3>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
