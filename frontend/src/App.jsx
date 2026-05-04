import { useState } from "react";
import UrlInput from "./components/UrlInput";
import FileUpload from "./components/FileUpload";
import TextInput from "./components/TextInput";
import VoiceInput from "./components/VoiceInput";
import OptionPanel from "./components/OptionPanel";
import ResultPanel from "./components/ResultPanel";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const TABS = [
  { id: "url",   icon: "📺", label: "YouTube URL" },
  { id: "file",  icon: "📄", label: "파일 업로드" },
  { id: "text",  icon: "✏️", label: "텍스트 메모" },
  { id: "voice", icon: "🎙️", label: "음성 메모" },
];

export default function App() {
  const [inputMode, setInputMode] = useState("url");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [voiceContent, setVoiceContent] = useState("");
  const [options, setOptions] = useState({ language: "ko", color_theme: "auto", output_format: "pdf" });

  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const isNoteMode = inputMode === "text" || inputMode === "voice";

  const handleGenerate = async () => {
    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    const form = new FormData();

    if (inputMode === "url") {
      form.append("youtube_url", youtubeUrl.trim());
    } else if (inputMode === "file") {
      form.append("file", file);
    } else if (inputMode === "text") {
      form.append("text_content", textContent.trim());
      form.append("content_type", "note");
    } else if (inputMode === "voice") {
      form.append("text_content", voiceContent.trim());
      form.append("content_type", "note");
    }

    form.append("language", options.language);
    form.append("color_theme", options.color_theme);
    form.append("output_format", options.output_format);

    try {
      const res = await fetch(`${API_BASE}/generate`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "알 수 없는 오류" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult({ blob, url, format: options.output_format });
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  };

  const currentInput = {
    url:   youtubeUrl.trim() !== "",
    file:  file !== null,
    text:  textContent.trim().length >= 10,
    voice: voiceContent.trim().length >= 10,
  };
  const canGenerate = status !== "loading" && currentInput[inputMode];

  const generateLabel = isNoteMode ? "✨ 노트 정리하기" : "✨ 인포그래픽 생성";
  const tagline = isNoteMode
    ? "메모를 AI가 깔끔하게 정리된 노트로 만들어 드립니다"
    : "YouTube 영상 또는 문서를 A5 인포그래픽 PDF로 변환하세요";

  return (
    <div style={s.page}>
      {/* 헤더 */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <span style={s.logoIcon}>{isNoteMode ? "📝" : "📊"}</span>
            <span style={s.logoText}>{isNoteMode ? "AI 노트 정리기" : "인포그래픽 생성기"}</span>
          </div>
          <p style={s.tagline}>{tagline}</p>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.card}>
          {/* 탭 */}
          <div style={s.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                style={{ ...s.tab, ...(inputMode === tab.id ? s.tabActive : {}) }}
                onClick={() => setInputMode(tab.id)}
              >
                <span style={s.tabIcon}>{tab.icon}</span>
                <span style={s.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 입력 영역 */}
          <div style={s.inputArea}>
            {inputMode === "url"   && <UrlInput value={youtubeUrl} onChange={setYoutubeUrl} />}
            {inputMode === "file"  && <FileUpload file={file} onChange={setFile} />}
            {inputMode === "text"  && <TextInput value={textContent} onChange={setTextContent} />}
            {inputMode === "voice" && <VoiceInput value={voiceContent} onChange={setVoiceContent} />}
          </div>

          {/* 노트 모드 힌트 */}
          {isNoteMode && (
            <div style={s.hint}>
              💡 {inputMode === "voice"
                ? "음성으로 메모한 내용을 AI가 주제별로 분류하고 깔끔하게 정리합니다"
                : "자유롭게 작성한 메모를 AI가 논리적으로 구조화해 드립니다"}
            </div>
          )}

          {/* 옵션 */}
          <OptionPanel options={options} onChange={setOptions} />

          {/* 생성 버튼 */}
          <button
            style={{ ...s.generateBtn, ...(canGenerate ? {} : s.generateBtnDisabled) }}
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {status === "loading" ? (
              <span style={s.spinnerRow}>
                <span style={s.spinner} /> {isNoteMode ? "정리 중..." : "생성 중..."}
              </span>
            ) : generateLabel}
          </button>
        </div>

        {/* 에러 */}
        {status === "error" && (
          <div style={s.errorBox}>
            <span style={{ marginRight: 8 }}>⚠️</span>{errorMsg}
          </div>
        )}

        {/* 결과 */}
        {status === "done" && result && <ResultPanel result={result} />}
      </main>

      <footer style={s.footer}>
        Powered by Claude AI · A5 Report Generator
      </footer>
    </div>
  );
}

/* ── 인라인 스타일 ── */
const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: {
    background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    color: "white", padding: "28px 24px", textAlign: "center",
  },
  headerInner: { maxWidth: 680, margin: "0 auto" },
  logo: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 },
  logoIcon: { fontSize: 26 },
  logoText: { fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px" },
  tagline: { margin: 0, fontSize: 13, opacity: 0.82, fontWeight: 400 },

  main: { flex: 1, maxWidth: 680, width: "100%", margin: "0 auto", padding: "24px 16px" },

  card: {
    background: "#fff", borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    overflow: "hidden", marginBottom: 20,
  },

  tabs: { display: "flex", borderBottom: "1px solid #e2e8f0" },
  tab: {
    flex: 1, padding: "12px 4px",
    border: "none", background: "transparent",
    fontSize: 12, fontWeight: 600, color: "#94a3b8",
    cursor: "pointer", transition: "all .15s",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
  },
  tabActive: { color: "#2563EB", borderBottom: "2px solid #2563EB", background: "#eff6ff" },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 11 },

  inputArea: { padding: "20px 24px 8px" },

  hint: {
    margin: "4px 24px 0",
    padding: "10px 14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    fontSize: 12,
    color: "#15803d",
    lineHeight: 1.5,
  },

  generateBtn: {
    display: "block",
    width: "calc(100% - 48px)",
    margin: "16px 24px 24px",
    padding: "14px 0",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white", border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    transition: "opacity .15s",
  },
  generateBtnDisabled: { opacity: 0.45, cursor: "not-allowed" },

  spinnerRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: {
    display: "inline-block", width: 16, height: 16,
    border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },

  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#991b1b", borderRadius: 10,
    padding: "12px 16px", fontSize: 13, marginBottom: 16,
  },

  footer: { textAlign: "center", padding: "16px", fontSize: 12, color: "#94a3b8" },
};
