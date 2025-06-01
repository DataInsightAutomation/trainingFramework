import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../../../store/appStore';
import ModelForm from '../../shared/ModelForm/ModelForm';
import { exportService } from '#services/exportService';
import ModelConfigLayout from '../../shared/ModelConfigLayout/ModelConfigLayout';
import './Export.scss';
import { translations } from './ExportTranslation';
import ErrorBanner from '../../shared/ErrorBanner/ErrorBanner';
import { useModelForm, processFormFields } from '../../../hooks/useModelForm';
import { createFormButtons } from '../../../utils/buttonActions';

// Define the basic form fields with better typing
const basicFields = [
  {
    name: 'modelNameOrPath',
    type: 'select',
    required: true,
    description: '',
    placeholder: 'modelNameOrPathPlaceholder',
    options: [] // Will be populated dynamically
  },
  {
    name: 'adapterNameOrPath',
    type: 'text',
    required: true,
    description: 'adapterNameOrPathDescription',
    placeholder: 'adapterNameOrPathPlaceholder'
  },
  {
    name: 'exportDir',
    type: 'text',
    required: true,
    description: 'exportDirDescription',
    placeholder: 'exportDirPlaceholder'
  }
];

// Advanced field sections
const advancedFieldSections = {
  basicConfig: {
    title: 'exportBasicConfigSection',
    fields: [
      {
        name: 'exportSize',
        type: 'number',
        colSpan: 6,
        min: 1,
        max: 50,
        step: 1,
        defaultValue: '5',
        description: 'exportSizeDescription',
        placeholder: 'exportSizePlaceholder'
      },
      {
        name: 'exportDevice',
        type: 'select',
        colSpan: 6,
        options: [
          { value: 'cpu', directLabel: 'CPU' },
          { value: 'auto', directLabel: 'Auto (GPU if available)' }
        ],
        defaultValue: 'cpu',
        description: 'exportDeviceDescription'
      },
      {
        name: 'exportLegacyFormat',
        type: 'toggle',
        colSpan: 12,
        defaultValue: 'false',
        description: 'exportLegacyFormatDescription'
      }
    ]
  },
  quantizationConfig: {
    title: 'exportQuantizationConfigSection',
    fields: [
      {
        name: 'quantization',
        type: 'toggle',
        defaultValue: 'false',
        description: 'quantizationDescription'
      },
      {
        name: 'exportQuantizationBit', 
        type: 'select',
        options: [
          { value: '4', directLabel: '4-bit' },
          { value: '8', directLabel: '8-bit' },
        ],
        description: 'exportQuantizationBitDescription'
      },
      {
        name: 'exportQuantizationDataset',
        type: 'text',
        colSpan: 12,
        description: 'exportQuantizationDatasetDescription',
        placeholder: 'exportQuantizationDatasetPlaceholder'
      },
      {
        name: 'exportQuantizationNsamples',
        type: 'number',
        colSpan: 6,
        min: 1,
        max: 1000,
        step: 1,
        defaultValue: '128',
        description: 'exportQuantizationNsamplesDescription',
        placeholder: 'exportQuantizationNsamplesPlaceholder'
      },
      {
        name: 'exportQuantizationMaxlen',
        type: 'number',
        colSpan: 6,
        min: 128,
        max: 4096,
        step: 128,
        defaultValue: '1024',
        description: 'exportQuantizationMaxlenDescription',
        placeholder: 'exportQuantizationMaxlenPlaceholder'
      }
    ]
  },
  hubConfig: {
    title: 'exportModelRepositorySection',
    fields: [
      {
        name: 'pushToHub',
        type: 'toggle',
        defaultValue: 'true',
        description: 'pushToHubDescription'
      },
      {
        name: 'exportType',
        type: 'select',
        options: [
          { value: 'merged', directLabel: 'Merged Model Only' },
          { value: 'adapter', directLabel: 'Adapter Only' },
          { value: 'both', directLabel: 'Merged Model and Adapter' },
        ],
        required: true,
        description: 'exportTypeDescription'
      },
      {
        name: 'exportHubModelId',
        type: 'text',
        required: true,
        description: 'exportHubModelIdDescription'
      },
      {
        name: 'adapterHubModelId',
        type: 'text',
        required: true,
        description: 'adapterHubModelIdDescription'
      },
      {
        name: 'hfHubToken',
        type: 'text',
        required: true,
        description: 'hfHubTokenDescription'
      },
      {
        name: 'private',
        type: 'toggle',
        defaultValue: 'true',
        description: 'privateDescription'
      }
    ]
  }
};

// Define the Export component
const Export: React.FC = () => {
  // Use refs to track if we're mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Use our custom hook for form handling
  const {
    formData,
    modelOptions,
    isLoading,
    error,
    showErrorBanner,
    expandedSections,
    showAdvanced,
    searchQuery,
    currentLocale,
    setRetryCount,
    toggleSection,
    handleChange,
    setFormData,
    setIsLoading
  } = useModelForm({
    formType: 'export',
    defaultValues: {
      modelNameOrPath: '',
      adapterNameOrPath: '',
      exportDir: '',
      exportFormat: 'safetensors',
      exportType: 'merged',
      quantization: 'false',
      exportQuantizationBit: '8',
      pushToHub: 'false',
      private: 'true',
    },
    updateStoreCallback: useAppStore.getState().updateExportFormData,
    getStoreData: () => useAppStore.getState().exportFormData,
    initialSections: {
      basicConfig: true,
      quantizationConfig: true,
      hubConfig: true
    }
  });

  // Add state to track whether form has been submitted in advanced mode
  const [hasSubmittedInAdvancedMode, setHasSubmittedInAdvancedMode] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get form fields based on the current state
  const currentFields = useMemo(() => {
    // Apply model options to the fields
    const fieldsWithOptions = JSON.parse(JSON.stringify(basicFields));
    
    if (modelOptions.length > 0) {
      fieldsWithOptions[0].options = modelOptions;
    }

    // Process the fields based on mode and search
    return processFormFields({
      basicFields: fieldsWithOptions,
      advancedSections: advancedFieldSections,
      expandedSections,
      toggleSection,
      formData,
      showAdvanced,
      searchQuery,
      currentLocale,
      translations
    });
  }, [
    modelOptions,
    expandedSections,
    searchQuery,
    currentLocale,
    showAdvanced,
    formData
  ]);

  // Filter which fields to show based on the current state
  const getVisibleFields = useMemo(() => {
    let fields = [...currentFields];
    
    // Filter quantization fields based on quantization toggle
    if (formData.quantization !== 'true') {
      fields = fields.filter(field => 
        !field.name.startsWith('exportQuantization') || field.name === 'quantization'
      );
    }
    
    // Filter hub fields based on pushToHub toggle
    if (formData.pushToHub !== 'true') {
      fields = fields.filter(field => 
        field.name !== 'exportType' &&
        field.name !== 'exportHubModelId' &&
        field.name !== 'adapterHubModelId' &&
        field.name !== 'hfHubToken' &&
        field.name !== 'private' || 
        field.name === 'pushToHub'
      );
    }
    
    // Filter model ID fields based on export type
    if (formData.exportType !== 'both') {
      if (formData.exportType === 'merged') {
        fields = fields.filter(field => field.name !== 'adapterHubModelId');
      } else if (formData.exportType === 'adapter') {
        fields = fields.filter(field => field.name !== 'exportHubModelId');
      }
    }
    
    return fields;
  }, [currentFields, formData]);

  // Handle form submission via API
  const handleSubmit = async (data: Record<string, string>): Promise<string> => {
    try {
      console.log('Export form data:', data);
      
      // If in advanced mode, mark that we've submitted in advanced mode
      if (showAdvanced) {
        setHasSubmittedInAdvancedMode(true);
      }

      // Only validate fields relevant to the current mode
      const requiredFields = ['modelNameOrPath', 'adapterNameOrPath', 'exportDir'];
      
      // Add conditional validation for advanced mode - only if we're in advanced mode
      if (showAdvanced && data.pushToHub === 'true') {
        requiredFields.push('hfHubToken');
        
        if (data.exportType === 'merged' || data.exportType === 'both') {
          requiredFields.push('exportHubModelId');
        }
        
        if (data.exportType === 'both') {
          requiredFields.push('adapterHubModelId');
        }
      }

      // Check required fields
      const missingFields = requiredFields.filter(field => !data[field]);
      if (missingFields.length > 0) {
        throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
      }

      setIsLoading(true);
      
      // Prepare API request - only include necessary fields based on mode
      const requestData: any = {
        model_name_or_path: data.modelNameOrPath,
        adapter_name_or_path: data.adapterNameOrPath,
        export_dir: data.exportDir,
      };

      // In basic mode, we always use these defaults
      if (!showAdvanced) {
        // Default export behavior for basic mode (explicitly set)
        requestData.merge_adapter = true;
        requestData.export_adapter = false;
        requestData.quantization = false;
        // Only include these fields, ignore any advanced fields that might be in data
      } else {
        // Add advanced options if needed in advanced mode
        if (showAdvanced) {
          // Add the new export configuration fields
          if (data.exportSize) {
            requestData.export_size = parseInt(data.exportSize);
          }

          if (data.exportDevice) {
            requestData.export_device = data.exportDevice;
          }

          // Quantization settings
          if (data.quantization === 'true') {
            requestData.quantization = true;
            requestData.quantization_bits = parseInt(data.quantizationBits || '8');
          }
        }
      }
      
      try {
        // Call API with explicit error handling
        const response = await exportService.startExport(requestData, showAdvanced);
        console.log('Export API response:', response);

        if (response && response.job_id) {
          localStorage.setItem('lastExportJobId', response.job_id);
          
          // Remove the reference to non-existent uiState
          // The following lines were causing the error:
          // if (showAdvanced !== uiState.showAdvanced) {
          //   console.log('Fixing UI state mismatch after submission');
          //   setUiState(prev => ({ ...prev, showAdvanced: showAdvanced }));
          // }
          
          // Return success message with properly referenced locale
          const locale = currentLocale === 'zh' ? 'zh' : 'en';
          return `${translations[locale].exportStarted} "${data.modelNameOrPath}" (Job ID: ${response.job_id})`;
        } else {
          console.warn('Unexpected API response format:', response);
          throw new Error('Invalid response from server');
        }
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        // Extract detailed error message if available
        if (apiError.response && apiError.response.data) {
          console.error('API error details:', apiError.response.data);
          throw new Error(`Export failed: ${apiError.response.data.detail || apiError.message}`);
        }
        throw apiError;
      }

    } catch (error) {
      console.error('Export failed:', error);
      throw error; // Re-throw to show in form error state
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Button actions
  const handlePreviewCurl = (data: Record<string, string>) => {
    const exportData = {
      model_name_or_path: data.modelNameOrPath,
      adapter_name_or_path: data.adapterNameOrPath,
      export_dir: data.exportDir,
    };

    const curlCommand = exportService.getPreviewCurlCommand(exportData);
    alert(curlCommand);
    navigator.clipboard.writeText(curlCommand);
  };

  // Check status handler
  const handleCheckStatus = async () => {
    const jobId = localStorage.getItem('lastExportJobId');
    if (!jobId) {
      alert('No recent export job found');
      return;
    }

    if (!isMounted.current) return;

    try {
      setIsLoading(true);
      const result = await exportService.getExportStatus(jobId);

      // Format status message
      let message = `Export status: ${result.status}\nJob ID: ${jobId}`;

      if (result.export_results) {
        message += '\n\nResults:';
        if (result.export_results.merged_model) {
          message += `\n- Merged Model: ${result.export_results.merged_model}`;
        }
        if (result.export_results.adapter_only) {
          message += `\n- Adapter: ${result.export_results.adapter_only}`;
        }
      }

      if (result.export_path) {
        message += `\n\nPath: ${result.export_path}`;
      }

      if (result.hub_model_id) {
        message += `\n\nHub Model ID: ${result.hub_model_id}`;
      }

      if (result.adapter_hub_model_id) {
        message += `\n\nAdapter Hub ID: ${result.adapter_hub_model_id}`;
      }

      alert(message);
    } catch (error) {
      console.error('Failed to check status:', error);
      alert('Failed to retrieve export status');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Create form buttons using the shared utility
  const formButtons = useMemo(() => createFormButtons({
    formType: 'export',
    previewCommand: handlePreviewCurl,
    checkStatus: handleCheckStatus,
    translations,
    currentLocale,
    updateFormData: useAppStore.getState().updateExportFormData
  }), [currentLocale]);

  // Add custom handler for field changes to prevent infinite loops
  const handleFormChange = (name: string, value: string) => {
    // For ALL field types, directly update form data to prevent infinite loops
    // This bypasses any complex state management that might cause circular updates
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <ErrorBanner 
        message={error}
        retryCount={showErrorBanner ? 2 : 0}
        onRetry={() => setRetryCount(prev => prev + 1)}
      />
      
      <ModelForm
        title="exportModel"
        submitButtonText="startExport"
        buttons={formButtons}
        fields={getVisibleFields}
        translations={translations}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange} // Use our custom handler instead of handleChange directly
        isLoading={isLoading}
        showAdvanced={showAdvanced}
        validateVisibleFieldsOnly={showAdvanced && !hasSubmittedInAdvancedMode}
      />
    </>
  );
};

// Create a wrapper component that includes the shared layout
const ExportWithLayout = () => (
  <ModelConfigLayout
    title="Export Model"
    translations={translations}>
    <Export />
  </ModelConfigLayout>
);

export default ExportWithLayout;
