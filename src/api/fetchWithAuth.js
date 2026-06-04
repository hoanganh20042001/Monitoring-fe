import config from "./config.js";

const BASE_URL = config.BASE_URL;

/**
 * 🌐 fetchWithAuth — Tự động thêm token, xử lý lỗi & dùng được cho mọi loại request
 * Hỗ trợ: JSON, FormData, upload file, redirect khi token hết hạn
 */
export default async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  // 🚪 Nếu chưa đăng nhập → về login
  if (!token) {
    redirectToLogin("Chưa đăng nhập hoặc token không hợp lệ!");
    return;
  }

  // 🧩 Chuẩn hóa headers
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  // ❗ Nếu body KHÔNG phải FormData thì mới set Content-Type JSON
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error("Không thể kết nối đến máy chủ!");
  }

  // 🧭 Token hết hạn hoặc bị từ chối
  if (response.status === 401 || response.status === 403) {
    redirectToLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    return;
  }

  // 🧾 Xử lý phản hồi
  const contentType = response.headers.get("content-type") || "";

  // Nếu BE trả JSON
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || `Lỗi API (${response.status})`);
    }
    return data;
  }

  // Nếu BE trả text (ví dụ: message khi PUT/DELETE)
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Lỗi API (${response.status})`);
  return text;
}

/**
 * 🔁 Hàm tiện ích: Xoá token và chuyển về login
 */
function redirectToLogin(msg) {
  console.warn(msg);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("/login");
}
