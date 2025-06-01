import { FormButton } from '../components/shared/ModelForm/ModelForm';
import { saveConfig, loadConfig } from './configUtils';

/**
 * Creates common button actions for model configuration forms
 */
export function createFormButtons({
  formType,
  previewCommand,
  checkStatus,
  translations,
  currentLocale,
  updateFormData
}: {
  formType: 'train' | 'evaluate' | 'export';
  previewCommand: (data: Record<string, string>) => void;
  checkStatus?: () => void;
  translations: any;
  currentLocale: string;
  updateFormData: (data: any) => void;
}): FormButton[] {
  const locale = currentLocale === 'zh' ? 'zh' : 'en';
  
  const buttons: FormButton[] = [
    {
      key: 'preview-command',
      text: 'previewCurlCommand',
      variant: 'outline-secondary',
      position: 'left',
      onClick: previewCommand
    },
    {
      key: 'load-config',
      text: 'loadConfig',
      variant: 'outline-info',
      position: 'left',
      onClick: () => {
        loadConfig(
          (config) => {
            updateFormData(config);
          },
          translations[locale].configLoaded
        );
      }
    },
    {
      key: 'save-config',
      text: 'saveConfig',
      variant: 'outline-success',
      position: 'right',
      onClick: (data: Record<string, string>) => {
        saveConfig(
          data,
          formType,
          translations[locale].configSaved
        );
      }
    }
  ];
  
  // Add check status button if the function is provided
  if (checkStatus) {
    buttons.push({
      key: 'check-status',
      text: 'checkStatus',
      variant: 'outline-primary',
      position: 'right',
      onClick: () => checkStatus()
    });
  }
  
  return buttons;
}
