import React, { useContext, useState, useEffect } from 'react';
import { Context } from '../../../utils/context';
import Header from './header/Header';
import Footer from './footer/Footer';
import LeftPanel from './leftPanel/LeftPanel';
import AxiosInterceptor from '../../../apis/AxiosInterceptor';
import './MainLayout.scss';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { state, toggleHeader, toggleLeftPanel, toggleFooter } = useContext(Context);
  
  // Get UI state directly from state
  const showHeader = state.showHeader;
  const showLeftPanel = state.showLeftPanel;
  const showFooter = state.showFooter;
  const theme = state.currentTheme;

  // Track panel width
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const savedWidth = localStorage.getItem('leftPanelWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 250;
  });
  
  // Update panel width when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedWidth = localStorage.getItem('leftPanelWidth');
      if (savedWidth) {
        setLeftPanelWidth(parseInt(savedWidth, 10));
      }
    };
    
    // Listen for storage events from the LeftPanel component
    window.addEventListener('storage', handleStorageChange);
    
    // Check for changes every 100ms as a fallback for same-window storage changes
    const interval = setInterval(() => {
      const savedWidth = localStorage.getItem('leftPanelWidth');
      if (savedWidth && parseInt(savedWidth, 10) !== leftPanelWidth) {
        setLeftPanelWidth(parseInt(savedWidth, 10));
      }
    }, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [leftPanelWidth]);

  return (
    <div className={`main-layout ${theme.name}-theme`}>
      <AxiosInterceptor />
      
      {/* Header Toggle Button */}
      <div
        className={`toggle-button header-toggle ${showHeader ? 'header-visible' : 'header-hidden'} ${theme.name}-theme`}
        onClick={toggleHeader}
        title={showHeader ? 'Hide Header' : 'Show Header'}
      >
        {showHeader ? '▲' : '▼'}
      </div>
      
      {showHeader && <Header />}

      <div className="content-container">
        <div className="content-row">
          {/* Left Panel Container */}
          {showLeftPanel && (
            <div className="left-panel-container" style={{ width: `${leftPanelWidth}px` }}>
              <LeftPanel />
              
              <div
                className={`toggle-button panel-toggle panel-hide-toggle ${theme.name}-theme`}
                onClick={toggleLeftPanel}
                title="Hide Left Panel"
              >
                <i className="bi bi-chevron-left"></i>
              </div>
            </div>
          )}
          
          {/* Panel Show Button when hidden */}
          {!showLeftPanel && (
            <div
              className={`toggle-button panel-toggle panel-show-toggle ${theme.name}-theme`}
              onClick={toggleLeftPanel}
              title="Show Left Panel"
            >
              <i className="bi bi-chevron-right"></i>
            </div>
          )}
          
          {/* Content area with proper margin adjusted for panel */}
          <div 
            className="content-area" 
            style={{ marginLeft: showLeftPanel ? `${leftPanelWidth}px` : "40px" }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Footer Toggle Button */}
      <div
        className={`toggle-button footer-toggle ${showFooter ? 'footer-visible' : 'footer-hidden'} ${theme.name}-theme`}
        onClick={toggleFooter}
        title={showFooter ? 'Hide Footer' : 'Show Footer'}
      >
        {showFooter ? '▼' : '▲'}
      </div>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
