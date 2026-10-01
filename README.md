# youtube-motion · 오늘AI 영상 제작

유용한 AI 활용법, 구체적인 업무 자동화, 공식 AI 발표를 오늘AI의 한국어 롱폼·숏폼으로 기획하고 제작하는 Codex 스킬과 이동용 자산입니다. 기존 분석 문서는 [docs](docs/README.md)에 보존했습니다.

**현재 제작 엔진은 HyperFrames입니다.** 스킬의 디자인·기획 기준은 Remotion에도 적용할 수 있지만, 이 저장소의 실행 가능한 시작 템플릿과 명령은 HyperFrames용입니다.

## 포함된 것

- [youtube-motion 스킬](skills/youtube-motion/SKILL.md): 조사, 승인, 제작, 자막, 본인 음성, 모션, 검수 기준.
- 팔레트 4종과 기본 팔레트 02, Paperlogy 웹폰트 4종, 광양감동체 원본과 출처·라이선스.
- 승인 캐릭터 원본, 참고 캐릭터 보드, 디자인보드·무드보드, 선 스타일이 같은 SVG 아이콘·강조 요소.
- 큰 설명 일러스트 4종: 음성에서 일정으로, AI 제작 작업대, 결과 확인·수정, 촬영 알림. 부분별 애니메이션과 선택 팔레트 적용이 가능한 SVG입니다.
- 실제 글자 폭에 밑줄을 맞추는 보조 함수, 인증·자동화 조건과 실제 시험 범위를 확인하는 팩트체크 기준.
- 운영체제에 맞는 설치 도구, 환경 진단, Google 본인 음성 생성 도구, 가로·세로 HyperFrames 시작 프로젝트 생성기.
- [암호화된 개인 백업](owner-backup/README.md): 사용자 목소리 원본·동의 녹음·등록 프로필·승인된 말하기 속도 참고 음성.

완성 에피소드 MP4, npm 캐시, 다른 제작자의 레퍼런스 영상, API 키는 공개 저장소에 넣지 않습니다. 스킬은 AI 에이전트가 따라 작업하는 제작 지침이며, URL 하나로 검토 없이 자동 발행하는 서비스가 아닙니다.

## 새 PC에서 설치

필요: **Python 3.10 이상, Node.js 22 이상, Git, FFmpeg/FFprobe**, Codex. Windows·macOS·Linux에서 같은 Python 도구를 사용합니다. 이 배포는 Windows에서 검증했으며 다른 OS의 실기기 검증은 아직 하지 않았습니다.

```sh
git clone https://github.com/bekind2all/youtube_create.git
cd youtube_create
python -m pip install -r skills/youtube-motion/requirements.txt
npm ci --prefix skills/youtube-motion
python install.py
python skills/youtube-motion/scripts/youtube_motion.py doctor
```

macOS/Linux에서 `python` 명령이 없으면 `python3`를 사용하세요. FFmpeg가 설치되어 있지 않으면 먼저 설치하고 터미널에서 `ffmpeg -version`, `ffprobe -version`이 실행되는지 확인하세요.

설치 위치는 `CODEX_HOME/skills/youtube-motion`, 환경변수가 없으면 `~/.codex/skills/youtube-motion`입니다. 기존 스킬을 갱신할 때는 `python install.py --update`를 사용합니다. 기존 버전은 로컬 설정 폴더의 `skill-backups`에 보관합니다.

새 Codex 대화에서 다음처럼 요청하세요.

> **유튜브 모션영상 만들자**

이 문구와 “유튜브 모션 영상 만들자”, “오늘AI 영상 만들자”를 스킬 설명에 등록했고, 자동 선택을 허용했습니다. 설치된 최신 스킬이 새 대화에 로드되면 저장된 제작 기준으로 시작합니다. 주제·URL을 함께 적어도 됩니다. 이전 영상을 이어 수정할 때는 로컬에 저장된 최신 프로젝트 기록을 읽습니다. 다른 PC에서 기존 영상까지 이어가려면 해당 에피소드 폴더도 옮겨야 합니다.

스킬을 직접 지정하는 요청도 사용할 수 있습니다.

> `$youtube-motion 이 공식 발표 URL로 오늘AI 롱폼 1편과 숏폼 2편의 기획안을 만들고, 승인 후 제작해줘.`

업무 활용 소재도 요청할 수 있습니다.

> `$youtube-motion 회의 메모를 후속 작업표로 바꾸는 AI 활용법을 롱폼과 숏폼으로 기획해줘. 실제 입력과 결과, 사용 조건을 확인하고 팔레트 01과 큰 설명 일러스트를 적용해줘.`

처음에는 `doctor`가 본인 음성 파일과 API 키 미설정으로 종료 코드 2를 반환할 수 있습니다. 아래 복원과 인증 설정 후 다시 실행하세요. `doctor`는 로컬 파일 존재를 확인하며 Google 계정의 서버 권한까지 검증하지는 않습니다.

## 내 목소리 복원

이 저장소는 공개이므로 원본 녹음을 암호화했습니다. **복호화 키 파일은 별도 안전한 경로로 새 PC에 옮겨야 합니다. GitHub에 올리거나 채팅에 붙여 넣지 마세요.**

```sh
python skills/youtube-motion/scripts/private_bundle.py restore --bundle owner-backup/owner-private.ymenc --key-file "/안전한경로/youtube-motion-owner.key"
```

Windows 예시의 키 경로는 `"E:\private\youtube-motion-owner.key"`처럼 지정합니다. 기본 복원 위치는 `~/.config/youtube-motion/private`이며 Git 저장소 밖입니다. 이미 복원된 파일을 자동 덮어쓰지 않습니다.

새 PC에서 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`를 환경변수로 설정하세요. 기존 Windows의 `Gemini API Key`라는 이름도 지원합니다. **API 키는 백업에도 포함하지 않았습니다.**

복원된 프로필을 사용할 수 있는 동일한 Google 프로젝트/권한의 인증이 필요합니다. 원본 녹음만으로 서버의 음성 프로필이나 권한이 복제되지는 않습니다. 프로필이 삭제되었거나 접근할 수 없으면 보관된 동의·원본을 바탕으로 공식 등록 절차를 다시 확인해야 합니다. 기존 목소리 대신 다른 음성을 자동으로 선택하지 않습니다.

```sh
python skills/youtube-motion/scripts/youtube_motion.py speak --text-file narration.txt --output outputs/narration.wav
```

이 명령은 Google API를 호출하므로 해당 계정의 사용 요금·쿼터가 적용됩니다. 모델명과 비공개 프로필 경로는 `~/.config/youtube-motion/settings.json`에서 바꿀 수 있습니다. API 키 값은 이 설정 파일에 쓰지 않습니다.

## 설치 확인용 시작 프로젝트

```sh
python skills/youtube-motion/scripts/youtube_motion.py new work/first-long --format long
python skills/youtube-motion/scripts/youtube_motion.py hf work/first-long check
python skills/youtube-motion/scripts/youtube_motion.py hf work/first-long snapshot --at 1.5,6.7,10
python skills/youtube-motion/scripts/youtube_motion.py hf work/first-long render --quality draft --output preview.mp4
```

세로는 `--format short`를 사용합니다. 첫 실행 시 HyperFrames가 호환 브라우저를 추가로 내려받을 수 있습니다.

시작 프로젝트는 **12초짜리 무음 기술 시안**입니다. 본편이나 사용자가 승인한 새 리디자인 완성본이 아닙니다. 본편 제작에는 주제별 공식 자료, 실제 내용이 있는 결과 화면, 승인된 원고·음성, 별도 자막 타임라인을 넣어야 합니다.

## 유지되는 제작 기준

두 가지 스타일을 선택할 수 있습니다. **스타일 1은 큰 타이포·실제 화면 중심**, **스타일 2는 큰 설명 일러스트·픽토그램 중심**입니다. 두 스타일 모두 실제 결과 화면을 활용하며 롱폼·숏폼에 적용할 수 있습니다. 스타일 번호와 팔레트 번호는 별개입니다. 예: `스타일 2 / 팔레트 01 / 숏폼`. 두 버전을 모두 원할 때만 함께 제작합니다.

- 첫 3초에 핵심 결과를 보여주고, 기능 나열보다 변화와 활용을 설명합니다.
- “이런 방법도 있다”는 활용 사례의 말투로 설명합니다. 한 번의 요청으로 완성을 보장하거나 “시연 앱·실습” 같은 강사 멘트를 쓰지 않습니다.
- 사용자 선택 팔레트의 HEX를 정확히 사용합니다. 별도 선택이 없으면 팔레트 02 `#000000 #14213D #FCA311 #E5E5E5 #FFFFFF`입니다.
- 선택한 스타일에 맞춰 실제 화면·타이포 또는 큰 일러스트가 설명을 맡고, 장면별 구도와 연결 방식에 변화를 줍니다.
- 글자가 먼저 나타난 뒤 밑줄·화살표가 강조합니다. 자막은 의미 단위로 나눕니다.
- 스타일 2는 작은 아이콘의 존재만으로 완료하지 않습니다. 휴대폰 크기에서도 그림의 상황이 보여야 합니다. 스타일 1에는 큰 일러스트를 의무적으로 넣지 않습니다.
- “한 번 연결하면 계속 자동” 같은 주장은 공식 문서와 현재 구현을 함께 확인합니다. 알림 설정 저장과 실제 알림 수신도 구분합니다.
- 본인 음색과 승인된 말하기 속도 유지. 롱폼의 문장 끝·핵심·주제 전환에는 기존 무음을 포함한 총 쉼을 적용합니다.
- 숏폼의 승인된 리듬에 롱폼용 쉼을 일괄 적용하지 않습니다.
- 완성 영상을 승인하면 YouTube 제목·설명·썸네일 제작과 업로드까지 이어서 진행합니다. 채널과 공개·예약 설정은 사용자가 정한 범위를 따릅니다. Instagram Reels 등 다른 플랫폼은 별도 요청에 따릅니다.
- 서비스·제품 영상과 썸네일에는 해당 서비스·제품의 공식 로고를 사용합니다.

## 구성 및 권리

자산 목록과 해시는 `skills/youtube-motion/assets/manifest.json`에 있습니다. 재사용 조건과 출처는 [자산 안내](ASSET-NOTICES.md)를 확인하세요. 사용자의 채널 브랜드와 캐릭터, 음성에 대한 제3자의 사용 권한을 이 저장소가 부여하는 것은 아닙니다.
