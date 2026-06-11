import fetchWithAuth from "./fetchWithAuth.js"

export const get = async () => {
  return await fetchWithAuth(`/dashboard`, { method: "GET" });
};
