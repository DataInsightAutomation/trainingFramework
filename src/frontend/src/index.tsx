
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// //import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import initializeStore from './redux/store/store'; // Import the store promise
import { persistStore } from 'redux-persist';
// import store from './redux/store'; // If you have a synchronous store

const Root = () => {
  const [store, setStore] = useState(null);
  const [persistor, setPersistor] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const { store, persistor } = await initializeStore();
      setStore(store);
      setPersistor(persistor);
    };

    initialize();
  }, []);

  // Show a loading state while the store is being initialized
  if (!store || !persistor) {
    return <div>Initializing data</div>;
  }
  // const persistor = persistStore(store);

  //   // Render the app once the store is ready
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root />);
} else {
  throw new Error("Root element with id 'root' not found.");
}