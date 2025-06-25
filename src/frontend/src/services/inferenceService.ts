import axios from 'axios';
import { EndPoints } from '../constants/endpoint';
import { postData } from '#apis/api';

interface InferenceResponse {
  job_id: string;
  status: string;
}

interface ChatResponse {
  response: string;
}

class InferenceService {

  async chat(payload: any): Promise<ChatResponse> {
    try {
      const response = await postData(EndPoints.chat, payload);
      return response.data;
    } catch (error) {
      console.error('Error in chat API call:', error);
      throw error;
    }
  }
}

export const inferenceService = new InferenceService();
