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
  const ext = file.name.split(".").pop()?.toLowerCase();
  const isVideo = file.type?.startsWith("video/") || ["mp4", "mov", "webm"].includes(ext);

  if (category) {
    const mimeAllowed = category.allowedMime.includes(file.type) || (isVideo && ["mp4", "mov", "webm"].includes(ext));
    if (!category.allowedExt.includes(ext) || !mimeAllowed) {
      return Response.json({ error: `"${file.name}" is not an allowed file type for ${category.label}.` }, { status: 400 });
    }
    const maxLimitMB = isVideo ? (category.maxVideoSizeMB || 150) : (category.maxFileSizeMB || 15);
    if (file.size > maxLimitMB * 1024 * 1024) {
      return Response.json({ error: `"${file.name}" is larger than the ${maxLimitMB}MB limit for ${isVideo ? "reels/videos" : category.label}.` }, { status: 400 });
    }
  } else if (file.size > 200 * 1024 * 1024) {
    return Response.json({ error: "File exceeds the 200MB limit." }, { status: 400 });
  }

  let mimeType = file.type;
  if (!mimeType || mimeType === "application/octet-stream") {
    if (ext === "mp4") mimeType = "video/mp4";
    else if (ext === "mov") mimeType = "video/quicktime";
    else if (ext === "webm") mimeType = "video/webm";
    else if (["jpg", "jpeg"].includes(ext)) mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";
    else if (ext === "webp") mimeType = "image/webp";
    else if (ext === "pdf") mimeType = "application/pdf";
  }

  const blob = await put(`submissions/${crypto.randomUUID()}-${file.name}`, file, { access: "public" });
  return Response.json({ url: blob.url, pathname: blob.pathname, size: file.size, mime: mimeType, originalName: file.name });
}
