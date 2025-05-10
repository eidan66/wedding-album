import styled from 'styled-components';

const FooterWrapper = styled.footer`
  text-align: center;
  padding: 1rem;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.secondaryText};
  margin-top: 2rem;

  a {
    color: ${({ theme }) => theme.colors.buttonText};
    text-decoration: none;
    font-weight: bold;
  }
`;

export const Footer = () => (
  <FooterWrapper>
    האתר נבנה באהבה על ידי{' '}
    <a href="https://idanlevian.com" target="_blank" rel="noopener noreferrer">
      עידן לויאן
    </a>
    <br />
    © 2025 כל הזכויות שמורות.
  </FooterWrapper>
);