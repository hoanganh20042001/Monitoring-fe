

import fetchWithAuth from "./fetchWithAuth.js"

export const get = async ({ taskId } = {}) => {
  if (!taskId) {
    return fetchWithAuth("/comments", { method: "GET" });
  }

  return fetchWithAuth(`/comments?taskId=${Number(taskId)}`, {
    method: "GET",
  });
};



export const getById = async (id) => {
    if (!id) throw new Error("Thiếu ID đơn vị!");
    return await fetchWithAuth(`/comments?id=${id}`, { method: "GET" });
};


export const create = async (data) => {
    return await fetchWithAuth("/comments", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const update = async (id, data) => {
    if (!id) throw new Error("Thiếu ID đơn vị");
    if (!data) throw new Error("Thiếu dữ liệu cập nhật!");

    return await fetchWithAuth(`/comments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
};


export const remove = async (id) => {
    if (!id) throw new Error("Thiếu ID đơn vị!");
    return await fetchWithAuth(`/comments/${id}`, { method: "DELETE" });
};