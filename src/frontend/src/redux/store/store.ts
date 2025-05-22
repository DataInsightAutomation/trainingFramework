/*
 * INTEL CONFIDENTIAL
 * 
 * Copyright (C) 2024 Intel Corporation
 *  
 * This software and the related documents are Intel copyrighted materials,
 * and your use of them is governed by the express license under which they
 * were provided to you ("License"). Unless the License provides otherwise,
 * you may not use, modify, copy, publish, distribute, disclose or transmit
 * this software or the related documents without Intel's prior written
 * permission.
 * 
 * This software and the related documents are provided as is, with no 
 * express or implied warranties, other than those that are expressly stated
 * in the License.
 */
 
import { configureStore } from "@reduxjs/toolkit";
import { compose } from "redux";
import {
  persistStore, persistReducer
} from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import initializeAppReducer from '../reducers'; // Import the promise
import { actions } from "#redux/actions/action";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['appReducer'],  // want to persist reducer
  // blacklist: []  // don't want to persist reducer
}
let persistor:any; // Cache to store the initialized appReducer
let store: any; // Cache to store the initialized appReducer

const initializeStore = async () => {
  const appReducer = await initializeAppReducer(); // Wait for the appReducer to resolve

  // Create the persisted reducer
  const persistedReducer = persistReducer(persistConfig, appReducer);
  // Configure the store
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  if (!store) {

  store = configureStore({
    // reducer: persistedReducer,
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware: (arg0: { immutableCheck: boolean; serializableCheck: boolean; }) => any) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  });
}
  if (!persistor) {

  // Create the persistor
  persistor = persistStore(store, null, () => {
    // console.log("Redux Persist: Rehydration Complete", store.getState());
    // to do/ enhance, for the extension data? what data should also reset.
    // store.dispatch({ type: actions.ADD_NODE_CONFIG, data: [] });

  });
}
  return { store, persistor };
};

// Export a promise that resolves to the store and persistor
export default initializeStore;