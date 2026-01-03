import React from "react";
import "./terminal-frame.css";

export default function TerminalFrame({ title = "Admin Console", children }) {
  return (
    <div className="termFrame" role="region" aria-label="terminal-window">
      <div className="termTopbar">
        <div className="termTitle">{title}</div>
        <div className="termWinBtns" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="termBody">{children}</div>
    </div>
  );
}
