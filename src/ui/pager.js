// Paged panels: instead of scrolling, a panel's content flows into fixed-height columns (CSS multi-column
// layout) and the reader steps through them with back and forward buttons. One page shows one column on
// narrow panels and up to three side by side on wide ones; the stride between pages is always the panel
// width plus one gap, so text, tables and card lists all split cleanly without any per-panel code.
import { ico } from './icons.js';

const GAP = 16;

/** Markup for a paged panel wrapping `inner`. Call initPager on the element once it is in the DOM. */
export function pagerHTML(inner, cls = '') {
  return `<div class="pager ${cls}">
    <div class="pgview"><div class="pgcol">${inner}<i class="pgend"></i></div></div>
    <div class="pgbar"><button class="pgbtn prev" title="Previous page">${ico('pagePrev', 18)}</button><span class="pgnum"></span><button class="pgbtn next" title="Next page">${ico('pageNext', 18)}</button></div>
  </div>`;
}

/**
 * Lay out and wire a paged panel. `focus` is a selector for an element whose page should open first.
 * Returns { go(page), layout(), page, pages }.
 */
export function initPager(el, { focus = null } = {}) {
  if (!el) return null;
  const view = el.querySelector('.pgview'), col = el.querySelector('.pgcol'), end = el.querySelector('.pgend');
  const num = el.querySelector('.pgnum'), prev = el.querySelector('.pgbtn.prev'), next = el.querySelector('.pgbtn.next');
  const st = { page: 0, pages: 1, cols: 1, stride: 0 };
  let focusSel = focus;
  const columnOf = (node) => {
    const cw = (view.clientWidth - GAP * (st.cols - 1)) / st.cols;
    const r = node.getBoundingClientRect(), c = col.getBoundingClientRect();
    let idx = Math.round((r.left - c.left) / (cw + GAP));
    if (idx > 0 && node === end && Math.abs(r.top - c.top) < 2) idx -= 1; // sentinel pushed to an empty column: content ended in the previous one
    return Math.max(0, idx);
  };
  const show = () => {
    st.page = Math.max(0, Math.min(st.pages - 1, st.page));
    col.style.transform = `translateX(${-st.page * st.stride}px)`;
    num.textContent = `${st.page + 1} / ${st.pages}`;
    prev.disabled = st.page === 0; next.disabled = st.page >= st.pages - 1;
    el.classList.toggle('single', st.pages === 1);
  };
  const layout = () => {
    const w = view.clientWidth, h = view.clientHeight;
    if (!w || !h) return;
    st.cols = Math.max(1, Math.min(3, Math.floor(w / 340)));
    const cw = (w - GAP * (st.cols - 1)) / st.cols;
    st.stride = w + GAP;
    col.style.width = `${w}px`; col.style.height = `${h}px`;
    col.style.columnWidth = `${cw}px`; col.style.columnGap = `${GAP}px`;
    st.pages = Math.floor(columnOf(end) / st.cols) + 1;
    if (focusSel) { const f = col.querySelector(focusSel); if (f) st.page = Math.floor(columnOf(f) / st.cols); focusSel = null; }
    show();
  };
  const go = (p) => { st.page = p; show(); };
  prev.onclick = () => go(st.page - 1);
  next.onclick = () => go(st.page + 1);
  // swipe between pages; swallow the gesture so parent swipes (faction carousel) do not also fire
  let sx = null, sy = null;
  view.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; if (st.pages > 1) e.stopPropagation(); });
  view.addEventListener('pointerup', (e) => {
    if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { go(st.page + (dx < 0 ? 1 : -1)); e.stopPropagation(); }
  });
  view.addEventListener('scroll', () => { view.scrollLeft = 0; view.scrollTop = 0; }); // focus() can scroll a clipped box; pages must only move by paging
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(view);
  layout();
  return { go, layout, get page() { return st.page; }, get pages() { return st.pages; } };
}
