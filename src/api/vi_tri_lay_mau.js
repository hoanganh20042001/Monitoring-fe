
import fetchWithAuth from "./fetchWithAuth.js"

export const get = async (searchText) => {
  console.log("Fetching TA records with search text:", searchText.searchText);
  return await fetchWithAuth(`/vi_tri_lay_mau?search_text=${encodeURIComponent(searchText.searchText)}`, { method: "GET" });
};


export const getByUnitId = async (id) => {
  return await fetchWithAuth(`/vi_tri_lay_mau/${id}`, { method: "GET" });
};


export const getById = async (id) => {
  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/vi_tri_lay_mau/${id}`, { method: "GET" });
};


export const create = async (data) => {
  console.log("Creating TA record with data:", data);
  return await fetchWithAuth("/vi_tri_lay_mau", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const update = async (id, data) => {
  if (!id) throw new Error("Thiếu ID đơn vị");
  if (!data) throw new Error("Thiếu dữ liệu cập nhật!");

  return await fetchWithAuth(`/vi_tri_lay_mau/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};


export const remove = async (id) => {

  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/vi_tri_lay_mau/${id}`, { method: "DELETE" });
};

