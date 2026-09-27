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
  const [updatingId, setUpdatingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [notice, setNotice] = useState(null);

  function showNotice(text, type = "success") {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  }

  const refreshStats = () => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {});
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const loadSubmissions = () => {
    const params = new URLSearchParams({ category, status, q, page: String(page) });
    fetch(`/api/admin/submissions?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  };

  useEffect(() => {
    loadSubmissions();
  }, [category, status, q, page]);

  async function handleCategoryChange(submission, newCat) {
    if (submission.category === newCat) return;
    setUpdatingId(submission.id);
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCat }),
      });
      if (res.ok) {
        setData((d) => ({
          ...d,
          submissions: d.submissions.map((s) => (s.id === submission.id ? { ...s, category: newCat } : s)),
        }));
        refreshStats();
        const catLabel = categories.find((c) => c.key === newCat)?.label || newCat;
        showNotice(`Category for "${submission.name}" changed to "${catLabel}".`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to update category.");
      }
    } catch (err) {
      alert("Error updating category: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function remove(id, name) {
    if (!confirm(`Are you sure you want to delete the submission for "${name || id}"?`)) return;
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((d) => ({ ...d, submissions: d.submissions.filter((s) => s.id !== id) }));
        refreshStats();
        showNotice(`Submission for "${name}" deleted.`);
      } else {
        alert("Failed to delete submission.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/submissions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          title: editing.title,
          category: editing.category,
        }),
      });
      if (res.ok) {
        setData((d) => ({
          ...d,
          submissions: d.submissions.map((s) => (s.id === editing.id ? { ...s, ...editing } : s)),
        }));
        refreshStats();
        showNotice(`Saved changes for "${editing.name}".`);
        setEditing(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save changes.");
      }
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div>
      {notice && (
        <div className={`admin-toast ${notice.type === "error" ? "error" : ""}`} role="status">
          <span>{notice.type === "error" ? "⚠️" : "✅"}</span>
          <span>{notice.text}</span>
        </div>
      )}

      {stats && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Overview</h3>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Total entries: <span style={{ color: "var(--maroon)" }}>{stats.totals?.total ?? 0}</span> · Total votes: <span style={{ color: "var(--maroon)" }}>{stats.totals?.votes ?? 0}</span>
            </p>
          </div>
          <ul>
            {stats.byCategory?.map((c) => (
              <li key={c.key}>
                <div style={{ fontSize: "1.05rem" }}>{c.label}</div>
                <div style={{ fontSize: "0.88rem", opacity: 0.8, marginTop: 4 }}>
                  {c.total} {c.total === 1 ? "entry" : "entries"} · {c.votes} {c.votes === 1 ? "vote" : "votes"}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ width: "auto" }}
        >
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          placeholder="Search name, code or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          style={{ width: "auto", flex: "1 1 200px" }}
        />

        <a className="btn btn-ghost" href="/api/admin/export" style={{ marginLeft: "auto", textDecoration: "none" }}>
          ⬇ Export CSV
        </a>
      </section>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Category (Click to change)</th>
              <th>Title</th>
              <th>Preview</th>
              <th>Votes</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.submissions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "var(--ink-muted)" }}>
                  No submissions found matching criteria.
                </td>
              </tr>
            ) : (
              data.submissions.map((s) => {
                const first = s.files?.[0];
                const isReel = first?.mime?.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(first?.url || first?.originalName || "");
                const isPdf = first?.mime === "application/pdf" || /\.pdf$/i.test(first?.url || first?.originalName || "");
                const isUpdating = updatingId === s.id;

                return (
                  <tr key={s.id}>
                    <td>
                      <code style={{ fontWeight: 700, color: "var(--maroon)", fontSize: "0.85rem" }}>
                        {s.submissionCode}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.year && s.department && (
                        <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                          {s.year} {s.department}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <select
                          value={s.category}
                          disabled={isUpdating}
                          onChange={(e) => handleCategoryChange(s, e.target.value)}
                          className="admin-cat-select"
                          title="Change category of this submission"
                        >
                          {categories.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        {isUpdating && <span style={{ fontSize: "0.8rem", color: "var(--maroon)" }}>⏳</span>}
                      </div>
                    </td>
                    <td>
                      <span title={s.description || s.title}>{s.title}</span>
                    </td>
                    <td>
                      {first ? (
                        <a href={first.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                          {isReel ? (
                            <span className="chip chip-reel">🎬 Video</span>
                          ) : isPdf ? (
                            <span className="chip">📄 PDF</span>
                          ) : (
                            <span className="chip">📸 Photo</span>
                          )}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{s.voteCount ?? 0}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button onClick={() => setEditing(s)}>Edit</button>
                      <button onClick={() => remove(s.id, s.name)} style={{ borderColor: "#d9534f", color: "#d9534f" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          ← Prev
        </button>
        <span style={{ fontWeight: 600 }}>
          Page {data.page || page} of {data.totalPages || 1}
        </span>
        <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
          Next →
        </button>
      </div>

      {editing && (
        <div className="admin-edit-modal-backdrop" onClick={() => setEditing(null)}>
          <div className="admin-edit-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={saveEdit} style={{ margin: 0, padding: 0, background: "transparent", border: 0, boxShadow: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Edit Submission</h3>
                <code style={{ background: "var(--cream-2)", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>
                  {editing.submissionCode}
                </code>
              </div>

              <label>
                Participant Name
                <input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Participant Name"
                />
              </label>

              <label>
                Entry Title
                <input
                  required
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Entry Title"
                />
              </label>

              <label>
                Category
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} ({c.marathi})
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: "flex", gap: 12, marginTop: 22, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setEditing(null)} disabled={savingEdit}>
                  Cancel
                </button>
                <button type="submit" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

