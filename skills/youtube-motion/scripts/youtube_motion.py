"""Portable checks, owner TTS, and HyperFrames project creation."""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

from common import SKILL_ROOT, data_dir, runtime_root, settings
from google_tts import find_key, synthesize

STYLE = ("Preserve the registered speaker vocal identity. Speak native Korean in a calm, friendly, "
         "trustworthy explanatory tone with clear articulation and stable sentence endings. "
         "Use a brisk conversational speaking pace, natural phrase groups, and brief pauses at "
         "complete thoughts. Calm does not mean slow. Read only the transcript exactly. "
         "No extra words, music, or effects.")


def voice_profile():
    value = json.loads(Path(settings()["private_profile_file"]).expanduser().read_text(encoding="utf-8"))
    if not isinstance(value.get("id"), str) or not value["id"].strip():
        raise ValueError("Private voice profile has no registered id.")
    return value["id"]


def doctor():
    config = settings()
    key, _, _ = find_key(config["key_env"])
    try:
        voice_profile()
        voice_ok = True
    except (OSError, ValueError):
        voice_ok = False
    node_ok = False
    if shutil.which("node"):
        try:
            node_ok = int(subprocess.check_output(["node", "--version"], text=True).strip().lstrip("v").split(".")[0]) >= 22
        except (ValueError, subprocess.SubprocessError):
            pass
    root = runtime_root()
    checks = {
        "python_3_10_or_newer": sys.version_info >= (3, 10),
        "node_22_or_newer": node_ok,
        "ffmpeg": bool(shutil.which("ffmpeg")),
        "ffprobe": bool(shutil.which("ffprobe")),
        "hyperframes_installed": (root / "node_modules/hyperframes/bin/hyperframes.mjs").is_file(),
        "gsap_installed": (root / "node_modules/gsap/dist/gsap.min.js").is_file(),
        "brand_assets": (SKILL_ROOT / "assets/character/reference-approved.png").is_file(),
        "google_key_present": bool(key),
        "owner_profile_present": voice_ok,
    }
    checks["visual_ready"] = all(v for k, v in checks.items() if k not in {"google_key_present", "owner_profile_present"})
    checks["owner_voice_ready_locally"] = checks["google_key_present"] and voice_ok
    print(json.dumps(checks, indent=2))
    return 0 if checks["visual_ready"] and checks["owner_voice_ready_locally"] else 2


def new_project(destination, vertical=False):
    destination = Path(destination).resolve()
    if destination.exists():
        raise ValueError("Choose a new project folder; existing projects are preserved.")
    vendor = runtime_root() / "node_modules/gsap/dist/gsap.min.js"
    if not vendor.is_file():
        raise ValueError("Run npm ci in the skill toolkit directory first.")
    # Finish preflight before creating the project.
    from fontTools.ttLib import TTFont
    destination.mkdir(parents=True)
    shutil.copytree(SKILL_ROOT / "assets/fonts", destination / "assets/fonts")
    shutil.copytree(SKILL_ROOT / "assets/icons", destination / "assets/icons")
    shutil.copytree(SKILL_ROOT / "assets/brand", destination / "assets/brand")
    (destination / "assets/vendor").mkdir(parents=True)
    shutil.copy2(vendor, destination / "assets/vendor/gsap.min.js")
    license_path = vendor.parents[1] / "LICENSE"
    if license_path.is_file():
        shutil.copy2(license_path, destination / "assets/vendor/GSAP-LICENSE.txt")
    font = TTFont(destination / "assets/fonts/GwangyangTouching.ttf")
    font.flavor = "woff2"
    font.save(destination / "assets/fonts/GwangyangTouching.woff2")
    font.close()
    source = (SKILL_ROOT / "templates/hyperframes/index.html").read_text(encoding="utf-8")
    source = source.replace("__WIDTH__", "1080" if vertical else "1920")
    source = source.replace("__HEIGHT__", "1920" if vertical else "1080")
    source = source.replace("__FORMAT__", "vertical" if vertical else "horizontal")
    if vertical:
        source = source.replace('class="connector" viewBox="0 0 210 110"', 'class="connector" viewBox="0 0 110 110"').replace('d="M5 55 H200"', 'd="M55 5 V100"')
    # Modular scene roots keep Studio editing and connector audits scoped correctly.
    css = re.search(r"<style>(.*?)</style>", source, re.S).group(1)
    scenes = re.findall(r'<section class="clip"[^>]*>(.*?)</section>', source, re.S)
    if len(scenes) != 3:
        raise ValueError("Unexpected starter template structure.")
    scripts = [
        """tl.fromTo('#phrase1',{y:150},{y:0,duration:.45,ease:'power3.out'},0);
tl.fromTo('#phrase2',{y:150},{y:0,duration:.48,ease:'power3.out'},.16);
draw('#mark',.9,.55);
tl.fromTo('#hook',{x:0,opacity:1},{x:-70,opacity:0,duration:.3,ease:'power2.in'},3.7);""",
        """tl.fromTo('#process',{x:80,opacity:0},{x:0,opacity:1,duration:.42,ease:'power3.out'},0);
tl.fromTo('#input',{scale:.85,opacity:0},{scale:1,opacity:1,duration:.4,ease:'power2.out'},.2);
tl.fromTo('#document',{x:30,opacity:0},{x:0,opacity:1,duration:.38,ease:'power2.out'},.8);
draw('#line1',1.3,.45);
tl.fromTo('#result',{scale:.88,opacity:0},{scale:1,opacity:1,duration:.45,ease:'power3.out'},1.7);
draw('#line2',2.3,.45);""",
        """tl.fromTo('#understand',{x:-100,opacity:0},{x:0,opacity:1,duration:.5,ease:'power3.out'},0);
tl.fromTo('#use',{x:100,opacity:0},{x:0,opacity:1,duration:.5,ease:'power3.out'},.45);
tl.fromTo('#closing',{opacity:0},{opacity:1,duration:.3,ease:'sine.out'},1.2);"""
    ]
    width, height = (1080, 1920) if vertical else (1920, 1080)
    layout = "vertical" if vertical else "horizontal"
    comps = destination / "compositions"
    comps.mkdir()
    hosts = []
    for index, (scene, script) in enumerate(zip(scenes, scripts)):
        name = f"scene-{index + 1}"
        scene_css = css.replace("#main{", "#root{")
        scene_css = (scene_css.replace(".vertical ", "") if vertical
                     else re.sub(r"\.vertical[^{}]*\{[^{}]*\}", "", scene_css))
        draw = "function draw(selector,start,duration){const path=root.querySelector(selector),n=path.getTotalLength();path.style.strokeDasharray=n;tl.fromTo(path,{strokeDashoffset:n,opacity:0},{strokeDashoffset:0,opacity:1,duration,ease:'power2.inOut'},start)}"
        page = (f'<template><div id="root" data-composition-id="{name}" data-width="{width}" data-height="{height}" data-duration="4">'
                f'<style>{scene_css}</style>{scene}<script>(function(){{const root=document.getElementById("{name}");const tl=gsap.timeline({{paused:true}});'
                + draw + script + f'window.__timelines["{name}"]=tl;}})();</script></div></template>')
        (comps / f"{name}.html").write_text(page, encoding="utf-8")
        hosts.append(f'<div id="{name}" class="clip" data-composition-id="{name}" data-composition-src="compositions/{name}.html" data-start="{index * 4}" data-duration="4" data-track-index="{index}"></div>')
    page = (f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>오늘AI 설치 확인</title><script src="assets/vendor/gsap.min.js"></script><style>{css}</style></head><body>'
            f'<div id="main" class="{layout}" data-composition-id="main" data-width="{width}" data-height="{height}" data-duration="12" data-fps="30">'
            + ''.join(hosts) + '<div class="brand">오늘AI</div><div class="note">설치 확인용 무음 시안 · 실제 제품 시연 아님</div></div>'
            '<script>const tl=gsap.timeline({paused:true});window.__timelines.main=tl;</script></body></html>')
    (destination / "index.html").write_text(page, encoding="utf-8")
    (destination / "AGENTS.md").write_text(
        "# 오늘AI 영상\n\nUse the youtube-motion skill. This 12-second silent composition is a technical starter, "
        "not a completed episode or the approved redesign. Add approved narration, source-grounded content, "
        "semantic subtitles, and result-specific illustrations before delivery. Preserve brand HEX values.\n",
        encoding="utf-8")
    print(json.dumps({"project": str(destination), "duration_seconds": 12, "audio": False}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="action", required=True)
    sub.add_parser("doctor")
    speak = sub.add_parser("speak")
    speak.add_argument("--text-file", type=Path, required=True)
    speak.add_argument("--output", type=Path, required=True)
    new = sub.add_parser("new")
    new.add_argument("destination", type=Path)
    new.add_argument("--format", choices=["long", "short"], default="long")
    hf = sub.add_parser("hf")
    hf.add_argument("project", type=Path)
    hf.add_argument("arguments", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    try:
        if args.action == "doctor":
            return doctor()
        if args.action == "new":
            new_project(args.destination, args.format == "short")
        elif args.action == "speak":
            config = settings()
            voice = voice_profile()  # Never substitute a stock voice silently.
            result = synthesize(args.text_file.read_text(encoding="utf-8-sig"), voice,
                                config["model"], STYLE, args.output, config["key_env"])
            print(json.dumps(result, ensure_ascii=False))
        elif args.action == "hf":
            cli = runtime_root() / "node_modules/hyperframes/bin/hyperframes.mjs"
            if not cli.is_file():
                raise ValueError("HyperFrames not installed; run npm ci in the toolkit directory.")
            arguments = args.arguments[1:] if args.arguments[:1] == ["--"] else args.arguments
            if not arguments:
                raise ValueError("Provide a HyperFrames command, for example check or render.")
            return subprocess.call(["node", str(cli), *arguments], cwd=args.project)
    except (ValueError, OSError, RuntimeError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
