import os, re, io
from fastapi import UploadFile, HTTPException
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
from pypdf import PdfReader
from docx import Document

def _extract_video_id(url):
    for p in [r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", r"youtu\.be\/([0-9A-Za-z_-]{11})", r"embed\/([0-9A-Za-z_-]{11})"]:
        m = re.search(p, url)
        if m: return m.group(1)
    raise HTTPException(status_code=400, detail="유효하지 않은 YouTube URL입니다.")

def _build_api():
    """Webshare 프록시 환경변수가 있으면 프록시 통해서, 없으면 직접 호출."""
    pu = os.environ.get("WEBSHARE_PROXY_USERNAME")
    pp = os.environ.get("WEBSHARE_PROXY_PASSWORD")
    if pu and pp:
        from youtube_transcript_api.proxies import WebshareProxyConfig
        return YouTubeTranscriptApi(
            proxy_config=WebshareProxyConfig(proxy_username=pu, proxy_password=pp)
        )
    return YouTubeTranscriptApi()

async def extract_from_youtube(url):
    vid = _extract_video_id(url)
    try:
        api = _build_api()
        tl = api.list(vid)
        try:
            t = tl.find_transcript(["ko", "en"])
        except Exception:
            t = tl.find_generated_transcript(["ko", "en"])
        fetched = t.fetch()
        # 신버전은 FetchedTranscript 객체, 구버전은 dict 리스트
        try:
            text = " ".join(s.text for s in fetched)
        except Exception:
            text = " ".join(s["text"] for s in fetched)
        return text.strip()
    except TranscriptsDisabled:
        raise HTTPException(status_code=422, detail="자막이 비활성화된 영상입니다.")
    except NoTranscriptFound:
        raise HTTPException(status_code=422, detail="한국어/영어 자막을 찾을 수 없습니다.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube 추출 실패: {e}")

async def extract_from_file(file: UploadFile):
    content = await file.read()
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        r = PdfReader(io.BytesIO(content))
        return "\n".join(p.extract_text() or "" for p in r.pages).strip()
    elif ext in ("docx", "doc"):
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    elif ext == "txt":
        return content.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=415, detail=f"지원하지 않는 형식: .{ext}")
