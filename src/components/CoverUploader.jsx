import { useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

function getExt(file) {
  const name = file?.name || "";
  const dot = name.lastIndexOf(".");
  if (dot !== -1) return name.slice(dot + 1).toLowerCase();
  const mime = file?.type || "";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

function buildCoverPath({ uid, journalId, ext }) {
  return `journal/${uid}/${journalId}.${ext}`;
}

export default function CoverUploader({
  uid,
  journalId,
  mode = "draft",
  valueUrl,
  onDraftFile,
  onUploaded,
  onRemoved,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const hint = useMemo(() => {
    if (disabled) return "不可用";
    if (mode === "draft") return "點擊添加封面（建立後上傳）";
    return "點擊更換封面";
  }, [disabled, mode]);

  const openPicker = () => {
    if (disabled || busy) return;
    inputRef.current?.click();
  };

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片檔");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("圖片太大（上限 5MB）");
      return;
    }

    if (mode === "draft") {
      onDraftFile?.(file);
      return;
    }

    if (!uid || !journalId) {
      alert("缺少 uid 或 journalId，無法上傳");
      return;
    }

    try {
      setBusy(true);
      const ext = getExt(file);
      const path = buildCoverPath({ uid, journalId, ext });

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data?.publicUrl || "";

      onUploaded?.(publicUrl, path);
    } catch (err) {
      console.error(err);
      alert(`上傳失敗：${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  const removeCover = async (e) => {
    e.stopPropagation();
    if (disabled || busy) return;
    if (!uid || !journalId) return;

    const ok = confirm("要移除封面嗎？");
    if (!ok) return;

    try {
      setBusy(true);
      const candidates = ["png", "jpg", "jpeg", "webp"].map((ext) =>
        buildCoverPath({ uid, journalId, ext })
      );

      const { error } = await supabase.storage.from("avatars").remove(candidates);
      if (error) throw error;

      onRemoved?.();
    } catch (err) {
      console.error(err);
      alert(`移除失敗：${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="coverUpWrap">
      <button
        type="button"
        className="coverUpBox"
        onClick={openPicker}
        disabled={disabled || busy}
        aria-busy={busy ? "true" : "false"}
        title={hint}
      >
        {valueUrl ? (
          <img className="coverUpImg" src={valueUrl} alt="cover" />
        ) : (
          <div className="coverUpEmpty">
            <div className="coverUpPlus">+</div>
            <div className="coverUpText">{hint}</div>
          </div>
        )}

        {valueUrl && !disabled && mode === "live" ? (
          <button
            type="button"
            className="coverUpRemove"
            onClick={removeCover}
            disabled={busy}
            title="移除封面"
          >
            移除
          </button>
        ) : null}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        style={{ display: "none" }}
      />
    </div>
  );
}
