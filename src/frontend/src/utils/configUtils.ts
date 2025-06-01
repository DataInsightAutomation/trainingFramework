/**
 * Shared utilities for handling configuration saving and loading
 * Used by both Train and Export components
 */

/**
 * Saves configuration to localStorage and downloads as a JSON file
 * 
 * @param data The configuration data to save
 * @param configType The type of configuration (used for localStorage key and filename)
 * @param successMessage Message to display on successful save
 */
export const saveConfig = (
  data: Record<string, string>, 
  configType: 'train' | 'export',
  successMessage: string
): void => {
  // Convert data to JSON
  const configJson = JSON.stringify(data, null, 2);
  
  // Save to localStorage as backup
  localStorage.setItem(`${configType}Config`, configJson);
  
  // Create downloadable file
  const blob = new Blob([configJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${configType}-config.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Show success message
  alert(successMessage);
};

/**
 * Loads configuration from a file selected by the user
 * 
 * @param onConfigLoaded Callback function called with the loaded configuration
 * @param successMessage Message to display on successful load
 */
export const loadConfig = (
  onConfigLoaded: (config: Record<string, string>) => void,
  successMessage: string
): void => {
  // Create a file input element
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  
  // Handle file selection
  input.onchange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (!event.target?.result) return;
          
          // Parse the JSON from file
          const config = JSON.parse(event.target.result as string);
          
          // Call the provided callback with the loaded config
          onConfigLoaded(config);
          
          // Show success message
          alert(successMessage);
        } catch (error) {
          console.error('Failed to parse config file:', error);
          alert('Invalid configuration file');
        }
      };
      reader.readAsText(file);
    }
  };
  
  // Trigger file selection dialog
  input.click();
};
