import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as auth from "../lib/auth.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user từ localStorage khi khởi động app
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    } else {
      const u = auth.getCurrentUser?.();
      if (u) setUser(u);
    }
    setLoading(false);
  }, []);

  // ✅ Hàm đăng nhập
  async function login(username, password) {
    const res = await auth.login(username, password);
    if (res?.user && res?.token) {
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("token", res.token);
      setUser(res.user);
      setToken(res.token);
    }
    return res;
  }

  // ✅ Hàm đăng ký (nếu có)
  async function register(name, email, password) {
    const res = await auth.register(name, email, password);
    if (res?.user && res?.token) {
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("token", res.token);
      setUser(res.user);
      setToken(res.token);
    }
    return res;
  }

  // ✅ Hàm đăng xuất
  function logout() {
    try {
      auth.logout?.(); // nếu file lib có hỗ trợ
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.clear();
      setUser(null);
      setToken(null);
      console.log("✅ Đã đăng xuất và làm sạch session.");
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    }
  }

  // ✅ Dữ liệu cung cấp cho toàn app
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      setUser,
      setToken,
    }),
    [user, token, loading]
  );

  return (
    <AuthCtx.Provider value={value}>
      {!loading && children}
    </AuthCtx.Provider>
  );
}
