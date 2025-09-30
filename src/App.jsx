import React, { useState, useRef, useCallback } from 'react';
import GenerativeVisual from './components/GenerativeVisual';
import Controls from './components/Controls';
import './App.css';

function App() {
  const paramsRef = useRef({
    complexity: 0.5,
    flow: 0.6,
    colorShift: 0.4,
    density: 0.5,
    growth: 0.3,
    audioEnabled: false,
  });

  const [params, setParams] = useState(paramsRef.current);

  const updateParam = useCallback((key, value) => {
    paramsRef.current = { ...paramsRef.current, [key]: value };
    // Only update state for audio toggle to avoid re-renders during dragging
    if (key === 'audioEnabled') {
      setParams(paramsRef.current);
    }
  }, []);

  const getParams = useCallback(() => paramsRef.current, []);

  return (
    <div className="app">
      <GenerativeVisual paramsRef={paramsRef} getParams={getParams} />
      <Controls params={params} paramsRef={paramsRef} updateParam={updateParam} />
    </div>
  );
}

export default App;
