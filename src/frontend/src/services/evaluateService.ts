import axios from 'axios';
import { EndPoints } from '../constants/endpoint';
import { postData } from '#apis/api';

interface EvaluateResponse {
  job_id: string;
  status: string;
}

class EvaluateService {
  async startEvaluation(data: any, isAdvanced: boolean = false): Promise<EvaluateResponse> {
    try {
      console.log(`Starting evaluation with${isAdvanced ? ' advanced' : ''} parameters:`, data);
      // const response = await axios.post(EndPoints.evaluate, data);
      const response = await postData(EndPoints.evaluate, data);
      
      console.log('Evaluation API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error in evaluation API call:', error);
      throw error;
    }
  }

  async getEvaluationStatus(jobId: string): Promise<any> {
    try {
      const response = await axios.get(`${EndPoints.jobStatus}?job_id=${jobId}`);
      console.log('Evaluation status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching evaluation status:', error);
      throw error;
    }
  }
}

export const evaluateService = new EvaluateService();
