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
    primary: '#7c3aed', // LLaMA purple accent
    secondary: '#a78bfa', // Lighter purple accent
    background: '#f5f6fa',
    text: '#232046',
    cardBg: '#ffffff',
    border: '#dee2e6'
  }
};


export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#7c3aed', // LLaMA purple accent
    secondary: '#a78bfa', // Lighter purple accent
    background: '#18181b',
    text: '#e0e7ff',
    cardBg: '#232046',
    border: '#37304a'
  }
};

export const getTheme = (themeName: string): Theme => {
  return themeName === 'dark' ? darkTheme : lightTheme;
};
