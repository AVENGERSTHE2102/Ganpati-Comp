"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard({ categories }) {
  const [stats, setStats] = useState(null);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ submissions: [], totalPages: 1 });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ category, status, q, page: String(page) });
    fetch(`/api/admin/submissions?${params}`).then((r) => r.json()).then(setData);
  }, [category, status, q, page]);

  async function remove(id) {
    if (!confirm("Delete this submission?")) return;
    await fetch(`/api/submissions/${id}`, { method: "DELETE" });
    setData((d) => ({ ...d, submissions: d.submissions.filter((s) => s.id !== id) }));
  }

  async function saveEdit(e) {
    e.preventDefault();
    const res = await fetch(`/api/submissions/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editing.name, title: editing.title }),
    });
    if (res.ok) {
      setData((d) => ({ ...d, submissions: d.submissions.map((s) => (s.id === editing.id ? { ...s, ...editing } : s)) }));
      setEditing(null);
    }
  }

  return (
    <div>
      {stats && (
        <section>
          <p>Total entries: {stats.totals.total} · Total votes: {stats.totals.votes}</p>
          <ul>
            {stats.byCategory.map((c) => (
              <li key={c.key}>{c.label}: {c.total} entries, {c.votes} votes</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <input placeholder="Search name or code" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <a href="/api/admin/export">Export CSV</a>
      </section>

      <table>
        <thead>
          <tr><th>Code</th><th>Name</th><th>Category</th><th>Title</th><th>Type</th><th>Votes</th><th></th></tr>
        </thead>
        <tbody>
          {data.submissions.map((s) => {
            const first = s.files?.[0];
            const isReel = first?.mime?.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(first?.url || first?.originalName || "");
            const isPdf = first?.mime === "application/pdf" || /\.pdf$/i.test(first?.url || first?.originalName || "");
            return (
              <tr key={s.id}>
                <td>{s.submissionCode}</td>
                <td>{s.name}</td>
                <td>{s.category}</td>
                <td>{s.title}</td>
                <td>
                  {first ? (
                    <a href={first.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                      {isReel ? <span className="chip chip-reel">🎬 Reel</span> : isPdf ? <span className="chip">📄 PDF</span> : <span className="chip">📸 Photo</span>}
                    </a>
                  ) : "—"}
                </td>
                <td>{s.voteCount}</td>
                <td>
                  <button onClick={() => setEditing(s)}>Edit</button>
                  <button onClick={() => remove(s.id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span> Page {data.page || page} of {data.totalPages} </span>
        <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {editing && (
        <form onSubmit={saveEdit}>
          <h3>Edit {editing.submissionCode}</h3>
          <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" />
          <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditing(null)}>Cancel</button>
        </form>
      )}
    </div>
  );
}
