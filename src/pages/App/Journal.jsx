import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
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
import "./Journal.css";

const LS_KEY = "y1ran_journal_entries_v1";

// Y1RAN_JOURNAL_REWRITE_MARKER_v4
console.log("[Journal] loaded -> Y1RAN_JOURNAL_REWRITE_MARKER_v4");

function safeJsonParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function loadEntries() {
  const raw = localStorage.getItem(LS_KEY);
  const arr = raw ? safeJsonParse(raw, []) : [];
  if (Array.isArray(arr) && arr.length) return arr;

  const seeded = [
    { id: "e1", symbol: "BTC", dir: "Long", time: "2025-12-20 22:16", cover: "", status: "open" },
    { id: "e2", symbol: "BTC", dir: "Long", time: "2025-12-20 22:00", cover: "", status: "open" },
    { id: "e3", symbol: "BTC", dir: "Long", time: "2025-12-19 13:22", cover: "", status: "open" },
  ];
  localStorage.setItem(LS_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveEntries(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function toLocalDateKey(input) {
  const d = new Date(String(input).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function CardView({ item, removeMode, onCardClick, deleteEntry }) {
  const coverSrc = item?.cover || item?.coverUrl || item?.image || item?.screenshot || "";

  return (
    <div
      className={"jCard" + (removeMode ? " isRemoveMode" : "")}
      onClick={() => {
        if (removeMode) return;
        if (typeof onCardClick !== "function") {
          console.error("[Journal] onCardClick missing/not a function:", onCardClick);
          return;
        }
        onCardClick(item);
      }}
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
        >
          -
        </span>
      </div>

      <div className="jCardBody">
        <div className="jSymbol">{item.symbol}</div>
        <div className="jMetaLine">
          <span>{item.time}</span>
          <span className="jDot">‧</span>
          <span>{item.dir}</span>
        </div>
      </div>
    </div>
  );
}
function SortableCard({ item, bucket, removeMode, onCardClick, deleteEntry }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { bucket },
    disabled: removeMode,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={"jCardWrapper" + (isDragging ? " isDragging" : "")}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none",
        visibility: isDragging ? "hidden" : "visible",
      }}
    >
      <CardView
        item={item}
        removeMode={removeMode}
        onCardClick={onCardClick}
        deleteEntry={deleteEntry}
      />
    </div>
  );
}

export default function Journal() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();

  const [tab, setTab] = useState(sp.get("tab") || "all");
  const [removeMode, setRemoveMode] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [active, setActive] = useState(null);

  const [entries, setEntries] = useState(() => loadEntries());
  const [todayOrder, setTodayOrder] = useState([]);
  const [historyOrder, setHistoryOrder] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  }, [tab, setSp]);

  // ===== date split: today vs history =====
  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const todayEntries = useMemo(
    () => entries.filter((e) => toLocalDateKey(e.time) === todayKey),
    [entries, todayKey]
  );

  const historyEntries = useMemo(
    () =>
      entries.filter((e) => {
        const k = toLocalDateKey(e.time);
        return k && k < todayKey;
      }),
    [entries, todayKey]
  );

  const perf = useMemo(() => {
    const total = entries.length;
    const todayCount = entries.filter((e) => toLocalDateKey(e.time) === todayKey).length;
    return { total, todayCount };
  }, [entries, todayKey]);

  const entryById = useMemo(() => {
    const map = Object.create(null);
    entries.forEach((e) => {
      map[e.id] = e;
    });
    return map;
  }, [entries]);

  const todayIds = useMemo(() => todayEntries.map((e) => e.id), [todayEntries]);
  const historyIds = useMemo(() => historyEntries.map((e) => e.id), [historyEntries]);

  useEffect(() => {
    setTodayOrder((prev) => {
      const setPrev = new Set(prev);
      const next = prev.filter((id) => todayIds.includes(id));
      todayIds.forEach((id) => {
        if (!setPrev.has(id)) next.push(id);
      });
      return next;
    });
  }, [todayIds.join("|")]);

  useEffect(() => {
    setHistoryOrder((prev) => {
      const setPrev = new Set(prev);
      const next = prev.filter((id) => historyIds.includes(id));
      historyIds.forEach((id) => {
        if (!setPrev.has(id)) next.push(id);
      });
      return next;
    });
  }, [historyIds.join("|")]);

  const todayOrdered = useMemo(
    () => todayOrder.map((id) => entryById[id]).filter(Boolean),
    [todayOrder, entryById]
  );

  const historyOrdered = useMemo(
    () => historyOrder.map((id) => entryById[id]).filter(Boolean),
    [historyOrder, entryById]
  );

  function openDetail(item) {
    setActive(item);
    setDetailOpen(true);
  }

  function deleteEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function markDone(id) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "done" } : e))
    );
  }

  function addOneDummy() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");

    const id = "e" + Math.random().toString(16).slice(2, 8);
    const item = {
      id,
      symbol: "BTC",
      dir: "Long",
      time: `${yyyy}-${mm}-${dd} ${hh}:${mi}`,
      cover: "",
      status: "open",
    };
    setEntries((prev) => [item, ...prev]);
  }

  const handleCardClick = (item) => {
    console.log("[Journal] card click", item?.id);
    if (removeMode) return;
    openDetail(item);
  };

  function handleQuickCreate(e) {
    console.log("[QuickCreate] enter");
    setCreateOpen(true);
  }

  function handleDragStart(e) {
    setActiveId(e.active?.id ?? null);
  }

  function handleDragEnd(e) {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const fromBucket = active.data.current?.bucket;
    const toBucket = over.data.current?.bucket;
    if (fromBucket !== toBucket) return;

    if (fromBucket === "today") {
      setTodayOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    if (fromBucket === "history") {
      setHistoryOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const activeEntry = activeId ? entryById[activeId] : null;

  return (
    <div className="jBoardMain">
      <div className="jTopSpan">
        <div className="jTitle">儀表板 (DEBUG)</div>

        <div className="jHeaderActions">
          <button type="button" className="jTab" onClick={() => nav("/")}>
            回首頁
          </button>
          <div className="jTabs">
            <button type="button" className={"jTab" + (tab === "all" ? " isActive" : "")} onClick={() => setTab("all")}>
              全部
            </button>
            <button type="button" className={"jTab" + (tab === "today" ? " isActive" : "")} onClick={() => setTab("today")}>
              今天
            </button>
            <button type="button" className={"jTab" + (tab === "week" ? " isActive" : "")} onClick={() => setTab("week")}>
              本週
            </button>
            <button type="button" className={"jTab" + (tab === "done" ? " isActive" : "")} onClick={() => setTab("done")}>
              已結單
            </button>
          </div>
        </div>
      </div>

      <div className="journalDivider" />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="jGridRow">
          <SortableContext items={todayOrder} strategy={rectSortingStrategy}>
            <div className="jCardGrid jCardGridToday">
              {todayOrdered.map((item) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  bucket="today"
                  removeMode={removeMode}
                  onCardClick={handleCardClick}
                  deleteEntry={deleteEntry}
                />
              ))}

              <button
                className="jCard jCardAdd jAddCard"
                onClick={handleQuickCreate}
                type="button"
              >
                <div className="jAddIcon">+</div>
                <div className="jAddText">新增第一張紀錄卡</div>
              </button>
            </div>
          </SortableContext>

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
              <div className="jPerfHint">（先佔位：之後放 PnL / 勝率 / R 值）</div>
            </div>
          </div>
        </div>

        <div className="jHistory">
          <div className="jHistoryTitle">歷史</div>
          <div className="jHistoryHint">（今天之前建立的卡片）</div>
          <SortableContext items={historyOrder} strategy={rectSortingStrategy}>
            <div className="jCardGrid jCardGridHistory">
              {historyOrdered.map((item) => (
                <SortableCard
                  key={item.id}
                  item={item}
                  bucket="history"
                  removeMode={removeMode}
                  onCardClick={handleCardClick}
                  deleteEntry={deleteEntry}
                />
              ))}
            </div>
          </SortableContext>
          {historyOrdered.length === 0 ? (
            <div className="jHistoryEmpty">今天之前沒有卡片（你很乾淨）</div>
          ) : null}
        </div>

        <DragOverlay adjustScale={false}>
          {activeEntry ? (
            <div className="jDragOverlay">
              <CardView item={activeEntry} removeMode={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {createOpen && (
        <div className="jModalOverlay isOpen" onMouseDown={() => setCreateOpen(false)}>
          <div className="jModal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="jModalHead">
              <div style={{ fontWeight: 800 }}>快速建立</div>
              <button className="jIconBtn" type="button" onClick={() => setCreateOpen(false)}>×</button>
            </div>
            <div className="jModalBody">
              <div className="jFormRow">
                <div className="jFormLabel">幣種</div>
                <input className="jInput" defaultValue="BTC" />
              </div>
              <div className="jFormRow">
                <div className="jFormLabel">方向</div>
                <select className="jInput" defaultValue="Long">
                  <option>Long</option>
                  <option>Short</option>
                </select>
              </div>
              <div className="jFormRow">
                <div className="jFormLabel">備註</div>
                <textarea className="jInput" rows="3" placeholder="可留空" />
              </div>
            </div>

            <div className="jModalActions">
              <button className="jBtn" type="button" onClick={() => setCreateOpen(false)}>取消</button>
              <button className="jBtn jBtnPrimary" type="button" onClick={() => { addOneDummy(); setCreateOpen(false); }}>
                建立
              </button>
            </div>
          </div>
        </div>
      )}

      {detailOpen && active && (
        <div className="jModalOverlay isOpen" onMouseDown={() => setDetailOpen(false)}>
          <div className="jModal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="jModalHead">
              <div style={{ fontWeight: 800 }}>{active.symbol}</div>
              <button className="jIconBtn" type="button" onClick={() => setDetailOpen(false)}>×</button>
            </div>
            <div className="jModalBody">
              <div className="jDetailLine">
                <div className="jDetailLabel">時間</div>
                <div className="jDetailValue">{active.time}</div>
              </div>
              <div className="jDetailLine">
                <div className="jDetailLabel">方向</div>
                <div className="jDetailValue">{active.dir}</div>
              </div>
              <div className="jDetailLine">
                <div className="jDetailLabel">備註</div>
                <div className="jDetailValue">—</div>
              </div>
            </div>

            <div className="jModalActions">
              <button className="jBtn" type="button" onClick={() => setDetailOpen(false)}>關閉</button>
              <button className="jBtn" type="button" onClick={() => { markDone(active.id); setDetailOpen(false); }}>
                標記已結單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









