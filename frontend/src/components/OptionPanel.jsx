const LANGUAGES = [
  { value: "ko", label: "🇰🇷 한국어" },
  { value: "en", label: "🇺🇸 English" },
  { value: "ja", label: "🇯🇵 日本語" },
];

const THEMES = [
  { value: "auto", label: "🤖 자동 선택" },
  { value: "blue",   label: "🔵 블루 (기술/비즈니스)" },
  { value: "green",  label: "🟢 그린 (건강/환경)" },
  { value: "orange", label: "🟠 오렌지 (창의/에너지)" },
  { value: "purple", label: "🟣 퍼플 (창작/철학)" },
  { value: "red",    label: "🔴 레드 (긴급/감정)" },
];

const FORMATS = [
  { value: "pdf",  label: "📄 PDF" },
  { value: "docx", label: "📝 Word (DOCX)" },
];

export default function OptionPanel({ options, onChange }) {
  const set = (key, val) => onChange({ ...options, [key]: val });

  return (
    <div style={s.panel}>
      <div style={s.title}>설정</div>
      <div style={s.grid}>
        <SelectField
          label="출력 언어"
          value={options.language}
          options={LANGUAGES}
          onChange={(v) => set("language", v)}
        />
        <SelectField
          label="색상 테마"
          value={options.color_theme}
          options={THEMES}
          onChange={(v) => set("color_theme", v)}
        />
        <SelectField
          label="파일 형식"
          value={options.output_format}
          options={FORMATS}
          onChange={(v) => set("output_format", v)}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <select
        style={s.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

const s = {
  panel: {
    borderTop: "1px solid #f1f5f9",
    padding: "16px 24px",
    background: "#f8fafc",
  },
  title: { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", marginBottom: 10, textTransform: "uppercase" },
  grid: { display: "flex", gap: 10, flexWrap: "wrap" },
  field: { flex: "1 1 140px" },
  label: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 },
  select: {
    width: "100%",
    padding: "8px 10px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 7,
    fontSize: 12,
    background: "white",
    color: "#0f172a",
    outline: "none",
    cursor: "pointer",
  },
};
