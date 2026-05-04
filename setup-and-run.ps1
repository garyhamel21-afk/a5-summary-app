# ============================================================
#  인포그래픽 생성기 - 자동 설치 & 실행 스크립트
#  실행 방법: 이 파일을 우클릭 → "PowerShell로 실행"
# ============================================================

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Err  { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "   📊 인포그래픽 생성기 시작" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# ── 사전 요구사항 확인 ──────────────────────────────────────
Write-Step "Python / Node.js 확인 중..."

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Err "Python이 설치되어 있지 않습니다."
    Write-Host "  → https://www.python.org/downloads/ 에서 설치 후 다시 실행하세요." -ForegroundColor Yellow
    Read-Host "엔터를 눌러 종료"
    exit 1
}
Write-OK "Python: $(python --version)"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js가 설치되어 있지 않습니다."
    Write-Host "  → https://nodejs.org 에서 LTS 버전을 설치 후 다시 실행하세요." -ForegroundColor Yellow
    Read-Host "엔터를 눌러 종료"
    exit 1
}
Write-OK "Node.js: $(node --version)"

# ── API 키 설정 ────────────────────────────────────────────
$EnvFile = Join-Path $Root "backend\.env"

if (-not (Test-Path $EnvFile)) {
    Write-Step "Anthropic API 키 설정..."
    Write-Host "  Anthropic Console (https://console.anthropic.com) 에서 발급한 API 키를 입력하세요."
    Write-Host "  입력값은 화면에 표시되지 않습니다." -ForegroundColor DarkGray
    Write-Host ""
    $SecureKey = Read-Host "  API 키 입력" -AsSecureString
    $PlainKey  = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                     [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureKey))

    if ($PlainKey -notmatch "^sk-ant-") {
        Write-Warn "입력한 값이 Anthropic API 키 형식(sk-ant-...)이 아닙니다. 계속 진행합니다."
    }

    "ANTHROPIC_API_KEY=$PlainKey" | Set-Content -Path $EnvFile -Encoding UTF8
    Write-OK ".env 파일 생성 완료"
} else {
    Write-OK ".env 파일 이미 존재 — 건너뜁니다."
}

# ── 백엔드 설치 ────────────────────────────────────────────
Write-Step "백엔드 Python 환경 설치 중..."
$BackendDir = Join-Path $Root "backend"
$VenvDir    = Join-Path $BackendDir "venv"

Set-Location $BackendDir

if (-not (Test-Path $VenvDir)) {
    python -m venv venv
    Write-OK "가상환경 생성 완료"
} else {
    Write-OK "가상환경 이미 존재"
}

& "$VenvDir\Scripts\python.exe" -m pip install --upgrade pip -q
& "$VenvDir\Scripts\pip.exe" install -r requirements.txt -q
Write-OK "Python 패키지 설치 완료"

# ── 프론트엔드 설치 ────────────────────────────────────────
Write-Step "프론트엔드 Node 패키지 설치 중..."
$FrontendDir = Join-Path $Root "frontend"
Set-Location $FrontendDir

if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    npm install --silent
    Write-OK "npm 패키지 설치 완료"
} else {
    Write-OK "node_modules 이미 존재"
}

# ── 서버 실행 ──────────────────────────────────────────────
Write-Step "서버 시작 중..."

# 백엔드 (새 창)
$BackendCmd = "Set-Location '$BackendDir'; & '$VenvDir\Scripts\uvicorn.exe' main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd -WindowStyle Normal

Start-Sleep -Seconds 2

# 프론트엔드 (새 창)
$FrontendCmd = "Set-Location '$FrontendDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd -WindowStyle Normal

Start-Sleep -Seconds 3

# ── 완료 ──────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ 실행 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 브라우저 접속 주소: http://localhost:5173" -ForegroundColor White
Write-Host "  🔧 API 서버 주소:      http://localhost:8000" -ForegroundColor White
Write-Host "  📋 API 문서:           http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  서버를 종료하려면 각 PowerShell 창을 닫으세요." -ForegroundColor DarkGray
Write-Host ""

Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
