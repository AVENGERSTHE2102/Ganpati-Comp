import { auth } from "@/auth";
import { database } from "@/lib/mongodb";

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 401 });

  const db = await database();
  const submissions = await db.collection("submissions").find({}).sort({ createdAt: -1 }).toArray();
  const voteCounts = Object.fromEntries(
    (await db.collection("votes").aggregate([{ $group: { _id: "$submissionId", n: { $sum: 1 } } }]).toArray()).map((v) => [v._id.toString(), v.n])
  );

  const header = ["Code", "Name", "Category", "Title", "Status", "Votes", "Created"];
  const rows = submissions.map((s) => [
    s.submissionCode,
    s.name,
    s.category,
    s.title,
    s.status,
    voteCounts[s._id.toString()] || 0,
    s.createdAt?.toISOString?.() || "",
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="submissions-${Date.now()}.csv"`,
    },
  });
}
