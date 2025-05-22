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

import { getExtensionData } from "./reducers";

// import { extensionsIntialState, loadExtensions } from "#extensions";
// import {getExtensionData, registerExtensionData} from "#extensions/registry";

let initialState:any = {
  error_msg: "",
  // title: "Untitled_text",
  // project_id: "",
  // project_name: "",
  user_name: "",
  user_role: "",
  // node_list: {} as any,
  // suggested_topology: [] as any,
  show_loader: false,
  registration_success: false,
  registration_email: "",
  // node_config: [] as any,
  // workflows: [] as any,
  // active_workflow: [] as any,
  // executing: "",
  // zoom_slider_val: 1,
  // visualizeData: {} as any,
  // isEditable: {} as any,
  // sharedProjectUrl: "" as any,
  // config_modal: false,
  // projectCount: 0,
  // workloads: [],
}
const initLoadExtension = async () => {
    return
//   await loadExtensions();
}

(async () => {
  await initLoadExtension(); // Wait for `initLoadExtension` to complete before moving on
  const extensionStates = Object.values(getExtensionData('reduxState')).map((data: any) => data.initialState);
  initialState = {
    ...initialState,
    ...extensionStates.reduce((acc, state) => ({ ...acc, ...state }), {}) // Merge all initialState objects
  };
})();

export { initialState };