import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CoverUploader from "../../components/CoverUploader";
import { supabase } from "../../lib/supabase";
import { listJournalEntries } from "../../lib/journalApi";
import { useAuthUser } from "../../hooks/useAuthUser";
import "./Journal.css";

const LS_KEY = "y1ran_journal_entries_v1";
const COVER_BUCKET = "avatars";

const EMPTY_CREATE_FORM = {
  symbol: "BTC",
  dir: "Long",
  exchange: "",
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  note: "",
};

function safeJsonParse(s, fallback) {
  try {
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function loadEntries() {
  const raw = localStorage.getItem(LS_KEY);
  const arr = raw ? safeJsonParse(raw, []) : [];
  if (Array.isArray(arr) && arr.length) return arr.map(normalizeEntry);
  return [];
}

function saveEntries(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object") return entry;
  return {
    ...entry,
    dir: entry.dir ?? entry.side ?? "",
    exchange: entry.exchange ?? "",
    entryPrice: entry.entryPrice ?? entry.entry_price ?? "",
    stopLoss: entry.stopLoss ?? entry.stop_loss ?? "",
    takeProfit: entry.takeProfit ?? entry.take_profit ?? "",
    cover_url: entry.cover_url ?? entry.coverUrl ?? entry.cover ?? "",
    cover_path: entry.cover_path ?? entry.coverPath ?? "",
    cover_updated_at: entry.cover_updated_at ?? entry.coverUpdatedAt ?? "",
  };
}

function fmtLocalYmdHm(ts) {
  const d = ts ? new Date(ts) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function sideToDir(side) {
  const s = String(side || "").toLowerCase();
  return s === "short" ? "Short" : "Long";
}

function mapDbRowToEntry(row) {
  return normalizeEntry({
    id: row.id,
    symbol: row.symbol || "—",
    dir: sideToDir(row.side),
    time: fmtLocalYmdHm(row.created_at),
    status: row.exit_price != null ? "done" : "open",
    note: row.note || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    entry_price: row.entry_price ?? "",
    exit_price: row.exit_price ?? "",
    pnl: row.pnl ?? "",
    cover: "",
  });
}

function formatNow() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function inToday(yyyyMMddHHmm) {
  const d = (yyyyMMddHHmm || "").slice(0, 10);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return d === `${y}-${m}-${day}`;
}

function isThisWeek(yyyyMMddHHmm) {
  const s = (yyyyMMddHHmm || "").slice(0, 10);
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return false;

  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  return dt >= monday && dt < nextMonday;
}

function getCoverPublicUrlByPath(path) {
  if (!path) return "";
  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

function resolveCoverUrl({ entry }) {
  if (!entry) return "";
  if (entry.cover_url) return entry.cover_url;
  if (entry.image) return entry.image;
  if (entry.screenshot) return entry.screenshot;
  if (entry.cover_path) return getCoverPublicUrlByPath(entry.cover_path);
  return "";
}

function getCoverCacheKey(entry) {
  return entry?.cover_updated_at || entry?.updated_at || entry?.time || "";
}

function withCacheBust(url, key) {
  if (!url || !key) return url || "";
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}v=${encodeURIComponent(key)}`;
}

function getExt(filename = "") {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "png";
}

async function uploadCoverAfterCreate({ uid, journalId, file }) {
  const ext = getExt(file?.name || "");
  const path = `journal/${uid}/${journalId}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return { publicUrl: data?.publicUrl || "", path };
}

function SortableItem({ id, children, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`jCardWrap${isDragging ? " isDragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function SortableSection({ items, setItems, renderCard, disabled = false, append = null }) {
  const ids = useMemo(() => items.map((x) => x.id), [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  function onDragEnd(e) {
    if (disabled) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setItems((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="jGrid">
          {items.map((it) => (
            <SortableItem key={it.id} id={it.id} disabled={disabled}>
              {renderCard(it)}
            </SortableItem>
          ))}
          {append}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default function Journal() {
  const gitSha = typeof __GIT_SHA__ !== "undefined" ? __GIT_SHA__ : "no-sha";
  console.log("[build] git sha:", gitSha);
  window.__git_sha__ = gitSha;
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuthUser();

  const [tab, setTab] = useState("all");
  const [removeMode, setRemoveMode] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [entries, setEntries] = useState([]);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [draftCoverFile, setDraftCoverFile] = useState(null);
  const [draftCoverPreview, setDraftCoverPreview] = useState("");

  const symbolRef = useRef(null);
  const dirRef = useRef(null);
  const exchangeRef = useRef(null);
  const entryRef = useRef(null);
  const stopLossRef = useRef(null);
  const takeProfitRef = useRef(null);
  const noteRef = useRef(null);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const { data, error } = await listJournalEntries(supabase, { limit: 50 });
      if (!alive) return;
      if (error) {
        console.error("[journal] list error:", error);
        return;
      }

      const mapped = (data || []).map(mapDbRowToEntry);
      window.__journal_entries__ = mapped;
      console.log("[journal] mapped:", mapped);
      setEntries(mapped);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (sp.get("create") === "1") {
      openCreate();
      const next = new URLSearchParams(sp);
      next.delete("create");
      setSp(next, { replace: true });
    }
  }, [sp, setSp]);

  useEffect(() => {
    if (!createOpen && !detailOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (createOpen) setCreateOpen(false);
      if (detailOpen) setDetailOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createOpen, detailOpen]);

  useEffect(() => {
    if (!createOpen) return;
    const t = setTimeout(() => {
      symbolRef.current?.focus?.();
    }, 0);
    return () => clearTimeout(t);
  }, [createOpen]);

  useEffect(() => {
    if (!draftCoverFile) {
      setDraftCoverPreview("");
      return;
    }
    const url = URL.createObjectURL(draftCoverFile);
    setDraftCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draftCoverFile]);

  const filtered = useMemo(() => {
    if (tab === "today") return entries.filter((e) => inToday(e.time));
    if (tab === "week") return entries.filter((e) => isThisWeek(e.time));
    if (tab === "done") return entries.filter((e) => e.status === "done");
    return entries;
  }, [entries, tab]);

  const todayEntries = useMemo(
    () => filtered.filter((entry) => inToday(entry.time)),
    [filtered]
  );

  const historyEntries = useMemo(
    () => filtered.filter((entry) => !inToday(entry.time)),
    [filtered]
  );

  const perf = useMemo(() => {
    const todayCount = entries.filter((e) => inToday(e.time)).length;
    const total = entries.length;
    return { todayCount, total };
  }, [entries]);

  const setTodayItems = (updater) => {
    setEntries((prev) => {
      const todayList = prev.filter((entry) => inToday(entry.time));
      const historyList = prev.filter((entry) => !inToday(entry.time));
      const nextToday = typeof updater === "function" ? updater(todayList) : updater;
      return [...nextToday, ...historyList];
    });
  };

  const setHistoryItems = (updater) => {
    setEntries((prev) => {
      const todayList = prev.filter((entry) => inToday(entry.time));
      const historyList = prev.filter((entry) => !inToday(entry.time));
      const nextHistory = typeof updater === "function" ? updater(historyList) : updater;
      return [...todayList, ...nextHistory];
    });
  };

  const updateEntryCover = (id, next) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...next } : entry))
    );
    setActive((prev) => (prev?.id === id ? { ...prev, ...next } : prev));
  };

  function openCreate() {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateErrors({});
    setDraftCoverFile(null);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateErrors({});
    setDraftCoverFile(null);
  }

  function openDetail(item) {
    setActive(item);
    setDetailOpen(true);
  }

  function deleteEntry(id) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (active?.id === id) {
      setDetailOpen(false);
      setActive(null);
    }
  }

  function onCardClick(item) {
    if (removeMode) return;
    openDetail(item);
  }

  function updateCreateField(key, value) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
    if (createErrors[key]) {
      setCreateErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  async function handleCreateSubmit() {
    const errors = {};
    if (!createForm.symbol.trim()) errors.symbol = "請輸入幣種";
    if (!createForm.dir) errors.dir = "請選擇方向";

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      if (errors.symbol) symbolRef.current?.focus?.();
      else if (errors.dir) dirRef.current?.focus?.();
      return;
    }

    const item = {
      id: "e" + Math.random().toString(16).slice(2),
      symbol: createForm.symbol.trim(),
      dir: createForm.dir,
      exchange: createForm.exchange.trim(),
      entryPrice: createForm.entryPrice.trim(),
      stopLoss: createForm.stopLoss.trim(),
      takeProfit: createForm.takeProfit.trim(),
      note: createForm.note.trim(),
      time: formatNow(),
      cover_url: "",
      cover_path: "",
      status: "open",
    };

    setEntries((prev) => [item, ...prev]);
    setCreateErrors({});
    setCreateOpen(false);

    const file = draftCoverFile;
    setDraftCoverFile(null);
    if (!file) return;
    if (!user?.id) {
      alert("尚未登入，無法上傳封面");
      return;
    }

    try {
      const { publicUrl, path } = await uploadCoverAfterCreate({
        uid: user.id,
        journalId: item.id,
        file,
      });
      const stamp = Date.now();
      updateEntryCover(item.id, {
        cover_url: publicUrl,
        cover_path: path,
        cover_updated_at: stamp,
      });
    } catch (e) {
      console.error(e);
      alert(`封面上傳失敗（不影響建立）：${e?.message || e}`);
    }
  }

  function handleCreateKeyDown(e) {
    if (e.key !== "Enter") return;
    if (e.target?.tagName === "TEXTAREA") return;
    e.preventDefault();
    handleCreateSubmit();
  }

  function markDone(id) {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status: "done" } : entry))
    );
  }

  const renderCard = (item) => {
    const coverUrl = resolveCoverUrl({ entry: item });
    const coverSrc = withCacheBust(coverUrl, getCoverCacheKey(item));
    const cardClass = "jCard" + (removeMode ? " isRemoveMode" : "");

    return (
      <button
        type="button"
        className={cardClass}
        onClick={() => onCardClick(item)}
        title={removeMode ? "移除模式" : "點擊查看詳情"}
      >
        <div className="jCover">
          {coverSrc ? (
            <img className="jCoverImg" src={coverSrc} alt="" />
          ) : (
            <div className="jCoverPlaceholder" aria-hidden="true" />
          )}
          <span
            role="button"
            className={"jRemoveMinus" + (removeMode ? " isVisible" : "")}
            onClick={(e) => {
              e.stopPropagation();
              if (!removeMode) return;
              deleteEntry(item.id);
            }}
            aria-label="刪除卡片"
            title="刪除此卡"
          >
            −
          </span>
        </div>
        <div className="jCardBody">
          <div className="jSymbol">{item.symbol}</div>
          <div className="jMetaLine">
            <span>{item.time}</span>
            <span className="jDot">·</span>
            <span>{item.dir}</span>
          </div>
        </div>
      </button>
    );
  };

  const detailStatus = active?.status === "done" ? "已結單" : "未結";
  const detailDirection = active?.dir || "—";
  const detailExchange = active?.exchange || "—";
  const activeCoverUrl = active ? resolveCoverUrl({ entry: active }) : "";
  const activeCoverSrc = withCacheBust(activeCoverUrl, getCoverCacheKey(active));

  return (
    <div className="jBoardMain">
      <div className="jTopSpan">
        <div className="jTitle">儀表板</div>

        <div className="jTabs">
          <button type="button" className="jTab" onClick={() => nav("/")}
          >
            回首頁
          </button>
          <button
            type="button"
            className={"jTab" + (tab === "all" ? " isActive" : "")}
            onClick={() => setTab("all")}
          >
            全部
          </button>
          <button
            type="button"
            className={"jTab" + (tab === "today" ? " isActive" : "")}
            onClick={() => setTab("today")}
          >
            今天
          </button>
          <button
            type="button"
            className={"jTab" + (tab === "week" ? " isActive" : "")}
            onClick={() => setTab("week")}
          >
            本週
          </button>
          <button
            type="button"
            className={"jTab" + (tab === "done" ? " isActive" : "")}
            onClick={() => setTab("done")}
          >
            已結單
          </button>
        </div>
      </div>

      <div className="jTopDivider" />

      <div className="jGridRow">
        <div className="jLeftCol">
          <div className="jSectionTitle">今日</div>
          <SortableSection
            items={todayEntries}
            setItems={setTodayItems}
            renderCard={renderCard}
            disabled={removeMode}
            append={(
              <button type="button" className="jCardAdd" onClick={openCreate}>
                <div className="jAddIcon">+</div>
                <div className="jAddText">新增第一張紀錄卡</div>
              </button>
            )}
          />

          <div className="jSectionTitle">歷史</div>
          <SortableSection
            items={historyEntries}
            setItems={setHistoryItems}
            renderCard={renderCard}
            disabled={removeMode}
          />
        </div>

        <div className="jRightCol">
          <button
            type="button"
            className={"jRemovePill" + (removeMode ? " isActive" : "")}
            onClick={() => setRemoveMode((v) => !v)}
            title="切換移除模式"
          >
            移除
          </button>

          <div className="jPerfCard">
            <div className="jPerfTitle">績效</div>

            <div className="jPerfRow">
              <div className="jPerfLabel">今日筆數</div>
              <div className="jPerfValue">{perf.todayCount}</div>
            </div>

            <div className="jPerfRow">
              <div className="jPerfLabel">總筆數</div>
              <div className="jPerfValue">{perf.total}</div>
            </div>

          </div>
        </div>
      </div>

      {createOpen && (
        <div className="jModalOverlay" onMouseDown={closeCreate}>
          <div
            className="jModal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="jModalHeader">
              <div>
                <div className="jModalTitle">快速建立</div>
              </div>
              <button className="jIconBtn" type="button" onClick={closeCreate}>
                ×
              </button>
            </div>

            <div className="jModalBody" onKeyDown={handleCreateKeyDown}>
              <div className="jForm">
                <CoverUploader
                  uid={user?.id}
                  journalId={null}
                  mode="draft"
                  valueUrl={draftCoverPreview}
                  onDraftFile={(file) => setDraftCoverFile(file)}
                />
                <div className="jField">
                  <div className="jFieldLabel">幣種</div>
                  <div className="jFieldControl">
                    <input
                      ref={symbolRef}
                      className="jInput"
                      value={createForm.symbol}
                      onChange={(e) => updateCreateField("symbol", e.target.value)}
                      placeholder="例如 BTC"
                    />
                    {createErrors.symbol ? (
                      <div className="jFieldError">{createErrors.symbol}</div>
                    ) : null}
                  </div>
                </div>

                <div className="jField">
                  <div className="jFieldLabel">方向</div>
                  <div className="jFieldControl">
                    <select
                      ref={dirRef}
                      className="jInput"
                      value={createForm.dir}
                      onChange={(e) => updateCreateField("dir", e.target.value)}
                    >
                      <option value="Long">Long</option>
                      <option value="Short">Short</option>
                    </select>
                    {createErrors.dir ? (
                      <div className="jFieldError">{createErrors.dir}</div>
                    ) : null}
                  </div>
                </div>

                <div className="jField">
                  <div className="jFieldLabel">交易所／帳戶</div>
                  <div className="jFieldControl">
                    <input
                      ref={exchangeRef}
                      className="jInput"
                      value={createForm.exchange}
                      onChange={(e) => updateCreateField("exchange", e.target.value)}
                      placeholder="可留空"
                    />
                  </div>
                </div>

                <div className="jField">
                  <div className="jFieldLabel">進場價</div>
                  <div className="jFieldControl">
                    <input
                      ref={entryRef}
                      className="jInput"
                      value={createForm.entryPrice}
                      onChange={(e) => updateCreateField("entryPrice", e.target.value)}
                      placeholder="可留空"
                    />
                  </div>
                </div>

                <div className="jField">
                  <div className="jFieldLabel">止損</div>
                  <div className="jFieldControl">
                    <input
                      ref={stopLossRef}
                      className="jInput"
                      value={createForm.stopLoss}
                      onChange={(e) => updateCreateField("stopLoss", e.target.value)}
                      placeholder="可留空"
                    />
                  </div>
                </div>

                <div className="jField">
                  <div className="jFieldLabel">止盈</div>
                  <div className="jFieldControl">
                    <input
                      ref={takeProfitRef}
                      className="jInput"
                      value={createForm.takeProfit}
                      onChange={(e) => updateCreateField("takeProfit", e.target.value)}
                      placeholder="可留空"
                    />
                  </div>
                </div>

                <div className="jField">
                  <div className="jFieldLabel">備註</div>
                  <div className="jFieldControl">
                    <textarea
                      ref={noteRef}
                      className="jInput jTextarea"
                      value={createForm.note}
                      onChange={(e) => updateCreateField("note", e.target.value)}
                      placeholder="可留空"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="jModalFooter jModalFooter--right">
              <div className="jBtnRow">
                <button className="jBtnGhost" type="button" onClick={closeCreate}>
                  取消
                </button>
                <button className="jBtnPrimary" type="button" onClick={handleCreateSubmit}>
                  建立
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailOpen && active && (
        <div className="jModalOverlay" onMouseDown={() => setDetailOpen(false)}>
          <div
            className="jModal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="jModalHeader">
              <div>
                <div className="jModalTitle">{active.symbol || "詳細"}</div>
                <div className="jModalSub">
                  <span className="jPill">{detailDirection}</span>
                  <span>{active.time || "—"}</span>
                  <span>·</span>
                  <span>{detailExchange}</span>
                  <span>·</span>
                  <span>{detailStatus}</span>
                </div>
              </div>
              <button className="jIconBtn" type="button" onClick={() => setDetailOpen(false)}>
                ×
              </button>
            </div>

            <div className="jModalBody">
              <CoverUploader
                uid={user?.id}
                journalId={active?.id}
                mode="live"
                valueUrl={activeCoverSrc}
                onUploaded={(publicUrl, path) => {
                  if (!active?.id) return;
                  const stamp = Date.now();
                  updateEntryCover(active.id, {
                    cover_url: publicUrl,
                    cover_path: path,
                    cover_updated_at: stamp,
                  });
                }}
                onRemoved={() => {
                  if (!active?.id) return;
                  updateEntryCover(active.id, {
                    cover_url: "",
                    cover_path: "",
                    cover_updated_at: Date.now(),
                  });
                }}
                disabled={!user?.id}
              />
              <div className="jGrid2">
                <div className="jPanel">
                  <div className="jRow">
                    <div className="jLabel">進場價</div>
                    <div className="jValue">{active.entryPrice || "—"}</div>
                  </div>
                  <div className="jRow">
                    <div className="jLabel">止損</div>
                    <div className="jValue">{active.stopLoss || "—"}</div>
                  </div>
                  <div className="jRow">
                    <div className="jLabel">止盈</div>
                    <div className="jValue">{active.takeProfit || "—"}</div>
                  </div>
                  <div className="jRow">
                    <div className="jLabel">備註</div>
                    <div className="jValue">{active.note || "—"}</div>
                  </div>
                </div>

                <div className="jPanel">
                  <div className="jRow">
                    <div className="jLabel">PnL</div>
                    <div className="jValue">—</div>
                  </div>
                  <div className="jRow">
                    <div className="jLabel">R multiple</div>
                    <div className="jValue">—</div>
                  </div>
                  <div className="jRow">
                    <div className="jLabel">持倉時間</div>
                    <div className="jValue">—</div>
                  </div>
                  <div className="jRow">
                    <div className="jLabel">狀態</div>
                    <div className="jValue">{detailStatus}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="jModalFooter">
              <button
                className="jBtnDanger"
                type="button"
                onClick={() => {
                  deleteEntry(active.id);
                  setDetailOpen(false);
                }}
              >
                刪除
              </button>

              <div className="jBtnRow">
                <button className="jBtnGhost" type="button" onClick={() => setDetailOpen(false)}>
                  關閉
                </button>
                <button
                  className="jBtnPrimary"
                  type="button"
                  onClick={() => {
                    markDone(active.id);
                    setDetailOpen(false);
                  }}
                >
                  標記已結單
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
