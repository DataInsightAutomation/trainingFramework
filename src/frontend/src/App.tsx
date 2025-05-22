import React from "react";
import { ContextProvider } from './utils/ContextProvider';
import { AppRoute } from "./routes/AppRoute";
import LoaderWatchdog from './components/shared/LoaderWatchdog';

function App() {
  return (
    <ContextProvider>
      <LoaderWatchdog />
      <AppRoute />
    </ContextProvider>
  );
}

export default App;