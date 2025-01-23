// components/BackButton.js
import { useRouter } from 'next/router';
import React from 'react';

const BackButton = () => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button onClick={handleBack} style={buttonStyle}>
      Geri
    </button>
  );
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  margin: '1rem 0',
  backgroundColor: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

export default BackButton;
