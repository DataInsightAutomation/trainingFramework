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
    
    // Also store in localStorage for persistence
    localStorage.setItem('preferredLocale', newLocale);
  };

  return (
    <header className="text-white p-2 shadow-sm" style={{ backgroundColor: currentTheme.colors.primary }}>
      <Container fluid className="d-flex justify-content-between align-items-center">
        <div className="fw-bold fs-5">{t.title}</div>
        
        <Nav className="d-flex align-items-center">
          <Nav.Link href="/" className="text-white px-3">{t.home}</Nav.Link>
          <Nav.Link href="/webui" className="text-white px-3">{t.train}</Nav.Link>
          {/* <Nav.Link href="/evaluate" className="text-white px-3">{t.evaluate}</Nav.Link> */}
          
          {/* Theme Toggle Button */}
          <Button 
            variant={currentTheme.name === 'light' ? 'outline-light' : 'light'} 
            size="sm" 
            className="ms-2 d-flex align-items-center"
            onClick={toggleTheme}
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
