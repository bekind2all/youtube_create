# 도구 검증 — HyperFrames vs Remotion, 그리고 당신 프로젝트의 check 오류

이 문서는 의견이 아니라 **이 세션의 리눅스 컨테이너에서 실제로 실행한 결과**다. 환경: Node v22.22.2, npm 12, ffmpeg 7.0.2-static, Playwright Chromium 1194(headless shell), 아웃바운드는 프록시(YouTube·Google Drive·GitHub 직접 다운로드·jsDelivr CDN 차단, npm 레지스트리 허용). 당신의 Windows 환경(`D:\Codex\영상관련\ai-news-video`)과는 다르므로 "여기서 됐다"가 "거기서 된다"를 보장하지는 않는다. 다만 도구 자체가 동작하는지, 어떤 조건이 필요한지는 확인됐다.

---

## 1. 결론 먼저

| 질문 | 답 |
|---|---|
| HyperFrames로 가능한가 | **가능.** v0.8.79 설치·`check`·`render` 모두 동작(10초 예제 → 1.1MB MP4, 10초 렌더). 단 (a) Chrome headless shell, (b) ffprobe, (c) 외부 CDN 의존 제거가 조건. |
| Remotion으로 가능한가 | **가능.** v4.0.529 스캐폴드 → 당신 design.md 토큰으로 3초 한국어 장면 렌더 성공(1920×1080, 30fps, H.264). 단 Chrome은 headless shell 지정 필요. |
| 어느 쪽을 쓸까 | **HyperFrames 유지.** 이유는 3절. 단, 05-4절의 check 오류를 먼저 고쳐야 한다. |
| 당신 프로젝트의 "Maximum call stack size exceeded" | 05-4절(재현·원인·패치). |

---

## 2. 실행 기록

### 2-1. HyperFrames 0.8.79

```
$ npx --yes hyperframes@0.8.79 --version   → 0.8.79
$ npx hyperframes@0.8.79 doctor
  ✓ FFmpeg 7.0.2-static
  ✗ FFprobe  — not found on PATH            ← (1)
  ✗ Chrome   — "Run: npx hyperframes browser ensure"  ← (2) 다운로드가 프록시에 막힘
  ✗ whisper-cpp / Kokoro / MusicGen — optional
```

(1) ffprobe: `npm i @ffprobe-installer/linux-x64`로 바이너리 확보 후 PATH 연결. Windows에서는 `winget install Gyan.FFmpeg`이 ffprobe를 같이 설치하므로 보통 문제 없음. `HYPERFRAMES_FFPROBE_PATH` 환경변수로 지정 가능(CLI 소스에서 확인: `HYPERFRAMES_BROWSER_PATH`, `HYPERFRAMES_FFMPEG_PATH`, `HYPERFRAMES_FFPROBE_PATH`, `PUPPETEER_EXECUTABLE_PATH`를 읽는다).

(2) Chrome: `HYPERFRAMES_BROWSER_PATH=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`로 지정하니 check/render 동작. 기본 경로는 `~/.cache/hyperframes/chrome/chrome-headless-shell/linux-152.0.7977.30/…`.

```
$ npx hyperframes@0.8.79 init warm --example warm-grain --non-interactive   → 성공(AGENTS.md, CLAUDE.md, compositions/, hyperframes.json, index.html …)
$ npx hyperframes@0.8.79 check
  Runtime ✗ request_failed: Failed to load npm/gsap@3.14.2/dist/gsap.min.js: net::ERR_TUNNEL_CONNECTION_FAILED
          ✗ page_error: gsap is not defined
          ✗ request_failed: patterns/natural-paper.png                   ← 예제 템플릿이 CDN에 의존
```

GSAP를 `npm i gsap@3.14.2` → `vendor/gsap.min.js`로 로컬화하고 외부 PNG 참조를 제거하자:

```
$ npx hyperframes@0.8.79 check
  Lint ◇ 0 errors / Runtime ◇ 0 errors / Layout ◇ 0 issues (9 samples) / Motion ◇ 0
  Contrast ✗ 4건 (예제 텍스트 대비 1.28~2.94:1 < 3:1)   ← 예제 자체의 문제, 렌더는 가능
$ npx hyperframes@0.8.79 render --quality looks --fps 30 --output out.mp4
  ◇ out.mp4  1.1 MB · 10.0s video · rendered in 10.0s (beginframe capture · software gpu · 300 frames)
$ ffprobe out.mp4 → h264 1920x1080, duration 10.000
```

**당신 프로젝트에의 의미:** 당신 build_video.py는 이미 GSAP를 `assets/vendor/gsap.min.js`로 로컬 참조하고 폰트도 로컬 woff2다. 이 설계는 옳다(렌더 결정성 + 오프라인). 예제 템플릿(warm-grain)을 가져다 쓸 때는 CDN 참조를 로컬로 바꿔야 한다.

### 2-2. Remotion 4.0.529

```
$ npx create-video@latest --yes --blank --no-tailwind demo   → 스캐폴드 성공(의존성은 별도 npm install 필요)
$ npm install                                                → 374 packages / 25s
$ npx remotion render Scene out/scene.mp4
  Error: Failed to launch the browser process! … "Old Headless mode has been removed from the Chrome binary. Please use … chrome-headless-shell"
$ npx remotion render Scene out/scene.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
  → out/scene.mp4  151 KB, 3.00s, h264 1920x1080 30fps   ← 성공
```

테스트 컴포지션은 당신 design.md 토큰(#F4F0E7/#222820/#AB411F/#536052, 100px 여백, 상단 chrome, hero 숫자 팝인(spring + blur), 진행 막대, 하단 자막 박스)을 React로 옮긴 것이다. 렌더 프레임(1.5초)에서 한국어("40% 저렴?", "여기서 40%는 월 구독료 할인이 아닙니다.")가 시스템 CJK 폰트로 정상 출력됐다. Pretendard를 쓰려면 `@remotion/fonts`의 `loadFont()`로 woff2를 로컬 로드하면 된다(remotion-best-practices 스킬 `rules/local-fonts.md`).

Windows에서는 Remotion이 Chrome Headless Shell을 자동 다운로드하므로 이 문제는 보통 없다. 프록시가 있는 회사망이면 `--browser-executable`로 우회.

---

## 3. 어느 쪽인가 — 당신 조건에서의 비교

| 기준 | HyperFrames 0.8.79 | Remotion 4.0.529 | 당신에게 |
|---|---|---|---|
| 저작 단위 | HTML 파일 1장 = 장면 1개, GSAP 타임라인 | React 컴포넌트 + `useCurrentFrame()` | 당신 build_video.py는 **Python이 HTML 문자열을 찍어내는 구조**라 HyperFrames와 맞다. Remotion으로 가면 Python 생성기를 TSX 생성기로 다시 써야 한다. |
| AI가 고치기 | 장면 HTML을 열어 CSS/GSAP 값만 고치면 됨(빌드 없음) | TSX 수정 후 번들 | 강사가 DAY3 `[50:41]`에서 HyperFrames를 고른 이유와 같다. |
| 검사 도구 | `check`(lint+runtime+layout+contrast), `snapshot`, `keyframes`, `timeline` | Studio(GUI) + 타입체크 | 페이스리스 자동화에서는 **CLI 검사가 있는 HyperFrames가 유리**. Remotion은 사람이 Studio를 봐야 한다. |
| 안정성 | 0.8.x, 릴리스 빈번, 예제가 CDN에 의존, Chrome/ffprobe 환경 민감 | 4.x, 성숙, 문서·커뮤니티 큼 | HyperFrames는 **버전 고정**(0.8.79, 당신 package.json에 이미 고정)이 필수. |
| 한국어 폰트 | 로컬 @font-face로 OK, 단 `font-family: inherit` 매핑 경고(05-4) | `@remotion/fonts` | 둘 다 로컬 woff2면 문제 없음. |
| 오디오 | `<audio data-start …>` 프레임워크가 재생·믹스 | `<Audio>` | 동등. |
| 세로/가로 두 버전 | 같은 HTML 생성기에서 CSS 값만 분기(당신 build_video.py의 `portrait` 분기) | 두 Composition 등록 | 동등. |
| 라이선스 | Apache 2.0 | Remotion License(개인/소기업 무료, 그 외 유료) | 유튜브 채널 1인 운영이면 둘 다 무료 범위. |
| 클라우드 렌더 | `hyperframes cloud`(HeyGen) / AWS Lambda | Remotion Lambda(성숙) | 지금은 로컬 렌더로 충분(롱폼 282초 = 8,476프레임, 예제 속도 기준 약 5분). |
| 포팅 | `/remotion-to-hyperframes` 스킬 있음 | 역방향 없음 | 나중에 Remotion으로 옮길 일은 없을 것. |

**판단:** 이미 HyperFrames로 파이프라인의 90%가 만들어져 있고, 남은 문제는 도구 선택이 아니라 **check 오류 1건과 폰트 매핑 경고**다. 도구를 바꾸면 그 90%를 버린다. HyperFrames를 유지하고 버전을 0.8.79에 고정한 채 4절의 패치를 적용하라. Remotion은 "HyperFrames가 특정 효과(예: 3D, Lottie 대량)를 못 할 때"의 대안으로만 남겨 둔다.

한 가지 단서: HyperFrames 0.8.x는 릴리스마다 lint 규칙과 런타임 검사가 바뀐다(당신 BRIEF.md의 "init이 exit 1"도 그 예). **업그레이드는 에피소드 사이에만, `check`를 다시 돌린 뒤에.**

---

## 4. 당신 프로젝트의 check 오류 재현과 원인

(이 절은 Drive의 `ai-news-video`를 이 컨테이너에 복원해 `tools/build_video.py`로 다시 빌드하고 `hyperframes check`를 돌린 결과다. 실제 음성 WAV는 내려받지 않고 같은 길이의 무음 WAV로 대체했다.)

### 4-1. 재현

Drive의 `tools/build_video.py`, `design.md`, `assets/fonts/*.woff2`, `assets/vendor/gsap.min.js`, `episodes/2026-09-22-opus-5-5/{episode,visuals}.json`, `captions/*.json`을 그대로 복원하고 음성은 같은 길이의 무음 WAV로 대체했다. 생성기는 한 줄도 고치지 않고 빌드했다.

```
$ python3 tools/build_video.py episodes/2026-09-22-opus-5-5
  longform 6장면 / 18페이즈 / 85자막, short-01~03 생성 (당신 build-report.json과 동일한 수치)
$ cd episodes/2026-09-22-opus-5-5/longform && npx hyperframes@0.8.79 check --json
  lint     ✓ 0 error / 1 warning  timeline_track_too_dense (scene-04.html, track 2에 timed 요소 4개)
  runtime  ✗ check_runtime_failure  "Maximum call stack size exceeded"  (index.html)     ← 당신이 본 오류 그대로
  stderr   [WARN] [Compiler] No deterministic font mapping for: inherit                 ← 당신이 본 경고 그대로
  exit 1
```

즉 **환경 문제가 아니라 재현 가능한 결정적 오류**다. 스택트레이스(`check-debug-stderr-before.txt`):

```
RangeError: Maximum call stack size exceeded
    at RegExpStringIterator.next (<anonymous>)
    at compositionRequiresWebGpu (hyperframes/dist/cli.js:67814)
    at openSettledCompositionPage (cli.js:131788)
    at runBrowserCheck (cli.js:167749)
```

### 4-2. 원인 (두 겹)

**겉 원인 — HyperFrames CLI의 정규식.** `check`는 index.html + 모든 sub-composition + gsap + 폰트(base64)를 **한 개의 HTML 문자열로 묶은 뒤**, 그 전체에 다음 정규식을 돌려 `data-requires-webgpu` 태그를 찾는다.

```js
function compositionRequiresWebGpu(html) {
  for (const [tag] of html.matchAll(/<(?:[^<>"']|"[^"]*"|'[^']*')*>/g)) { … }
}
```

인라인된 `gsap.min.js` 안에 `<"===a?u._start:` 같은 코드가 있어(번들 오프셋 약 13,600자) `<` 뒤의 따옴표 짝이 어긋나고, 이후 문서 전체가 "따옴표 안"으로 흡수되어 매치 한 번이 문서 끝까지 이어진다. V8의 정규식 백트랙 스택은 실측으로 약 600만~900만 자 사이에서 넘친다. 번들이 그보다 작으면 통과하고, 크면 이 오류가 난다. 이것은 HyperFrames 0.8.79의 버그이며, 업스트림에 보고할 가치가 있다(당신 프로젝트가 아니어도 폰트를 많이 인라인하는 프로젝트면 누구나 겪는다).

**속 원인 — 당신 build_video.py의 정규식 한 글자.** 번들이 17.3 MB가 된 이유다.

```python
# tools/build_video.py  sub_css()
s = re.sub(r"@font-face\\{[^}]+\\}", "", s)     # ← raw string 안의 \\{ 는 "백슬래시 + {"를 찾는다 → 절대 매치 안 됨
```

의도는 "sub-composition에서는 @font-face를 빼고 index.html의 폰트를 상속(`font-family: inherit`)"인데, 정규식이 한 번도 매치되지 않아 **7개 sub-composition(scene-01~06 + captions-layer) 전부에 @font-face 2개가 남았다.** 컴파일러는 파일마다 Pretendard Regular·ExtraBold(각 약 770 KB → base64 약 1 MB)를 인라인해 폰트 URI가 16개, 번들 17.3 MB가 됐다. 실측: 오류 시 번들 17,333,163자, 수정 후 2,777,011자.

`python3 -c 'import re; print(re.sub(r"@font-face\\{[^}]+\\}", "", "@font-face{x:y} body{}"))'` → `@font-face{x:y} body{}` (그대로). 이 한 줄이 증거다.

### 4-3. 최소 패치

```diff
--- tools/build_video.py
+++ tools/build_video.py
@@ def sub_css(w,h,portrait):
-    s=re.sub(r"@font-face\\{[^}]+\\}", "", s)
+    s=re.sub(r"@font-face\{[^}]+\}", "", s)
```

한 글자씩 두 곳. 그 외 아무것도 바꾸지 않는다.

### 4-4. 패치 후 결과

```
$ python3 tools/build_video.py episodes/2026-09-22-opus-5-5 && cd episodes/…/longform
$ npx hyperframes@0.8.79 check --json
  ok: true, exit 0
  lint     0 error / 1 warning (timeline_track_too_dense, 아래)
  runtime  0 error
  layout   0 issue  (duration 282.52, 9 samples)
  contrast 65 checked / 65 passed
$ npx hyperframes@0.8.79 render --quality looks --fps 30 --output final.mp4
  final.mp4  7,398,425 B · h264 1920×1080 30fps + aac · 282.53 s · 렌더 5분 47초 (4코어, software GPU)
$ (short-01) check ok:true, warning 0 → final.mp4 1,023,022 B · 1080×1920 · 42.47 s · 56초
```

스냅샷 5장(`snapshots/frame-00-at-1.8s.png` 등)과 렌더 프레임에서 Pretendard 400/800이 정상 출력됐다(sub-composition은 index의 @font-face를 상속한다). 즉 **당신 파이프라인은 이 한 줄만 고치면 longform·shorts 모두 check 통과·렌더 완료**다.

### 4-5. 남는 경고 두 개와 처리

| 경고 | 뜻 | 처리 |
|---|---|---|
| `[Compiler] No deterministic font mapping for: inherit` | 컴파일러의 폰트 로컬라이저가 CSS 키워드 `inherit`를 폰트 이름으로 오인한 것. 렌더 결과에 영향 없음 | **그대로 둔다.** 대안으로 sub-composition에 `font-family: Pretendard`를 명시해 봤더니(short-01 사본으로 실측) lint **error** `font_family_without_font_face`가 파일마다 나서 check가 실패한다. 즉 지금의 `inherit` 방식이 0.8.79에서는 맞다. 이 문서 5절의 2번 제안은 그래서 철회한다 |
| `timeline_track_too_dense` (scene-04) | 한 HTML에서 같은 `data-track-index`에 timed 요소가 3개를 넘으면 경고(상한 3). 렌더에 영향 없음, Studio 표시용 | 무시해도 된다. 없애려면 phase마다 `data-track-index`를 2,3,4,5로 달리 주거나 phase가 4개 이상인 장면을 두 HTML로 나눈다 |

### 4-6. 같은 오류가 다시 날 조건

- 폰트를 더 추가(손글씨체 등)하면 index.html의 인라인 폰트만으로도 번들이 커진다. 폰트 3종 이상이면 `pyftsubset`으로 한글 서브셋(KS X 1001 2,350자 + 필요한 기호)을 만들어 woff2를 200~300 KB로 줄여라. 04 문서의 손글씨체 도입 전에 반드시.
- 큰 이미지를 data URI로 넣어도 같은 한계에 걸린다. 04 문서가 "생성 PNG가 아니라 SVG 부품"을 권하는 이유 중 하나다.
- HyperFrames를 올리면 정규식이 고쳐졌을 수도, 다른 검사가 추가됐을 수도 있다. **에피소드 사이에만 올리고 check를 다시 돌린다.**

### 4-7. build_video.py에서 같이 본 사소한 것 (오류 아님)

- `window.__timelines["scene-01"]=tl` 앞에 `window.__timelines = window.__timelines || {}` 초기화가 없다. HyperFrames 런타임이 먼저 만들어 주므로 지금은 동작하지만, 브라우저에서 HTML 단독으로 열면 죽는다. 한 줄 추가 권장.
- `data-duration="51.47999999999999"` 같은 부동소수 문자열이 생긴다. `round(x, 3)`으로.
- sub-composition을 `<!doctype html><html>…<template>…` 전체 문서로 만든다. 0.8.79 런타임은 첫 `<template>`를 찾아 동작하지만 공식 가이드는 `<template>` 조각만 권한다. 당장 바꿀 필요는 없다.
- `render-template/…/number-pop-in` 폴더의 Google Docs 변환본은 내용이 "5.7k"뿐이라 Drive에서 손상된 상태다. 생성 프로젝트는 이 컴포넌트를 참조하지 않아 영향은 없지만, 원본을 다시 올려 두는 게 좋다.

---

## 5. build_video.py에 대한 추가 제안 (오류와 별개)

1. **버전 파일명**: `final.mp4` → `renders/final_v{NNN}.mp4`, `compositions/scene-XX.html`은 덮어써도 되지만 build-report.json에 빌드 번호와 git 커밋을 남긴다(DAY2 `[47:37]` 덮어쓰기 사고 방지).
2. ~~폰트 경고 제거: `font-family:inherit` 대신 `Pretendard` 명시~~ → **철회.** 4-5절에서 실측한 대로 명시하면 lint error가 난다. 경고는 무해하니 둔다.
3. **statement 남용 방지**: visuals.json 작성 규칙에 "phase 길이 30초 초과 시 분할" — 코드 변경 없이 design.md 문장으로.
4. **일러스트 슬롯**: 06 문서 4단계의 `illustration` 필드를 `content()`에 추가(선택적). 없으면 현재와 동일하게 동작해야 한다.
5. **check를 빌드 스크립트에 통합**: build 후 자동으로 `npx hyperframes check --timeout 45000`을 각 프로젝트에서 실행하고 결과를 build-report.json에 기록. 지금은 STORYBOARD의 `built_pending_checks`가 사람 손으로 바뀌어야 한다.
