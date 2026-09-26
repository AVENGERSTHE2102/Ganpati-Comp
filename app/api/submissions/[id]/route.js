import { auth } from "@/auth";
import { database, toId } from "@/lib/mongodb";

const EDITABLE_FIELDS = ["name", "title", "status"];

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

  const db = await database();
  const result = await db.collection("submissions").updateOne({ _id: toId(id) }, { $set: update });
  if (!result.matchedCount) return Response.json({ error: "Entry not found." }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 401 });

  const { id } = await params;
  const db = await database();
  const objectId = toId(id);
  await Promise.all([
    db.collection("submissions").deleteOne({ _id: objectId }),
    db.collection("votes").deleteMany({ submissionId: objectId }),
  ]);
  return Response.json({ ok: true });
}
