import React from "react";
import clsx from "clsx";

export default function Table({
  columns = [],
  data = [],
  renderActions,
  onRowClick,
  rowClassName = () => "",
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-green-300 bg-white">
      <table className="min-w-full border-collapse">

        {/* ===== HEADER ===== */}
        <thead className="bg-green-100">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "px-3 py-2 text-left font-semibold text-green-700 border-b border-green-300",
                  c.className
                )}
              >
                {c.title}
              </th>
            ))}

            {renderActions && (
              <th className="px-3 py-2 text-left font-semibold text-green-700 border-b border-green-300 w-28">
                Hành động
              </th>
            )}
          </tr>
        </thead>

        {/* ===== BODY ===== */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (renderActions ? 1 : 0)}
                className="py-6 text-center text-green-700 italic"
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={
                  row.__rowKey ||
                  `${idx}_${row.id || "noid"}_${Math.random()}`
                }
                onClick={() => onRowClick && onRowClick(row)}
                className={clsx(
                  idx % 2 === 0 ? "bg-white" : "bg-green-50/50",
                  "transition cursor-pointer hover:bg-green-100",
                  rowClassName(row)
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx(
                      "px-3 py-2 border-t border-green-200 text-sm text-green-800",
                      c.className
                    )}
                  >
                    {c.render ? c.render(row[c.key], row) : row[c.key]}
                  </td>
                ))}

                {renderActions && (
                  <td className="px-3 py-2 border-t border-green-200 text-sm">
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
