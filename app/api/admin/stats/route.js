import { auth } from "@/auth";
import { database } from "@/lib/mongodb";
import config from "@/config/site.config";
import staticSubmissions from "@/data/submissions.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  const db = await database().catch(() => null);

  if (!db) {
    const staticCounts = staticSubmissions.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {});
    return Response.json({
      totals: { total: staticSubmissions.length, votes: 0 },
      byCategory: config.categories.map((c) => ({
        key: c.key,
        label: c.label,
        total: staticCounts[c.key] || 0,
        votes: 0,
      })),
    });
  }

  const [entryCounts, voteCounts, totalVotes] = await Promise.all([
    db.collection("submissions").aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]).toArray().catch(() => []),
    db.collection("votes").aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]).toArray().catch(() => []),
    db.collection("votes").countDocuments().catch(() => 0),
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
