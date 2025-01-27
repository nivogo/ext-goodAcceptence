// components/FocusLockInput.js
import React, { useRef, useEffect } from "react";

const FocusLockInput = ({
  value,
  onChange,
  onEnter,      // Enter tuşu yakalamak isterseniz
  autoFocus = true,
  className,
  style,
  ...props
}) => {
  const inputRef = useRef(null);

  // Sayfa açıldığında (veya bileşen yüklendiğinde) otomatik odak al
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Enter tuşuna basılınca submit veya özel fonksiyon tetikle
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onEnter) onEnter(e);

      // Enter sonrası yine fokus kaybolmasın
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Input’a tıklanınca focus ver (klavye yine açılmayacak)
  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      // Mobil klavye açılmaması için:
      readOnly
      inputMode="none"
      // Otomatik tamamlama ve tavsiyeler kapatmak:
      autoComplete="off"
      // İsterseniz caret rengini belirleyebilirsiniz (bazı tarayıcılarda görünmeyebilir):
      // style={{ caretColor: "auto" }}
      className={className}
      style={style}
      {...props}
    />
  );
};

export default FocusLockInput;
