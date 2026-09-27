"""Paths and local configuration. No private values are printed."""
from pathlib import Path
import json
import os

SKILL_ROOT = Path(__file__).resolve().parents[1]


def data_dir():
    override = os.environ.get("YOUTUBE_MOTION_HOME")
    return Path(override).expanduser().resolve() if override else Path.home() / ".config" / "youtube-motion"


def settings():
    result = {"model": "gemini-3.8-flash-tts", "key_env": "Gemini API Key"}
    path = data_dir() / "settings.json"
    if path.is_file():
        result.update(json.loads(path.read_text(encoding="utf-8")))
    result.setdefault("private_profile_file", str(data_dir() / "private" / "google-voice-profile.json"))
    return result


def runtime_root():
    path = Path(settings().get("toolkit_root", SKILL_ROOT)).expanduser()
    return path if path.is_dir() else SKILL_ROOT


def private_write(path, data, overwrite=False):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    flags = os.O_WRONLY | os.O_CREAT | (os.O_TRUNC if overwrite else os.O_EXCL)
    with os.fdopen(os.open(path, flags, 0o600), "wb") as handle:
        handle.write(data)
