/* Call after local fonts load, before transforms/timeline setup. Inline in a
 * component scope or import with the host project's normal bundler. */
function fitTextUnderlines(root) {
  for (const svg of root.querySelectorAll('.anchored-underline')) {
    const text = svg.parentElement.querySelector('.text-target');
    const path = svg.querySelector('path');
    if (!text || !path) throw new Error('Underline needs a text target and path');
    // One untransformed inline-block phrase. Separate wrapped lines first.
    const width = text.getBoundingClientRect().width;
    if (!(width > 0)) throw new Error('Underline target is hidden or unmeasured');
    const stroke = parseFloat(getComputedStyle(path).strokeWidth) || 9;
    const inset = stroke / 2 + 3;
    if (width <= 2 * inset) throw new Error('Underline target is too narrow');
    // Same CSS-pixel and SVG units prevent scaled dash lengths from breaking.
    svg.setAttribute('viewBox', `0 0 ${width} 27`);
    path.setAttribute('d', `M${inset} 17 Q${width / 2} 10 ${width - inset} 15`);
  }
}
