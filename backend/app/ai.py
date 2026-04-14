import os
import requests

# Read provider from ENV (injected via GitHub Actions / Docker / ECS)
PROVIDER = os.getenv("AI_PROVIDER", "openai")

def build_prompt(data):
    return f"""
Compare cloud costs:

AWS: {data['aws']}
Azure: {data['azure']}
GCP: {data['gcp']}

Provide:
Cheapest option
When to use each cloud
Cost optimization tips
"""

# ------------------------
# OpenAI
# ------------------------
def call_openai(prompt):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        return "Missing OPENAI_API_KEY"

    res = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        },
        timeout=10
    )

    return res.json()["choices"][0]["message"]["content"]

# ------------------------
# Gemini
# ------------------------
def call_gemini(prompt):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return "Missing GEMINI_API_KEY"

    res = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
        json={
            "contents": [{"parts": [{"text": prompt}]}]
        },
        timeout=10
    )

    return res.json()["candidates"][0]["content"]["parts"][0]["text"]

# ------------------------
# Claude
# ------------------------
def call_claude(prompt):
    api_key = os.getenv("CLAUDE_API_KEY")

    if not api_key:
        return "Missing CLAUDE_API_KEY"

    res = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        },
        json={
            "model": "claude-3-haiku-20240307",
            "max_tokens": 300,
            "messages": [{"role": "user", "content": prompt}]
        },
        timeout=10
    )

    return res.json()["content"][0]["text"]

# ------------------------
# Main entry
# ------------------------
def get_ai_recommendation(data):
    prompt = build_prompt(data)

    try:
        if PROVIDER == "openai":
            return call_openai(prompt)
        elif PROVIDER == "gemini":
            return call_gemini(prompt)
        elif PROVIDER == "claude":
            return call_claude(prompt)
        else:
            return "Invalid AI provider"
    except Exception as e:
        return f"AI Error: {str(e)}"