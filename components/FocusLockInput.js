// components/FocusLockInput.js
import React, { useRef, useEffect } from "react";

/**
 * Mobilde sanal klavyeyi açmamak için inputMode="none" ve readOnly yaklaşımları kullanıyoruz.
 * Enter'a basıldığında odak yine input'un üzerinde kalmaya devam edecek.
 */
const FocusLockInput = ({
  value,
  onChange,
  onEnter,    // Enter'a basıldığında yapılacak özel bir işlem istiyorsak
  autoFocus = true,
  ...props
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    // Bileşen ilk yüklendiğinde (veya value değiştiğinde) otomatik odaklamak isterseniz
    // autoFocus özelliği true ise odaklar
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [value, autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Enter basıldığında formu göndermesini engelle
      e.preventDefault();
      // Eğer bir callback ile spesifik işlem istiyorsak
      if (onEnter) {
        onEnter(e);
      }
      // Enter'a basıldıktan sonra da tekrar focus veriyoruz
      // (Her ihtimale karşı, bazı tarayıcılarda kaybolabilir)
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      // Mobilde klavye çıkışını engellemek için (çoğu modern tarayıcı destekliyor):
      inputMode="none"
      // Bazı cihazlarda yine de açılmaması için readOnly
      readOnly
      style={{ caretColor: "transparent" }} // İmleç görünmez yapmak isterseniz
      autoComplete="off"
      {...props}
    />
  );
};

export default FocusLockInput;
