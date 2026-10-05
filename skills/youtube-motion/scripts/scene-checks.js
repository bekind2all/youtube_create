#!/usr/bin/env node
/*
 * scene-checks.js — 렌더 전에 HyperFrames 구간을 0.5초 간격으로 훑는 자동 검사 5종.
 *
 *   node scene-checks.js <구간폴더 또는 index.html> [...]  [--only=mark,contrast,clip,skip,empty]
 *
 *   mark      강조(.mk)가 캡처 창(.vp) 안에 있고 콜아웃·카드에 가리지 않는가
 *   contrast  보이는 글자와 실제 뒤 배경의 대비가 3:1 이상인가 (배경색을 바꾼 뒤 필수)
 *   clip      글자·박스가 부모의 clip-path/overflow나 화면 가장자리에 잘리지 않는가
 *   skip      link()가 간격이 좁아 그리지 않은 화살표 목록 (필요한 화살표가 빠졌는지 확인)
 *   empty     고정 높이 박스에 내용 아래로 큰 빈 영역이 남는가
 *
 * 전제: #main(1920×1080), window.__timelines.main(GSAP), .clip[data-start][data-duration],
 *       캡처는 .shot > .vp > .cam, 강조는 .mk, 생략된 화살표는 window.__skipped (assets/motion/box-motion.js).
 * 오탐: 들어오기 전 화면 밖에 대기 중인 요소, 일부러 잘라 둔 썸네일, 형제 요소를 감싸는 점선 틀은
 *       결과를 보고 판단한다. 통과해도 최종 MP4를 눈으로 확인한다.
 * Chrome: CHROME_PATH 환경 변수, 없으면 ~/.cache/puppeteer/chrome 의 최신 버전을 쓴다.
 */
const path = require('path'), fs = require('fs'), os = require('os');
const SKILL = path.resolve(__dirname, '..');
let puppeteer;
try { puppeteer = require(path.join(SKILL, 'node_modules', 'puppeteer-core')); } catch (e) { puppeteer = require('puppeteer-core'); }

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if (!fs.existsSync(base)) throw new Error('Chrome not found: set CHROME_PATH or run `npx hyperframes doctor` once');
  const vers = fs.readdirSync(base).sort().reverse();
  for (const v of vers) for (const sub of ['chrome-win64/chrome.exe', 'chrome-linux64/chrome', 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing']) {
    const p = path.join(base, v, sub); if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome binary not found under ' + base);
}

// ---- page-side checks (run inside the composition) ----
function pageChecks(only) {
  const tl = window.__timelines.main, D = tl.duration(), out = { mark: {}, contrast: {}, clip: {}, empty: {}, skip: window.__skipped || [] };
  const area = r => Math.max(0, r.width) * Math.max(0, r.height);
  const inter = (a, c) => Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left)) * Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top));
  const inClip = e => { if (!e.classList.contains('clip') || e.dataset.start === undefined) return true; const st = +e.dataset.start, du = +e.dataset.duration; return tl.time() >= st && tl.time() < st + du; };
  const vis = (el, min) => { for (let e = el; e && e.id !== 'main'; e = e.parentElement) { const cs = getComputedStyle(e); if (+cs.opacity < (min || .5) || cs.display === 'none' || cs.visibility === 'hidden' || !inClip(e)) return false; } return true; };
  const rgb = c => (c.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number);
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const ratio = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mainBg = rgb(getComputedStyle(document.getElementById('main')).backgroundColor);
  const bgOf = el => { for (let e = el; e && e.id !== 'main'; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length < 4 || c[3] > .5) return c; } return mainBg; };
  const hasText = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  const name = e => (e.id || e.tagName.toLowerCase() + '.' + (typeof e.className === 'string' ? e.className : '')) + ' "' + (e.textContent || '').trim().slice(0, 24) + '"';
  const rec = (bucket, k, t, extra) => { const o = bucket[k] || (bucket[k] = Object.assign({ from: +t.toFixed(1), n: 0 }, extra)); o.to = +t.toFixed(1); o.n++; return o; };
  const skipBox = e => e.id === 'main' || e.classList.contains('clip') || e.classList.contains('scene') || e.classList.contains('vp') || e.classList.contains('cam') || e.tagName === 'BODY';
  for (let t = .3; t < D; t += .5) {
    tl.seek(t, false);
    if (only.mark) document.querySelectorAll('.mk').forEach(m => {
      if (!vis(m, .3)) return; const r0 = m.getBoundingClientRect();
      const r = { left: r0.left, right: r0.right, top: r0.top - (r0.height < 8 ? 4 : 0), bottom: r0.bottom + (r0.height < 8 ? 4 : 0) }; r.width = r.right - r.left; r.height = r.bottom - r.top;
      const vp = m.closest('.vp'); const v = vp ? vp.getBoundingClientRect() : { left: 0, top: 0, right: 1920, bottom: 1080 };
      const inside = inter(r, v) / (area(r) || 1); let cover = 0;
      document.querySelectorAll('.co,.kc,.stamp,.card').forEach(c => { if (c.contains(m) || !vis(c)) return; cover = Math.max(cover, inter(r, c.getBoundingClientRect()) / (area(r) || 1)); });
      const o = rec(out.mark, m.id || '?', t, { minInside: 1, maxCover: 0 }); o.minInside = Math.min(o.minInside, +inside.toFixed(2)); o.maxCover = Math.max(o.maxCover, +cover.toFixed(2));
    });
    if (only.contrast || only.clip) for (const el of document.querySelectorAll('#main *')) {
      if (el.closest('.cam') || el.closest('.chap') || el.closest('.bgwrap')) continue;
      const isImg = el.tagName === 'IMG'; if (!hasText(el) && !isImg) continue; if (!vis(el)) continue;
      const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
      if (only.contrast && hasText(el)) { const cr = ratio(rgb(getComputedStyle(el).color), bgOf(el)); if (cr < 3) rec(out.contrast, name(el), t, { ratio: +cr.toFixed(2) }); }
      if (only.clip && !el.closest('.caps')) {
        let cut = (r.left < -2 || r.top < -2 || r.right > 1922 || r.bottom > 1082) ? 'frame' : null;
        for (let a = el.parentElement; a && !cut && !skipBox(a); a = a.parentElement) {
          const cs = getComputedStyle(a); if (cs.clipPath === 'none' && cs.overflow !== 'hidden' && cs.overflowX !== 'hidden' && cs.overflowY !== 'hidden') continue;
          const qd = a.getBoundingClientRect(); if (r.left < qd.left - 2 || r.top < qd.top - 2 || r.right > qd.right + 2 || r.bottom > qd.bottom + 2) cut = (cs.clipPath !== 'none' ? 'clip:' : 'overflow:') + (a.id || a.className);
        }
        if (cut) rec(out.clip, name(el) + ' ' + cut, t);
      }
    }
    if (only.empty && Math.round(t * 2) % 2 === 0) for (const el of document.querySelectorAll('#main *')) {
      if (skipBox(el) || el.closest('.cam') || el.closest('.chap') || el.closest('.bgwrap') || el.closest('.caps') || el.classList.contains('shot') || /^(TD|TH|TABLE|svg|path)$/i.test(el.tagName)) continue;
      const cs = getComputedStyle(el); const bg = rgb(cs.backgroundColor); if (!((bg.length < 4 || bg[3] > .3) || parseFloat(cs.borderTopWidth) >= 2)) continue;
      if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (r.width < 120 || r.height < 120) continue;
      let bottom = r.top; el.querySelectorAll('*').forEach(k => { const qd = k.getBoundingClientRect(); if (qd.width > 0 && qd.height > 0 && +getComputedStyle(k).opacity > 0) bottom = Math.max(bottom, qd.bottom); });
      if (hasText(el)) { const rg = document.createRange(); rg.selectNodeContents(el); bottom = Math.max(bottom, rg.getBoundingClientRect().bottom); }
      if (bottom === r.top) continue;
      const empty = r.bottom - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth) - bottom;
      if (empty > 70 && empty / r.height > .22) rec(out.empty, name(el), t, { h: Math.round(r.height), empty: Math.round(empty) });
    }
  }
  return out;
}

(async () => {
  const args = process.argv.slice(2); const onlyArg = (args.find(a => a.startsWith('--only=')) || '').slice(7);
  const all = ['mark', 'contrast', 'clip', 'skip', 'empty']; const only = {}; (onlyArg ? onlyArg.split(',') : all).forEach(k => only[k] = true);
  const targets = args.filter(a => !a.startsWith('--')).map(a => fs.statSync(a).isDirectory() ? path.join(a, 'index.html') : a);
  if (!targets.length) { console.error('usage: node scene-checks.js <segment dir|index.html>... [--only=mark,contrast,clip,skip,empty]'); process.exit(2); }
  const b = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--allow-file-access-from-files'] });
  let problems = 0;
  for (const f of targets) {
    const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
    await p.goto('file:///' + path.resolve(f).split(path.sep).join('/'), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts && document.fonts.ready); await new Promise(r => setTimeout(r, 500));
    const res = await p.evaluate(pageChecks, only); await p.close();
    const lines = [];
    if (only.mark) Object.entries(res.mark).filter(([, o]) => o.minInside < .97 || o.maxCover > .05).forEach(([k, o]) => lines.push(`mark     ${k} ${o.from}-${o.to}s inside ${o.minInside} cover ${o.maxCover}`));
    if (only.contrast) Object.entries(res.contrast).filter(([, o]) => o.n >= 2).forEach(([k, o]) => lines.push(`contrast ${o.from}-${o.to}s ratio ${o.ratio} ${k}`));
    if (only.clip) Object.entries(res.clip).filter(([, o]) => o.n >= 2).forEach(([k, o]) => lines.push(`clip     ${o.from}-${o.to}s ${k}`));
    if (only.skip) res.skip.forEach(s => lines.push(`skip     ${s}`));
    if (only.empty) Object.entries(res.empty).forEach(([k, o]) => lines.push(`empty    t${o.from} h${o.h} empty${o.empty} ${k}`));
    problems += lines.length;
    console.log(path.basename(path.dirname(path.resolve(f))), lines.length ? '' : 'ok'); lines.forEach(l => console.log('   ', l));
  }
  await b.close(); process.exit(problems ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(2); });
