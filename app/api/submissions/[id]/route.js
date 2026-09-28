import { auth } from "@/auth";
import { database, toId } from "@/lib/mongodb";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EDITABLE_FIELDS = ["name", "title", "status", "category"];

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return Response.json({ error: "Missing submission ID." }, { status: 400 });
  }

  const body = await request.json();
  const update = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      update[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  }
  update.updatedAt = new Date();

  const db = await database().catch((e) => {
    console.error("Database connection error in PATCH:", e);
    return null;
  });

  if (!db) {
    return Response.json({ error: "Database temporarily unavailable." }, { status: 503 });
  }

  let mongoId;
  try {
    mongoId = toId(id);
  } catch {
    mongoId = id;
  }

  const filter = { $or: [{ _id: mongoId }, { id: id }, { submissionCode: id }] };
  const result = await db.collection("submissions").updateOne(filter, { $set: update });

  if (result.matchedCount === 0) {
    return Response.json({ error: `Submission '${id}' not found in database.` }, { status: 404 });
  }

  if (update.category) {
    await db.collection("votes").updateMany(
      { $or: [{ submissionId: mongoId }, { submissionId: id }] },
      { $set: { category: update.category } }
    ).catch(() => {});
  }

  // Also sync data/submissions.json if filesystem is writable
  try {
    const jsonPath = path.join(process.cwd(), "data", "submissions.json");
    if (fs.existsSync(jsonPath)) {
      const subs = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const idx = subs.findIndex((s) => s.id === id || s._id === id || s.submissionCode === id);
      if (idx !== -1) {
        subs[idx] = { ...subs[idx], ...update, updatedAt: new Date().toISOString() };
        fs.writeFileSync(jsonPath, JSON.stringify(subs, null, 2), "utf-8");
      }
    }
  } catch (e) {
    // Expected on read-only serverless filesystems
  }

  return Response.json({ ok: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
}

export async function DELETE(_request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return Response.json({ error: "Missing submission ID." }, { status: 400 });
  }

  const db = await database().catch(() => null);
  let mongoId;
  try {
    mongoId = toId(id);
  } catch {
    mongoId = id;
  }

  if (db) {
    const filter = { $or: [{ _id: mongoId }, { id: id }, { submissionCode: id }] };
    await Promise.all([
      db.collection("submissions").deleteOne(filter),
      db.collection("votes").deleteMany({ $or: [{ submissionId: mongoId }, { submissionId: id }] }),
    ]).catch(() => {});
  }

  // Also sync data/submissions.json if filesystem is writable
  try {
    const jsonPath = path.join(process.cwd(), "data", "submissions.json");
    if (fs.existsSync(jsonPath)) {
      const subs = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const filtered = subs.filter((s) => s.id !== id && s._id !== id && s.submissionCode !== id);
      fs.writeFileSync(jsonPath, JSON.stringify(filtered, null, 2), "utf-8");
    }
  } catch (e) {
    // Expected on read-only serverless filesystems
  }

  return Response.json({ ok: true });
}
