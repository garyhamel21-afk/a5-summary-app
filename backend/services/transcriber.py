import os
import subprocess
import tempfile
from pathlib import Path
from groq import AsyncGroq

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".webm", ".flac", ".mp4", ".aac"}
# Groq가 직접 지원하는 포맷
GROQ_SUPPORTED = {".mp3", ".wav", ".m4a", ".ogg", ".webm", ".flac", ".mp4"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB

# Whisper 언어 코드 매핑 (ISO 639-1)
LANG_MAP = {
    "ko": "ko",
    "en": "en",
    "ja": "ja",
    "zh": "zh",
    "auto": None,  # None → 자동 감지
}


async def transcribe_audio(file_bytes: bytes, filename: str, language: str = "ko") -> str:
    """
    오디오 파일을 받아 텍스트로 변환합니다 (Groq Whisper API 사용).
    환경변수 GROQ_API_KEY 필요. AAC 파일은 MP3로 자동 변환됩니다.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY 환경변수가 설정되지 않았습니다. "
            "Railway 대시보드에서 환경변수를 추가해 주세요."
        )

    # 파일 확장자 검사
    ext = Path(filename).suffix.lower()
    if not ext:
        ext = ".mp3"  # 기본값
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"지원하지 않는 파일 형식입니다 ({ext}). "
            f"지원 형식: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    # 파일 크기 검사
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError(f"파일 크기가 너무 큽니다. (최대 25MB)")

    # AAC 등 Groq 미지원 포맷은 MP3로 변환
    if ext not in GROQ_SUPPORTED:
        file_bytes, filename, ext = _convert_to_mp3(file_bytes, ext)

    # 언어 코드 변환
    whisper_lang = LANG_MAP.get(language, None)

    client = AsyncGroq(api_key=api_key)

    # 임시 파일로 저장 후 Whisper API 호출
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            kwargs = {
                "model": "whisper-large-v3-turbo",
                "file": (filename, audio_file, _mime_type(ext)),
                "response_format": "text",
            }
            if whisper_lang:
                kwargs["language"] = whisper_lang

            transcript = await client.audio.transcriptions.create(**kwargs)

        # response_format="text" 이면 문자열 바로 반환
        return transcript if isinstance(transcript, str) else transcript.text

    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _convert_to_mp3(file_bytes: bytes, ext: str) -> tuple:
    """AAC 등 미지원 포맷을 ffmpeg로 MP3 변환합니다."""
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_in:
        tmp_in.write(file_bytes)
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path.replace(ext, ".mp3")

    try:
        cmd = [
            "ffmpeg", "-y",
            "-analyzeduration", "100M",
            "-probesize", "100M",
        ]
        # AAC는 ADTS 포맷으로 강제 지정
        if ext == ".aac":
            cmd += ["-f", "adts"]
        cmd += [
            "-i", tmp_in_path,
            "-vn",
            "-acodec", "libmp3lame",
            "-q:a", "2",
            tmp_out_path
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=120
        )

        if result.returncode != 0:
            raise ValueError(
                f"오디오 변환 실패: {result.stderr.decode(errors='replace')[-300:]}"
            )

        with open(tmp_out_path, "rb") as f:
            mp3_bytes = f.read()
        return mp3_bytes, "converted.mp3", ".mp3"

    finally:
        try:
            os.unlink(tmp_in_path)
        except OSError:
            pass
        try:
            os.unlink(tmp_out_path)
        except OSError:
            pass


def _mime_type(ext: str) -> str:
    """확장자 → MIME 타입 매핑"""
    return {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
        ".ogg": "audio/ogg",
        ".webm": "audio/webm",
        ".flac": "audio/flac",
        ".mp4": "audio/mp4",
        ".aac": "audio/aac",
    }.get(ext, "audio/mpeg")
