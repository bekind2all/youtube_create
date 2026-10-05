/*
 * box-motion.js — 오늘AI 박스·연결선·강조 모션 (HyperFrames + GSAP, 2026-10 제미나이 스킬 편에서 검증)
 *
 * 전제
 *   - 장면 루트: <div id="main"> 1920×1080, position:relative
 *   - 타임라인: 이 파일보다 먼저 `const tl = gsap.timeline({paused:true})` 를 만들고 window.__timelines.main = tl
 *   - 장면 단위: .clip[data-start][data-duration] (연결선·외곽선은 이 장면이 끝나면 자동으로 사라짐)
 *   - 캡처 창: .shot > .vp > .cam (img + svg). 캡처 위 강조는 svg 안의 .mk 요소
 *
 * 핵심 규칙 (왜 이렇게 했는지)
 *   1) 위치는 offsetLeft/Top(레이아웃)으로 재고, 웹폰트 로드 뒤·크기 변화 때 다시 잰다.
 *      → 로드 시점 측정은 글꼴이 바뀌면 높이가 달라져 테두리가 박스와 어긋났다.
 *   2) 테두리는 대상의 네 모서리 곡률을 그대로 따라 그린다(_rr). 한 가지 rx만 쓰면 말풍선 같은 박스와 어긋난다.
 *   3) 그리기 애니메이션은 pathLength=100 기준 dash → 크기가 바뀌어도 그리기 진행이 맞다.
 *   4) 펼치기(wipe)는 대상 곡률 + 그림자 여유(60px)를 포함한 둥근 inset으로, 끝나면 clip-path를 해제한다.
 *      → 네모 마스크는 그림자를 각지게 자르고, 남겨 두면 태그·뱃지가 잘린다.
 *   5) 연결선은 시작 전까지 숨긴다(둥근 선 끝이 점으로 먼저 보이는 문제). 간격 45px 미만이면 그리지 않고
 *      window.__skipped 에 기록한다(오타처럼 보이는 짧은 화살표 방지). 필요한 화살표가 빠졌는지는 검사로 확인한다.
 */
window.__timelines = window.__timelines || {};
const q = window.q || (s => document.querySelector(s));
const qa = window.qa || (s => Array.from(document.querySelectorAll(s)));
const NS = 'http://www.w3.org/2000/svg';
const BM = { line: '#E5E5E5', accent: '#FCA311', ease: { draw: 'power2.inOut', in: 'expo.out', out: 'power3.in' } };

function _rel(el) { const m = q('#main').getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - m.left, y: r.top - m.top, w: r.width, h: r.height }; }
function _lay(el) {
  if (!el || (!el.offsetParent && el.offsetWidth === 0)) return _rel(el);
  let x = 0, y = 0, e = el; const m = q('#main');
  while (e && e !== m) { x += e.offsetLeft || 0; y += e.offsetTop || 0; e = e.offsetParent; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
const _relayout = [];
function _watch(els, f) { _relayout.push(f); f(); if (window.ResizeObserver) { const ro = new ResizeObserver(() => f()); els.forEach(e => e && ro.observe(e)); } }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => _relayout.forEach(f => f()));
window.addEventListener('load', () => _relayout.forEach(f => f()));
function _clipEnd(el) { const c = el && el.closest && el.closest('.clip'); return c ? (+c.dataset.start) + (+c.dataset.duration) - .3 : null; }
function _radii(el, add) { const cs = getComputedStyle(el); return ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map(k => (parseFloat(cs[k]) || 0) + (add || 0)); }
function _rr(x, y, w, h, r) {
  const m = Math.min(w, h) / 2; const [a, b, c, d] = r.map(v => Math.max(0, Math.min(v, m)));
  return `M${x + a} ${y}H${x + w - b}A${b} ${b} 0 0 1 ${x + w} ${y + b}V${y + h - c}A${c} ${c} 0 0 1 ${x + w - c} ${y + h}H${x + d}A${d} ${d} 0 0 1 ${x} ${y + h - d}V${y + a}A${a} ${a} 0 0 1 ${x + a} ${y}Z`;
}

/** 대상 둘레에 테두리를 그렸다가(hold 후) 사라지게 한다. o: {c, w, pad, d, hold, z} */
function outline(el, t, o) {
  o = o || {}; const sv = document.createElementNS(NS, 'svg');
  sv.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:visible;pointer-events:none;z-index:' + (o.z || 46);
  const p = document.createElementNS(NS, 'path'); const pad = o.pad || 0;
  p.setAttribute('fill', 'none'); p.setAttribute('stroke', o.c || BM.line); p.setAttribute('stroke-width', o.w || 4); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('pathLength', '100');
  const place = () => { const r = _lay(el); let rad = _radii(el); if (rad.every(v => v === 0)) rad = [8, 8, 8, 8]; rad = rad.map(v => v + pad); p.setAttribute('d', _rr(r.x - pad, r.y - pad, r.w + 2 * pad, r.h + 2 * pad, rad)); };
  sv.appendChild(p); q('#main').appendChild(sv); _watch([el], place); p.style.strokeDasharray = '100 100';
  tl.set(sv, { opacity: 0 }, 0); tl.set(p, { strokeDashoffset: 100 }, 0); tl.set(sv, { opacity: 1 }, t);
  tl.to(p, { strokeDashoffset: 0, duration: o.d || .5, ease: BM.ease.draw }, t);
  let ht = t + (o.hold || .75); const ce = _clipEnd(el); if (ce !== null && ht > ce) ht = ce;
  tl.to(sv, { opacity: 0, duration: .35, ease: 'power1.out' }, ht); return sv;
}

/** 왼쪽에서 오른쪽으로 펼치기. 둥근 모서리와 그림자를 유지하고 끝나면 clip을 푼다. */
function wipeIn(el, t, d) {
  const E = 60, r = _radii(el, E).map(v => v + 'px').join(' '); d = d || .5;
  tl.fromTo(el, { opacity: 0, clipPath: `inset(-${E}px 100% -${E}px -${E}px round ${r})` },
    { opacity: 1, clipPath: `inset(-${E}px -${E}px -${E}px -${E}px round ${r})`, duration: d, ease: BM.ease.in }, t);
  tl.set(el, { clipPath: 'none' }, t + d + .02);
}

/** 선이 영역을 그린 뒤(약 70% 지점) 내용이 펼쳐진다. o.st: 여러 개일 때 시차 */
function dbox(sel, t, o) { o = o || {}; qa(sel).forEach((el, k) => { const tt = t + (o.st || 0) * k; outline(el, tt, o); wipeIn(el, tt + (o.d || .5) * .7); }); }

/** a → b 곡선 화살표. side 'h'(가로) | 'v'(세로). 장면이 끝나면 자동으로 사라진다. o: {c, w, d, until, dash, z} */
function link(a, b, t, o) {
  o = o || {}; const ea = q(a), eb = q(b); const side = o.side || 'h';
  if (o.until === undefined) { const ce = _clipEnd(ea); if (ce !== null) o.until = ce; }
  { const A = _lay(ea), B = _lay(eb); const gap = side === 'h' ? B.x - (A.x + A.w) : B.y - (A.y + A.h);
    if (gap < 45) { (window.__skipped = window.__skipped || []).push(a + ' -> ' + b + ' gap ' + Math.round(gap)); return null; } }
  const sv = document.createElementNS(NS, 'svg');
  sv.style.cssText = 'position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:visible;pointer-events:none;z-index:' + (o.z || 39);
  const p = document.createElementNS(NS, 'path'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', o.c || BM.line); p.setAttribute('stroke-width', o.w || 5); p.setAttribute('stroke-linecap', 'round');
  if (o.dash) p.setAttribute('stroke-dasharray', o.dash); else p.setAttribute('pathLength', '100');
  const ah = document.createElementNS(NS, 'path'); const ang = side === 'h' ? 0 : 90;
  ah.setAttribute('d', 'M-12 -10 L4 0 L-12 10'); ah.setAttribute('fill', 'none'); ah.setAttribute('stroke', o.c || BM.line); ah.setAttribute('stroke-width', o.w || 5); ah.setAttribute('stroke-linecap', 'round'); ah.setAttribute('stroke-linejoin', 'round');
  const place = () => { const A = _lay(ea), B = _lay(eb); let x1, y1, x2, y2;
    if (side === 'h') { x1 = A.x + A.w + 8; y1 = A.y + A.h / 2; x2 = B.x - 14; y2 = B.y + B.h / 2; } else { x1 = A.x + A.w / 2; y1 = A.y + A.h + 8; x2 = B.x + B.w / 2; y2 = B.y - 14; }
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    p.setAttribute('d', side === 'h' ? `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}` : `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`);
    ah.setAttribute('transform', `translate(${x2} ${y2}) rotate(${ang})`); };
  sv.appendChild(p); sv.appendChild(ah); q('#main').appendChild(sv); _watch([ea, eb], place);
  tl.set(p, { opacity: 0 }, 0); tl.set(p, { opacity: 1 }, t);
  if (!o.dash) { p.style.strokeDasharray = '100 100'; tl.set(p, { strokeDashoffset: 100 }, 0); tl.to(p, { strokeDashoffset: 0, duration: o.d || .5, ease: BM.ease.draw }, t); }
  else tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: .3 }, t);
  tl.set(ah, { opacity: 0 }, 0); tl.to(ah, { opacity: 1, duration: .15 }, t + (o.d || .5) - .1);
  if (o.until !== undefined) tl.to([p, ah], { opacity: 0, duration: .25 }, o.until);
  return sv;
}

/**
 * 캡처 위 강조. 동그라미 대신 형광펜 박스(rect.mk)와 형광펜 밑줄(path.mk)을 쓴다.
 *   박스:  <rect class="mk" x y width height rx="10" style="fill:#FCA311;fill-opacity:0"/>  (OCR로 잰 글자 영역)
 *   밑줄:  <path class="mk hl" d="M x1 y H x2"/>  (stroke-width 16~22, stroke-opacity .55, 글자 뒤)
 * 테두리를 먼저 그리고, 채움은 테두리가 끝난 뒤 옅게 차오른다. 카메라(look)가 멈춘 뒤 0.2초 이상 지나서 호출한다.
 */
function mark(sel, t, d) {
  d = d || .5;
  qa(sel).forEach(m => {
    const n = m.getTotalLength(); m.style.strokeDasharray = n + ' ' + n;
    tl.set(m, { strokeDashoffset: n, opacity: 0 }, 0); tl.set(m, { opacity: 1 }, t);
    tl.to(m, { strokeDashoffset: 0, duration: d, ease: 'power3.out' }, t);
    if (m.tagName.toLowerCase() === 'rect') tl.fromTo(m, { fillOpacity: 0 }, { fillOpacity: .16, duration: .35, ease: 'power1.out' }, t + d * .8);
  });
}

/** 여러 요소를 순서대로 날려 보낸다(한꺼번에 사라지지 않게). */
function flyOut(sel, t, o) { o = o || {}; tl.to(sel, { x: o.x === undefined ? -1500 : o.x, y: o.y === undefined ? -120 : o.y, rotate: o.r === undefined ? -10 : o.r, opacity: 0, duration: o.d || .55, ease: BM.ease.out, stagger: o.st === undefined ? .08 : o.st }, t); }
