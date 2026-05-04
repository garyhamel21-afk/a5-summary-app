export default function TextInput({ value, onChange }) {
  const MAX = 5000;
  const count = value.length;
  const pct = Math.min(count / MAX, 1);

  return (
    <div style={s.wrap}>
      <textarea
        style={s.textarea}
        placeholder="여기에 메모를 입력하세요.&#10;&#10;예) 오늘 미팅 내용, 강의 필기, 아이디어, 할 일 목록 등&#10;자유롭게 작성하면 AI가 깔끔한 노트로 정리해 드립니다."
        value={value}
        onChange={e => onChange(e.target.value.slice(0, MAX))}
        rows={10}
        spellCheck={false}
      />
      <div style={s.footer}>
        <span style={{ ...s.count, ...(pct > 0.9 ? s.countWarn : {}) }}>
          {count.toLocaleString()} / {MAX.toLocaleString()}자
        </span>
        <div style={s.barWrap}>
          <div style={{ ...s.bar, width: `${pct * 100}%`, background: pct > 0.9 ? "#ef4444" : "#2563eb" }} />
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: 8 },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#0f172a",
    background: "#f8fafc",
    resize: "vertical",
    outline: "none",
    fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
    transition: "border-color .15s",
  },
  footer: { display: "flex", alignItems: "center", gap: 10 },
  count: { fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" },
  countWarn: { color: "#ef4444", fontWeight: 600 },
  barWrap: { flex: 1, height: 3, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 99, transition: "width .2s, background .2s" },
};
