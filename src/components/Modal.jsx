import React from 'react';

export default function Modal({ open, onClose, title, children, footer, className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* 👇 Đây là phần modal chính — thêm hỗ trợ className & mở rộng ngang */}
      <div className={`relative w-full ${className} card max-h-[90vh] overflow-y-auto`}>
        <div className="card-header flex items-center justify-between">
          <span className="text-lg font-semibold w-full text-center">{title}</span>
          <button className="text-gray-500 hover:text-black absolute right-4" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="card-body">{children}</div>

        {footer && (
          <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-end gap-2 sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
