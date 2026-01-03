import React, { useEffect, useMemo, useState } from "react";
import {
  adminDeleteUser,
  adminListUsers,
  adminPatchProfile,
} from "../../lib/adminApi";
import TerminalFrame from "./TerminalFrame";
import "./admin-users.css";
import "./terminal-frame.css";
import "./admin-users-terminal.css";

const PLANS = ["free", "pro", "vip"];

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function toAppUid(authUid) {
  const hex = String(authUid || "").replace(/-/g, "");
  return hex.length >= 6 ? `a${hex.slice(0, 6)}` : "-";
}

function matchUser(u, qRaw) {
  const q = String(qRaw || "").trim().toLowerCase();
  if (!q) return true;
  const email = String(u.email || "").toLowerCase();
  const appUid = String(toAppUid(u.uid) || "").toLowerCase();
  const userId = String(u.uid || "").toLowerCase();
  const userIdCompact = userId.replace(/-/g, "");
  const qCompact = q.replace(/-/g, "");
  return (
    email.includes(q) ||
    appUid === q ||
    userId.includes(q) ||
    userIdCompact.includes(qCompact)
  );
}

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("");
  const [banned, setBanned] = useState("");
  const [searchToken, setSearchToken] = useState(0);

  const [edit, setEdit] = useState(null);
  const [danger, setDanger] = useState(null);

  const totalPages = useMemo(() => {
    const t = data?.total ?? 0;
    return Math.max(1, Math.ceil(t / limit));
  }, [data, limit]);

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const build = data?.build ?? "-";

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await adminListUsers({
        page,
        limit,
        q: q.trim(),
        plan,
        status: banned,
      });
      const list = r?.users ?? [];
      const qTrim = q.trim();
      const filtered = qTrim ? list.filter((u) => matchUser(u, qTrim)) : list;
      const totalOut = qTrim ? filtered.length : r?.total ?? filtered.length;
      setData({ ...r, users: filtered, total: totalOut });
    } catch (e) {
      setErr(e?.error || e?.message || JSON.stringify(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, plan, banned, searchToken]);

  async function onSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearchToken((n) => n + 1);
  }

  async function toggleBan(u) {
    await adminPatchProfile(u.uid, { is_banned: !u.is_banned });
    await load();
  }

  async function saveEdit() {
    const u = edit;
    if (!u) return;
    const updates = {
      display_name: (u.display_name ?? "").trim(),
      plan: u.plan,
      is_banned: Boolean(u.is_banned),
    };
    await adminPatchProfile(u.uid, updates);
    setEdit(null);
    await load();
  }

  async function confirmDelete() {
    if (!danger) return;
    if (
      (danger.confirmEmail ?? "").trim().toLowerCase() !==
      (danger.email ?? "").toLowerCase()
    ) {
      alert("Email mismatch. Delete blocked.");
      return;
    }
    await adminDeleteUser(danger.uid);
    setDanger(null);
    await load();
  }

  return (
    <div className="adminPage">
      <div className="adminLayout">
        <div className="adminConsoleFrame">
          <TerminalFrame title="Admin Console">
            <div className="termLine">
              <span className="termPrompt">PS</span>{" "}
              <span className="termDim">C:\\y1ran&gt;</span>{" "}
              <span className="termCmd">admin-users --console</span>
            </div>
            <div className="termInside">
            <form className="termToolbar" onSubmit={onSearchSubmit}>
              <input
                placeholder="search email / uid"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">all plans</option>
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={banned}
                onChange={(e) => {
                  setBanned(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">all status</option>
                <option value="true">banned</option>
                <option value="false">active</option>
              </select>
              <button className="termBtn" type="submit" disabled={loading}>
                Search
              </button>
              <button
                className="termBtn"
                type="button"
                onClick={load}
                disabled={loading}
              >
                Refresh
              </button>
              <div className="termToolbarMeta">
                <span>
                  page {page} / {totalPages}
                </span>
                <span>total {total}</span>
                <span>build {build}</span>
              </div>
            </form>

            {err && <div className="termError">{String(err)}</div>}

            <div className="termTableWrap">
              <table className="termTable adminTable">
                <thead>
                  <tr>
                    <th className="colEmail">Email</th>
                    <th className="colAppUid">App UID</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Seen</th>
                    <th style={{ width: 240 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.uid} className="termRow">
                      <td className="colEmail">
                        <div>{u.email}</div>
                        <div className="termMuted">{u.display_name ?? "-"}</div>
                      </td>
                      <td className="colAppUid">
                        <div className="mono">{toAppUid(u.uid)}</div>
                        <div className="adminMutedUuid">{u.uid ?? "-"}</div>
                      </td>
                      <td>{u.plan ?? "free"}</td>
                      <td>
                        <span className={`termChip ${u.is_banned ? "bad" : "ok"}`}>
                          {u.is_banned ? "banned" : "active"}
                        </span>
                      </td>
                      <td className="termMuted">{u.created_at}</td>
                      <td className="termMuted">{u.last_seen_at ?? "-"}</td>
                      <td>
                        <div className="termActions">
                          <button type="button" onClick={() => setEdit({ ...u })}>
                            edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBan(u)}
                            disabled={loading}
                          >
                            {u.is_banned ? "unban" : "ban"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDanger({
                                uid: u.uid,
                                email: u.email,
                                confirmEmail: "",
                              })
                            }
                          >
                            delete
                          </button>
                        </div>
                        <span className="termActionsHint">hover for actions</span>
                      </td>
                    </tr>
                  ))}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="termMuted">
                        no data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {loading && <div className="termLoading">Loading...</div>}

            <div className="termToolbar termToolbarFooter">
              <button
                className="termBtn"
                type="button"
                onClick={() => setPage((p) => clamp(p - 1, 1, totalPages))}
                disabled={loading || page <= 1}
              >
                Prev
              </button>
              <div className="termPager">
                page {page} / {totalPages}
              </div>
              <button
                className="termBtn"
                type="button"
                onClick={() => setPage((p) => clamp(p + 1, 1, totalPages))}
                disabled={loading || page >= totalPages}
              >
                Next
              </button>
            </div>
            </div>
          </TerminalFrame>
        </div>
      </div>

      {edit && (
        <div
          className="modalOverlay adminModalBackdrop"
          onMouseDown={() => setEdit(null)}
        >
          <div
            className="modal adminModal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modalTitle">Edit User</div>
            <div className="modalBody">
              <div className="kv">
                <div className="k">email</div>
                <div className="v mono">{edit.email}</div>
              </div>
              <div className="kv">
                <div className="k">uid</div>
                <div className="v mono">{edit.uid}</div>
              </div>

              <label className="label">display_name</label>
              <input
                className="input"
                value={edit.display_name ?? ""}
                onChange={(e) =>
                  setEdit({ ...edit, display_name: e.target.value })
                }
              />

              <label className="label">plan</label>
              <select
                className="select"
                value={edit.plan ?? "free"}
                onChange={(e) => setEdit({ ...edit, plan: e.target.value })}
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <label className="label inline">
                <input
                  type="checkbox"
                  checked={Boolean(edit.is_banned)}
                  onChange={(e) =>
                    setEdit({ ...edit, is_banned: e.target.checked })
                  }
                />
                <span>is_banned</span>
              </label>
            </div>
            <div className="modalActions">
              <button className="btn ghost" onClick={() => setEdit(null)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={async () => {
                  try {
                    await saveEdit();
                  } catch (e) {
                    alert(e?.error || e?.message || JSON.stringify(e));
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {danger && (
        <div
          className="modalOverlay adminModalBackdrop"
          onMouseDown={() => setDanger(null)}
        >
          <div
            className="modal dangerBox adminModal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modalTitle">Delete User (Danger)</div>
            <div className="modalBody">
              <div className="muted">You are deleting:</div>
              <div className="mono">{danger.email}</div>
              <div className="muted" style={{ marginTop: 8 }}>
                Type the full email to confirm.
              </div>
              <input
                className="input"
                value={danger.confirmEmail}
                onChange={(e) =>
                  setDanger({ ...danger, confirmEmail: e.target.value })
                }
                placeholder="type email to confirm"
              />
            </div>
            <div className="modalActions">
              <button className="btn ghost" onClick={() => setDanger(null)}>
                Cancel
              </button>
              <button
                className="btn danger"
                onClick={async () => {
                  try {
                    await confirmDelete();
                  } catch (e) {
                    alert(e?.error || e?.message || JSON.stringify(e));
                  }
                }}
              >
                Delete (I know what I am doing)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
