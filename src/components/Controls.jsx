import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Controls.css';

const Slider = React.memo(({ label, paramKey, initialValue, paramsRef, updateParam }) => {
  const sliderRef = useRef(null);
  const [localValue, setLocalValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);

  const updateSliderValue = useCallback((e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newValue = x / rect.width;
    setLocalValue(newValue);
    updateParam(paramKey, newValue);
  }, [paramKey, updateParam]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    updateSliderValue(e);
  }, [updateSliderValue]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        updateSliderValue(e);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateSliderValue]);

  return (
    <div className="control-item">
      <div className="control-label">{label}</div>
      <div
        ref={sliderRef}
        className="slider-track"
        onMouseDown={handleMouseDown}
      >
        <div
          className="slider-fill"
          style={{ width: `${localValue * 100}%` }}
        />
        <div
          className="slider-thumb"
          style={{ left: `${localValue * 100}%` }}
        >
          <div className="slider-glow" />
          <div className="slider-ripple" />
        </div>
      </div>
      <div className="control-value">{Math.round(localValue * 100)}</div>
    </div>
  );
});

Slider.displayName = 'Slider';

const Controls = ({ params, paramsRef, updateParam }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <div
        className={`controls-trigger ${visible ? 'active' : ''}`}
        onClick={() => setVisible(!visible)}
      >
        <div className="trigger-ripple" />
        <div className="trigger-glow" />
        <div className="trigger-inner">
          <div className="trigger-dot"></div>
          <div className="trigger-dot"></div>
          <div className="trigger-dot"></div>
        </div>
      </div>

      <div className={`controls-panel ${visible ? 'visible' : ''}`}>
        <div className="controls-bg">
          <div className="cloud-layer cloud-1" />
          <div className="cloud-layer cloud-2" />
          <div className="cloud-layer cloud-3" />
        </div>

        <div className="controls-header">
          <div className="header-shimmer" />
          ephemeral
        </div>

        <div className="controls-content">
          <Slider
            label="complexity"
            paramKey="complexity"
            initialValue={params.complexity}
            paramsRef={paramsRef}
            updateParam={updateParam}
          />
          <Slider
            label="flow"
            paramKey="flow"
            initialValue={params.flow}
            paramsRef={paramsRef}
            updateParam={updateParam}
          />
          <Slider
            label="color shift"
            paramKey="colorShift"
            initialValue={params.colorShift}
            paramsRef={paramsRef}
            updateParam={updateParam}
          />
          <Slider
            label="density"
            paramKey="density"
            initialValue={params.density}
            paramsRef={paramsRef}
            updateParam={updateParam}
          />
          <Slider
            label="growth"
            paramKey="growth"
            initialValue={params.growth}
            paramsRef={paramsRef}
            updateParam={updateParam}
          />

          <div className="control-item">
            <div className="control-label">audio</div>
            <button
              className={`audio-toggle ${params.audioEnabled ? 'active' : ''}`}
              onClick={() => updateParam('audioEnabled', !params.audioEnabled)}
            >
              <div className="toggle-ripple" />
              <span>{params.audioEnabled ? 'on' : 'off'}</span>
            </button>
          </div>

          <div className="control-hint">
            generative ambient soundscapes - click to enable
          </div>
        </div>
      </div>
    </>
  );
};

export default Controls;
