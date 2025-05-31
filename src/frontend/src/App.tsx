import React from 'react';
import { useAppStore } from './store/appStore';
import ContextBridge from './providers/ContextBridge';
import { AppRoute } from "./routes/AppRoute";
// Import Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';

const App = () => {
  return (
    <div className="app">
      {/* Wrap with ContextBridge to provide compatibility */}
      <ContextBridge>
        <AppRoute />
      </ContextBridge>
    </div>
  );
};

export default App;