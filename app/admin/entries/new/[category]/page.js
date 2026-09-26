import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import config from "@/config/site.config";
import EntryForm from "./EntryForm";

export default async function NewEntryPage({ params }) {
  const session = await auth();
  const { category: categoryKey } = await params;
  if (!session?.user?.isAdmin) redirect(`/signin?callbackUrl=/admin/entries/new/${categoryKey}`);

  const category = config.categories.find((c) => c.key === categoryKey);
  if (!category) notFound();

  return (
    <main className="admin-wrap">
      <a href="/admin/entries/new">← Choose a different category</a>
      <h1>Add Entry — {category.label}</h1>
      <EntryForm category={category} />
    </main>
  );
}
