FROM python:3.11-slim

# 한국어 폰트 (ReportLab용) + ffmpeg (오디오 변환용)
RUN apt-get update && apt-get install -y \
    fonts-noto-cjk \
    fonts-nanum \
    fontconfig \
    ffmpeg \
    && fc-cache -fv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "main.py"]
