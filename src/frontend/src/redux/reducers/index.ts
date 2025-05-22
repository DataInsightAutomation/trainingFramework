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

// import { getExtensionData } from "#extensions/registry";

import { actions } from "../actions/action";
import { initialState } from "../initialState";
// import { loadExtensions } from "#extensions";
import { REHYDRATE } from 'redux-persist';
export const getExtensionData = (key: string) => {
  // Mock implementation of getExtensionData
  // Replace with actual logic to retrieve extension data
  return {
    reduxState: {
      setState: (state: any, action: any) => { 
        // Mock implementation of setState
        // Replace with actual logic to set state
        return { ...state, ...action.data };
      }
    }
  };
}
interface State {
  [key: string]: any;
}

interface ExtensionResetConfigs {
  [key: string]: boolean; // Keys to preserve and their conditions
}

interface Action {
  data: any;
  type: string;
  payload?: any;
}

const createCoreReducer = (extensionResetConfigs: Array<Record<string, boolean>>) => {
  const coreReducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
      case actions.RESET_STATE:
        // Preserve keys defined in extensionResetConfigs
        const configObject = extensionResetConfigs.reduce((acc: any, config: any) => {
          return { ...acc, ...config };
        }, {});
        const preservedState = Object.keys(configObject).reduce<State>((acc, key) => {
          if (configObject[key] && key in state) {
            acc[key] = state[key]; // Preserve the key
          }
          return acc;
        }, {});
        return {
          ...initialState, // Reset to initial state
          ...preservedState, // Preserve specified keys
        };
      case actions.USER_NAME:
        return {
          ...state,
          user_name: action.data,
        };
      case actions.USER_ROLE:
        return {
          ...state,
          user_role: action.data,
        };
      case actions.ERROR_MSG:
        return {
          ...state,
          error_msg: action.data,
        };
      case actions.SHOW_LOADER:
        return {
          ...state,
          show_loader: action.data,
        };
      case actions.REGISTRATION_SUCCESS:
        return {
          ...state,
          registration_success: action.data,
        };
      case actions.REGISTRATION_EMAIL_STORED:
        return {
          ...state,
          registration_email: action.data,
        };
      case REHYDRATE:
        // Merge rehydrated state with initial state
        return {
          ...state, // Initial state
          ...(action.payload?.appReducer || {}), // Merge rehydrated state if it exists
        };
      // case actions.SAFE_UNLOAD:
      //   return {
      //     ...state,
      //     safeUnload: action.data,
      //   };
      default:
        return state;
    }
  };

  return coreReducer;
};

const initLoadExtension = async () => {
    return
//   await loadExtensions();
}
const combineReducers = (reducersMap: { [key: string]: Function | Function[] }) => {
  return (state: any = {}, action: any) => {
    const newState: { [key: string]: any } = {};

    for (const key in reducersMap) {
      if (reducersMap.hasOwnProperty(key)) {
        const reducerOrReducers = reducersMap[key];

        // Handle both single reducer and array of reducers
        if (Array.isArray(reducerOrReducers)) {
          // Combine multiple reducers for this key
          newState[key] = reducerOrReducers.reduce((currentState, reducer) => {
            const newStateSlice = reducer(currentState, action);
            return { ...currentState, ...newStateSlice };
          }, state[key] || {});
        } else {
          // Single reducer for this key
          newState[key] = reducerOrReducers(state[key] || {}, action);
        }
      }
    }

    return { ...state, ...newState }; // Merge the new state with the existing state
  };
};
let cachedAppReducer = null; // Cache to store the initialized appReducer

const initializeAppReducer = async () => {
  await initLoadExtension(); // Wait for extensions to load
  const extensionReducers = Object.values(getExtensionData('reduxState'))
    .map((data: any) => data.setState)
  const coreReducer = createCoreReducer(Object.values(getExtensionData('reduxState')).map((data: any) => data.resetWhenReload));
  cachedAppReducer = combineReducers({
    appReducer: [coreReducer, ...extensionReducers], // Combine multiple reducers under 'appReducer'
  });
  return cachedAppReducer; // Return the initialized value
};

export default initializeAppReducer; // Export a promise

