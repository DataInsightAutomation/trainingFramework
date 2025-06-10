// Add fallback values for endpoints

// Get the API base URL from environment or use a default
// const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = 'http://localhost:8001';

// Ensure API base URL is properly formatted
// const getFormattedBaseUrl = () => {
//   let baseUrl = API_BASE_URL;
  
//   // Ensure base URL has http:// or https:// prefix
//   if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
//     baseUrl = 'http://' + baseUrl;
//   }
  
//   // Ensure base URL doesn't end with a slash
//   if (baseUrl.endsWith('/')) {
//     baseUrl = baseUrl.slice(0, -1);
//   }
  
//   return baseUrl;
// };

// const BASE_URL = getFormattedBaseUrl();
const BASE_URL = API_BASE_URL

// Define your API endpoints here
export const EndPoints = {
  // Model endpoints
  getModels: `${BASE_URL}/v1/resources/models`,
  getModelById: (id: string) => `${BASE_URL}/models/${id}`,
  
  exportModel: `${BASE_URL}/v1/export`,
  getExportModelById: (id: string) => `${BASE_URL}/export/${id}`,

  // Dataset endpoints
  getDatasets: `${BASE_URL}/v1/resources/datasets`,
  getDatasetById: (id: string) => `${BASE_URL}/datasets/${id}`,
  
  // Training endpoints
  startTraining: `${BASE_URL}/v1/train`,
  getTrainingStatus: `${BASE_URL}/v1/train/:jobId/status`,
  
  // Export endpoints
  startExport: '/v1/export',
  getExportStatus: '/v1/export/status/:jobId',
  
  // For the curl preview
  getPreviewCurlCommand: `${BASE_URL}/v1/train`,
  evaluate: `${BASE_URL}/v1/evaluate`,
};