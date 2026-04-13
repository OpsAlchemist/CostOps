import os
import requests
PROVIDER = os.getenv("AI_PROVIDER", "openai")
def build_prompt(data):
    return f"""
    Compare cloud costs:
    AWS: {data['aws']}
    Azure: {data['azure']}
    GCP: {data['gcp']}
    Provide:
    1. Cheapest option
    2. When to use each cloud
    3. Cost optimization tips
    """
# ------------------------
# OpenAI
# ------------------------
def call_openai(prompt):
    api_key = os.getenv("OPENAI_API_KEY")
    res = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    return res.json()["choices"][0]["message"]["content"]
# ------------------------
# Gemini
# ------------------------
def call_gemini(prompt):
    api_key = os.getenv("GEMINI_API_KEY")
    res = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}",
        json={
            "contents": [{"parts": [{"text": prompt}]}]
        }
    )
    return res.json()["candidates"][0]["content"]["parts"][0]["text"]
# ------------------------
# Claude
# ------------------------
def call_claude(prompt):
    api_key = os.getenv("CLAUDE_API_KEY")
    res = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        },
        json={
            "model": "claude-3-haiku-20240307",
            "max_tokens": 300,
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    return res.json()["content"][0]["text"]
# ------------------------
# AWS Bedrock (Stub)
# ------------------------
def call_bedrock(prompt):
    return "AWS Bedrock integration coming soon..."
# ------------------------
# Main entry
# ------------------------
def get_ai_recommendation(data):
    prompt = build_prompt(data)
    if PROVIDER == "openai":
        return call_openai(prompt)
    elif PROVIDER == "gemini":
        return call_gemini(prompt)
    elif PROVIDER == "claude":
        return call_claude(prompt)
    elif PROVIDER == "bedrock":
        return call_bedrock(prompt)
    else:
        return "Invalid AI provider"