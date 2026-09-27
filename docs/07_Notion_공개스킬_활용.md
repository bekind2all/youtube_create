# Notion 공개 스킬 6개 — 일러스트 스타일 파이프라인에 무엇을 가져올까

- 출처: https://earthy-mile-a8d.notion.site/AI-3d0b4ddff08a81219324d473c3b3fcf2 (2026-09-03 수정본, Notion MCP로 전문 읽음)
- 추가로 직접 읽은 것: `kumtti/monoline-paper-video/SKILL.md`(484줄 전문), `Dtech00/paper-collage-video/skills/paper-collage-video/SKILL.md`(87줄 전문), `heygen-com/hyperframes/README.md`(2026-09-22 커밋). 나머지 4개는 Notion 설명과 당신 Drive의 기존 검토(06_Notion_공개스킬_추가분석.md)에 의존했다.
- 이 문서는 6개를 다시 평가하는 게 아니라 **당신의 일러스트 레퍼런스 스타일에 실제로 옮겨 쓸 수 있는 "규칙 문장"과 "코드 조각"을 추출**한 것이다.

---

## 1. 결론

| 스킬 | 당신 스타일과의 거리 | 가져올 것 | 안 맞는 것 |
|---|---|---|---|
| **Monoline Paper** (이경화) | **가장 가깝다.** 흰 종이 + 검은 모노라인 + 강조색 1개 + 손이 카드를 놓는 연출. 레퍼런스 01/02(굵은 파랑 라인 + 주황)와 문법이 같다 | 스타일 토큰 형식, 선 두께 3단계(9/17/30), `stroke-linecap:butt`, 편집 규칙 5-1~5-11, 함정 9장, 완료 점검표 | 순백 #FFFFFF·순검 #000000 고정(당신은 #F4F0E7/#222820 웜톤), "회색 금지"(당신 보조색 #536052은 회녹색), 감성 격려 톤 |
| **Paper Collage** (동테크) | 가깝다. 아이보리 종이 질감 + 누끼 이미지 + 손으로 붙인 그림자 + 의미 단위 한글 줄바꿈 | 상태 변화형 장면 설계(이전→계기→이후→정지), 그림자 규칙, 한글 제목 줄바꿈 기준, "순번·영문 분류표 만들지 마라" | 생성 이미지 위주(당신은 코드 부품 위주로 가야 함), 실제 SKILL.md는 참고 문서 6개에 흩어져 있어 설치만으로는 안 됨 |
| **Ink on White** (김숙명) | 중간. 흰 배경·검은 선화·보라 강조, 음성+대본 필수, SVG 도형(격자/막대/달력) | 대본을 자막 근거로, 음성을 타이밍 근거로 쓰는 분리(당신 align_audio.py와 동일 사상), verify.py의 프레임 샘플링 검수 | 보라 강조, 선화 위주라 "종이 질감·오프레지스터" 없음 |
| **Money Swagger** (이준원) | 중간. 차콜 모눈 + 크림 종이, 정의/사례/결론 카드, PIP | 등식·카드 레이아웃(당신 equation/steps와 유사) | 다크 그리드 배경 |
| **Korean Shorts** (남윤하) | 낮음(형식은 직접적). 9:16 정보형 쇼츠, 자막 안전선, 효과 발동 조건표 | **9:16 안전 여백·자막 위치 수치**, 효과↔의미 발동 조건표 형식 | 캐릭터 생성기, build.py는 예시 장면 자리표시자 |
| **Whiteboard Minimal** (배기윤) | 낮음. 흑백 큰 글자, 탄성 등장 | 효과음 빈도를 줄인 피드백 기록 방식 | 1920×1080 흑백, 문서 중심이라 구현은 에이전트 몫 |

**요약:** Monoline Paper의 "규칙 문법"을 뼈대로, Paper Collage의 "종이 질감·그림자·한글 줄바꿈"을 얹고, 색은 당신 design.md 팔레트로 바꾸면 된다. 스킬을 설치해 그대로 돌리는 게 아니라 **문장을 베껴 오는 것**이다(라이선스: Monoline MIT, Paper Collage는 LICENSE 파일 미확인 — 코드 재배포 시 확인).

---

## 2. Monoline Paper에서 그대로 가져올 문장 (당신 design.md에 붙일 후보)

원문(SKILL.md 4~5장, 9장)에서 당신 스타일에 맞게 색만 치환:

```
line:
  hairline: 9        # 도표·표 테두리
  monoline: 17       # 픽토그램/소품 아이콘 (레퍼런스 02의 선 굵기 느낌)
  emphasis: 30       # 그 장면의 주인공 하나
  linecap: butt / linejoin: miter   # 레퍼런스 01·02는 둥근 캡이므로 당신은 round/round로 바꿀 것 (04 문서 참조)
motion:
  enter: ease none, 15f, 2% overshoot, 4f settle
  drawOn: strokeDashoffset 15~30f, ease none   # "관계·인과·경로를 말할 때"
  transition: hard-cut
  forbidden: back/elastic/bounce, 디졸브, 와이프
  budget: 전체 프레임의 75% 이상 완전 정지, 한 번에 하나만 움직인다
caption:
  하단 12% 지점, 700 기본, 핵심어 1.14배·800, 숫자는 여기에 강조색
  한 줄 22자 초과 시 분할, 화면 큰 글씨가 그 문장이면 자막 생략
```

편집 규칙 중 당신 채널(정보 해설)에 특히 맞는 것:
- **5-1 매 순간 주인공 하나**: "지금 이 문장의 주어가 화면에서 제일 눈에 띄는가?" → 당신 hero/statement 레이아웃 선택 기준으로 그대로.
- **5-2 강조색의 뜻 고정(최대 2 카테고리)**: 당신 #AB411F = ①수치 ②"활용 제안" 표지. 그 외엔 쓰지 않는다고 design.md에 명문화.
- **5-3 지시어 2겹 표시**: 대본에 "여기서", "이 숫자"가 나오면 강조색 + 밑줄/괄호 + 라벨 중 2개.
- **5-7 수치는 변화 곡선**: "40% 저렴"을 최종값 팝인만 하지 말고 100→60 카운트다운으로. (당신 number-pop-in에 카운트 옵션 추가.)
- **5-10 한 씬 지시는 전체에 반영**: 피드백 반영 후 "같은 요소가 나오는 다른 장면을 전부 찾아 맞추고 어디까지 확장했는지 보고".

9장 함정 중 당신 build_video.py에 이미 해당하는 것:
- **GSAP fromTo가 SVG transform을 덮어쓴다** → 당신은 CSS 변수(`--hf-number-y`)로 우회하고 있어 안전. 일러스트 SVG 부품을 넣을 때 `<g id><g transform>…</g></g>` 이중 그룹 규칙을 지킬 것.
- **CSS 선택자는 `<use>` 안으로 못 들어간다** → 부품을 `<use>`로 재사용하면 `stroke:currentColor` + 부모 `color`로 색을 준다.
- **check 통과 ≠ 그림이 맞다** → `hyperframes snapshot --at …`으로 장면당 1장은 눈으로.

---

## 3. Paper Collage에서 가져올 것

- **장면 설계 단위**: `이전 상태 → 계기 → 이후 상태/반응 → 필요한 이미지 → 연결 동작 → 정지`. 당신 visuals.json의 phase가 "정보 단위"라면, 이 스킬은 "상태 변화 단위"다. 정보 영상에서도 "구독료 할인으로 오해 → 공식 설명 → 세 가지로 나눠 보기"처럼 전후 상태가 있는 장면(01, 05)에는 이 단위가 더 낫다.
- **그림자 규칙**: "이미지와 종이 라벨 뒤에 따뜻한 회갈색 그림자, 텍스트 그림자는 이미지보다 약하게" → 당신 `.paper` 박스(#FFFCF5, 2px #B5BAAB 테두리)에 `box-shadow: 0 6px 0 rgba(83,96,82,.18)` 정도의 오프셋 그림자를 주면 "붙인 종이" 느낌이 난다(04 문서의 토큰 제안).
- **한글 줄바꿈**: "자동 줄바꿈에 맡기지 않고 의미 단위로 직접 나눈다. 조사·어미·숫자 단위가 다음 줄에 홀로 떨어지지 않게" → visuals.json의 title에 이미 `\n`으로 직접 나누고 있다. 규칙으로 명문화만 하면 된다.
- **"순번·영문 분류표를 만들지 않는다"**: 당신 steps 레이아웃의 `01 02 03` 번호는 대본에 실제 순서("첫째, 둘째, 셋째")가 있을 때만 쓴다는 조건을 붙이자. 현재 scene-01 phase 3("오늘 확인할 3가지")은 대본에 "세 가지로 정리해 드릴게요"가 있으니 정당하다.
- **"빈 공간은 결함이 아니라 읽는 호흡"**: statement 레이아웃 남용 방지와 같은 취지.

---

## 4. Korean Shorts에서 가져올 것 (숏폼 3개용)

Notion 설명대로 "자막·안전선·효과 발동 조건"이 핵심이다. 당신 build_video.py의 세로 값(좌우 80, 상단 180, 하단 310, 자막 bottom 255)은 이미 유튜브 쇼츠 UI를 고려한 값이다. 가져올 것은 **효과 발동 조건표 형식**뿐이다:

| 대본 신호 | 효과 | 예 |
|---|---|---|
| 숫자 + 단위 | hero 숫자 팝인(+카운트) | "40%", "$4/$20" |
| "A가 아니라 B" | split 좌우 대비, 왼쪽 먼저 흐리게 | "월 구독료 할인이 아니라 실행 비용" |
| "첫째/둘째/셋째" | steps 순차 등장 | "세 가지를 기록" |
| "확인하세요/체크" | paper 체크박스 행 | "이용 대상, 가격 조건" |
| "A × B = C" | equation | "단가 × 사용량 = 작업 비용" |

이 표를 design.md에 넣으면 visuals.json을 AI가 쓸 때 layout 선택이 안정된다(DAY3 `[29:26]`의 "리스트마다 의미를 미리 넣는" 방식).

---

## 5. HyperFrames 공식 README(2026-09-22)에서 확인한 것

- 요구사항 **Node.js 22+, FFmpeg**. 라이선스 Apache 2.0(렌더당 비용 없음). Remotion은 "Source-available Remotion License"(회사 규모에 따라 유료).
- 스킬 설치는 `npx hyperframes skills update`(core set)가 에이전트용 권장. `/faceless-explainer`(텍스트로 개념 설명, 모든 시각이 LLM 생성)와 `/general-video`가 당신 용도. **`/remotion-to-hyperframes`** 포팅 스킬이 있다(역방향은 없음).
- `frame.md`: "design.md를 카메라용으로 뒤집은 것". 당신 design.md를 frame.md 형식으로 확장하면 공식 스킬이 그대로 읽는다.
- Catalog: `npx hyperframes add data-chart` 등. 당신은 `number-pop-in`을 registry에서 이미 가져왔다(render-template/hyperframes.json).

---

## 6. 주의

- Notion 페이지의 "현재 열리지 않는 제출물"(keisys462/whiteboard-skill 404)은 이번에도 확인하지 않았다.
- 6개 스킬 대부분이 **whisper/faster-whisper 전사**를 전제로 한다. 당신은 TTS라 대본이 정답이고 정렬만 필요하다(`align_audio.py`). 전사 단계는 건너뛰어도 된다.
- Monoline SKILL.md의 Pretendard CDN 경로(`npm/pretendard@1.3.9`)는 이 환경(프록시)에서는 막히지만, 당신은 이미 로컬 woff2를 assets/fonts에 두고 있어 해당 없음.
