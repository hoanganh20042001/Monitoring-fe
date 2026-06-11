import fetchWithAuth from "./fetchWithAuth.js";

const BASE_URL = "/nguoi_dung";

export const get = async () => {
  return await fetchWithAuth(BASE_URL, {
    method: "GET",
  });
};

export const getMe = async () => {
  return await fetchWithAuth(`${BASE_URL}/me`, {
    method: "GET",
  });
};

export const getList = async () => {
  return await fetchWithAuth(`${BASE_URL}/list`, {
    method: "GET",
  });
};

export const getById = async (id) => {
  if (!id) throw new Error("Thiếu ID người dùng!");

  return await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "GET",
  });
};

export const create = async (data) => {
  if (!data) throw new Error("Thiếu dữ liệu tạo người dùng!");

  return await fetchWithAuth(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const update = async (id, data) => {
  if (!id) throw new Error("Thiếu ID người dùng!");
  if (!data) throw new Error("Thiếu dữ liệu cập nhật!");

  return await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const changePassBySa = async (id, data) => {
  if (!id) throw new Error("Thiếu ID người dùng!");
  if (!data?.new_password) throw new Error("Thiếu mật khẩu mới!");

  return await fetchWithAuth(`${BASE_URL}/${id}/change-pass`, {
    method: "PUT",
    body: JSON.stringify({
      old_password: data.old_password,
      new_password: data.new_password,
    }),
  });
};

export const changePassMe = async (data) => {
  if (!data) throw new Error("Thiếu dữ liệu đổi mật khẩu!");

  return await fetchWithAuth(`${BASE_URL}/change-pass/me`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const remove = async (id) => {
  if (!id) throw new Error("Thiếu ID người dùng!");

  return await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
};