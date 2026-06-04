import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  History,
  Ruler,
  FlaskConical,
  MapPinned,
} from "lucide-react";
import clsx from "clsx";

const GREEN = "#2E7D32";

export default function Sidebar({ open = true }) {
  const role_id = localStorage.getItem("role_id");

  const navTree = [
    {
      id: "home",
      to: "/admin",
      label: "Trang chủ",
      icon: <Home size={24} color={GREEN} />,
      show: true,
    },
    {
      id: "users",
      to: "/users",
      label: "Quản lý người dùng",
      icon: <Users size={24} color={GREEN} />,
      show: true,
    },
    {
      id: "logs",
      to: "/logs",
      label: "Lịch sử người dùng",
      icon: <History size={24} color={GREEN} />,
      show: true,
    },
    // {
    //   id: "don-vi-tinh",
    //   to: "/don_vi_tinh",
    //   label: "Đơn vị tính",
    //   icon: <Ruler size={24} color={GREEN} />,
    //   show: true,
    // },
    {
      id: "loai-mau",
      to: "/loai_mau",
      label: "Loại mẫu",
      icon: <FlaskConical size={24} color={GREEN} />,
      show: true,
    },
    {
      id: "khu-vuc",
      to: "/khu_vuc",
      label: "Khu vực lấy mẫu",
      icon: <MapPinned size={24} color={GREEN} />,
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <aside
      className={clsx(
        "bg-white h-screen border-r border-gray-200 transition-all duration-300 shadow-md relative",
        open ? "w-64" : "w-20"
      )}
    >
      {/* ===== MENU ===== */}
      <nav className="py-4">
        {navTree.map((item) => (
          <div key={item.id} className="px-3 mb-2">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all border",
                  "hover:bg-green-50 hover:scale-[1.05] hover:border-green-600",
                  isActive
                    ? "bg-green-100 border-green-600 text-green-700"
                    : "text-green-700 border-transparent"
                )
              }
              title={!open ? item.label : ""}
            >
              <span className="shrink-0">{item.icon}</span>

              {open && (
                <span className="font-bold text-green-700 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* ===== FOOTER ===== */}
      <div className="absolute bottom-0 w-full py-3 text-center text-green-700 text-xs border-t border-gray-200">
        {open ? `© ${new Date().getFullYear()} CBRN-MEDIC` : "©"}
      </div>
    </aside>
  );
}