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
 
import axios from "axios";
// import { getTokenService } from "../services/Management/management.service";
const getTokenService = () => {
  // Mock implementation of getTokenService
  // Replace with actual token retrieval logic
  return localStorage.getItem("token");
}
import {URL} from "#constants/apiconfig";
import { EndPoints } from "#constants/endpoint";

// Add a global loading controller
export const loaderState = {
  isLoading: false,
  pendingRequests: 0,
  listeners: new Set<(isLoading: boolean) => void>(),
  
  // Method to subscribe to loading state changes
  subscribe(callback: (isLoading: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  // Set loading state and notify listeners
  setLoading(isLoading: boolean) {
    this.isLoading = isLoading;
    this.listeners.forEach(callback => callback(isLoading));
  },
  
  // Start a request and update loading state
  startRequest() {
    this.pendingRequests++;
    if (this.pendingRequests === 1) {
      this.setLoading(true);
    }
  },
  
  // End a request and update loading state if no pending requests
  endRequest() {
    this.pendingRequests--;
    if (this.pendingRequests === 0) {
      this.setLoading(false);
    }
  }
};

// Create a centralized API instance 
export const instance = axios.create({
  baseURL: URL, // Point to your backend API
  timeout: 1000 * 60 * 5, // Reduce timeout to 5 minutes (instead of ~2.8 hours)
  headers: {},
});

export const globalInstance = {
  instance: instance,
  loader: true,
};

// Request interceptor
instance.interceptors.request.use(
  config => {
    // Show loader if needed
    if (globalInstance.loader) {
      loaderState.startRequest();
    }
    
    // Add authorization if needed
    const userToken = getTokenService();
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    return config;
  },
  error => {
    // Important: Also end loading on request configuration errors
    loaderState.endRequest();
    console.error("Request setup error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with improved error handling
instance.interceptors.response.use(
  response => {
    // Hide loader
    loaderState.endRequest();
    return response;
  },
  error => {
    // Always hide loader on any error
    loaderState.endRequest();
    
    // Handle network errors (server not running, etc.)
    if (error.code === 'ECONNABORTED') {
      console.error("Request timeout. The server might be too slow or not responding.");
      // You could show a user-friendly toast/alert here
    } else if (!error.response) {
      console.error("Network error. The server might be down or unreachable.");
      // You could show a user-friendly toast/alert here
    } else if (error?.response?.status === 401) {
      console.error("Authentication error:", error.response.data);
    } else if (error?.response?.status >= 500) {
      console.error("Server error:", error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Create a function to reset the loader state in case it gets stuck
export const resetLoader = () => {
  loaderState.pendingRequests = 0;
  loaderState.setLoading(false);
  console.log("Loader has been manually reset");
};

export const getData = function (
  url: string,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  return globalInstance.instance
    .get(url, 
    //   {
    //   headers: {
    //     Authorization: "Bearer " + userToken,
    //   },
    // }
  )
    .then((res) => 
    {
      console.log("get data response:", res)
      return res.data;
    }
  ).catch((error) => {
      console.error("Error fetching data:", error);
      // Handle specific error cases if needed
      if (error.response) {
        console.error("Response error:", error.response.data);
      } else {
        console.error("Network error or timeout:", error.message);
      }
      throw error; // Re-throw the error for further handling
    }
    );
};
export const postData = function (
  url: string,
  obj: any,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  // console.log("post data obj:", obj)
  return globalInstance.instance
    .post(url, obj, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + userToken,
      },
    })
    .then((res) => res.data);
};
export const postDataForm = function (
  url: string,
  obj: any,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  // console.log("post data obj:", obj)

  if (!(obj instanceof FormData)) {
    console.log(obj,'asdasdad obj not instance of formData ??')
  }
  console.log('obj instanceof FormData:', obj instanceof FormData);
  console.log('obj:', obj);
  return globalInstance.instance
    .post(url, obj, {
      headers: {
        'Content-Type': undefined,  // force Axios to set the correct boundary header
        // Accept: "application/json",
        Authorization: "Bearer " + userToken,
      },
    })
    .then((res) => res.data);
};
export const deleteDataWithObject = function (
  url: string,
  obj: any,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  return globalInstance.instance
    .delete(url, {
      headers: {
        Authorization: "Bearer " + userToken,
      },
      data: obj
    })
    .then((res) => res.data);
};

export const deleteData = function (
  url: string,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  return globalInstance.instance
    .delete(url, {
      headers: {
        Authorization: "Bearer " + userToken,
      },
    })
    .then((res) => res.data);
};
export const putData = function (
  url: string,
  obj: any,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  return globalInstance.instance
    .put(url, obj, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + userToken,
      },
    })
    .then((res) => res.data);
};
export const uploadData = function (
  url: string,
  obj: any,
  loader: boolean = true
): Promise<any> {
  globalInstance.loader = loader;
  return globalInstance.instance
    .put(url, obj, {
      headers: { "Content-Type": "" },
    })
    .then((res) => res);
};
export const getJobStatusData = function (
  url: string,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  return globalInstance.instance
    .get(url, {
      headers: {
        Authorization: "Bearer " + userToken,
        "Pragma": 'no-cache', 
        "Cache-Control": 'no-cache' 
      },
    })
    .then((res) => res.data);
};
export const getFile = function (
  url: string,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  return globalInstance.instance
    .get(url, {
      headers: {
        Authorization: "Bearer " + userToken,
      },
      responseType: 'blob',
    })
    .then((res) => new Blob([res.data]));
};

export const serviceDownloadFromSaas = function (
  url: string,
  obj: any,
  returnAsBlob: boolean = false,
  loader: boolean = true
): Promise<any> {
  const userToken = getTokenService();
  globalInstance.loader = loader;
  return globalInstance.instance
    .post(url, obj, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + userToken,
      },
      responseType: returnAsBlob ? 'blob' : 'text', // Change this to text if your server reponds with HTML content

    })
    // .then((res) => new Blob([res.data]));
    .then((res) => [res.data]);
};

// Add the trainAPI module for API calls
export const trainAPI = {
  // Get all available models
  getPreviewCurlCommand: async (modelId: string) => {
    try {
      return getData(`${EndPoints.getPreviewCurlCommand}`, false);
    } catch (error) {
      console.error("Error fetching preview curl command:", error);
      throw error;
    }
  },

  getModels: async () => {
    try {
      return getData(`${EndPoints.getModels}`, false);
    } catch (error) {
      console.error("Error fetching models:", error);
      throw error;
    }
  },
  
  // Start a training job
  startTraining: async (trainingData: any) => {
    try {
      console.log("Sending training request to backend:", trainingData);
      return postData(EndPoints.startTraining, trainingData);
    } catch (error: any) {
      console.error("Error starting training:", error);
      
      // Handle network errors with more descriptive messages
      if (!error.response) {
        throw new Error("The server is unreachable. Please check if the backend service is running.");
      } else if (error.code === 'ECONNABORTED') {
        throw new Error("The request timed out. The server might be overloaded or not responding.");
      }
      
      throw error;
    }
  },
  
  // Get training job status
  getTrainingStatus: async (jobId: string) => {
    try {
      return getData(EndPoints.getTrainingStatus.replace(':jobId', jobId), false);
    } catch (error) {
      console.error(`Error getting status for job ${jobId}:`, error);
      throw error;
    }
  }
};

// // Add the resourceAPI module for models and datasets
// export const resourceAPI = {
//   // Get all available models
//   getModels: async () => {
//     try {
//       return getData('v1/resources/models', false);
//     } catch (error) {
//       console.error("Error fetching models:", error);
//       throw error;
//     }
//   },
  
//   // Get all available datasets
//   getDatasets: async () => {
//     try {
//       return getData('v1/resources/datasets', false);
//     } catch (error) {
//       console.error("Error fetching datasets:", error);
//       throw error;
//     }
//   }
// };