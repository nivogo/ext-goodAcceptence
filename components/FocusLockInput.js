// components/FocusLockInput.js

import React, { useRef, useEffect } from "react";

/**
 * El terminalinde sürekli caret (imleç) görünmesi
 * ve mobil klavye açılmasını engellemek için:
 *  - inputMode="none" => Mobil klavye açma ipucunu kapatır
 *  - readOnly yerine normal "type=text" -> caret görünsün
 *  - style={{ caretColor: "black" }} => imleç rengi belirgin olsun
 *  - Enter'a basıldığında focus kaybolmasın => handleKeyDown
 */
function FocusLockInput({
  value,
  onChange,
  onEnter,           // Enter'a basınca yapılacak işlem
  autoFocus = true,  // Bileşen yüklenince otomatik odak
  className = "",
  style = {},
  enableKeyboard = false,
  ...props
}) {
  const inputRef = useRef(null);

  // Sayfa/bileşen yüklendiğinde odak ver
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Enter'a basılınca (cihaz auto enter yapsa bile) fokus koru
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Form gönderimi vs. engelle
      e.preventDefault();

      // Dışarıdan bir işlem istiyorsak
      if (onEnter) {
        onEnter(e);
      }

      // Fokus tekrar input'ta kalsın
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Stil birleştirmesi (caretColor: black => imleç siyah gözükür)
  const combinedStyle = {
    caretColor: "black",
    ...style,
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      // Mobil tarayıcıların klavye açmamasını önerir:
      inputMode={enableKeyboard ? "text" : "none"}
      // Otomatik tamamlamaları kapatalım
      autoComplete="off"
      // Caret gösterirken mobil klavyeyi tetiklememeye çalışır
      style={combinedStyle}
      className={className}
      {...props}
    />
  );
}

export default FocusLockInput;
