import { auth } from "@/auth";
import { database } from "@/lib/mongodb";
import staticSubmissions from "@/data/submissions.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 20;

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (status && status !== "all") filter.status = status;
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: re }, { email: re }, { submissionCode: re }, { title: re }];
  }

  const db = await database().catch(() => null);

  if (!db) {
    let filtered = staticSubmissions;
    if (category && category !== "all") filtered = filtered.filter((s) => s.category === category);
    if (status && status !== "all") filtered = filtered.filter((s) => s.status === status);
    if (q) {
      const qLower = q.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(qLower) ||
          s.email?.toLowerCase().includes(qLower) ||
          s.submissionCode?.toLowerCase().includes(qLower) ||
          s.title?.toLowerCase().includes(qLower)
      );
    }
    const total = filtered.length;
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return Response.json({
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      submissions: pageItems.map((s) => ({ id: s.id || s._id, ...s, voteCount: 0 })),
    });
  }

  const total = await db.collection("submissions").countDocuments(filter);
  const submissions = await db
    .collection("submissions")
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .toArray();

  const voteCounts = Object.fromEntries(
    (
      await db
        .collection("votes")
        .aggregate([
          { $match: { submissionId: { $in: submissions.map((s) => s._id) } } },
          { $group: { _id: "$submissionId", n: { $sum: 1 } } },
        ])
        .toArray()
        .catch(() => [])
    ).map((v) => [v._id.toString(), v.n])
  );

  return Response.json({
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    submissions: submissions.map(({ _id, ...s }) => ({
      id: _id.toString(),
      ...s,
      voteCount: voteCounts[_id.toString()] || 0,
    })),
  });
}
