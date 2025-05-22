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
 
import { AxiosError, AxiosResponse } from "axios";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../components/shared/Loader/Loader";
import { instance, globalInstance } from "./api";
let globalVal = 0;
const AxiosInterceptor = () => {
  const dispatch = useDispatch();
  globalInstance.instance.interceptors.request.use((request) => {
    globalVal++;
    dispatch({ type: "SHOW_LOADER", data: globalInstance.loader });
    return request;
  });
  globalInstance.instance.interceptors.response.use(
    (response: AxiosResponse) => {
      globalVal--;
      if (globalVal === 0) {
        dispatch({ type: "SHOW_LOADER", data: false });
      }
      return response;
    },
    (err: AxiosError) => {
      globalVal--;
      dispatch({ type: "SHOW_LOADER", data: false });
      return Promise.reject(err);
    }
  );
  const showLoader = useSelector((state: any) => state.appReducer.show_loader);
  return showLoader && <Loader />;
};
export default AxiosInterceptor;
