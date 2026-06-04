// src/api/auth.js
import config from "./config.js";

const BASE_URL = config.BASE_URL;

export const login = async (username, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
console.log("🔵 Phản hồi đăng nhập:", response);
    let data = null;
    try {
      data = await response.json();
    } catch {
      throw new Error("Phản hồi từ máy chủ không hợp lệ (không phải JSON)");
    }

    if (!response.ok) {
      throw new Error(data?.mess || data?.message || "Đăng nhập thất bại!");
    }

    // ⭐ ép chuỗi, tránh role_id = số gây sai UI
    localStorage.setItem("role_id", String(data.user.role_id).trim());

    return data;
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập:", error);
    throw error;
  }
};
