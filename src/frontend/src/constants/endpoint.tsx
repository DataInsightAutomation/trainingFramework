    //   return getData(`/v1/models`);

export const EndPoints = {
    // Get all available endpoint
    getAllEndpoints: "/v1/endpoints",
    // Get all available models
    getAllModels: "/v1/models",
    getPreviewCurlCommand: "/v1/models/:modelId/preview",
    // Start a training job
    startTraining: "/v1/train",
    // Get training job status
    getTrainingStatus: "/v1/train/:jobId/status",
}

