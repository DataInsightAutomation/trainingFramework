import { Theme } from '../../../themes/theme';

export interface BaseFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  required?: boolean;
  validated?: boolean;
  theme: Theme;
}

export interface TextFieldProps extends BaseFieldProps {
  placeholder: string;
}

export interface SelectFieldProps extends BaseFieldProps {
  placeholder: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}

export interface SearchableSelectFieldProps extends SelectFieldProps {
  isClearable?: boolean;
  noOptionsMessage?: string;
}
