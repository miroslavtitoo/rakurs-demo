import { useRef } from "react";

// Shared tap/hold/swipe behavior for onboarding and informational stories.
export function useStoryGestures(change, hold) {
  const start = useRef(null), suppressClick = useRef(false);
  const interactive = (target) => target.closest("button,a,input,textarea,select,summary");
  return {
    onPointerDown(e) {
      if (e.button !== 0 || interactive(e.target)) return;
      suppressClick.current = false;
      start.current = { x: e.clientX, y: e.clientY, at: performance.now() };
      hold(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerUp(e) {
      hold(false);
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = e.clientX - from.x, dy = e.clientY - from.y;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        suppressClick.current = true;
        change(dx < 0 ? 1 : -1);
      } else if (Math.abs(dx) > 12 || Math.abs(dy) > 12 || performance.now() - from.at > 500) {
        suppressClick.current = true;
      }
    },
    onPointerCancel() { start.current = null; suppressClick.current = true; hold(false); },
    onClick(e) {
      if (interactive(e.target)) return;
      if (suppressClick.current) { suppressClick.current = false; return; }
      const rect = e.currentTarget.getBoundingClientRect();
      change(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
    },
    onDragStart(e) { e.preventDefault(); },
  };
}
