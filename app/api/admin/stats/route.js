import { auth } from "@/auth";
import { database } from "@/lib/mongodb";
import config from "@/config/site.config";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 401 });

  const db = await database();
  const [entryCounts, voteCounts, totalVotes] = await Promise.all([
    db.collection("submissions").aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]).toArray(),
    db.collection("votes").aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]).toArray(),
    db.collection("votes").countDocuments(),
  ]);

  const entriesByCategory = Object.fromEntries(entryCounts.map((c) => [c._id, c.n]));
  const votesByCategory = Object.fromEntries(voteCounts.map((c) => [c._id, c.n]));

  return Response.json({
    totals: { total: entryCounts.reduce((sum, c) => sum + c.n, 0), votes: totalVotes },
    byCategory: config.categories.map((c) => ({
      key: c.key,
      label: c.label,
      total: entriesByCategory[c.key] || 0,
      votes: votesByCategory[c.key] || 0,
    })),
  });
}
