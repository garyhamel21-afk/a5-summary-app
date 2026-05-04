@echo off
echo ============================
echo  인포그래픽 생성기 - 로컬 개발
echo ============================

REM ─── 백엔드 ───
echo [1/2] 백엔드 시작 중 (FastAPI)...
cd backend
if not exist venv (
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

if not exist .env (
    copy .env.example .env
    echo.
    echo !! .env 파일이 생성됐습니다.
    echo !! backend\.env 파일을 열어 ANTHROPIC_API_KEY를 입력해주세요.
    pause
)

start "Backend" cmd /k "call venv\Scripts\activate && uvicorn main:app --reload"

REM ─── 프론트엔드 ───
echo [2/2] 프론트엔드 시작 중 (React)...
cd ..\frontend
if not exist node_modules (
    npm install
)
start "Frontend" cmd /k "npm run dev"

echo.
echo 브라우저에서 http://localhost:5173 을 열어주세요!
timeout /t 3
start http://localhost:5173
