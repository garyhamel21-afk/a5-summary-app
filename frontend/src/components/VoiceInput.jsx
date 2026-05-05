import { useState, useRef } from "react";

const ACCEPT_TYPES = ".mp3,.wav,.m4a,.ogg,.webm,.flac,.mp4,.aac";
const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const LANG_OPTIONS = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "auto", label: "자동 감지" },
];

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function VoiceInput({ value, onChange }) {
  const [audioFile, setAudioFile] = useState(null);
  const [lang, setLang] = useState("ko");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  /* ── 파일 유효성 검사 ─────────────────────────── */
  const validateFile = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const allowed = ["mp3", "wav", "m4a", "ogg", "webm", "flac", "mp4", "aac"];
    if (!allowed.includes(ext))
      return `지원하지 않는 형식입니다. (지원: ${allowed.join(", ")})`;
    if (file.size > MAX_SIZE_BYTES)
      return `파일 크기가 너무 큽니다. (최대 ${MAX_SIZE_MB}MB)`;
    return null;
  };

  const handleFile = (file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError("");
    setAudioFile(file);
    onChange(""); // 이전 텍스트 초기화
  };

  /* ── 드래그 앤 드롭 ───────────────────────────── */
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };
  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);

  /* ── 파일 입력 ───────────────────────────────── */
  const onFileChange = (e) => handleFile(e.target.files?.[0]);

  /* ── 텍스트 추출 (백엔드 Whisper 호출) ─────────── */
  const extractText = async () => {
    if (!audioFile) return;
    setLoading(true);
    setError("");
    onChange("");

    try {
      const form = new FormData();
      form.append("audio_file", audioFile, audioFile.name);
      form.append("language", lang);

      const res = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `오류 발생 (${res.status})`);
      }

      const data = await res.json();
      onChange(data.text || "");
    } catch (e) {
      setError(e.message || "텍스트 추출 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /* ── 초기화 ──────────────────────────────────── */
  const clearAll = () => {
    setAudioFile(null);
    onChange("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── 파일 크기 표시 ──────────────────────────── */
  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div style={s.wrap}>

      {/* ── 언어 선택 ── */}
      <div style={s.langRow}>
        <span style={s.langLabel}>인식 언어</span>
        <select
          style={s.langSelect}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={loading}
        >
          {LANG_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── 드롭존 ── */}
      <div
        style={{
          ...s.dropzone,
          ...(isDragOver ? s.dropzoneActive : {}),
          ...(audioFile ? s.dropzoneFilled : {}),
        }}
        onClick={() => !audioFile && fileInputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_TYPES}
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        {audioFile ? (
          <div style={s.fileInfo}>
            <span style={s.fileIcon}>🎵</span>
            <div style={s.fileMeta}>
              <span style={s.fileName}>{audioFile.name}</span>
              <span style={s.fileSize}>{formatSize(audioFile.size)}</span>
            </div>
            <button
              style={s.removeBtn}
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
            >✕</button>
          </div>
        ) : (
          <div style={s.dropHint}>
            <span style={s.dropIcon}>🎙️</span>
            <span style={s.dropText}>
              녹음 파일을 여기에 드래그하거나 클릭하여 업로드
            </span>
            <span style={s.dropSub}>
              MP3 · WAV · M4A · AAC · OGG · WebM · FLAC · MP4 (최대 {MAX_SIZE_MB}MB)
            </span>
          </div>
        )}
      </div>

      {/* ── 오류 메시지 ── */}
      {error && <div style={s.errorBox}>⚠️ {error}</div>}

      {/* ── 버튼 영역 ── */}
      <div style={s.btnRow}>
        <button
          style={{
            ...s.extractBtn,
            ...((!audioFile || loading) ? s.extractBtnDisabled : {}),
          }}
          onClick={extractText}
          disabled={!audioFile || loading}
        >
          {loading
            ? <><span style={s.spinner}>⏳</span> 텍스트 추출 중...</>
            : <>🔍 텍스트 추출하기</>
          }
        </button>
        {(audioFile || value) && (
          <button style={s.clearBtn} onClick={clearAll} disabled={loading}>
            초기화
          </button>
        )}
      </div>

      {/* ── 로딩 안내 ── */}
      {loading && (
        <div style={s.loadingBox}>
          <span style={s.loadingDot} />
          <span style={s.loadingText}>
            AI가 음성을 분석하고 있습니다. 파일 길이에 따라 잠시 소요될 수 있습니다...
          </span>
        </div>
      )}

      {/* ── 추출된 텍스트 ── */}
      {(value || loading) && (
        <div style={s.textBox}>
          <div style={s.textHeader}>
            <span style={s.textLabel}>추출된 텍스트</span>
            {value && <span style={s.textCount}>{value.length.toLocaleString()}자</span>}
          </div>
          <textarea
            style={s.textarea}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="텍스트 추출 후 여기에 표시됩니다. 직접 수정도 가능합니다."
            rows={9}
            disabled={loading}
            spellCheck={false}
          />
        </div>
      )}

      {/* ── 초기 안내 ── */}
      {!audioFile && !value && (
        <div style={s.infoBox}>
          💡 음성으로 메모한 내용을 AI가 주제별로 분류하고 깔끔하게 정리합니다
        </div>
      )}
    </div>
  );
}

/* ── 스타일 ─────────────────────────────────────── */
const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 12 },

  langRow: { display: "flex", alignItems: "center", gap: 8 },
  langLabel: { fontSize: 12, color: "#64748b", whiteSpace: "nowrap" },
  langSelect: {
    fontSize: 13, padding: "4px 8px",
    border: "1px solid #e2e8f0", borderRadius: 6,
    background: "#f8fafc", color: "#334155", cursor: "pointer",
  },

  dropzone: {
    border: "2px dashed #cbd5e1", borderRadius: 12,
    padding: "28px 20px", cursor: "pointer",
    transition: "all .2s", background: "#f8fafc",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  dropzoneActive: { borderColor: "#2563eb", background: "#eff6ff" },
  dropzoneFilled: {
    borderStyle: "solid", borderColor: "#bfdbfe",
    background: "#f0f7ff", cursor: "default",
  },

  dropHint: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 8, textAlign: "center",
  },
  dropIcon: { fontSize: 36 },
  dropText: { fontSize: 14, color: "#475569", fontWeight: 500 },
  dropSub: { fontSize: 11, color: "#94a3b8" },

  fileInfo: { display: "flex", alignItems: "center", gap: 12, width: "100%" },
  fileIcon: { fontSize: 28, flexShrink: 0 },
  fileMeta: { display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 },
  fileName: {
    fontSize: 13, fontWeight: 600, color: "#1e40af",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  fileSize: { fontSize: 11, color: "#64748b" },
  removeBtn: {
    padding: "4px 8px", border: "none", borderRadius: 6,
    background: "#fee2e2", color: "#dc2626",
    fontSize: 12, cursor: "pointer", flexShrink: 0,
  },

  errorBox: {
    padding: "10px 14px", borderRadius: 8,
    background: "#fff1f2", border: "1px solid #fecdd3",
    fontSize: 13, color: "#be123c",
  },

  btnRow: { display: "flex", gap: 8, alignItems: "center" },
  extractBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 10,
    border: "none", background: "#2563eb", color: "white",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    transition: "background .15s",
  },
  extractBtnDisabled: { background: "#94a3b8", cursor: "not-allowed" },
  spinner: { fontSize: 16 },
  clearBtn: {
    padding: "10px 14px", borderRadius: 10,
    border: "1px solid #e2e8f0", background: "white",
    color: "#64748b", fontSize: 13, cursor: "pointer",
  },

  loadingBox: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px", borderRadius: 8,
    background: "#eff6ff", border: "1px solid #bfdbfe",
  },
  loadingDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#2563eb", flexShrink: 0,
    animation: "pulse 1s ease-in-out infinite",
  },
  loadingText: { fontSize: 12, color: "#1d4ed8" },

  textBox: { display: "flex", flexDirection: "column", gap: 6 },
  textHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  textLabel: { fontSize: 12, fontWeight: 600, color: "#475569" },
  textCount: { fontSize: 12, color: "#94a3b8" },
  textarea: {
    width: "100%", boxSizing: "border-box",
    padding: "14px 16px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, lineHeight: 1.7,
    color: "#0f172a", background: "#f8fafc",
    resize: "vertical", outline: "none",
    fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
  },

  infoBox: {
    padding: "12px 16px", borderRadius: 10,
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    fontSize: 13, color: "#166534",
  },
};
