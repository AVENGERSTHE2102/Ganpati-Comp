import crypto from "crypto";
import { auth } from "@/auth";
import { database } from "@/lib/mongodb";
import config from "@/config/site.config";

async function generateSubmissionCode(db) {
  const year = new Date().getFullYear().toString().slice(-2);
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `GA${year}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    if (!(await db.collection("submissions").findOne({ submissionCode: code }))) return code;
  }
  throw new Error("Could not generate a unique submission code, please try again.");
}

export async function GET() {
  const db = await database();
  const submissions = await db.collection("submissions").find({ status: "approved" }).sort({ createdAt: -1 }).toArray();
  return Response.json(submissions.map(({ _id, name, title, category, files }) => ({ id: _id.toString(), name, title, category, files })));
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 401 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = config.categories.find((c) => c.key === body.category);
  if (!name || !title || !category || !Array.isArray(body.files) || !body.files.length) {
    return Response.json({ error: "Name, title, category and a file are required." }, { status: 400 });
  }

  const db = await database();
  const submissionCode = await generateSubmissionCode(db);
  const result = await db.collection("submissions").insertOne({
    submissionCode,
    name,
    title,
    category: category.key,
    files: body.files.slice(0, category.maxFiles).map(({ url, originalName, mime, size }) => ({ url, originalName, mime, size })),
    status: "approved",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return Response.json({ id: result.insertedId.toString(), submissionCode }, { status: 201 });
}
