// src/components/PriorityBadge.jsx
import React from "react";
import clsx from "clsx";

const colorMap = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function PriorityBadge({ level }) {
  if (!level) return null;

  return (
    <span
      className={clsx(
        "px-2 py-1 rounded-full text-xs font-semibold",
        colorMap[level] || colorMap.MEDIUM
      )}
    >
      {level}
    </span>
  );
}
