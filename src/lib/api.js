const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const asJson = async (res) => { if (!res.ok) throw new Error('Lỗi API'); return res.json(); };


export const api = {
async list() {
const res = await fetch(`${API}/records`, { credentials: 'include' });
return asJson(res);
},
async create(rec) {
const res = await fetch(`${API}/records`, {
method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(rec)
});
return asJson(res);
},
async update(id, patch) {
const res = await fetch(`${API}/records/${id}`, {
method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(patch)
});
return asJson(res);
},
async remove(id) {
const res = await fetch(`${API}/records/${id}`, { method: 'DELETE', credentials: 'include' });
await asJson(res);
return true;
},
};