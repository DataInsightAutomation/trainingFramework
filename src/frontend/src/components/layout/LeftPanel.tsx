import React from 'react';
import { useAppStore } from '../../store/appStore';

const LeftPanel = () => {
  const { showLeftPanel, toggleLeftPanel } = useAppStore();
  
  return (
    <div className={`left-panel ${showLeftPanel ? 'visible' : 'hidden'}`}>
      <button onClick={toggleLeftPanel}>
        {showLeftPanel ? 'Hide Panel' : 'Show Panel'}
      </button>
      {/* ...existing code... */}
    </div>
  );
};

export default LeftPanel;