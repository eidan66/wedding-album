import type { FunctionComponent } from 'react';
import styled from 'styled-components';
import animatedIdanSapir from '../assets/animated-idan-sapir.png'



export const EmptyGrid:FunctionComponent =  ()=> (
    <EmptyState>
        <img src={animatedIdanSapir} alt="no photos yet" />
        <EmptyText>וואו! אתם הראשונים שיעלו תמונה!!<br/> תנו לנו רגע מיוחד!</EmptyText>
    </EmptyState>
);


const EmptyText = styled.p`
letter-spacing: 2.5px;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryText};

  img {
    max-width: 240px;
    margin-bottom: 1rem;
  }

  p {
    font-size: 18px;
  }
`;