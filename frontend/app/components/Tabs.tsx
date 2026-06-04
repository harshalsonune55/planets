"use client";

import { useEffect, useRef, useState } from "react";

type Tab = { id: string; label: string };
type Props = { tabs: Tab[]; active: string; onChange: (id: string) => void };

export default function Tabs({ tabs, active, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, top: 0, height: 0 });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeBtn = list.querySelector(`[data-tab="${active}"]`) as HTMLElement;
    if (!activeBtn) return;
    setIndicator({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      top: activeBtn.offsetTop,
      height: activeBtn.offsetHeight,
    });
  }, [active, tabs]);

  return (
    <div className="tab-list" ref={listRef}>
      <div
        className="tab-indicator"
        style={{
          left: indicator.left,
          width: indicator.width,
          top: indicator.top,
          height: indicator.height,
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          className={`tab-btn ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
