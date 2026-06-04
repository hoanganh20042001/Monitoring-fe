import fetchWithAuth from "./fetchWithAuth.js"

// export const get = async () => {
//   return await fetchWithAuth("/boards", { method: "GET" });
// };
export const get = async ({
  search_text = "",
  type = "all",
  priority = "all",
  due_from,
  due_to,
  overdueOnly = false,
} = {}) => {
  const params = new URLSearchParams();

  if (search_text) params.append("search_text", search_text);
  if (type !== "all") params.append("type", type);
  if (priority !== "all") params.append("priority", priority); // HIGH/MEDIUM/LOW
  if (due_from) params.append("due_from", due_from);
  if (due_to) params.append("due_to", due_to);
  if (overdueOnly) params.append("overdue", "1");

  return fetchWithAuth(`/boards?${params.toString()}`, {
    method: "GET",
  });
};
