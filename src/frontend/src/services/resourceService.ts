import { EndPoints } from '#constants/endpoint';
import { getData } from '../apis/api';

// Define model and dataset interfaces
export interface Model {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  size_mb?: number;
}

export const resourceService = {
  /**
   * Get all available models
   * @returns Promise with models data
   */
  getModels: async (): Promise<{ models: Model[] }> => {
    try {
      const response = await getData(EndPoints.getModels, false);
      return response;
    } catch (error) {
      console.error('Resource service error fetching models:', error);
      throw error;
    }
  },
  
  /**
   * Get models grouped by category
   * @returns Promise with models grouped by category
   */
  getModelsWithCategories: async (): Promise<Record<string, Model[]>> => {
    try {
      const response = await getData('v1/resources/models', false);
      
      // Group models by category
      const categorizedModels = response.models.reduce((acc: Record<string, Model[]>, model: Model) => {
        const category = model.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(model);
        return acc;
      }, {});
      
      return categorizedModels;
    } catch (error) {
      console.error('Resource service error fetching categorized models:', error);
      throw error;
    }
  },
  
  /**
   * Get all available datasets
   * @returns Promise with datasets data
   */
  getDatasets: async (): Promise<{ datasets: Dataset[] }> => {
    try {
      const response = await getData('v1/resources/datasets', false);
      return response;
    } catch (error) {
      console.error('Resource service error fetching datasets:', error);
      throw error;
    }
  },
  
  /**
   * Get datasets grouped by category
   * @returns Promise with datasets grouped by category
   */
  getDatasetsWithCategories: async (): Promise<Record<string, Dataset[]>> => {
    try {
      const response = await getData('v1/resources/datasets', false);
      
      // Group datasets by category
      const categorizedDatasets = response.datasets.reduce((acc: Record<string, Dataset[]>, dataset: Dataset) => {
        const category = dataset.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(dataset);
        return acc;
      }, {});
      
      return categorizedDatasets;
    } catch (error) {
      console.error('Resource service error fetching categorized datasets:', error);
      throw error;
    }
  }
};
