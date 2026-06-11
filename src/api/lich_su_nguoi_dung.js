
import fetchWithAuth from "./fetchWithAuth.js"

export const get = async () => {
  return await fetchWithAuth(`/lich_su_nguoi_dung`, { method: "GET" });
};




export const getById = async (id) => {
  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/lich_su_nguoi_dung/${id}`, { method: "GET" });
};