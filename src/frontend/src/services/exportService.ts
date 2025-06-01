// import { api } from '../api/api'; // Fix import path for api
import { getData, postData } from '../apis/api'; // Ensure correct import path for api
import { EndPoints } from '../constants/endpoint';

// Define export interfaces
export interface ExportRequest {
  model_name_or_path: string;
  adapter_name_or_path: string;
  export_dir: string;
  export_hub_model_id?: string;
  hf_hub_token?: string;
  quantization?: boolean;
  quantization_bits?: number;
  merge_adapter?: boolean;
  export_adapter?: boolean;
  push_to_hub?: boolean;
  private?: boolean;
  [key: string]: any; // For additional parameters
}

export interface ExportResponse {
  job_id: string;
  status: string;
}

export interface ExportStatus {
  status: string;
  progress: number;
  message: string;
  export_path?: string;
  hub_model_id?: string;
  adapter_hub_model_id?: string;
  export_results?: {
    merged_model?: string;
    adapter_only?: string;
  };
  [key: string]: any; // For additional fields
}

export const exportService = {
  /**
   * Start a new export job
   * @param exportData The export configuration
   * @param isAdvancedMode Whether advanced options should be included
   * @returns Promise with job information
   */
  startExport: async (exportData: ExportRequest, isAdvancedMode: boolean = false): Promise<ExportResponse> => {
    console.log('Starting export with data:', exportData);
    try {
      // If not in advanced mode, ensure we only send basic fields
      let finalData: ExportRequest;

      if (!isAdvancedMode) {
        // In basic mode, create a new object with only the basic fields
        finalData = {
          model_name_or_path: exportData.model_name_or_path,
          adapter_name_or_path: exportData.adapter_name_or_path,
          export_dir: exportData.export_dir,
          export_hub_model_id: exportData.export_hub_model_id,
          hf_hub_token: exportData.hf_hub_token,
        };
        console.log("Export service using BASIC mode - filtering out advanced parameters");
      } else {
        finalData = exportData;
        console.log("Export service using ADVANCED mode - including all parameters");
      }

      // Add debug log for the API endpoint

      // Add timeout and better error handling
      const response = await postData(EndPoints.exportModel, finalData);

      // Store job ID in local storage for later reference
      if (response.job_id) {
        localStorage.setItem('lastExportJobId', response.job_id);
      }

      return response;
    } catch (error: any) {
      console.error("Export service error starting export:", error);

      // Enhanced error handling
      if (!error.response) {
        throw new Error("The server is unreachable. Please check if the backend service is running.");
      } else if (error.code === 'ECONNABORTED') {
        throw new Error("The request timed out. The server might be overloaded or not responding.");
      } else {
        // Enhance error logging
        console.error('Response error:', error.response.status, error.response.data);
      }

      throw error;
    }
  },

  /**
   * Get the status of an export job
   * @param jobId The ID of the job to check
   * @returns Promise with job status information
   */
  getExportStatus: async (jobId?: string): Promise<ExportStatus> => {
    try {
      const storedJobId = jobId || localStorage.getItem('lastExportJobId');
      if (!storedJobId) {
        throw new Error("No job ID provided and no recent export job found");
      }

      // Fix getData is not defined error - use api.get instead
      const response = await getData(`${EndPoints.getExportStatus}/${storedJobId}`);
      return response.data;
    } catch (error) {
      console.error(`Export service error getting status for job:`, error);
      throw error;
    }
  },

  /**
   * Get a preview of the curl command for an export request
   * @param exportData The export configuration
   * @returns Formatted curl command string
   */
  getPreviewCurlCommand: (exportData: ExportRequest): string => {
    return `curl -X POST /v1/export/ \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(exportData, null, 2)}'`;
  }
};
