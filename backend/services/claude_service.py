import os, json, anthropic
from fastapi import HTTPException
from dotenv import load_dotenv
load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = """당신은 콘텐츠를 분석하여 A5 보고서용 구조화 데이터를 생성하는 전문가입니다.
반드시 아래 JSON 형식만 반환하세요. 설명이나 마크다운 없이 순수 JSON만 출력합니다.

{
  "title": "핵심 제목 (20자 이내)",
  "subtitle": "부제목 또는 출처 요약 (40자 이내)",
  "summary": "전체 내용 요약 2~3문장 (180자 이내)",
  "key_points": [
    {
      "heading": "소제목 (20자 이내)",
      "content": "핵심 내용 상세 설명 (150자 이내, 2~3문장으로 구체적으로 작성)"
    }
  ],
  "stats": [
    {"value": "숫자나 짧은 값", "label": "설명 (15자 이내)"}
  ],
  "color_theme": "blue",
  "takeaway": "결론 및 핵심 메시지 한 줄 (70자 이내)"
}

규칙:
- key_points: 반드시 4~5개. 각 content는 구체적이고 충분히 길게 (최소 100자)
- stats: 숫자/데이터가 있을 때만 0~3개, 없으면 []
- color_theme: blue/green/orange/purple/red 중 내용 분위기에 맞게
- 언어: 요청된 언어로 작성
"""

NOTE_SYSTEM_PROMPT = """당신은 메모와 음성 기록을 깔끔하게 정리하는 노트 전문가입니다.
입력된 메모/음성 텍스트를 분석하여 아래 JSON 형식으로 구조화된 노트를 생성하세요.
반드시 아래 JSON 형식만 반환하세요. 설명이나 마크다운 없이 순수 JSON만 출력합니다.

{
  "title": "핵심 주제 (20자 이내)",
  "subtitle": "메모 유형 또는 맥락 요약 (40자 이내)",
  "summary": "전체 메모 핵심 요약 2~3문장 (180자 이내)",
  "key_points": [
    {
      "heading": "정리된 항목명 (20자 이내)",
      "content": "해당 항목의 정리된 내용 (150자 이내, 구체적이고 명확하게)"
    }
  ],
  "stats": [
    {"value": "숫자나 짧은 값", "label": "설명 (15자 이내)"}
  ],
  "color_theme": "blue",
  "takeaway": "핵심 결론 또는 다음 행동 항목 (70자 이내)"
}

규칙:
- key_points: 메모 내용을 논리적으로 분류하여 3~5개 항목으로 정리. 중복은 합치고 관련 내용은 묶기
- 날짜/시간/숫자 등 중요 데이터가 있으면 stats에 포함, 없으면 []
- takeaway: 메모에서 가장 중요한 결론이나 다음에 해야 할 행동
- color_theme: blue/green/orange/purple/red 중 내용 분위기에 맞게
- 언어: 요청된 언어로 작성
"""

async def summarize_to_infographic(text, language="ko", color_theme="auto", content_type="general"):
    MAX_CHARS = 12000
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS] + "\n\n[이하 생략]"

    lang_map = {"ko": "모든 출력을 한국어로.", "en": "Write all output in English.", "ja": "日本語で出力してください。"}
    theme_inst = f"color_theme은 반드시 '{color_theme}'." if color_theme != "auto" else "color_theme은 내용에 맞게 자동 선택."

    system = NOTE_SYSTEM_PROMPT if content_type == "note" else SYSTEM_PROMPT
    user_label = "정리할 메모/음성 텍스트" if content_type == "note" else "분석할 텍스트"

    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=system,
        messages=[{"role": "user", "content": f"{lang_map.get(language,'')}\n{theme_inst}\n\n{user_label}:\n---\n{text}\n---\n\n순수 JSON만 반환하세요."}],
    )
    raw = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"): raw = raw[4:]
        raw = raw.strip()
    data = json.loads(raw)
    for k,v in [("title","정리된 노트"),("subtitle",""),("summary",""),("key_points",[]),("stats",[]),("color_theme","blue"),("takeaway","")]:
        data.setdefault(k,v)
    return data
