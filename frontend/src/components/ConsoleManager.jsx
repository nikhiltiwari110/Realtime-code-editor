// ConsoleManager.jsx - Enhanced Console with Modern Design

import React, { useState, useEffect } from "react";

const ConsoleManager = ({
  isConsoleVisible,
  setIsConsoleVisible,
  consoleHeight,
  handleMouseDown,
  isInputOpen,
  setIsInputOpen,
  input,
  setInput,
  isOutputOpen,
  setIsOutputOpen,
  consoleOutput,
  setConsoleOutput,
}) => {
  const [inputLines, setInputLines] = useState(0);
  const [outputLines, setOutputLines] = useState(0);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setInputLines(input.split('\n').length);
  }, [input]);

  useEffect(() => {
    setOutputLines(consoleOutput.split('\n').length);
  }, [consoleOutput]);

  const handleClearOutput = (e) => {
    e.stopPropagation();
    setIsClearing(true);
    setTimeout(() => {
      setConsoleOutput("");
      setIsClearing(false);
    }, 300);
  };

  if (!isConsoleVisible) {
    return (
      <button
        className="show-console-btn-small"
        onClick={setIsConsoleVisible}
        title="Show Console"
      >
        <span className="console-show-icon-small">⚙️</span>
        <span className="console-show-text-small">Show Console</span>
        <span className="console-show-arrow-small">↑</span>
      </button>
    );
  }

  return (
    <>
      {/* Resize Handle */}
      <div className="resize-handle" onMouseDown={handleMouseDown}>
        <div className="resize-bar"></div>
        <div className="resize-hint">Drag to resize</div>
      </div>

      <div className="console-wrapper" style={{ height: `${consoleHeight}px` }}>
        {/* Console Header */}
        <div className="console-main-header">
          <div className="console-header-left">
            <div className="console-main-title">
              <span className="console-icon">⚙️</span>
              <span className="console-title-text">Console Panel</span>
            </div>
            <div className="console-stats">
              <span className="stat-badge">
                <span className="stat-icon">📥</span>
                <span>{inputLines} lines</span>
              </span>
              <span className="stat-badge">
                <span className="stat-icon">📟</span>
                <span>{outputLines} lines</span>
              </span>
            </div>
          </div>
          <button
            className="toggle-console-btn"
            onClick={setIsConsoleVisible}
            title="Hide Console"
          >
            <span className="toggle-icon">✕</span>
            <span>Hide</span>
          </button>
        </div>

        <div className="console-sections">
          {/* Input Section */}
          <div className={`console-section ${isInputOpen ? 'open' : 'closed'}`}>
            <div
              className="console-section-header"
              onClick={setIsInputOpen}
            >
              <span className="section-icon">{isInputOpen ? "▼" : "▶"}</span>
              <span className="section-icon-emoji">📥</span>
              <span className="section-title">Input</span>
              <span className="section-badge">{inputLines} lines</span>
              <span className="section-hint">Enter values, one per line</span>
            </div>
            {isInputOpen && (
              <div className="console-section-content">
                <div className="input-wrapper">
                  <div className="input-line-numbers">
                    {Array.from({ length: Math.max(inputLines, 5) }, (_, i) => (
                      <div key={i} className="line-number">{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input here...&#10;Example:&#10;5&#10;10&#10;Hello World"
                    className="input-textarea"
                  />
                </div>
                <div className="input-footer">
                  <span className="input-info">
                    <span className="info-icon">💡</span>
                    <span>Tip: Each line is treated as separate input</span>
                  </span>
                  <button 
                    className="clear-input-btn"
                    onClick={() => setInput("")}
                    disabled={!input}
                  >
                    <span>🗑️</span>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className={`console-section ${isOutputOpen ? 'open' : 'closed'}`}>
            <div
              className="console-section-header"
              onClick={setIsOutputOpen}
            >
              <span className="section-icon">{isOutputOpen ? "▼" : "▶"}</span>
              <span className="section-icon-emoji">📟</span>
              <span className="section-title">Output</span>
              <span className="section-badge">{outputLines} lines</span>
              {consoleOutput && (
                <button
                  className={`clear-output-btn ${isClearing ? 'clearing' : ''}`}
                  onClick={handleClearOutput}
                  title="Clear Output"
                >
                  <span className="clear-icon">🗑️</span>
                  <span>Clear</span>
                </button>
              )}
            </div>
            {isOutputOpen && (
              <div className="console-section-content">
                <div className={`output-wrapper ${!consoleOutput ? 'empty' : ''}`}>
                  {consoleOutput ? (
                    <div className="output-display">
                      {consoleOutput}
                    </div>
                  ) : (
                    <div className="output-placeholder">
                      <div className="placeholder-icon">🚀</div>
                      <div className="placeholder-text">Run your code to see output...</div>
                      <div className="placeholder-hint">Press the Run button or use Ctrl+Enter</div>
                    </div>
                  )}
                </div>
                {consoleOutput && (
                  <div className="output-footer">
                    <span className="output-info">
                      <span className="info-icon">✓</span>
                      <span>Execution completed</span>
                    </span>
                    <span className="output-stats">
                      {consoleOutput.length} characters
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsoleManager;