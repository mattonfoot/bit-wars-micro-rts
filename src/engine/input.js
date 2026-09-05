// Unified touch + mouse gesture recogniser built on Pointer Events.
// Emits: tap, doubleTap, longPress, dragStart/drag/dragEnd (single pointer), pinch (two pointers), wheel, rightClick.
export class Input {
  constructor(el, handlers) {
    this.el = el; this.h = handlers;
    this.pointers = new Map();
    this.drag = null; this.pinch = null;
    this.lastTap = { t: 0, x: 0, y: 0 };
    this.longTimer = 0;
    this.suppressTap = false;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.move(e));
    el.addEventListener('pointerup', (e) => this.up(e));
    el.addEventListener('pointercancel', (e) => this.up(e, true));
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.h.wheel?.(e.deltaY, e.offsetX, e.offsetY); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  pos(e) { const r = this.el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  down(e) {
    this.el.setPointerCapture?.(e.pointerId);
    const [x, y] = this.pos(e);
    this.pointers.set(e.pointerId, { x, y, sx: x, sy: y, t: performance.now(), button: e.button, type: e.pointerType });
    if (this.pointers.size === 1) {
      this.drag = null; this.suppressTap = false;
      clearTimeout(this.longTimer);
      if (e.button === 0 || e.pointerType === 'touch') {
        this.longTimer = setTimeout(() => {
          if (this.pointers.size === 1 && !this.drag) { this.suppressTap = true; this.h.longPress?.(x, y); }
        }, 480);
      }
    } else if (this.pointers.size === 2) {
      clearTimeout(this.longTimer);
      if (this.drag) { this.h.dragEnd?.(this.drag.x, this.drag.y, this.drag, true); this.drag = null; }
      const [a, b] = [...this.pointers.values()];
      this.pinch = { d: Math.hypot(b.x - a.x, b.y - a.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      this.suppressTap = true;
    }
  }
  move(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) { this.h.hover?.(...this.pos(e)); return; }
    const [x, y] = this.pos(e);
    p.x = x; p.y = y;
    if (this.pointers.size === 2 && this.pinch) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(b.x - a.x, b.y - a.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      this.h.pinch?.(d / (this.pinch.d || 1), cx, cy, cx - this.pinch.cx, cy - this.pinch.cy);
      this.pinch = { d, cx, cy };
      return;
    }
    if (this.pointers.size !== 1) return;
    if (!this.drag) {
      if (Math.hypot(x - p.sx, y - p.sy) > (p.type === 'touch' ? 9 : 4)) {
        clearTimeout(this.longTimer);
        this.drag = { sx: p.sx, sy: p.sy, x, y, button: p.button, type: p.type, shift: e.shiftKey };
        this.h.dragStart?.(p.sx, p.sy, this.drag);
      }
    } else {
      this.drag.x = x; this.drag.y = y;
      this.h.drag?.(x, y, x - p.x + (x - x), y - p.y, this.drag, p);
    }
    // update previous pos AFTER computing delta
    p.px = x; p.py = y;
  }
  up(e, cancelled = false) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const [x, y] = this.pos(e);
    this.pointers.delete(e.pointerId);
    clearTimeout(this.longTimer);
    if (this.pointers.size === 1) { this.pinch = null; this.suppressTap = true; const rest = [...this.pointers.values()][0]; rest.sx = rest.x; rest.sy = rest.y; return; }
    if (this.pointers.size > 0) return;
    if (this.drag) { this.h.dragEnd?.(x, y, this.drag, cancelled); this.drag = null; return; }
    if (cancelled || this.suppressTap) { this.suppressTap = false; return; }
    const now = performance.now();
    if (p.button === 2) { this.h.rightClick?.(x, y); return; }
    if (p.button === 1) return;
    const dbl = now - this.lastTap.t < 320 && Math.hypot(x - this.lastTap.x, y - this.lastTap.y) < 24;
    this.lastTap = { t: dbl ? 0 : now, x, y };
    if (dbl) this.h.doubleTap?.(x, y, e); else this.h.tap?.(x, y, e);
  }
}
