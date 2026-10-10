import { interpolate, spring } from "remotion";
// 박자 격자. 트렌드코리아 B 미들과 같은 방식: 모든 등장은 박 위에서.
export const FPS = 30;
export const BPM = 100;                       // 1박 = 18프레임 (0.6초). 용어 설명용 '보통' 템포
export const BEAT = Math.round((60 / BPM) * FPS);
export const beat = (n: number) => Math.round(n * BEAT);   // n박 → 프레임
export const sec = (s: number) => Math.round(s * FPS);

// 팝: 0 → 1.08 → 1, 9프레임. (실습 정리 2-0 '한 박에 팝 하나' 규칙)
export const pop = (frame: number, start: number) => {
  const t = frame - start;
  if (t < 0) return 0;
  return interpolate(t, [0, 6, 9], [0, 1.08, 1], { extrapolateRight: "clamp" });
};
// 부드럽게 자리 잡는 스프링(오버슛 거의 없음). 블록이 '착' 붙을 때.
export const settle = (frame: number, start: number, fps = FPS) =>
  spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
