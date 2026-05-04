from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from typing import Optional
from services.extractor import extract_from_youtube, extract_from_file
from services.claude_service import summarize_to_infographic
from services.renderer import render_pdf, render_docx

router = APIRouter()


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
