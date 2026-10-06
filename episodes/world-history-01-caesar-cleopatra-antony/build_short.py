#!/usr/bin/env python3
"""Assemble the paper stop-motion history short.

Inputs (relative to cwd):
  frames/S{scene}_{k}.png   4 stills per scene (Higgsfield GPT Image 2.5)
  voice/{scene}.mp3         one ElevenLabs Korean take per scene
  font.ttf                  bold Korean display font (Black Han Sans)
Output: out/final.mp4 (1080x1920, 24 fps, AAC)

Each scene lasts LEAD + voice + TAIL. Frames are either cycled (rowers, ships:
true stop-motion loop) or stepped through once (story progression), and every
held drawing gets a small random offset/rotation so it reads as hand-placed
paper. Captions use the authored script text, timed across the detected speech
span of each take (proportional to syllable count).
"""
import json, random, subprocess
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 24
LEAD, TAIL, END_TAIL = 0.25, 0.35, 1.4
random.seed(11)

SCENES = [  # (id, mode, hold, zoom, text)
    (1, "progress", 3, 0.05, "플루타르코스에 따르면 기원전 48년, 클레오파트라는 침구 자루 속에 숨어 카이사르를 찾아갔습니다."),
    (2, "progress", 3, 0.05, "둘은 동맹을 맺었고 아들 카이사리온이 태어났죠. 하지만 기원전 44년, 카이사르는 로마에서 암살당합니다."),
    (3, "cycle", 3, 0.04, "기원전 41년 타르수스, 그녀는 황금빛 배를 타고 안토니우스 앞에 나타났고, 둘은 동맹이자 연인이 되어 아이들까지 낳습니다."),
    (4, "pingpong", 4, 0.06, "하지만 기원전 31년 악티움 해전에서, 두 사람은 옥타비아누스에게 참패합니다."),
    (5, "progress", 3, 0.05, "이듬해 안토니우스가 스스로 목숨을 끊고, 클레오파트라도 뒤따릅니다. 독사에 물렸다는 이야기는 전승일 뿐, 확실하지 않습니다."),
    (6, "progress", 3, 0.04, "그렇게 약 삼백 년 프톨레마이오스 왕조가 끝났습니다. 여러분은 그녀가 사랑을 택했다고 보나요, 이집트를 지키려 했다고 보나요?"),
]

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())

def speech_span(p):
    from faster_whisper import WhisperModel
    global _m
    try: _m
    except NameError: _m = WhisperModel("tiny", compute_type="int8")
    segs, _ = _m.transcribe(p, language="ko", vad_filter=True)
    segs = list(segs)
    return (segs[0].start, segs[-1].end) if segs else (0.0, dur(p))

def chunks(text, maxlen=13):
    out, cur = [], ""
    for w in text.split():
        if cur and len(cur) + 1 + len(w) > maxlen:
            out.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
        if w.endswith((".", "?")):
            out.append(cur); cur = ""
    if cur: out.append(cur)
    return out

def load(p):
    im = Image.open(p).convert("RGB")
    ow, oh = int(W * 1.1), int(H * 1.1)
    s = max(ow / im.width, oh / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - ow) // 2, (im.height - oh) // 2
    return im.crop((l, t, l + ow, t + oh))

font = ImageFont.truetype("font.ttf", 78)
tagfont = ImageFont.truetype("font.ttf", 44)

def caption(img, text):
    d = ImageDraw.Draw(img)
    tw = d.textlength(text, font=font)
    x, y = (W - tw) / 2, int(H * 0.70)
    pad = 26
    lab = Image.new("RGBA", (int(tw + 2 * pad), 78 + 2 * pad), (245, 197, 24, 255))
    ld = ImageDraw.Draw(lab)
    ld.text((pad, pad - 8), text, font=font, fill=(17, 17, 17))
    lab = lab.rotate(random.choice([-1.2, -0.6, 0.6, 1.0]), expand=True, resample=Image.BICUBIC)
    img.paste(lab, (int(x - pad), y), lab)

def tag(img):
    d = ImageDraw.Draw(img)
    txt = "세계사 시리즈 EP.1"
    tw = d.textlength(txt, font=tagfont)
    d.rectangle([60, 110, 60 + tw + 40, 110 + 72], fill=(17, 17, 17))
    d.text((80, 116), txt, font=tagfont, fill=(250, 246, 236))

timeline, audio_parts, t0 = [], [], 0.0
for i, (sid, mode, hold, zoom, text) in enumerate(SCENES):
    vp = f"voice/{sid}.mp3"
    vd = dur(vp)
    tail = END_TAIL if i == len(SCENES) - 1 else TAIL
    sd = LEAD + vd + tail
    a, b = speech_span(vp)
    cs = chunks(text)
    tot = sum(len(c.replace(" ", "")) for c in cs)
    cues, acc = [], LEAD + a
    for c in cs:
        L = (b - a) * len(c.replace(" ", "")) / tot
        cues.append((acc, acc + L, c)); acc += L
    timeline.append(dict(sid=sid, mode=mode, hold=hold, zoom=zoom, start=t0, dur=sd, cues=cues))
    audio_parts.append((vp, LEAD, tail))
    t0 += sd

json.dump(timeline, open("out/timeline.json", "w"), ensure_ascii=False, indent=1)

# audio: pad each take and concatenate
fl, ins = [], []
for j, (vp, lead, tail) in enumerate(audio_parts):
    ins += ["-i", vp]
    fl.append(f"[{j}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(lead*1000)}|{int(lead*1000)},apad=pad_dur={tail}[a{j}]")
fl.append("".join(f"[a{j}]" for j in range(len(audio_parts))) + f"concat=n={len(audio_parts)}:v=0:a=1,loudnorm=I=-16:TP=-1.5[aout]")
subprocess.check_call(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(fl), "-map", "[aout]", "out/voice.wav"])

ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-i", "out/voice.wav", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
                       "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "out/final.mp4"], stdin=subprocess.PIPE)
for sc in timeline:
    base = [load(f"frames/S{sc['sid']}_{k}.png") for k in range(1, 5)]
    n = round(sc["dur"] * FPS)
    order = [0, 1, 2, 3] + ([2, 1] if sc["mode"] == "pingpong" else [])
    cur = None
    for f in range(n):
        t = f / FPS
        if f % sc["hold"] == 0:
            if sc["mode"] == "progress":
                k = min(3, int(4 * t / sc["dur"]))
            else:
                k = order[(f // sc["hold"]) % len(order)]
            z = 1 + sc["zoom"] * (t / sc["dur"])
            im = base[k]
            im = im.resize((round(im.width * z), round(im.height * z)), Image.BICUBIC)
            im = im.rotate(random.uniform(-0.6, 0.6), resample=Image.BICUBIC,
                           translate=(random.uniform(-5, 5), random.uniform(-5, 5)))
            l, tp = (im.width - W) // 2, (im.height - H) // 2
            frame = im.crop((l, tp, l + W, tp + H))
            tag(frame)
            for (s, e, c) in sc["cues"]:
                if s <= t < e:
                    caption(frame, c); break
            cur = frame.tobytes()
        ff.stdin.write(cur)
ff.stdin.close(); ff.wait()
print("total", round(t0, 2), "s")
