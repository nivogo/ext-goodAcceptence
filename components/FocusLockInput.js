// components/FocusLockInput.js

import React, { useRef, useEffect } from "react";

const FocusLockInput = ({
  value,
  onChange,
  onEnter,
  autoFocus = true,
  ...props
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    // Bileşen yüklendiğinde (veya istediğiniz zaman) otomatik odak.
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Enter yakalama
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Form submit vb. engellemek için
      if (onEnter) onEnter(e); // Enter'a özel işlem varsa
      // Tekrar odağı sağlama
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Tıklayınca yine odaklanır, ancak klavye açılmayacak
  const handleFocus = () => {
    // Örneğin, imleci metnin sonuna getirebiliriz (opsiyonel):
    const len = value ? value.length : 0;
    inputRef.current.setSelectionRange(len, len);
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      // Sanal klavyeyi kapatmak:
      inputMode="none"
      readOnly
      autoComplete="off"
      // Varsayılan olarak imleç görünümünü (caret) gizlemek isterseniz:
      style={{ caretColor: "black" }}
      {...props}
    />
  );
};

export default FocusLockInput;
