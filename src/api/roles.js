import fetchWithAuth from "./fetchWithAuth.js"

export const get = async () => {
  return await fetchWithAuth("/roles", { method: "GET" });
};
