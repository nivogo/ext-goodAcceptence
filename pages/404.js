// pages/404.js
import React from 'react';
import Link from 'next/link';

const Custom404 = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>404 - Sayfa Bulunamadı</h1>
      <p>Aradığınız sayfa mevcut değil.</p>
      <Link href="/">Anasayfaya Dön</Link>
    </div>
  );
};

export default Custom404;
