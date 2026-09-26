"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EntryForm({ category }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!files.length) return setError("Please choose a file.");
    if (files.length > category.maxFiles) return setError(`At most ${category.maxFiles} file(s) for ${category.label}.`);

    setBusy(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const form = new FormData();
          form.append("file", file);
          form.append("category", category.key);
          const res = await fetch("/api/upload", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed.");
          return { url: data.url, originalName: data.originalName, mime: data.mime, size: data.size };
        })
      );

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, category: category.key, files: uploaded }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the entry.");
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const preview = files[0] && URL.createObjectURL(files[0]);

  return (
    <form onSubmit={submit}>
      {error && <p className="notice" role="alert">{error}</p>}
      <label>Participant name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Entry title<input required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>
        {category.allowedMime[0].startsWith("video/") ? "Video" : "Image"} <span className="muted">— {category.instructions}</span>
        <input
          type="file"
          required
          multiple={category.maxFiles > 1}
          accept={category.allowedMime.join(",")}
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </label>
      {preview && (files[0].type.startsWith("video/")
        ? <video src={preview} controls style={{ maxHeight: 280, borderRadius: 12, marginBottom: 16 }} />
        : <img src={preview} alt="" style={{ maxHeight: 280, borderRadius: 12, marginBottom: 16 }} />)}
      <button type="submit" disabled={busy}>{busy ? "Uploading…" : "Add entry"}</button>
    </form>
  );
}
