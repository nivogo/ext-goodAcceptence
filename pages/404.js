// pages/404.js
import React from "react";
import Link from "next/link";

const Custom404 = () => {
  return (
    <div style={containerStyle}>
      <h1>404 - Sayfa Bulunamadı</h1>
      <p>Aradığınız sayfa mevcut değil.</p>
      <Link href="/" style={linkStyle}>
        Anasayfaya Dön
      </Link>
    </div>
  );
};

const containerStyle = {
  padding: "2rem",
  textAlign: "center",
};

const linkStyle = {
  color: "#0070f3",
  textDecoration: "underline",
  cursor: "pointer",
};

export default Custom404;
