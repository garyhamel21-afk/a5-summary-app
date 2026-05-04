# 📊 인포그래픽 생성기

YouTube URL 또는 문서 파일을 A5 크기 인포그래픽 PDF/DOCX로 자동 변환하는 풀스택 웹 애플리케이션입니다.

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | React 18 + Vite (Vercel 배포) |
| 백엔드 | FastAPI + Python 3.11 (Railway 배포) |
| AI | Claude Sonnet (Anthropic API) |
| YouTube | youtube-transcript-api |
| 파일 파싱 | PyMuPDF, python-docx |
| PDF 생성 | WeasyPrint (HTML→PDF) |
| DOCX 생성 | python-docx |

---

## 로컬 개발 시작하기

### 1. 백엔드

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# .env 파일 생성
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 입력

uvicorn main:app --reload
# → http://localhost:8000
```

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 배포 (Vercel + Railway)

### 백엔드 → Railway

1. [railway.app](https://railway.app) 에서 New Project → GitHub repo 연결
2. `backend/` 폴더를 루트로 지정
3. 환경 변수 추가: `ANTHROPIC_API_KEY=sk-ant-...`
4. Deploy → Railway URL 확인 (예: `https://your-app.railway.app`)

### 프론트엔드 → Vercel

1. `frontend/vercel.json` 에서 `YOUR_RAILWAY_URL`을 위에서 얻은 URL로 교체
2. [vercel.com](https://vercel.com) 에서 New Project → GitHub repo 연결
3. Framework: Vite / Root Directory: `frontend`
4. Deploy

---

## 프로젝트 구조

```
infographic-app/
├── backend/
│   ├── main.py                 # FastAPI 앱 진입점
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railway.toml
│   ├── .env.example
│   ├── routers/
│   │   └── generate.py         # /api/generate 엔드포인트
│   ├── services/
│   │   ├── extractor.py        # YouTube/파일 텍스트 추출
│   │   ├── claude_service.py   # Claude API 요약 → JSON
│   │   └── renderer.py         # JSON → PDF / DOCX
│   └── templates/
│       └── infographic.html    # Jinja2 + WeasyPrint 템플릿
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── vercel.json
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        └── components/
            ├── UrlInput.jsx     # YouTube URL 입력
            ├── FileUpload.jsx   # 파일 드래그&드롭
            ├── OptionPanel.jsx  # 언어/테마/형식 설정
            └── ResultPanel.jsx  # 미리보기 + 다운로드
```

---

## API 명세

### POST /api/generate

| 필드 | 타입 | 설명 |
|------|------|------|
| youtube_url | string (optional) | YouTube URL |
| file | file (optional) | PDF/DOCX/TXT 파일 |
| language | string | ko / en / ja (기본: ko) |
| color_theme | string | auto / blue / green / orange / purple / red |
| output_format | string | pdf / docx (기본: pdf) |

응답: PDF 또는 DOCX 파일 바이너리
