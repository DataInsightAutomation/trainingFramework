import React, { useContext, useState, useEffect, useRef } from "react";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import { Context } from '../../../../utils/context';
import { tabConfig } from '../../../../constants/config/tabConfig';
import './LeftPanel.scss';

const LeftPanel = () => {
  const { state, setState } = useContext(Context);
  const theme = state.currentTheme;
  const panelRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  
  // Initialize panel width from localStorage
  const [panelWidth, setPanelWidth] = useState(() => {
    const savedWidth = localStorage.getItem('leftPanelWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 250;
  });

  const activeKey = state.en?.activeKeyLeftPanel;
  
  // Save panel width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('leftPanelWidth', panelWidth.toString());
    window.dispatchEvent(new Event('storage'));
  }, [panelWidth]);
  
  // Mouse event handlers for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing && panelRef.current) {
        const newWidth = e.clientX;
        // Set min and max width constraints
        if (newWidth > 150 && newWidth < 600) {
          setPanelWidth(newWidth);
        }
      }
    };
    
    const handleMouseUp = () => {
      setResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
    
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);
  
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
  };

  const setActiveKey = (key: string) => {
    setState({
      ...state,
      en: {
        ...state.en,
        activeKeyLeftPanel: key,
      },
    });
  };

  return (
    <div 
      ref={panelRef}
      className={`left-panel ${theme.name}-theme ${resizing ? 'resizing' : ''}`}
      style={{ 
        width: `${panelWidth}px`,
      }}
    >
      <Tab.Container 
        id="left-tabs" 
        activeKey={typeof activeKey === "string" ? activeKey : undefined}
        onSelect={k => setActiveKey(k || tabConfig[0].key)}
      >
        <div className="left-panel-content">
          <Nav variant="pills" className="flex-column nav-vertical">
            {tabConfig.map(tab => (
              <Nav.Item key={tab.key}>
                <Nav.Link eventKey={tab.key} className="tab-link">
                  {tab.icon && <i className={`${tab.icon} me-2`}></i>}
                  <span>{tab.label}</span>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
          
          <div className="tab-content-container">
            {/* Tab content rendered in main container */}
          </div>
        </div>
      </Tab.Container>
      
      <div 
        className="resize-handle"
        onMouseDown={handleResizeStart}
      >
        <div className="resize-handle-bar" />
      </div>
    </div>
  );
};

export default LeftPanel;