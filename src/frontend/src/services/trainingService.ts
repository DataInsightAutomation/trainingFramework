import { getData, postData } from '../apis/api';
import { EndPoints } from '#constants/endpoint';

// Define training interfaces
export interface TrainingRequest {
  model_name: string;
  model_path: string;
  datasets: string[];
  train_method: string;
  [key: string]: any; // For additional parameters
}

export interface TrainingResponse {
  job_id: string;
  status: string;
}

export interface TrainingStatus {
  status: string;
  progress: number;
  message: string;
  [key: string]: any; // For additional fields
}

export const trainingService = {
  /**
   * Start a new training job
   * @param trainingData The training configuration
   * @param isAdvancedMode Whether advanced options should be included
   * @returns Promise with job information
   */
  startTraining: async (trainingData: TrainingRequest, isAdvancedMode: boolean = false): Promise<TrainingResponse> => {
    try {
      // If not in advanced mode, ensure we only send basic fields
      let finalData: TrainingRequest;
      
      if (!isAdvancedMode) {
        // In basic mode, create a new object with only the basic fields
        finalData = {
          model_name: trainingData.model_name,
          model_path: trainingData.model_path,
          datasets: trainingData.datasets,
          train_method: trainingData.train_method,
        };
        console.log("Training service using BASIC mode - filtering out advanced parameters");
      } else {
        finalData = trainingData;
        console.log("Training service using ADVANCED mode - including all parameters");
      }
      
      console.log("Training service starting job with data:", finalData);
      const response = await postData(EndPoints.startTraining, finalData);
      
      // Store job ID in local storage for later reference
      if (response.job_id) {
        localStorage.setItem('lastTrainingJobId', response.job_id);
      }
      
      return response;
    } catch (error: any) {
      console.error("Training service error starting training:", error);
      
      // Enhanced error handling
      if (!error.response) {
        throw new Error("The server is unreachable. Please check if the backend service is running.");
      } else if (error.code === 'ECONNABORTED') {
        throw new Error("The request timed out. The server might be overloaded or not responding.");
      }
      
      throw error;
    }
  },
  
  /**
   * Get the status of a training job
   * @param jobId The ID of the job to check
   * @returns Promise with job status information
   */
  getTrainingStatus: async (jobId: string): Promise<TrainingStatus> => {
    try {
      const storedJobId = jobId || localStorage.getItem('lastTrainingJobId');
      if (!storedJobId) {
        throw new Error("No job ID provided and no recent training job found");
      }
      
      const response = await getData(EndPoints.getTrainingStatus.replace(':jobId', storedJobId), false);
      return response;
    } catch (error) {
      console.error(`Training service error getting status for job:`, error);
      throw error;
    }
  },
  
  /**
   * Get a preview of the curl command for a training request
   * @param trainingData The training configuration
   * @returns Formatted curl command string
   */
  getPreviewCurlCommand: (trainingData: TrainingRequest): string => {
    return `curl -X POST ${EndPoints.startTraining} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(trainingData, null, 2)}'`;
  }
};
