import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C, textOn } from "./theme";
import { beat, pop, settle, sec } from "./beat";

/* ───────── 공통: 자막 (위쪽 가운데, 안전영역 y 300~900, 최대 2줄, 1초 이상 유지) ───────── */
export const Caption: React.FC<{ lines: string[]; start: number; size?: number; color?: string }> = ({
  lines, start, size = 100, color = C.navy,
}) => {
  const f = useCurrentFrame();
  const s = pop(f, start);
  return (
    <div style={{
      position: "absolute", left: 90, right: 180, top: 320, textAlign: "center",
      fontFamily: "Paperlogy", fontWeight: 800, fontSize: size, lineHeight: 1.25, color,
      transform: `scale(${s})`, opacity: s === 0 ? 0 : 1, transformOrigin: "50% 50%",
    }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
};

/* ───────── 블록 한 개 ───────── */
const Block: React.FC<{ label: string; bg: string; start: number; w?: number; h?: number; dashed?: boolean; fade?: number }> = ({
  label, bg, start, w = 150, h = 110, dashed, fade,
}) => {
  const f = useCurrentFrame();
  const s = settle(f, start);
  const op = fade !== undefined && f >= fade ? interpolate(f, [fade, fade + 12], [1, 0], { extrapolateRight: "clamp" }) : 1;
  return (
    <div style={{
      width: w, height: h, borderRadius: 18, background: dashed ? "transparent" : bg,
      border: dashed ? `6px dashed ${bg}` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Paperlogy", fontWeight: 700, fontSize: 48, color: dashed ? bg : textOn(bg),
      transform: `scale(${s}) translateY(${(1 - s) * 40}px)`, opacity: Math.min(s, op),
    }}>{label}</div>
  );
};

/* ───────── S2: 문장이 블록으로 쪼개짐. 조각마다 반 박 간격으로 '착' ───────── */
// pieces 는 설명용 예시(실제 조각은 모델마다 다름) — 화면에 '설명용 예시' 라벨을 꼭 둘 것
export const SplitSentence: React.FC<{ pieces: string[]; start: number; bg?: string }> = ({ pieces, start, bg = C.navy }) => (
  <div style={{ position: "absolute", left: 90, right: 180, top: 760, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
    {pieces.map((p, i) => <Block key={i} label={p} bg={bg} start={start + beat(0.5 * i)} w={Math.max(120, p.length * 52)} />)}
    <div style={{ width: "100%", textAlign: "center", fontFamily: "Paperlogy", fontSize: 32, color: C.navy, opacity: 0.7, marginTop: 8 }}>설명용 예시 · 실제 조각은 모델마다 달라요</div>
  </div>
);

/* ───────── S3: 영어 6 vs 한국어 12 → 8. '초과 블록'만 빨강, 줄어드는 4개는 박 위에서 사라짐 ───────── */
export const CompareBlocks: React.FC<{ start: number; shrinkAt: number }> = ({ start, shrinkAt }) => {
  const en = 6, koOld = 12, koNew = 8;
  const row = (n: number, y: number, label: string, redFrom: number, fadeFrom?: number) => (
    <div style={{ position: "absolute", left: 90, right: 180, top: y }}>
      <div style={{ fontFamily: "Paperlogy", fontWeight: 700, fontSize: 44, color: C.navy, marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {Array.from({ length: n }).map((_, i) => (
          <Block key={i} label="" bg={i >= redFrom ? C.red : C.navy} start={start + beat(0.25 * i)} w={56} h={56}
            fade={fadeFrom !== undefined && i >= fadeFrom ? shrinkAt + beat(0.25 * (i - fadeFrom)) : undefined} />
        ))}
      </div>
    </div>
  );
  return (
    <>
      {row(en, 780, "영어 · Hello, how are you?", 99)}
      {row(koOld, 960, "한국어 · 안녕하세요, 잘 지내세요?", en, koNew)}
      <Counter start={start} shrinkAt={shrinkAt} from={koOld} to={koNew} y={1140} />
    </>
  );
};
const Counter: React.FC<{ start: number; shrinkAt: number; from: number; to: number; y: number }> = ({ start, shrinkAt, from, to, y }) => {
  const f = useCurrentFrame();
  const n = f < shrinkAt ? from : Math.round(interpolate(f, [shrinkAt, shrinkAt + beat(1)], [from, to], { extrapolateRight: "clamp" }));
  const label = f < shrinkAt ? "GPT-3.5 때" : "지금";
  return (
    <div style={{ position: "absolute", left: 90, top: y, fontFamily: "Paperlogy", color: C.navy, opacity: pop(f, start) ? 1 : 0 }}>
      <span style={{ fontSize: 44, fontWeight: 700 }}>{label} </span>
      <span style={{ fontSize: 160, fontWeight: 800, color: n > 6 ? C.red : C.navy }}>{n}</span>
      <span style={{ fontSize: 44 }}> 개</span>
    </div>
  );
};

/* ───────── S4: 입력 → 추론(점선, 안 보임) → 출력. 동전은 출력 5 : 입력 1 ───────── */
export const TokenFlow: React.FC<{ start: number }> = ({ start }) => {
  const f = useCurrentFrame();
  const box = (label: string, bg: string, i: number, dashed?: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <Block label={label} bg={bg} start={start + beat(i)} w={250} h={130} dashed={dashed} />
    </div>
  );
  const arrow = (i: number) => (
    <div style={{ fontSize: 64, color: C.navy, fontFamily: "Paperlogy", opacity: pop(f, start + beat(i)) ? 1 : 0 }}>→</div>
  );
  const coins = (n: number, i: number) => (
    <div style={{ display: "flex", gap: 6, height: 60 }}>
      {Array.from({ length: n }).map((_, k) => (
        <div key={k} style={{ width: 44, height: 44, borderRadius: 22, background: C.darkRed, transform: `scale(${pop(f, start + beat(i) + beat(0.25 * k))})` }} />
      ))}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 90, right: 180, top: 760 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        {box("입력", C.blue, 0)}{arrow(0.5)}{box("추론", C.navy, 1, true)}{arrow(1.5)}{box("출력", C.navy, 2)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "24px 20px 0" }}>
        {coins(1, 3)}<div />{coins(5, 3.5)}
      </div>
      <div style={{ textAlign: "center", fontFamily: "Paperlogy", fontSize: 32, color: C.navy, opacity: 0.7, marginTop: 10 }}>
        예: GPT-6.1 Sol API 입력 $2 · 출력 $10 /100만 토큰 (출처: OpenAI 요금 페이지)
      </div>
    </div>
  );
};

/* ───────── S5: 한도 바가 닳음 + 질문마다 '앞 내용 다시 읽기' 스윕 ───────── */
export const UsageBar: React.FC<{ start: number; questions?: number }> = ({ start, questions = 3 }) => {
  const f = useCurrentFrame();
  const lines = 8;                                    // 쌓인 이전 대화 줄
  const per = beat(2);                                // 질문 간격
  let used = 0;
  for (let q = 0; q < questions; q++) {
    const t = start + q * per;
    if (f >= t) used += interpolate(f, [t, t + beat(1)], [0, (q + 1) * 0.12], { extrapolateRight: "clamp" }); // 질문이 쌓일수록 더 많이 닳음
  }
  const level = Math.max(0, 1 - used);
  const q = Math.min(questions - 1, Math.max(0, Math.floor((f - start) / per)));
  const sweepT = (f - (start + q * per)) / beat(1);   // 0→1 동안 아래에서 위로 훑기
  const sweepY = 1180 - Math.min(1, Math.max(0, sweepT)) * 420;
  return (
    <>
      <div style={{ position: "absolute", left: 90, top: 760, width: 640 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} style={{ height: 34, margin: "12px 0", borderRadius: 17, background: C.navy, opacity: 0.18, width: `${55 + ((i * 37) % 40)}%` }} />
        ))}
      </div>
      {f >= start && sweepT < 1 && (
        <div style={{ position: "absolute", left: 70, width: 680, top: sweepY, height: 60, background: C.blue, opacity: 0.35, borderRadius: 30 }} />
      )}
      <div style={{ position: "absolute", left: 790, top: 760, width: 90, height: 460, borderRadius: 20, border: `6px solid ${C.navy}`, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: "100%", height: `${level * 100}%`, background: level < 0.35 ? C.darkRed : C.navy }} />
      </div>
      <div style={{ position: "absolute", left: 760, top: 1235, fontFamily: "Paperlogy", fontSize: 32, color: C.navy }}>한도</div>
    </>
  );
};

/* ───────── S6: 압축. 12블록 문장이 6블록으로 접힘 ───────── */
export const Compress: React.FC<{ longPieces: string[]; shortPieces: string[]; start: number; at: number }> = ({ longPieces, shortPieces, start, at }) => {
  const f = useCurrentFrame();
  const showShort = f >= at;
  const pieces = showShort ? shortPieces : longPieces;
  return (
    <div style={{ position: "absolute", left: 90, right: 180, top: 760 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {pieces.map((p, i) => <Block key={`${showShort}-${i}`} label={p} bg={C.navy} start={(showShort ? at : start) + beat(0.25 * i)} w={Math.max(100, p.length * 50)} h={96} />)}
      </div>
      <div style={{ textAlign: "center", marginTop: 28, fontFamily: "Paperlogy", fontWeight: 800, fontSize: 140, color: showShort ? C.navy : C.red }}>
        {pieces.length}<span style={{ fontSize: 44, fontWeight: 400 }}> 개</span>
      </div>
      <div style={{ textAlign: "center", fontFamily: "Paperlogy", fontSize: 32, color: C.navy, opacity: 0.7 }}>OpenAI 공식 토크나이저(GPT-5 기준)로 직접 센 값 · 캡처는 설명란</div>
    </div>
  );
};

/* ───────── 바탕 ───────── */
export const Bg: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: C.cream }}>{children}</AbsoluteFill>
);
export { sec };
