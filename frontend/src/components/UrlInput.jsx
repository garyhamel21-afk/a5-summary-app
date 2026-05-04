export default function UrlInput({ value, onChange }) {
  return (
    <div>
      <label style={s.label}>YouTube URL</label>
      <div style={s.row}>
        <span style={s.icon}>📺</span>
        <input
          style={s.input}
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p style={s.hint}>자막(한국어/영어)이 있는 영상을 지원합니다.</p>
    </div>
  );
}

const s = {
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" },
  row: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
    background: "#f8fafc",
    transition: "border-color .15s",
  },
  icon: { padding: "0 10px", fontSize: 18, flexShrink: 0 },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "11px 12px 11px 0",
    fontSize: 13,
    outline: "none",
    color: "#0f172a",
  },
  hint: { margin: "6px 0 0", fontSize: 11, color: "#94a3b8" },
};
