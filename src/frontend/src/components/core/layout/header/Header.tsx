import React from 'react';
import { Navbar, Container, Nav, Dropdown, Button } from 'react-bootstrap';
import { useAppStore } from '../../../../store/appStore';

const Header = () => {
  // Use Zustand store directly
  const { currentLocale, currentTheme, toggleTheme, setLocale } = useAppStore();
  const locale = currentLocale || 'en';
  
  // Simple translations
  const translations = {
    en: {
      title: 'Intel AI Training Framework',
      home: 'Home',
      train: 'Train',
      evaluate: 'Evaluate',
      language: 'Language',
      english: 'English',
      chinese: '中文',
      lightTheme: 'Light Mode',
      darkTheme: 'Dark Mode'
    },
    zh: {
      title: 'AI 训练框架',
      home: '首页',
      train: '训练',
      evaluate: '评估',
      language: '语言',
      english: 'English',
      chinese: '中文',
      lightTheme: '亮色模式',
      darkTheme: '暗色模式'
    }
  };
  
  const t = translations[locale as keyof typeof translations];

  // Function to change the language
  const changeLanguage = (newLocale: string) => {
    setLocale(newLocale as 'en' | 'zh' | 'vi' | 'fr');
  };
  
  // Function to toggle theme with persistence
  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <header
      className="text-white p-2 shadow-sm"
      style={{
        background: currentTheme.name === 'light'
          ? 'linear-gradient(90deg, #ffb347 0%, #ff7a00 40%, #ff6f91 100%)'
          : 'linear-gradient(90deg, #232046 0%, #ff7a00 60%, #ffb347 100%)',
        boxShadow: currentTheme.name === 'light'
          ? '0 2px 16px 0 rgba(255, 122, 0, 0.10)'
          : '0 2px 16px 0 rgba(255, 179, 71, 0.10)'
      }}
    >
      <Container fluid className="d-flex justify-content-between align-items-center">
        <div
          className="fw-bold fs-5"
          style={
            currentTheme.name === 'light'
              ? {
                  color: '#7a3a00', // solid readable color for light theme
                  fontWeight: 800
                }
              : {
                  background: 'linear-gradient(90deg, #ffb347 0%, #ff7a00 60%, #ff6f91 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800
                }
          }
        >
          {t.title}
        </div>
        <Nav className="d-flex align-items-center">
          <Nav.Link href="/" className="text-white px-3">{t.home}</Nav.Link>
          {/* <Nav.Link href="/webui" className="text-white px-3">{t.train}</Nav.Link> */}
          {/* <Nav.Link href="/evaluate" className="text-white px-3">{t.evaluate}</Nav.Link> */}
          {/* Theme Toggle Button */}
          <Button 
            variant={currentTheme.name === 'light' ? 'outline-light' : 'light'} 
            size="sm" 
            className="ms-2 d-flex align-items-center"
            onClick={handleToggleTheme}
            style={{
              background: currentTheme.name === 'light'
                ? 'linear-gradient(90deg, #ffb347 0%, #ff7a00 60%, #ff6f91 100%)'
                : 'linear-gradient(90deg, #ffb347 0%, #ff7a00 60%, #ff6f91 100%)',
              border: 'none',
              color: '#fff',
              boxShadow: '0 2px 8px 0 rgba(255, 122, 0, 0.10)'
            }}
          >
            <i className={`bi bi-${currentTheme.name === 'light' ? 'moon' : 'sun'} me-1`}></i>
            {currentTheme.name === 'light' ? t.darkTheme : t.lightTheme}
          </Button>
          {/* Language Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-light" size="sm" id="dropdown-language" className="ms-2">
              {t.language}
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-sm">
              <Dropdown.Item 
                active={locale === 'en'} 
                onClick={() => changeLanguage('en')}
              >
                {translations.en.english}
              </Dropdown.Item>
              <Dropdown.Item 
                active={locale === 'zh'} 
                onClick={() => changeLanguage('zh')}
              >
                {translations.zh.chinese}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </header>
  );
};

export default Header;
