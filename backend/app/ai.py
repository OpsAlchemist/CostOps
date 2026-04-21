import os
import requests

# Read provider from ENV (injected via GitHub Actions / Docker / ECS)
# Supported: "gemini", "nova"
PROVIDER = os.getenv("AI_PROVIDER", "gemini")

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
# Google Gemini
# ------------------------
def call_gemini(prompt):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return "Missing GEMINI_API_KEY"

    res = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": prompt}]}]
        },
        timeout=15
    )

    data = res.json()
    if "error" in data:
        return f"Gemini Error: {data['error'].get('message', str(data['error']))}"
    return data["candidates"][0]["content"]["parts"][0]["text"]

# ------------------------
# Amazon Nova
# ------------------------
def call_nova(prompt):
    api_key = os.getenv("NOVA_API_KEY")

    if not api_key:
        return "Missing NOVA_API_KEY"

    res = requests.post(
        "https://api.nova.amazon.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "nova-2-lite-v1",
            "messages": [
                {"role": "system", "content": "You are a cloud cost optimization expert."},
                {"role": "user", "content": prompt}
            ],
            "stream": False
        },
        timeout=15
    )

    data = res.json()
    if "error" in data:
        return f"Nova Error: {data['error'].get('message', str(data['error']))}"
    return data["choices"][0]["message"]["content"]

# ------------------------
# Main entry
# ------------------------
def call_ai(prompt):
    """Generic AI call - returns raw text response."""
    try:
        if PROVIDER == "gemini":
            return call_gemini(prompt)
        elif PROVIDER == "nova":
            return call_nova(prompt)
        else:
            return f"Error: Invalid AI provider: {PROVIDER}"
    except Exception as e:
        return f"AI Error: {str(e)}"


def get_ai_recommendation(data):
    prompt = build_prompt(data)
    return call_ai(prompt)
