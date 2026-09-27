# AI 영상 편집 자동화 챌린지 3편 분석 + 일러스트 레퍼런스 스타일 적용안

작성일 2026-09-27. 요청: Drive 폴더의 일러스트 레퍼런스 스타일을 반영한 영상을 Remotion 또는 HyperFrames로 만들 수 있는지 확인하고, 챌린지 DAY1~3 영상을 전부 읽고 어떻게 활용할지 가감없이 정리.

| 문서 | 내용 |
|---|---|
| [00_결론_요약.md](00_결론_요약.md) | 가능 여부, 도구 선택, 지금 막힌 것, 다음 3가지 행동 |
| [01_DAY1_상세분석.md](01_DAY1_상세분석.md) | 레퍼런스를 편집 규칙으로 바꾸기 (2:07:09 전 구간) |
| [02_DAY2_상세분석.md](02_DAY2_상세분석.md) | 피드백으로 장면이 아니라 규칙을 고치기, 이미지 자산 정리 (1:26:29) |
| [03_DAY3_상세분석.md](03_DAY3_상세분석.md) | 대화를 스킬로 남기고 새 창에서 검증하기 (1:18:28) |
| [04_레퍼런스_스타일_분석.md](04_레퍼런스_스타일_분석.md) | 일러스트 15장 → 색·선·질감·타이포 규칙, design.md 패치 초안 |
| [05_도구검증_HyperFrames_vs_Remotion.md](05_도구검증_HyperFrames_vs_Remotion.md) | 이 환경에서 실제 설치·렌더한 결과, 당신 프로젝트 check 오류 재현·원인·패치 |
| [06_적용_로드맵_및_프롬프트.md](06_적용_로드맵_및_프롬프트.md) | 7단계 로드맵 + 프롬프트 6개 |
| [07_Notion_공개스킬_활용.md](07_Notion_공개스킬_활용.md) | 공개 스킬 6개에서 가져올 규칙 문장 |
| assets/tool-tests/ | Remotion·HyperFrames 렌더 증거(프레임 PNG, 3초 MP4, 테스트 컴포지션 소스) |
| assets/tool-tests/ai-news-video-check/ | 당신 프로젝트 재현 증거: 패치 diff, check 전/후 JSON, 스택트레이스, 패치 후 렌더 프레임 3장 |

## 읽은 것 / 못 읽은 것

- 읽음: 세 영상의 한국어 자동 자막 전문(총 7,101 세그먼트, 4시간 52분), Notion 공개 스킬 페이지, Drive의 `ai-news-video` 프로젝트 파일(AGENTS/README/design/build_video.py/visuals/episode/captions/check-result 등), Drive의 기존 watch 분석 문서 7개, 일러스트 레퍼런스 15장 중 10장 원본(01~08·13·15), Monoline Paper·Paper Collage SKILL.md 전문, HyperFrames README.
- 못 읽음: 레퍼런스 5장(09·10·11·12·14 — Drive MCP 인라인 응답은 바이트 복원 불가, 직접 다운로드는 프록시 403, OCR 텍스트 없음). 영상 화면(프레임). 이 컨테이너에서 YouTube 다운로드가 프록시 403으로 차단됐다. 화면 묘사는 강사 발화 기반이며, 외부 영상 분석 API(Higgsfield)도 시도했으나 첫 1~2분만 처리하고 DAY1은 엉뚱한 내용을 반환해 폐기했다. 강사의 노션 원문 프롬프트·슬랙 자료는 비공개라 보지 않았다.
- `/watch` 스킬: 사용자의 Windows 경로(`C:/Users/hyjun/.agents/skills/watch/SKILL.md`)에 있어 이 세션에서는 로드할 수 없었다. 대신 같은 절차(자막 전문 확보 → 시간 블록 읽기 → 타임스탬프 인용)를 수동으로 수행했다. Drive의 `watch-analysis/` 폴더에 이미 그 스킬로 만든 결과가 있어 교차 확인에 썼다.
