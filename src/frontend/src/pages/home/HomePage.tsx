import React, { useState } from 'react';
import Header from '../../components/core/layout/header/Header';
import Footer from '../../components/core/layout/footer/Footer';
import LeftPanel from '../../components/core/layout/leftPanel/LeftPanel';
import Content from '../../components/custom/content/Content';
import { Col } from 'react-bootstrap';

import { Context,defaultState } from "../../utils/context";
// import { defaultState } from "../utils/context"; // if you exported it

import { headerFooterTabStyle, leftPanelTabStyle, leftPanelTabHiddenStyle, tabSize } from './TempConstant';

const HomePage = () => {
  const [showHeader, setShowHeader] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [activeKey, setActiveKey] = useState('');
  const [state, setState] = useState(defaultState);

  return (
    <div className="d-flex flex-column min-vh-100 position-relative" style={{ background: "#f5f6fa" }}>
      {/* Header Toggle Tab */}
      <div
        style={{
          ...headerFooterTabStyle,
          top: showHeader ? 64 : 0, // adjust 64 to your header height
          borderRadius: showHeader ? '0 0 16px 16px' : '16px',
        }}
        onClick={() => setShowHeader(h => !h)}
        title={showHeader ? 'Hide Header' : 'Show Header'}
        onMouseOver={e => (e.currentTarget.style.background = '#e9ecef')}
        onMouseOut={e => (e.currentTarget.style.background = '#f8f9fa')}
      >
        {showHeader ? '▲' : '▼'}
      </div>
      {showHeader && <Header />}

      <div className="container-fluid flex-fill position-relative px-0" style={{ minHeight: 0 }}>
        <div className="row h-100 position-relative m-0" style={{ display: 'flex', flexWrap: 'nowrap', height: '100%' }}>
          {/* LeftPanel and its toggle */}
          {showLeftPanel && (
            // <div style={{ position: 'relative', width: "15%", minWidth: "15%", height: '100%' }}>
            <Col>
              {/* <Context.Provider value={{ state, setState }}> */}

                <LeftPanel />
                <div
                  style={{
                    ...leftPanelTabStyle,
                    position: 'absolute',
                    // right: -tabSize / 2,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  onClick={() => setShowLeftPanel(l => !l)}
                  title="Hide Left Panel"
                  onMouseOver={e => (e.currentTarget.style.background = '#e9ecef')}
                  onMouseOut={e => (e.currentTarget.style.background = '#f8f9fa')}
                >
                  ◀
                </div>
              {/* </Context.Provider> */}
              {/* </div> */}
            </Col>
          )}
          {!showLeftPanel && (
            <div
              style={{
                ...leftPanelTabHiddenStyle,
                left: 0,
                top: '4%',
                transform: 'translateY(-50%)',
              }}
              onClick={() => setShowLeftPanel(l => !l)}
              title="Show Left Panel"
              onMouseOver={e => (e.currentTarget.style.background = '#e9ecef')}
              onMouseOut={e => (e.currentTarget.style.background = '#f8f9fa')}
            >
              ▶
            </div>
          )}
          {/* Content always fills the rest */}
          <div className="flex-fill" style={{ minWidth: 0, overflow: 'auto', marginLeft: !showLeftPanel ? "25px" : "0" }}>
            <Content />
          </div>
        </div>
      </div>

      {/* Footer Toggle Tab */}
      <div
        style={{
          ...headerFooterTabStyle,
          position: 'fixed',
          bottom: showFooter ? 64 : 0, // adjust 64 to your footer height
          borderRadius: showFooter ? '16px 16px 0 0' : '16px',
        }}
        onClick={() => setShowFooter(f => !f)}
        title={showFooter ? 'Hide Footer' : 'Show Footer'}
        onMouseOver={e => (e.currentTarget.style.background = '#e9ecef')}
        onMouseOut={e => (e.currentTarget.style.background = '#f8f9fa')}
      >
        {showFooter ? '▼' : '▲'}
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

export default HomePage;