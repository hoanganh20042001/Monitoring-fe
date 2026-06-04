import React from "react";

/**
 * Component hiển thị tiêu đề trang (PageHeader)
 * 
 * Props:
 *  - title: tiêu đề chính (bắt buộc)
 *  - subtitle: mô tả phụ (tùy chọn)
 *  - right: phần tử hiển thị bên phải (thường là các nút)
 *  - children: phần tử mở rộng (tuỳ chọn)
 */
export default function PageHeader({ title, subtitle, right, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      {/* Bên trái - Tiêu đề & mô tả */}
      <div>
        <h1 className="text-2xl font-bold text-blue-700 tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-blue-600 mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bên phải - Các nút chức năng */}
      {right && (
        <div className="flex flex-wrap items-center gap-2">
          {right}
        </div>
      )}

      {/* Phần mở rộng khác nếu có */}
      {children && (
        <div className="mt-2 w-full">
          {children}
        </div>
      )}
    </div>
  );
}
