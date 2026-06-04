// src/components/EmptyState.jsx
import React from "react";

export default function EmptyState({ title = "Không có dữ liệu", desc, action }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center">
      <div className="text-lg font-semibold text-blue-700 mb-1">{title}</div>
      {desc && <div className="text-sm text-blue-600 mb-4">{desc}</div>}
      {action}
    </div>
  );
}
