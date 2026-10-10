// 사용 예 — 장면 시작 프레임(start)은 반드시 실제 나레이션 타임스탬프에서 읽어 넣는다(voice_info.py 결과).
import React from "react";
import { Sequence } from "remotion";
import { Bg, Caption, SplitSentence, CompareBlocks, TokenFlow, UsageBar, Compress } from "./TokenScenes";
import { sec, beat } from "./beat";

export const TokenShort: React.FC = () => (
  <Bg>
    {/* S1 훅: 0~1초 고정 문구, 이어서 제목 */}
    <Sequence from={0} durationInFrames={sec(3)}>
      <Caption lines={["이것까지 알아야 해?"]} start={0} size={84} />
      <Caption lines={["토큰,", "블록 하나로 보면 쉬워요"]} start={sec(1.2)} />
    </Sequence>
    {/* S2 */}
    <Sequence from={sec(3)} durationInFrames={sec(8)}>
      <Caption lines={["AI는 글을", "블록으로 쪼개서 읽어요"]} start={0} />
      <SplitSentence pieces={["나는", "오늘", "카페", "에서", "커피", "를", "마셨", "다"]} start={beat(1)} />
    </Sequence>
    {/* S3 */}
    <Sequence from={sec(11)} durationInFrames={sec(12)}>
      <Caption lines={["한국어는", "더 잘게 쪼개져요"]} start={0} />
      <CompareBlocks start={beat(1)} shrinkAt={sec(6)} />
    </Sequence>
    {/* S4 */}
    <Sequence from={sec(23)} durationInFrames={sec(11)}>
      <Caption lines={["입력 · 추론 · 출력", "셋 다 토큰"]} start={0} />
      <TokenFlow start={beat(1)} />
    </Sequence>
    {/* S5 */}
    <Sequence from={sec(34)} durationInFrames={sec(15)}>
      <Caption lines={["길어질수록", "빨리 닳아요"]} start={0} />
      <UsageBar start={beat(1)} />
    </Sequence>
    {/* S6 */}
    <Sequence from={sec(49)} durationInFrames={sec(11)}>
      <Caption lines={["짧게 쓰면", "블록이 반으로"]} start={0} />
      <Compress
        longPieces={["이", "내용", "에", "대해서", "설명", "을", "해", "주시면", "감사", "하겠", "습니", "다"]}
        shortPieces={["이", "내용", "설명", "해", "줘", "."]}
        start={beat(1)} at={sec(5)} />
    </Sequence>
    {/* S7 */}
    <Sequence from={sec(60)} durationInFrames={sec(7)}>
      <Caption lines={["아끼는 습관 =", "유료 효과"]} start={0} />
      <Caption lines={["꿀팁 5가지 → 지난 영상"]} start={sec(2.5)} size={64} />
    </Sequence>
  </Bg>
);
