import React, { useEffect, useRef } from 'react';

export default function Dropdown({ open, onClose, className = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    function onEsc(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  if (!open) return null;
  return (
    <div ref={ref} className={`absolute z-50 mt-2 w-64 bg-white border border-blue-100 rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
  );
}
