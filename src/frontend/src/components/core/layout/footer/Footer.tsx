import React, { useContext } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Context } from '../../../../utils/context';

const Footer = () => {
  const { state } = useContext(Context);
  const locale = state.currentLocale || 'en';
  const theme = state.currentTheme;
  
  // Simple translations for footer
  const translations = {
    en: {
      copyright: '© 2025 Intel AI Training Framework. All rights reserved.',
      version: 'Version 1.0.0',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    },
    zh: {
      copyright: '© 2025 AI 训练框架. 保留所有权利.',
      version: '版本 1.0.0',
      privacy: '隐私政策',
      terms: '服务条款'
    }
  };
  
  const t = translations[locale as keyof typeof translations];

  return (
    <footer
      className="text-white p-2 shadow-sm"
      style={{
        background: theme.name === 'light'
          ? 'linear-gradient(90deg, #ffb347 0%, #ff7a00 40%, #ff6f91 100%)'
          : 'linear-gradient(90deg, #232046 0%, #ff7a00 60%, #ffb347 100%)',
        boxShadow: theme.name === 'light'
          ? '0 -2px 16px 0 rgba(255, 122, 0, 0.10)'
          : '0 -2px 16px 0 rgba(255, 179, 71, 0.10)'
      }}
    >
      <Container fluid>
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start">
            <small
              style={
                theme.name === 'light'
                  ? {
                      color: '#7a3a00', // solid readable color for light theme
                      fontWeight: 700
                    }
                  : {
                      background: 'linear-gradient(90deg, #ffb347 0%, #ff7a00 60%, #ff6f91 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 700,
                      filter: 'brightness(1.7) drop-shadow(0 1px 2px #000)',
                      textShadow: '0 1px 4px #000, 0 0px 2px #ffb347'
                    }
              }
            >
              {t.copyright}
            </small>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <small className="me-3">{t.version}</small>
            <a href="#privacy" className="text-white text-decoration-none me-3">
              <small>{t.privacy}</small>
            </a>
            <a href="#terms" className="text-white text-decoration-none">
              <small>{t.terms}</small>
            </a>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
