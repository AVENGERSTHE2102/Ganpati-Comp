import { put } from "@vercel/blob";
import { auth } from "@/auth";
import config from "@/config/site.config";

export const runtime = "nodejs";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const categoryKey = form.get("category");
  if (!(file instanceof File)) return Response.json({ error: "A file is required." }, { status: 400 });

  const category = config.categories.find((c) => c.key === categoryKey);
  if (category) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!category.allowedExt.includes(ext) || !category.allowedMime.includes(file.type)) {
      return Response.json({ error: `"${file.name}" is not an allowed file type for ${category.label}.` }, { status: 400 });
    }
    if (file.size > category.maxFileSizeMB * 1024 * 1024) {
      return Response.json({ error: `"${file.name}" is larger than the ${category.maxFileSizeMB}MB limit for ${category.label}.` }, { status: 400 });
    }
  } else if (file.size > 200 * 1024 * 1024) {
    return Response.json({ error: "File exceeds the 200MB limit." }, { status: 400 });
  }

  const blob = await put(`submissions/${crypto.randomUUID()}-${file.name}`, file, { access: "public" });
  return Response.json({ url: blob.url, pathname: blob.pathname, size: file.size, mime: file.type, originalName: file.name });
}
