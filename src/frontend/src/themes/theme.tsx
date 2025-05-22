export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  cardBg: string;
  border: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#0d6efd', // Bootstrap primary blue
    secondary: '#6c757d', // Bootstrap secondary gray
    background: '#f5f6fa',
    text: '#212529',
    cardBg: '#ffffff',
    border: '#dee2e6'
  }
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#0a58ca', // Darker blue
    secondary: '#495057', // Darker gray
    background: '#212529',
    text: '#f8f9fa',
    cardBg: '#343a40',
    border: '#495057'
  }
};

export const getTheme = (themeName: string): Theme => {
  return themeName === 'dark' ? darkTheme : lightTheme;
};
