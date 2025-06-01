import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import { useAppStore } from '../../../store/appStore';
import ModelForm, { FormField, FormButton } from '../../shared/ModelForm/ModelForm';
import { resourceService } from '../../../services/resourceService';
import { exportService } from '#services/exportService';
import ModelConfigLayout, { ModelConfigContext } from '../../shared/ModelConfigLayout/ModelConfigLayout';
import { saveConfig, loadConfig } from '../../../utils/configUtils';
import './Export.scss';
import { translations } from './ExportTranslation';

// Define translations

// Add this function to highlight text matches in field labels
const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;

    const regex = new RegExp(`(${query.trim()})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
};

// Define the Export component
const Export: React.FC = () => {
    // Use refs to track if we're mounted to prevent state updates after unmount
    const isMounted = useRef(true);

    // Get advanced mode state directly from store first time
    const { showAdvanced, searchQuery } = useContext(ModelConfigContext);

    // Create a reference to store values
    const storeRef = useRef({
        currentLocale: useAppStore.getState().currentLocale || 'en',
        exportFormData: useAppStore.getState().exportFormData,
        showAdvanced: showAdvanced || false,
    });

    // Local component state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelOptions, setModelOptions] = useState<any[]>([]);
    const [formState, setFormState] = useState<Record<string, string>>(
        storeRef.current.exportFormData || {
            modelNameOrPath: '',
            adapterNameOrPath: '',
            exportDir: '',
            exportFormat: 'safetensors',
            exportType: 'merged',
            quantization: 'false',
            quantizationBits: '8',
            pushToHub: 'false',
            private: 'true',
        }
    );

    // Use a separate state for UI-related properties that don't affect form data
    // Use the context values directly rather than local copies
    const [uiState, setUiState] = useState<{
        searchQuery: string;
        showAdvanced: boolean;
        expandedConfig: boolean;
    }>({
        searchQuery: searchQuery || '',
        showAdvanced: showAdvanced, // Use the context value directly
        expandedConfig: true, // Set default value for expandedConfig
    });

    // Expanded state for each section
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basicConfig: true,
        quantizationConfig: true,
        hubConfig: true
    });

    // Add a state to track whether form has been submitted in advanced mode
    const [hasSubmittedInAdvancedMode, setHasSubmittedInAdvancedMode] = useState(false);

    // Subscribe to store changes once on mount, cleanup on unmount
    useEffect(() => {
        // Update our ref with latest values
        const updateStoreRef = () => {
            const newStoreRef = {
                currentLocale: useAppStore.getState().currentLocale || 'en',
                exportFormData: useAppStore.getState().exportFormData,
                showAdvanced: showAdvanced || false,
                expandedSections: { exportConfig: false },
            };

            // Update the ref
            storeRef.current = newStoreRef;

            // Update form state from store if exportFormData changed
            if (storeRef.current.exportFormData) {
                setFormState(prev => ({
                    ...prev,
                    ...storeRef.current.exportFormData
                }));
            }
        };

        // Initial update
        updateStoreRef();

        // Subscribe to store changes
        const unsubscribe = useAppStore.subscribe(updateStoreRef);

        // Set isMounted to false on cleanup
        return () => {
            isMounted.current = false;
            unsubscribe();
        };
    }, [showAdvanced]);

    // Update UI state when context changes
// Update UI state when context changes
useEffect(() => {
    if (isMounted.current) {
        // When switching modes, we need to refresh the form state appropriately
        if (showAdvanced !== uiState.showAdvanced) {
            if (!showAdvanced) {
                // When switching from advanced to basic mode,
                // ensure we only keep basic fields in the form state
                const basicFields = ['modelNameOrPath', 'adapterNameOrPath', 'exportDir'];
                
                // Create a completely new state object with only basic fields
                const basicFormState: Record<string, string> = {};
                
                // Copy only basic fields
                basicFields.forEach(field => {
                    basicFormState[field] = formState[field] || '';
                });
                
                console.log('Cleaned form state for basic mode:', basicFormState);
                
                // Update the form state with only basic fields
                setFormState(basicFormState);
                
                // Don't update the store here - let the formState effect handle it
                // Removing this line breaks the circular dependency
                // useAppStore.getState().updateExportFormData?.(basicFormState);
            }
        }
        
        // Update the UI state with current context values
        setUiState(prev => ({
            ...prev,
            showAdvanced: showAdvanced,
            searchQuery: searchQuery || ''
        }));
    }
}, [showAdvanced, searchQuery, uiState.showAdvanced]);

    // Add a debug log to monitor state changes
    useEffect(() => {
        console.log("UI state updated:", uiState);
    }, [uiState]);

    // Load models from API - simplified with mount check
    useEffect(() => {
        const fetchModels = async () => {
            if (!isMounted.current) return;

            setIsLoading(true);
            try {
                const response = await resourceService.getModels();
                if (isMounted.current && response?.models) {
                    const options = response.models.map((model: any) => ({
                        value: model.id,
                        directLabel: model.name
                    }));
                    setModelOptions(options);
                }
            } catch (error) {
                console.error('Failed to fetch models:', error);
                if (isMounted.current) {
                    setError('Failed to load models');
                    setModelOptions([
                        { value: 'llama3-8b', directLabel: 'Llama 3 (8B)' },
                        { value: 'gpt4', directLabel: 'GPT-4' }
                    ]);
                }
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchModels();
    }, []);

    // Basic form fields definition with modelOptions applied
    const formFields = useMemo(() => {
        // Create base fields - remove exportFormat from the basic fields
        const basicFields: FormField[] = [
            {
                name: 'modelNameOrPath',
                type: 'select',
                required: true,
                description: '',
                placeholder: 'modelNameOrPathPlaceholder',
                options: modelOptions
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
            // exportFormat field removed
        ];

        const staticAdvancedFields: FormField[] = [
            // Basic settings sub-header
            {
                name: 'exportBasicConfigHeader',
                type: 'sectionHeader',
                colSpan: 12,
                collapsible: true,
                expanded: expandedSections.basicConfig,
                onToggle: () => handleToggleSection('basicConfig'),
                customTitle: 'exportBasicConfigSection'
            },
        ];

        // Only add basic config fields if the section is expanded
        if (expandedSections.basicConfig) {
            staticAdvancedFields.push(
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
            );
        }

        // Quantization settings sub-header
        staticAdvancedFields.push({
            name: 'exportQuantizationConfigHeader',
            type: 'sectionHeader',
            colSpan: 12,
            collapsible: true,
            expanded: expandedSections.quantizationConfig,
            onToggle: () => handleToggleSection('quantizationConfig'),
            customTitle: 'exportQuantizationConfigSection'
        });

        // Only add quantization fields if the section is expanded
        if (expandedSections.quantizationConfig) {
            // Quantization fields - only for merged model exports
            if (formState.exportType === 'merged' || formState.exportType === 'both') {
                staticAdvancedFields.push({
                    name: 'quantization',
                    type: 'toggle',
                    defaultValue: 'false',
                    description: 'quantizationDescription'
                });

                // When formState.quantization === 'true', fix the field name to match translation key
                if (formState.quantization === 'true') {
                    staticAdvancedFields.push(
                        {
                            name: 'exportQuantizationBit', // Changed from export_quantization_bit to match translation key
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
                    );
                }
            }
        }


        // If not advanced mode, return just the basic fields
        if (!showAdvanced) {
            return basicFields;
        }

        // Advanced mode - add header and dynamic fields based on formState
        const allFields = [...basicFields, ...staticAdvancedFields];

        // Only add advanced fields if the main advanced config is expanded
        if (uiState.expandedConfig) {
            // Model repository settings sub-header (changed from HuggingFace Hub settings)
            allFields.push({
                name: 'exportHubConfigHeader',
                type: 'sectionHeader',
                colSpan: 12,
                collapsible: true,
                expanded: expandedSections.hubConfig,
                onToggle: () => handleToggleSection('hubConfig'),
                customTitle: 'exportModelRepositorySection' // Changed from 'exportHubConfigSection'
            });

            // Only add Hub-related fields if the Hub section is expanded
            if (expandedSections.hubConfig) {
                // Push to Hub toggle
                allFields.push({
                    name: 'pushToHub',
                    type: 'toggle',
                    defaultValue: 'true',
                    description: 'pushToHubDescription'
                });

                // Conditional fields based on pushToHub value
                if (formState.pushToHub === 'true') {
                    // Export Type
                    allFields.push({
                        name: 'exportType',
                        type: 'select',
                        options: [
                            { value: 'merged', directLabel: 'Merged Model Only' },
                            { value: 'adapter', directLabel: 'Adapter Only' },
                            { value: 'both', directLabel: 'Merged Model and Adapter' },
                        ],
                        required: true,
                        description: 'exportTypeDescription'
                    });

                    // Model Hub IDs based on export type
                    if (formState.exportType === 'merged' || formState.exportType === 'both') {
                        allFields.push({
                            name: 'exportHubModelId',
                            type: 'text',
                            required: true,
                            description: 'exportHubModelIdDescription'
                        });
                    }

                    if (formState.exportType === 'both') {
                        allFields.push({
                            name: 'adapterHubModelId',
                            type: 'text',
                            required: true,
                            description: 'adapterHubModelIdDescription'
                        });
                    }

                    // HF Token
                    allFields.push({
                        name: 'hfHubToken',
                        type: 'text',
                        required: true,
                        description: 'hfHubTokenDescription'
                    });

                    // Private repo toggle
                    allFields.push({
                        name: 'private',
                        type: 'toggle',
                        defaultValue: 'true',
                        description: 'privateDescription'
                    });
                }
            }
        } // Add missing closing bracket for the if (uiState.expandedConfig) block

        // Handle search filtering and highlighting if search query exists
        if (searchQuery.trim()) {
            console.log("Filtering fields by search query:", searchQuery);
            const locale = storeRef.current.currentLocale === 'zh' ? 'zh' : 'en';

            // Apply highlighting to basic fields (but don't filter them)
            basicFields.forEach((field) => {
                const labelKey = `${field.name}Label`;
                const label = translations[locale][labelKey as keyof typeof translations[typeof locale]] || field.name;

                if (label.toLowerCase().includes(searchQuery.toLowerCase())) {
                    field.searchHighlight = highlightMatch(label, searchQuery);
                }
            });

            // In basic mode with search, return all basic fields with highlighting on matches
            if (!showAdvanced) {
                return basicFields; // Return ALL basic fields, not just matches
            }

            // For advanced mode with search, start with all basic fields
            let allFields = [...basicFields];

            // Apply highlighting to advanced fields and collect matches
            const advancedFieldsWithMatches = staticAdvancedFields.filter(field => {
                // For section headers, check the title
                if (field.type === 'sectionHeader' && field.customTitle) {
                    const titleKey = field.customTitle;
                    const title = translations[locale][titleKey as keyof typeof translations[typeof locale]] || '';

                    if (title.toLowerCase().includes(searchQuery.toLowerCase())) {
                        field.searchHighlight = highlightMatch(title, searchQuery);
                        field.expanded = true; // Expand matched sections
                        return true;
                    }
                } else {
                    // For regular fields, check the label
                    const labelKey = `${field.name}Label`;
                    const label = translations[locale][labelKey as keyof typeof translations[typeof locale]] || field.name;

                    if (label.toLowerCase().includes(searchQuery.toLowerCase())) {
                        field.searchHighlight = highlightMatch(label, searchQuery);
                        return true;
                    }
                }

                return false;
            });

            // Add matching advanced fields to the list
            allFields.push(...advancedFieldsWithMatches);

            return allFields;
        }

        // Regular non-search behavior
        return allFields;
    }, [
        modelOptions,
        showAdvanced,
        uiState.expandedConfig,
        expandedSections,
        formState.pushToHub,
        formState.exportType,
        formState.quantization,
        searchQuery,
        storeRef.current.currentLocale
    ]);


    // Handle form field changes
    // const handleChange = useCallback((name: string, value: string) => {
    //     // Update local form state
    //     setFormState(prev => {
    //         const newState = { ...prev, [name]: value };

    //         // Store in app state (for persistence)
    //         useAppStore.getState().updateExportFormData?.(newState);

    //         return newState;
    //     });
    // }, []);
// Handle form field changes
const handleChange = useCallback((name: string, value: string) => {
    // Only update local form state, don't directly call updateExportFormData
    setFormState(prev => {
        return { ...prev, [name]: value };
    });
}, []);

// Add a debounced effect to sync formState with store
// Using a ref to track previous state to avoid unnecessary updates
const prevFormStateRef = useRef<Record<string, string>>({});
useEffect(() => {
    // Only update if we have meaningful form data, component is mounted,
    // and the form state has actually changed
    if (Object.keys(formState).length > 0 && 
        isMounted.current && 
        JSON.stringify(formState) !== JSON.stringify(prevFormStateRef.current)) {
        
        // Update our reference to current state
        prevFormStateRef.current = {...formState};
        
        // Update store as a side effect, not during render
        useAppStore.getState().updateExportFormData?.(formState);
    }
}, [formState]);

    // Handle section toggle for any section
    const handleToggleSection = useCallback((sectionKey: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    }, []);

    // Handle form submission via API
    const handleSubmit = useCallback(async (data: Record<string, string>): Promise<string> => {
        // if (!isMounted.current) return "Component is unmounted";

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
                    
                    // Add this check to ensure advanced state is preserved after successful submission
                    if (showAdvanced !== uiState.showAdvanced) {
                        console.log('Fixing UI state mismatch after submission');
                        setUiState(prev => ({ ...prev, showAdvanced: showAdvanced }));
                    }
                    
                    // Return success message
                    const locale = storeRef.current.currentLocale === 'zh' ? 'zh' : 'en';
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
    }, [showAdvanced, uiState.showAdvanced, hasSubmittedInAdvancedMode]);

    // Button actions
    const handlePreviewCurl = useCallback((data: Record<string, string>) => {
        const exportData = {
            model_name_or_path: data.modelNameOrPath,
            adapter_name_or_path: data.adapterNameOrPath,
            export_dir: data.exportDir,
            // export_format field removed - no longer needed
        };

        const curlCommand = exportService.getPreviewCurlCommand(exportData);
        alert(curlCommand);
        navigator.clipboard.writeText(curlCommand);
    }, []);

    const handleSaveConfig = useCallback((data: Record<string, string>) => {
        const locale = storeRef.current.currentLocale === 'zh' ? 'zh' : 'en';
        saveConfig(
            data,
            'export',
            translations[locale].configSaved
        );
    }, []);

    const handleLoadConfig = useCallback(() => {
        const locale = storeRef.current.currentLocale === 'zh' ? 'zh' : 'en';
        loadConfig(
            (config) => {
                // Update local state
                setFormState(prev => ({
                    ...prev,
                    ...config
                }));

                // Update store state
                useAppStore.getState().updateExportFormData?.(config);
            },
            translations[locale].configLoaded
        );
    }, []);

    const handleCheckStatus = useCallback(async () => {
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
    }, []);

    // Define form buttons with stable references
    const formButtons = useMemo<FormButton[]>(() => [
        {
            key: 'preview-curl',
            text: 'previewCurlCommand',
            variant: 'outline-secondary',
            position: 'left',
            onClick: handlePreviewCurl
        },
        {
            key: 'load-config',
            text: 'loadConfig',
            variant: 'outline-info',
            position: 'left',
            onClick: handleLoadConfig
        },
        {
            key: 'save-config',
            text: 'saveConfig',
            variant: 'outline-success',
            position: 'right',
            onClick: handleSaveConfig
        },
        {
            key: 'check-status',
            text: 'checkStatus',
            variant: 'outline-primary',
            position: 'right',
            onClick: handleCheckStatus
        }
    ], [handlePreviewCurl, handleLoadConfig, handleSaveConfig, handleCheckStatus]);

    // Return the form with modified validation behavior
    return (
        <>
            {/* For debugging - you can uncomment if needed */}
            {/* <div style={{ marginBottom: '10px' }}>
                <div>Advanced Mode from Context: {showAdvanced ? 'ON' : 'OFF'}</div>
                <div>Advanced Mode in UI State: {uiState.showAdvanced ? 'ON' : 'OFF'}</div>
            </div> */}
            <ModelForm
                title="exportModel"
                submitButtonText="startExport"
                buttons={formButtons}
                fields={formFields}
                translations={translations}
                onSubmit={handleSubmit}
                formData={formState}
                onChange={handleChange}
                isLoading={isLoading}
                showAdvanced={showAdvanced}
                // Ensure we're properly handling the validation mode flag
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
