

import fetchWithAuth from "./fetchWithAuth.js"

export const get = async () => {
  return await fetchWithAuth("/users", { method: "GET" });
};
export const getMe = async () => {
  return await fetchWithAuth("/users/getMe/", { method: "GET" });
};
export const getList = async () => {
  return await fetchWithAuth("/users/list/", { method: "GET" });
};
export const getById = async (id) => {
  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/users/${id}`, { method: "GET" });
};


export const create = async (data) => {
  return await fetchWithAuth("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const update = async (id, data) => {
  if (!id) throw new Error("Thiếu ID đơn vị");
  if (!data) throw new Error("Thiếu dữ liệu cập nhật!");

  return await fetchWithAuth(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const changePass = async (id, { old_password, new_password }) => {
  console.log(old_password, new_password)
  return await fetchWithAuth(`/users/change_pass_by_sa/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      old_password,
      new_password,
    }),
  });
};
export const changePassMe = async (data ) => {
  // console.log(old_password, new_password)
  console.log(data)
  return await fetchWithAuth(`/users/change_pass/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
 data
    }),
  });
};


export const remove = async (id) => {
  if (!id) throw new Error("Thiếu ID đơn vị!");
  return await fetchWithAuth(`/users/${id}`, { method: "DELETE" });
};