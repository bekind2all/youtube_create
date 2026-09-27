"""Google Gemini TTS. Reads keys locally; never writes credentials or prints them."""
from __future__ import annotations
import argparse, base64, hashlib, io, json, os, re, sys, wave
from pathlib import Path
from urllib import request, error

ROOT = Path(__file__).resolve().parents[1]
API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models/"
DEFAULT_STYLE = 'You are a calm, kind, trustworthy adult Korean woman explaining helpful AI information to one adult listener. Speak native Korean with a warm natural conversational tone and a comfortable mid-to-low female register. Gently confident and reassuring, clear but never stern. Use a measured moderate pace, unhurried natural phrase grouping, soft stable sentence endings, and short natural pauses between paragraphs. Avoid high-pitched excitement, breathy ASMR, exaggerated advertising delivery, theatrical performance or a stiff announcer cadence. Pronounce every Korean word clearly. Read only the given transcript; add no words, music, sounds or introductions.'


def find_key(extra_name=None):
    names = list(dict.fromkeys([extra_name, "GEMINI_API_KEY", "GOOGLE_API_KEY", "Gemini API Key"]))
    names = [n for n in names if n]
    for name in names:
        if os.environ.get(name, "").strip():
            return os.environ[name].strip(), "process", name
    if sys.platform == "win32":
        import winreg
        for scope, hive, location in [
            ("user", winreg.HKEY_CURRENT_USER, r"Environment"),
            ("machine", winreg.HKEY_LOCAL_MACHINE,
             r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment"),
        ]:
            try:
                with winreg.OpenKey(hive, location) as handle:
                    for name in names:
                        try:
                            value, _ = winreg.QueryValueEx(handle, name)
                            if isinstance(value, str) and value.strip():
                                return value.strip(), scope, name
                        except FileNotFoundError:
                            pass
            except OSError:
                pass
    return None, None, None

def make_body(text, voice, model, style):
    if model.startswith("gemini-3.8-"):
        return {
            "contents": [{"role": "user", "parts": [{
                "text": text, "speech_metadata": {"style": style}}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                "speechConfig": {"voiceConfig": {"voice": voice}}},
        }
    return {
        "contents": [{"role": "user", "parts": [{"text": style + "\n\n" + text}]}],
        "generationConfig": {"responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}},
    }

def as_wav(data, mime):
    if data.startswith(b"RIFF") and data[8:12] == b"WAVE":
        with wave.open(io.BytesIO(data), "rb") as f:
            if f.getnframes() == 0:
                raise ValueError("Empty WAV audio")
        return data
    if "pcm" not in mime.lower() and "l16" not in mime.lower():
        raise ValueError("Unsupported audio encoding: " + mime.split(";")[0])
    match = re.search(r"rate=(\d+)", mime)
    rate = int(match.group(1)) if match else 24000
    out = io.BytesIO()
    with wave.open(out, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(rate)
        f.writeframes(data)
    return out.getvalue()

def synthesize(text, voice, model, style, output, extra_name=None):
    if not re.fullmatch(r"[a-zA-Z0-9._-]+", model):
        raise ValueError("Invalid model name")
    if not text.strip():
        raise ValueError("Empty transcript")
    body = make_body(text, voice, model, style)
    fingerprint = hashlib.sha256(
        json.dumps(body, ensure_ascii=False, sort_keys=True).encode() + model.encode()
    ).hexdigest()
    meta_path = output.with_suffix(".json")
    if output.exists() and meta_path.exists():
        old = json.loads(meta_path.read_text(encoding="utf-8"))
        if old.get("request_sha256") == fingerprint and old.get("audio_sha256") == hashlib.sha256(output.read_bytes()).hexdigest():
            return {"cached": True, "file": str(output), "duration_seconds": old["duration_seconds"]}
    key, scope, name = find_key(extra_name)
    if not key:
        raise RuntimeError("Google API key not found in process or Windows user/system environment. Set GEMINI_API_KEY or supply --key-env NAME.")
    req = request.Request(
        API_ROOT + model + ":generateContent",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=180) as response:
            payload = json.load(response)
    except error.HTTPError as exc:
        # Provider error bodies can contain request details. Do not log them.
        hints = {400: "request format/model/voice", 401: "authentication", 403: "key permissions",
                 404: "model availability", 429: "quota or rate limit"}
        raise RuntimeError(f"Google TTS HTTP {exc.code}; check {hints.get(exc.code, 'provider status')}. No automatic paid retry.") from None
    except error.URLError:
        raise RuntimeError("Google TTS network request failed. No automatic retry.") from None
    parts = []
    for candidate in payload.get("candidates", [])[:1]:
        parts.extend(candidate.get("content", {}).get("parts", []))
    audio_parts = [p.get("inlineData", p.get("inline_data", {})) for p in parts
                   if "inlineData" in p or "inline_data" in p]
    if len(audio_parts) != 1:
        raise RuntimeError(f"Expected one audio result, received {len(audio_parts)}. Inspect provider response privately.")
    encoded = audio_parts[0]
    data = as_wav(base64.b64decode(encoded["data"], validate=True),
                  encoded.get("mimeType", encoded.get("mime_type", "")))
    with wave.open(io.BytesIO(data), "rb") as f:
        duration = f.getnframes() / f.getframerate()
    output.parent.mkdir(parents=True, exist_ok=True)
    pending = output.with_suffix(".pending")
    pending.write_bytes(data)
    pending.replace(output)
    metadata = {
        "provider": "google", "model": model, "voice_identifier_recorded": False, "style": style,
        "transcript": text, "duration_seconds": round(duration, 3),
        "request_sha256": fingerprint, "audio_sha256": hashlib.sha256(data).hexdigest(),
        "review_status": "pending_user_listening",
    }
    meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"cached": False, "file": str(output), "duration_seconds": round(duration, 3)}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--doctor", action="store_true")
    p.add_argument("--text-file", type=Path)
    p.add_argument("--output", type=Path)
    p.add_argument("--voice")
    p.add_argument("--model", default="gemini-3.8-flash-tts")
    p.add_argument("--style", default=DEFAULT_STYLE)
    p.add_argument("--key-env")
    a = p.parse_args()
    if a.doctor:
        key, scope, name = find_key(a.key_env)
        print(json.dumps({"google_key_available": bool(key), "scope": scope, "variable": name}, ensure_ascii=False))
        return 0 if key else 2
    if not a.text_file or not a.output:
        p.error("--text-file and --output are required for synthesis")
    if not a.voice:
        p.error("Use youtube_motion.py speak for the registered owner profile; no default voice substitution.")
    result = synthesize(a.text_file.read_text(encoding="utf-8-sig"), a.voice,
                        a.model, a.style, a.output, a.key_env)
    print(json.dumps(result, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, ValueError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
