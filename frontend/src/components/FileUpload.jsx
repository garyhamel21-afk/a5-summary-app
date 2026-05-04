import { useRef, useState } from "react";

export default function FileUpload({ file, onChange }) {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  };

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) onChange(f);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      <label style={s.label}>파일 업로드</label>
      <div
        style={{ ...s.dropzone, ...(dragOver ? s.dragActive : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: "none" }}
          onChange={handleChange}
        />
        {file ? (
          <div style={s.fileInfo}>
            <span style={s.fileIcon}>{getIcon(file.name)}</span>
            <div>
              <div style={s.fileName}>{file.name}</div>
              <div style={s.fileSize}>{formatSize(file.size)}</div>
            </div>
            <button
              style={s.removeBtn}
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >✕</button>
          </div>
        ) : (
          <div style={s.placeholder}>
            <div style={s.uploadIcon}>📂</div>
            <div style={s.uploadText}>파일을 드래그하거나 클릭하여 선택</div>
            <div style={s.uploadHint}>PDF · DOCX · TXT · 최대 20MB</div>
          </div>
        )}
      </div>
    </div>
  );
}

function getIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  return ext === "pdf" ? "📕" : ext === "docx" || ext === "doc" ? "📘" : "📄";
}

const s = {
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, letterSpacing: "0.5px" },
  dropzone: {
    border: "2px dashed #cbd5e1",
    borderRadius: 10,
    padding: "24px 16px",
    cursor: "pointer",
    transition: "all .15s",
    background: "#f8fafc",
    textAlign: "center",
  },
  dragActive: { borderColor: "#2563eb", background: "#eff6ff" },
  placeholder: {},
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 13, fontWeight: 600, color: "#475569" },
  uploadHint: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  fileInfo: { display: "flex", alignItems: "center", gap: 12, textAlign: "left" },
  fileIcon: { fontSize: 28, flexShrink: 0 },
  fileName: { fontSize: 13, fontWeight: 600, color: "#0f172a", wordBreak: "break-all" },
  fileSize: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  removeBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    fontSize: 16,
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px 6px",
    flexShrink: 0,
  },
};
