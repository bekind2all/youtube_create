// 팔레트 01 (Fiery Ocean) — skills/youtube-motion/assets/brand/palettes.json 과 같은 값
export const C = {
  cream: "#FDF0D5",   // 바탕
  navy: "#003049",    // 기본 글자, 영어 블록, 한국어 기본 블록
  red: "#C1121F",     // '초과 블록'(영어보다 더 든 만큼)만
  blue: "#669BBC",    // 입력 토큰 블록 — 글자는 반드시 남색 (흰 글자는 대비 3.0:1로 불합격)
  darkRed: "#780000", // 돈·한도 강조
  white: "#FFFFFF",
};
// 블록 색에 따라 글자색을 자동으로 고른다. 파랑 위에는 남색, 나머지 진한 색 위에는 흰색.
export const textOn = (bg: string) => (bg === C.blue || bg === C.cream ? C.navy : C.white);
