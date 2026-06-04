import fetchWithAuth from "./fetchWithAuth.js"

export const get = async () => {
  return await fetchWithAuth("/user_histories", { method: "GET" });
};
