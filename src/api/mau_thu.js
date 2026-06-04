
import fetchWithAuth from "./fetchWithAuth.js"

export const get = async () => {
  return await fetchWithAuth(`/mau_thu`, { method: "GET" });
};


export const getByUnitId = async (id) => {
  return await fetchWithAuth(`/mau_thu/${id}`, { method: "GET" });
};


export const getById = async (id) => {
  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/mau_thu/${id}`, { method: "GET" });
};


export const create = async (data) => {
  console.log("Creating mau_thu with data:", data);
  return await fetchWithAuth("/mau_thu", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const update = async (id, data) => {
  if (!id) throw new Error("Thiếu ID đơn vị");
  if (!data) throw new Error("Thiếu dữ liệu cập nhật!");

  return await fetchWithAuth(`/mau_thu/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};


export const remove = async (id) => {

  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/mau_thu/${id}`, { method: "DELETE" });
};

