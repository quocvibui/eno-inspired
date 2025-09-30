import React, { useState, useRef, useEffect } from 'react';
import './Controls.css';

const Controls = ({ params, paramsRef, updateParam }) => {
  const [visible, setVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(null);

  const Slider = ({ label, paramKey, value }) => {
    const sliderRef = useRef(null);
    const [localValue, setLocalValue] = useState(value);

    const handleMouseDown = (e) => {
      setIsDragging(paramKey);
      updateSliderValue(e);
    };

    const updateSliderValue = (e) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const newValue = x / rect.width;
      setLocalValue(newValue);
      updateParam(paramKey, newValue);
    };

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (isDragging === paramKey) {
          updateSliderValue(e);
        }
      };

      const handleMouseUp = () => {
        if (isDragging === paramKey) {
          setIsDragging(null);
        }
      };

      if (isDragging === paramKey) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, paramKey]);

    // Sync with paramsRef when not dragging
    useEffect(() => {
      if (!isDragging && paramsRef) {
        setLocalValue(paramsRef.current[paramKey]);
      }
    }, [isDragging, paramKey, paramsRef]);

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
  };

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
          <Slider label="complexity" paramKey="complexity" value={params.complexity} />
          <Slider label="flow" paramKey="flow" value={params.flow} />
          <Slider label="color shift" paramKey="colorShift" value={params.colorShift} />
          <Slider label="density" paramKey="density" value={params.density} />
          <Slider label="growth" paramKey="growth" value={params.growth} />

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
