'use client';
import { useRef, type PointerEvent } from 'react';
import { boundedRect } from '@/lib/editor-math.mjs';
import type { Rect } from '@/lib/processing';
export function RegionEditor({
  url,
  rect,
  onChange,
  kind,
  label,
}: {
  url: string;
  rect: Rect;
  onChange: (r: Rect) => void;
  kind: string;
  label: string;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    rect: Rect;
    resize: boolean;
  } | null>(null);
  function start(e: PointerEvent<HTMLElement>, resize = false) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { x: e.clientX, y: e.clientY, rect, resize };
  }
  function move(e: PointerEvent<HTMLElement>) {
    const g = gesture.current,
      b = surface.current?.getBoundingClientRect();
    if (!g || !b) return;
    const dx = ((e.clientX - g.x) / b.width) * 100,
      dy = ((e.clientY - g.y) / b.height) * 100;
    onChange(
      boundedRect(
        g.resize
          ? {
              ...g.rect,
              w: Math.min(100 - g.rect.x, g.rect.w + dx),
              h: Math.min(100 - g.rect.y, g.rect.h + dy),
            }
          : { ...g.rect, x: g.rect.x + dx, y: g.rect.y + dy },
      ),
    );
  }
  return (
    <div className="region-wrap" ref={surface}>
      <img src={url} alt="" draggable={false} />
      <div
        className={`selection-box ${kind}`}
        style={{
          left: `${rect.x}%`,
          top: `${rect.y}%`,
          width: `${rect.w}%`,
          height: `${rect.h}%`,
        }}
        role="group"
        aria-label={label}
        tabIndex={0}
        onPointerDown={(e) => start(e)}
        onPointerMove={move}
        onPointerUp={() => (gesture.current = null)}
        onPointerCancel={() => (gesture.current = null)}
        onKeyDown={(e) => {
          const amount = e.shiftKey ? 5 : 1;
          if (
            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
          )
            return;
          e.preventDefault();
          onChange(
            boundedRect({
              ...rect,
              x:
                rect.x +
                (e.key === 'ArrowRight'
                  ? amount
                  : e.key === 'ArrowLeft'
                    ? -amount
                    : 0),
              y:
                rect.y +
                (e.key === 'ArrowDown'
                  ? amount
                  : e.key === 'ArrowUp'
                    ? -amount
                    : 0),
            }),
          );
        }}
      >
        <span className="selection-grid" />
        <span
          className="resize-handle"
          onPointerDown={(e) => start(e, true)}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
