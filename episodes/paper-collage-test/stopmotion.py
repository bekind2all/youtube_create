#!/usr/bin/env python3
"""Paper stop-motion loop builder.

Cycles N still frames in order (1,2,...,N,1,2,...) at a "on twos/threes"
cadence, adding a small random jitter + rotation per held frame so it feels
like hand-placed paper cut-outs shot on a rostrum camera.

usage: stopmotion.py OUT.mp4 --duration 6 [--hold 2] [--fps 24] [--w 1080 --h 1920]
                     [--jitter 6] [--rot 0.8] [--pingpong] frame1.png frame2.png ...
"""
import argparse, random, subprocess
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("frames", nargs="+")
ap.add_argument("--duration", type=float, default=6.0)
ap.add_argument("--fps", type=int, default=24)
ap.add_argument("--hold", type=int, default=2, help="video frames per drawing (2 = 12 drawings/s)")
ap.add_argument("--w", type=int, default=1080)
ap.add_argument("--h", type=int, default=1920)
ap.add_argument("--jitter", type=float, default=6.0, help="max px offset per drawing")
ap.add_argument("--rot", type=float, default=0.8, help="max degrees rotation per drawing")
ap.add_argument("--zoom", type=float, default=0.0, help="total slow push-in over the clip, e.g. 0.06")
ap.add_argument("--pingpong", action="store_true", help="1..N..2 instead of 1..N")
ap.add_argument("--seed", type=int, default=7)
a = ap.parse_args()

random.seed(a.seed)
over = 1.08  # overscan so jitter/rotation never shows an edge
base = []
for p in a.frames:
    im = Image.open(p).convert("RGB")
    W, H = int(a.w * over), int(a.h * over)
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    base.append(im.crop((l, t, l + W, t + H)))

order = list(range(len(base)))
if a.pingpong and len(base) > 2:
    order += list(range(len(base) - 2, 0, -1))

total = round(a.duration * a.fps)
cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
       "-s", f"{a.w}x{a.h}", "-r", str(a.fps), "-i", "-",
       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", a.out]
ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
cur = None
for i in range(total):
    if i % a.hold == 0:
        k = order[(i // a.hold) % len(order)]
        dx, dy = random.uniform(-a.jitter, a.jitter), random.uniform(-a.jitter, a.jitter)
        ang = random.uniform(-a.rot, a.rot)
        z = 1 + a.zoom * (i / max(1, total - 1))
        im = base[k]
        if z != 1:
            im = im.resize((round(im.width * z), round(im.height * z)), Image.BICUBIC)
        im = im.rotate(ang, resample=Image.BICUBIC, translate=(dx, dy))
        l, t = (im.width - a.w) // 2, (im.height - a.h) // 2
        cur = im.crop((l, t, l + a.w, t + a.h)).tobytes()
    ff.stdin.write(cur)
ff.stdin.close()
ff.wait()
print("wrote", a.out, total, "frames")
