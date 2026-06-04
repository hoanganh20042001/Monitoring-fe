

import fetchWithAuth from "./fetchWithAuth.js"

export const get = async ({ page = 1, size = 5, search_text = "" } = {}) => {
    const params = new URLSearchParams({
        page,
        size,
    });
    if (search_text) {
        params.append("search_text", search_text);
    }
    return await fetchWithAuth(`/tasks?${params.toString()}`, {
        method: "GET",
    });
};
export const getById = async (id) => {
  console.log("Fetching task by ID:", id);
    if (!id) throw new Error("Thiếu ID đơn vị!");
    return await fetchWithAuth(`/tasks/${id}`, { method: "GET" });
};
export const getByUser = async () => {
  console.log("Fetching tasks for current user");
  return await fetchWithAuth(`/tasks/user`, { method: "GET" });
};


export const create = async (data) => {
  return await fetchWithAuth("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const update = async (id, data) => {
  if (!id) throw new Error("Thiếu ID đơn vị");
  if (!data) throw new Error("Thiếu dữ liệu cập nhật!");

  return await fetchWithAuth(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};
export const updateStatus = async (id, data) => {
  if (!id) throw new Error("Thiếu ID đơn vị");
  if (!data) throw new Error("Thiếu dữ liệu cập nhật!");

  return await fetchWithAuth(`/tasks/updateStatus/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const remove = async (id) => {
  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/tasks/${id}`, { method: "DELETE" });
};