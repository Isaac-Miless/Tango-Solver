import React from 'react'
import './StepHistoryPanel.css'

function StepHistoryPanel({ steps, selectedStepIndex, onStepClick }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="step-history-panel">
        <h3 className="step-history-title">Solving Steps</h3>
        <div className="step-history-empty">
          No steps yet. Start solving to see steps here.
        </div>
      </div>
    )
  }

  return (
    <div className="step-history-panel">
      <h3 className="step-history-title">Solving Steps</h3>
      <div className="step-history-list">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step-history-item ${selectedStepIndex === index ? 'step-history-item-selected' : ''}`}
            onClick={() => onStepClick(index)}
          >
            <div className="step-history-item-number">Step {index + 1}</div>
            <div className="step-history-item-rule">{step.ruleName}</div>
            <div className="step-history-item-preview">
              Cell ({step.resultCell[0] + 1}, {step.resultCell[1] + 1}) → {step.resultValue === 'sun' ? '☀️' : '🌙'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StepHistoryPanel
