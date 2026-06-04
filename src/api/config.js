
const BASE_URL =
  import.meta.env?.VITE_API_URL?.trim() ||
  "http://localhost:3000/api"; // ✅ fallback mặc định

export default {
  BASE_URL,
};
