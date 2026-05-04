import { useState, useRef, useEffect } from "react";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const supported = !!SpeechRecognition;

export default function VoiceInput({ value, onChange }) {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");   // 인식 중인 임시 텍스트
  const [lang, setLang] = useState("ko-KR");
  const recognitionRef = useRef(null);
  const finalRef = useRef(value);               // 확정된 텍스트 추적

  // value 변경 시 ref 동기화
  useEffect(() => { finalRef.current = value; }, [value]);

  const startRecording = () => {
    if (!supported) return;
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interimText = "";
      let newFinal = finalRef.current;

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          newFinal = (newFinal ? newFinal + " " : "") + transcript;
          finalRef.current = newFinal;
          onChange(newFinal);
          interimText = "";
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error !== "aborted") console.warn("Speech error:", e.error);
      stopRecording();
    };

    rec.onend = () => {
      // continuous 모드에서 자동 재시작 (사용자가 멈추기 전까지)
      if (recognitionRef.current && recording) {
        try { rec.start(); } catch (_) {}
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setRecording(true);
      setInterim("");
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // 재시작 방지
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
    setInterim("");
  };

  const clearAll = () => {
    stopRecording();
    onChange("");
    finalRef.current = "";
  };

  if (!supported) {
    return (
      <div style={s.unsupported}>
        <span>⚠️</span>
        <span>이 브라우저는 음성인식을 지원하지 않습니다. Chrome을 사용해 주세요.</span>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      {/* 언어 선택 */}
      <div style={s.langRow}>
        <span style={s.langLabel}>인식 언어</span>
        <select
          style={s.langSelect}
          value={lang}
          onChange={e => setLang(e.target.value)}
          disabled={recording}
        >
          <option value="ko-KR">한국어</option>
          <option value="en-US">English</option>
          <option value="ja-JP">日本語</option>
        </select>
      </div>

      {/* 녹음 버튼 */}
      <div style={s.btnRow}>
        <button
          style={{ ...s.micBtn, ...(recording ? s.micBtnOn : {}) }}
          onClick={recording ? stopRecording : startRecording}
        >
          <span style={{ ...s.micIcon, ...(recording ? s.micIconPulse : {}) }}>
            🎙️
          </span>
          {recording ? "녹음 중단" : "녹음 시작"}
        </button>
        {value && (
          <button style={s.clearBtn} onClick={clearAll}>초기화</button>
        )}
      </div>

      {/* 상태 표시 */}
      {recording && (
        <div style={s.statusRow}>
          <span style={s.dot} />
          <span style={s.statusText}>말씀하세요... 자동으로 텍스트로 변환됩니다</span>
        </div>
      )}

      {/* 텍스트 영역 (확정 + 임시) */}
      <div style={s.textBox}>
        <textarea
          style={s.textarea}
          value={value + (interim ? (value ? " " : "") + interim : "")}
          onChange={e => {
            // 사용자가 직접 편집 시 interim 제거하고 반영
            const v = e.target.value;
            onChange(v);
            finalRef.current = v;
            setInterim("");
          }}
          placeholder={recording
            ? "음성인식 중... 여기에 실시간으로 표시됩니다"
            : "녹음 시작 버튼을 누르고 말하면\n여기에 텍스트로 변환됩니다.\n\n직접 타이핑으로 수정도 가능합니다."}
          rows={9}
          spellCheck={false}
        />
        {interim && (
          <div style={s.interimBadge}>인식 중...</div>
        )}
      </div>

      {/* 글자 수 */}
      {value && (
        <div style={s.countRow}>
          <span style={s.count}>{value.length.toLocaleString()}자 입력됨</span>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 10 },

  langRow: { display: "flex", alignItems: "center", gap: 8 },
  langLabel: { fontSize: 12, color: "#64748b", whiteSpace: "nowrap" },
  langSelect: {
    fontSize: 13, padding: "4px 8px", border: "1px solid #e2e8f0",
    borderRadius: 6, background: "#f8fafc", color: "#334155", cursor: "pointer",
  },

  btnRow: { display: "flex", gap: 8, alignItems: "center" },
  micBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 20px", borderRadius: 10,
    border: "none", background: "#2563eb", color: "white",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    transition: "background .15s",
  },
  micBtnOn: { background: "#dc2626" },
  micIcon: { fontSize: 18, display: "inline-block" },
  micIconPulse: { animation: "pulse 1s ease-in-out infinite" },

  clearBtn: {
    padding: "10px 14px", borderRadius: 10,
    border: "1px solid #e2e8f0", background: "white",
    color: "#64748b", fontSize: 13, cursor: "pointer",
  },

  statusRow: { display: "flex", alignItems: "center", gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: "50%", background: "#dc2626",
    animation: "pulse 1s ease-in-out infinite", flexShrink: 0,
  },
  statusText: { fontSize: 12, color: "#dc2626", fontWeight: 500 },

  textBox: { position: "relative" },
  textarea: {
    width: "100%", boxSizing: "border-box",
    padding: "14px 16px", border: "1.5px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, lineHeight: 1.7,
    color: "#0f172a", background: "#f8fafc",
    resize: "vertical", outline: "none",
    fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
  },
  interimBadge: {
    position: "absolute", bottom: 10, right: 10,
    fontSize: 11, color: "#2563eb", background: "#eff6ff",
    padding: "2px 8px", borderRadius: 99, fontWeight: 500,
  },

  countRow: { display: "flex", justifyContent: "flex-end" },
  count: { fontSize: 12, color: "#94a3b8" },

  unsupported: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "16px", background: "#fff7ed",
    border: "1px solid #fed7aa", borderRadius: 10,
    fontSize: 13, color: "#9a3412",
  },
};
