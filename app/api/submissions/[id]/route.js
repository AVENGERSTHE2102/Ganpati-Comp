import { auth } from "@/auth";
import { database, toId } from "@/lib/mongodb";

import fs from "fs";
import path from "path";

const EDITABLE_FIELDS = ["name", "title", "status", "category"];

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const update = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
  }
  update.updatedAt = new Date();

  const db = await database().catch(() => null);
  let mongoId;
  try {
    mongoId = toId(id);
  } catch {
    mongoId = id;
  }

  if (db) {
    const filter = { $or: [{ _id: mongoId }, { id: id }, { submissionCode: id }] };
    await db.collection("submissions").updateOne(filter, { $set: update }).catch(() => {});
    if (update.category) {
      await db.collection("votes").updateMany(
        { $or: [{ submissionId: mongoId }, { submissionId: id }] },
        { $set: { category: update.category } }
      ).catch(() => {});
    }
  }

  // Also sync data/submissions.json
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
    console.error("Error updating submissions.json:", e);
  }

  return Response.json({ ok: true });
}

export async function DELETE(_request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 401 });

  const { id } = await params;
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

  // Also sync data/submissions.json
  try {
    const jsonPath = path.join(process.cwd(), "data", "submissions.json");
    if (fs.existsSync(jsonPath)) {
      const subs = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const filtered = subs.filter((s) => s.id !== id && s._id !== id && s.submissionCode !== id);
      fs.writeFileSync(jsonPath, JSON.stringify(filtered, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Error deleting from submissions.json:", e);
  }

  return Response.json({ ok: true });
}
