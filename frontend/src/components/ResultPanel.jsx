import { useState } from "react";

export default function ResultPanel({ result }) {
  const { url, format } = result;
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `infographic.${format}`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div style={s.card}>
      {/* 성공 배너 */}
      <div style={s.successBanner}>
        <span style={s.checkIcon}>✅</span>
        <div>
          <div style={s.successTitle}>인포그래픽 생성 완료!</div>
          <div style={s.successSub}>파일을 다운로드하거나, PDF라면 미리보기를 확인하세요.</div>
        </div>
      </div>

      {/* PDF 미리보기 */}
      {format === "pdf" && (
        <div style={s.previewWrap}>
          <iframe
            src={url}
            style={s.iframe}
            title="인포그래픽 미리보기"
          />
        </div>
      )}

      {/* DOCX 안내 */}
      {format === "docx" && (
        <div style={s.docxHint}>
          <span style={{ fontSize: 28 }}>📘</span>
          <div>
            <div style={s.docxTitle}>Word 문서가 준비됐습니다</div>
            <div style={s.docxSub}>아래 버튼을 눌러 다운로드한 후 Word에서 여세요.</div>
          </div>
        </div>
      )}

      {/* 다운로드 버튼 */}
      <button style={s.downloadBtn} onClick={handleDownload}>
        {downloaded ? "✓ 다운로드 완료!" : `⬇ ${format.toUpperCase()} 다운로드`}
      </button>
    </div>
  );
}

const s = {
  card: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#f0fdf4",
    borderBottom: "1px solid #bbf7d0",
    padding: "14px 20px",
  },
  checkIcon: { fontSize: 24, flexShrink: 0 },
  successTitle: { fontSize: 14, fontWeight: 700, color: "#14532d" },
  successSub: { fontSize: 12, color: "#16a34a", marginTop: 2 },

  previewWrap: {
    padding: "16px 20px",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "center",
  },
  iframe: {
    width: "100%",
    maxWidth: 420,
    height: 560,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "white",
  },

  docxHint: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "24px 20px",
    background: "#eff6ff",
  },
  docxTitle: { fontSize: 14, fontWeight: 700, color: "#1e3a8a" },
  docxSub: { fontSize: 12, color: "#3b82f6", marginTop: 4 },

  downloadBtn: {
    display: "block",
    width: "calc(100% - 40px)",
    margin: "0 20px 20px",
    padding: "13px 0",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};
