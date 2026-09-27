import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const BG = "#F4F0E7", INK = "#222820", ACCENT = "#AB411F", SUB = "#536052";

const Number: React.FC<{ value: string; unit: string; delay: number }> = ({ value, unit, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  const blur = interpolate(s, [0, 1], [8, 0]);
  return (
    <div style={{ display: "flex", alignItems: "baseline", color: ACCENT, fontWeight: 800,
      opacity: s, scale: String(0.82 + 0.18 * s), translate: `0px ${24 * (1 - s)}px`, filter: `blur(${blur}px)` }}>
      <span style={{ fontSize: 360, lineHeight: 1.1, letterSpacing: "-0.07em" }}>{value}</span>
      <span style={{ fontSize: 128, marginLeft: 12 }}>{unit}</span>
    </div>
  );
};

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const titleY = interpolate(frame, [0, 0.4 * fps], [26, 0], { extrapolateRight: "clamp" });
  const titleO = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: "clamp" });
  const progress = frame / durationInFrames;
  return (
    <AbsoluteFill style={{ background: BG, color: INK, fontFamily: "Pretendard, 'Noto Sans KR', sans-serif", padding: "190px 100px 270px" }}>
      <div style={{ position: "absolute", left: 100, right: 100, top: 65, display: "flex", justifyContent: "space-between",
        borderBottom: "2px solid #B5BAAB", paddingBottom: 24, fontSize: 26 }}>
        <span style={{ fontWeight: 800, letterSpacing: 2 }}>AI UPDATE</span><span style={{ color: SUB, fontSize: 24 }}>OPUS 5.5 / 01</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, color: ACCENT, fontWeight: 800 }}>공식 발표 해설</div>
          <h1 style={{ fontSize: 94, fontWeight: 800, lineHeight: 1.14, letterSpacing: "-0.04em", margin: 0,
            opacity: titleO, translate: `0px ${titleY}px` }}>40% 저렴?</h1>
          <p style={{ fontSize: 38, color: SUB, lineHeight: 1.5 }}>오퍼스 5.5 · 어떤 비용을 말할까</p>
        </div>
        <Number value="40" unit="%" delay={Math.round(0.12 * fps)} />
      </div>
      <div style={{ position: "absolute", left: 100, right: 100, bottom: 190, height: 5, background: "#D4D9CE" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: ACCENT }} />
      </div>
      <Sequence from={Math.round(0.5 * fps)} layout="none">
        <div style={{ position: "absolute", left: 100, right: 100, bottom: 65, display: "flex", justifyContent: "center" }}>
          <p style={{ fontSize: 47, fontWeight: 800, background: INK, color: "#FFFCF5", padding: "18px 28px", borderRadius: 5, margin: 0 }}>
            여기서 40%는 월 구독료 할인이 아닙니다.
          </p>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
