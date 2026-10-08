import React from "react";

// Purely decorative: no fake processing, progress, or live-data indicators.
export default function AIOrb({ compact = false }) {
  return (
    <div className={`ai-orb ${compact ? "compact" : ""}`} aria-hidden="true">
      <div className="ai-orb-halo" />
      <div className="ai-orb-ring ring-one" />
      <div className="ai-orb-ring ring-two" />
      <div className="ai-orb-sphere">
        <i />
        <b />
        <span />
      </div>
      <div className="ai-orb-satellite" />
    </div>
  );
}
