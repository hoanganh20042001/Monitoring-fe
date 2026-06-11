import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Footer from "./components/Footer.jsx";
import Protected from "./components/Protected.jsx";
import AuthProvider from "./context/AuthContext.jsx";

import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// import TienDoCongViecPage from "./pages/progress";
import { Users, Loai_mau, Logs, Admin, Khu_vuc, Don_vi_tinh } from "./pages/system";
// import TaskList from "./pages/task";

/* ================= USER / PUBLIC ================= */
function UserLayout() {
  return (
    <div className="min-h-screen w-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/trang_chu"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        {/* <Route
          path="/tasks"
          element={
            <Protected>
              <TaskList />
            </Protected>
          }
        /> */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/* ================= ADMIN ================= */
function AdminLayout({ sidebarOpen, setSidebarOpen }) {
  const sidebarWidth = sidebarOpen ? 256 : 80;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      {/* TOPBAR */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-white shadow">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      </header>

      {/* SIDEBAR */}
      <aside
        style={{ width: sidebarWidth }}
        className="fixed top-16 left-0 bottom-0 z-40 bg-white border-r transition-all duration-300"
      >
        <Sidebar open={sidebarOpen} />
      </aside>

      {/* MAIN CONTENT */}
      <main
        style={{ marginLeft: sidebarWidth }}
        className="pt-16 h-full transition-all duration-300"
      >
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto px-6 py-6 min-h-full">
            <Routes>
              <Route path="/" element={<Navigate to="/admin" replace />} />

              <Route
                path="/admin"
                element={
                  <Protected>
                    <Admin />
                  </Protected>
                }
              />

              <Route
                path="/users"
                element={
                  <Protected>
                    <Users />
                  </Protected>
                }
              />

              <Route
                path="/logs"
                element={
                  <Protected>
                    <Logs />
                  </Protected>
                }
              />

              <Route
                path="/users"
                element={
                  <Protected>
                    <Users />
                  </Protected>
                }
              />

              <Route
                path="/khu_vuc"
                element={
                  <Protected>
                    <Khu_vuc />
                  </Protected>
                }
              />
<Route
                path="/don_vi_tinh"
                element={
                  <Protected>
                    <Don_vi_tinh />
                  </Protected>
                }
              />
              <Route
                path="/loai_mau"
                element={
                  <Protected>
                    <Loai_mau />
                  </Protected>
                }
              />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>

            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ================= ROOT ================= */
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [roleId, setRoleId] = useState(() => {
    return String(localStorage.getItem("role_id") || "").trim();
  });

  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRoleId = localStorage.getItem("role_id");

    setIsAuthenticated(!!token);
    setRoleId(String(storedRoleId || "").trim());
  }, [location.pathname]);

  // Admin là role_id = 1
  const isAdmin = roleId === "admin";

  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/users") ||
    location.pathname.startsWith("/loai_mau") ||
    location.pathname.startsWith("/khu_vuc") ||
    location.pathname.startsWith("/logs") ||
    location.pathname.startsWith("/progress");

  return (
    <AuthProvider>
      {isAdminRoute ? (
        isAuthenticated ? (
          isAdmin ? (
            <AdminLayout
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          ) : (
            <Navigate to="/trang_chu" replace />
          )
        ) : (
          <Navigate to="/" replace />
        )
      ) : (
        <UserLayout />
      )}
    </AuthProvider>
  );
}