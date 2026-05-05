import os
import tempfile
from pathlib import Path
from openai import AsyncOpenAI

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".webm", ".flac", ".mp4"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB (OpenAI Whisper 제한)

LANG_MAP = {
    "ko": "ko",
    "en": "en",
    "ja": "ja",
    "zh": "zh",
    "auto": None,
}


async def transcribe_audio(file_bytes: bytes, filename: str, language: str = "ko") -> str:
    """오디오 파일을 텍스트로 변환합니다 (OpenAI Whisper API).
    환경변수 OPENAI_API_KEY 필요.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY 환경변수가 설정되지 않았습니다. "
            "Railway 대시보드에서 환경변수를 추가해 주세요."
        )

    ext = Path(filename).suffix.lower()
    if not ext:
        ext = ".mp3"
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"지원하지 않는 파일 형식입니다 ({ext}). "
            f"지원 형식: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("파일 크기가 너무 큽니다. (최대 25MB)")

    whisper_lang = LANG_MAP.get(language, None)
    client = AsyncOpenAI(api_key=api_key)

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            kwargs = {
                "model": "whisper-1",
                "file": (filename, audio_file, _mime_type(ext)),
                "response_format": "text",
            }
            if whisper_lang:
                kwargs["language"] = whisper_lang
            transcript = await client.audio.transcriptions.create(**kwargs)
        return transcript if isinstance(transcript, str) else transcript.text
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _mime_type(ext: str) -> str:
    return {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
        ".ogg": "audio/ogg",
        ".webm": "audio/webm",
        ".flac": "audio/flac",
        ".mp4": "audio/mp4",
    }.get(ext, "audio/mpeg")
