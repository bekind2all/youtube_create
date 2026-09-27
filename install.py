"""Install the portable skill without overwriting an existing version silently."""
from datetime import datetime, timezone
import argparse
import json
import os
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "skills/youtube-motion"
sys.path.insert(0, str(SOURCE / "scripts"))
from common import data_dir, private_write


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skills-dir", type=Path, help="Default: CODEX_HOME/skills or ~/.codex/skills")
    parser.add_argument("--update", action="store_true", help="Back up and replace the installed skill")
    args = parser.parse_args()
    base = args.skills_dir or Path(os.environ.get("CODEX_HOME", str(Path.home() / ".codex"))) / "skills"
    base = base.expanduser().resolve()
    target = base / "youtube-motion"
    if target.is_symlink() or target.resolve().parent != base:
        raise SystemExit("Unsafe installation target: expected a direct non-symlink skill directory.")
    if target == SOURCE:
        raise SystemExit("Installation target is the source folder.")
    if target.exists():
        if not args.update:
            raise SystemExit("Skill already installed. Use --update to back it up and update.")
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        backup = data_dir() / "skill-backups" / stamp
        backup.parent.mkdir(parents=True, exist_ok=True)
        # Preserve original files before updating; do not recursively delete.
        shutil.move(str(target), str(backup))
    shutil.copytree(SOURCE, target, ignore=shutil.ignore_patterns("node_modules", "__pycache__", "*.pyc", ".hyperframes"))
    config_path = data_dir() / "settings.json"
    config = json.loads(config_path.read_text(encoding="utf-8")) if config_path.exists() else {}
    config["toolkit_root"] = str(SOURCE)
    config.setdefault("model", "gemini-3.8-flash-tts")
    config.setdefault("key_env", "Gemini API Key")
    config.setdefault("private_profile_file", str(data_dir() / "private/google-voice-profile.json"))
    private_write(config_path, json.dumps(config, ensure_ascii=False, indent=2).encode(), overwrite=config_path.exists())
    print("Installed:", target)
    print("Local settings:", config_path)
    print("Open a new Codex chat and invoke $youtube-motion.")


if __name__ == "__main__":
    main()
