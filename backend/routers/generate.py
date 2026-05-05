from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, JSONResponse
from typing import Optional
from services.extractor import extract_from_youtube, extract_from_file
from services.claude_service import summarize_to_infographic
from services.renderer import render_pdf, render_docx
from services.transcriber import transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio_file: UploadFile = File(...),
    language: str = Form("ko"),
):
    """오디오 파일을 텍스트로 변환합니다 (OpenAI Whisper)."""
    file_bytes = await audio_file.read()
    filename = audio_file.filename or "audio.mp3"

    if not file_bytes:
        raise HTTPException(status_code=400, detail="오디오 파일이 비어 있습니다.")

    try:
        text = await transcribe_audio(file_bytes, filename, language=language)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"음성 인식 중 오류가 발생했습니다: {str(e)}")

    if not text or not text.strip():
        raise HTTPException(status_code=422, detail="음성에서 텍스트를 인식하지 못했습니다. 다른 파일을 시도해 주세요.")

    return JSONResponse({"text": text.strip()})


@router.post("/generate")
async def generate(
    youtube_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    language: str = Form("ko"),
    color_theme: str = Form("auto"),
    output_format: str = Form("pdf"),  # "pdf" | "docx"
    content_type: str = Form("general"),  # "general" | "note"
):
    # 1. 텍스트 추출
    if youtube_url:
        raw_text = await extract_from_youtube(youtube_url)
    elif file:
        raw_text = await extract_from_file(file)
    elif text_content and text_content.strip():
        raw_text = text_content.strip()
    else:
        raise HTTPException(status_code=400, detail="youtube_url, file, text_content 중 하나는 필수입니다.")

    if not raw_text or len(raw_text.strip()) < 10:
        raise HTTPException(status_code=422, detail="입력된 텍스트가 너무 짧습니다.")

    # 2. Claude로 인포그래픽 구조 생성
    infographic_data = await summarize_to_infographic(
        raw_text, language=language, color_theme=color_theme, content_type=content_type
    )

    # 3. 렌더링
    if output_format == "docx":
        file_bytes = render_docx(infographic_data)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = "infographic.docx"
    else:
        file_bytes = render_pdf(infographic_data)
        media_type = "application/pdf"
        filename = "infographic.pdf"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
