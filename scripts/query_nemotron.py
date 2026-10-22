import os
import sys
import json
import urllib.request
import urllib.error

# Ensure stdout handles UTF-8 properly on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

OPENROUTER_API_KEY = os.environ.get(
    "OPENROUTER_API_KEY",
    ""
)
OPENROUTER_API_URL = os.environ.get(
    "OPENROUTER_API_URL",
    "https://openrouter.ai/api/v1/chat/completions"
)
DEFAULT_MODEL = os.environ.get(
    "NEMOTRON_MODEL",
    "nvidia/nemotron-3.5-lightning"
)

def query_nemotron(prompt: str, system_prompt: str = None, model: str = None, stream: bool = True) -> str:
    """
    Send a prompt to NVIDIA Nemotron 3.5 via OpenRouter with streaming or standard response.
    """
    selected_model = model or DEFAULT_MODEL
    sys_content = system_prompt or (
        "You are NVIDIA Nemotron 3.5, an advanced AI reasoning and software engineering model. "
        "Collaborate closely with Antigravity and VOG Tekstil engineers. "
        "Be precise, concise, and provide production-ready solutions, architectural reviews, and high-quality code. "
        "Answer in the user's language (Turkish or English)."
    )

    payload = {
        "model": selected_model,
        "messages": [
            {"role": "system", "content": sys_content},
            {"role": "user", "content": prompt}
        ],
        "stream": stream
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vogsystem.com",
        "X-Title": "VOG System Antigravity - NVIDIA Nemotron 3.5"
    }

    req = urllib.request.Request(
        OPENROUTER_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers
    )

    try:
        if not stream:
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode("utf-8"))
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                return content

        full_content = []
        with urllib.request.urlopen(req, timeout=120) as response:
            for line in response:
                line = line.decode("utf-8").strip()
                if not line or line.startswith(":"):
                    continue
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            print(content, end="", flush=True)
                            full_content.append(content)
                    except json.JSONDecodeError:
                        continue
        print()
        return "".join(full_content)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"[!] OpenRouter HTTP Error {e.code}: {error_body}", file=sys.stderr)
        return ""
    except urllib.error.URLError as e:
        print(f"[!] OpenRouter connection error: {e.reason}", file=sys.stderr)
        return ""
    except Exception as e:
        print(f"[!] Unexpected error querying Nemotron: {e}", file=sys.stderr)
        return ""

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_prompt = " ".join(sys.argv[1:])
    else:
        user_prompt = "Merhaba! Nvidia Nemotron 3.5 olarak VOG Tekstil sistem mimarisine hoş geldin. Antigravity ile nasıl birlikte çalışacağını kısaca özetle."
    query_nemotron(user_prompt)
