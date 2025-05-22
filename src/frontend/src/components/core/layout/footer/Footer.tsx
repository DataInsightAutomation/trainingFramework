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
    <footer className="text-white p-2 shadow-sm" style={{ backgroundColor: theme.colors.primary }}>
      <Container fluid>
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start">
            <small>{t.copyright}</small>
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
