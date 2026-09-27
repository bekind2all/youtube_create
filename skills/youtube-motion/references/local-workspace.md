# 이동 가능한 자산과 실행 도구

## 경로 규칙

이 문서의 `assets/`, `scripts/`, `templates/`는 **이 스킬 폴더 기준**이다. `cwd`나 D 드라이브를 가정하지 않는다. 설정은 기본 `~/.config/youtube-motion/settings.json`이며 `YOUTUBE_MOTION_HOME`으로 변경할 수 있다. 설치 도구가 현재 PC의 저장소 위치를 `toolkit_root`에 기록한다. 저장소를 옮기면 설치 도구를 다시 실행한다.

로컬 설정의 선택 항목 `active_episode_dir`는 마지막으로 작업한 에피소드 폴더다. 기존 영상 이어하기에 사용하며, 새 제작의 주제를 대신하지 않는다. 폴더의 `production-status.json`에서 `revision`, `production_script`, `timeline`, `review_document`, `artifacts`, `render_projects` 등 존재하는 최신 포인터를 읽는다. 원고와 화면의 참고 버전이 다를 수 있으므로 스타일 기준 시안 V2·V3를 최신 원고로 오인하지 않는다. 새 PC에서는 해당 에피소드 파일도 옮겨야 이전 영상 자체를 수정할 수 있다. 현재 PC의 경로를 공개 스킬에 고정하지 않는다.

## 함께 제공하는 자산

| 자료 | 위치 |
| --- | --- |
| 기본 브랜드·팔레트·폰트 역할 | `assets/brand/brand.json` |
| 선택 가능한 팔레트 01~04 | `assets/brand/palettes.json`, `assets/palettes/` |
| 승인된 롱폼 쉼·숏폼 리듬 | `assets/brand/narration-rhythm.json` |
| 선과 아이콘의 토큰 | `assets/brand/components.json` |
| 폰트·출처·라이선스 | `assets/fonts/` |
| 승인 캐릭터 | `assets/character/reference-approved.png` |
| 참고 포즈·캐릭터 정의 | `assets/character/character.json`, 같은 폴더의 PNG |
| 디자인·무드·캐릭터 보드 | `assets/boards/` |
| SVG 아이콘·밑줄·화살표·동그라미 | `assets/icons/` |
| 부분별로 움직이는 설명 일러스트 4종 | `assets/illustrations/`, 사용법은 `references/motion-direction.md` |
| 글자 폭·선 끝 여백을 맞추는 보조 함수 | `assets/motion/fit-text-underlines.js`, 적용 조건은 `references/precision-checks.md` |
| 자산 체크섬 | `assets/manifest.json` |

보드는 이전 시안이다. 최신 `motion-direction.md`의 다양한 구성·설명하는 움직임 기준을 함께 적용한다. 승인된 캐릭터의 정체성과 파생 포즈·모션의 최종 승인을 구분한다.

## 실행 도구

Python 3.10+, Node.js 22+, FFmpeg/FFprobe가 필요하다. `requirements.txt`와 `package-lock.json`으로 의존성을 설치한다. 저장소 루트 README에 운영체제 공통 설치 명령이 있다.

- `scripts/youtube_motion.py doctor`: 경로·도구·키 존재·음성 프로필 형식 진단. 비밀 값 출력이나 유료 API 호출 없음.
- `scripts/youtube_motion.py speak --text-file ... --output ...`: 등록된 본인 음성으로 Google TTS 호출. 다른 목소리로 자동 대체하지 않음.
- `scripts/youtube_motion.py new <새폴더> --format long|short`: 로컬 폰트·SVG·GSAP가 연결된 HyperFrames 시작 프로젝트. 기존 폴더 덮어쓰지 않음.
- `scripts/youtube_motion.py hf <프로젝트> check|snapshot|render ...`: 고정된 HyperFrames 버전으로 도구 실행.
- `scripts/private_bundle.py restore --bundle ... --key-file ...`: 별도 키 파일로 암호화된 소유자 자료 복원. Git 체크아웃 안에는 복원하지 않음.

12초짜리 무음 시작 프로젝트는 설치·렌더 확인용이며 본편이나 완성된 리디자인 템플릿이 아니다. 실제 주제에서는 승인된 원고와 음성, 공식 자료, 결과 화면, 의미 단위 자막, 내용에 맞는 모션을 작성한다. 기존 에피소드의 실행 환경을 옮길 때는 그 에피소드의 소스·자산·타임라인도 별도로 옮긴다.

## 본인 음성

기본 비공개 위치: `~/.config/youtube-motion/private/`.

- `google-voice-profile.json`: 기존 등록 정보. 실제 `id`를 출력하거나 공개 파일로 복사하지 않는다.
- `original-reference.ogg`, `original-consent.ogg`: 사용자 제공 원본. 매 생성 시 전송하지 않는다.
- `reference-candidate-28s.wav`, `consent.wav`: 기존 등록에 사용한 처리본.
- `approved-pace-20s.wav`: 승인된 숏폼의 말하기 속도 참고. 새 발화에 다시 1.25배를 곱하는 기준이 아니다.

현재 등록은 Google에서 성공한 상태다. 새 PC에서도 프로필에 접근 가능한 Google 프로젝트·권한이 필요하다. API 키는 `GEMINI_API_KEY`, `GOOGLE_API_KEY`, 기존 Windows의 `Gemini API Key`를 지원하며 Windows는 사용자/시스템 환경변수도 확인한다. 키는 백업·settings.json·공개 Git에 넣지 않는다.

실행 모델은 로컬 설정의 `model`을 사용한다. 기본값은 프로젝트에서 사용했던 `gemini-3.8-flash-tts`다. 모델/API 오류가 나면 현재 공식 문서를 확인한다. 접근 불가를 이유로 Kore 음성으로 되돌리거나 기존 프로필을 삭제하지 않는다.

암호화 백업은 저장소의 `owner-backup/owner-private.ymenc`에 있다. 복호화 키는 Git에 없으며 소유자가 별도로 보관한다. 원본 녹음은 재등록 대비 자료이지 Google 계정 권한을 대신하는 자료가 아니다.

## 기존 제작 기록의 해석

- 사용자는 Aside의 1.25배속 버전 속도와 48초 숏폼 리듬을 승인했다.
- 롱폼에는 그 속도를 유지하고 의미 경계의 쉼을 추가했다. 롱폼 최신 검토본과 사용자 최종 승인은 별개다.
- 이 패키지에는 해당 완성 영상 전체를 포함하지 않는다. 관련 프로젝트를 이어 수정하려면 현재 작업 공간에서 최신 원본과 타임라인을 찾아야 한다.
- `today-ai-news-publisher`는 별도 WordPress 기사 스킬이다. 이 영상 스킬에 그 게시 권한이나 발행 주기를 적용하지 않는다.
