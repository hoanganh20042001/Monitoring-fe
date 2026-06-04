// src/lib/auth.js (MOCK localStorage – KHÔNG gọi API)
const KEY_USERS = 'upsc_users';
const KEY_SESSION = 'upsc_session';

function readUsers() {
  const raw = localStorage.getItem(KEY_USERS);
  return raw ? JSON.parse(raw) : [];
}
function writeUsers(list) { localStorage.setItem(KEY_USERS, JSON.stringify(list)); }

export function getCurrentUser() {
  const raw = localStorage.getItem(KEY_SESSION);
  return raw ? JSON.parse(raw) : null;
}

export function logout() { localStorage.removeItem(KEY_SESSION); }

export async function register(name, email, password) {
  await delay(120);
  const users = readUsers();
  if (users.some(u => u.email === email)) throw new Error('Email đã tồn tại');
  const user = {
    id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
    name, email, passwordHash: btoa(password),
  };
  users.push(user);
  writeUsers(users);
  localStorage.setItem(KEY_SESSION, JSON.stringify({ id: user.id, name, email }));
  return getCurrentUser();
}

export async function login(email, password) {
  await delay(120);
  const users = readUsers();
  const u = users.find(x => x.email === email && x.passwordHash === btoa(password));
  if (!u) throw new Error('Sai email hoặc mật khẩu');
  localStorage.setItem(KEY_SESSION, JSON.stringify({ id: u.id, name: u.name, email: u.email }));
  return getCurrentUser();
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// (tuỳ chọn) seed 1 user admin cho tiện
(function seedDefaultUser(){
  try {
    const list = readUsers();
    const email = 'admin@upsc.local';
    if (!list.some(u => u.email === email)) {
      list.push({
        id: (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
        name: 'UPSC Admin',
        email,
        passwordHash: btoa('123456'),
      });
      writeUsers(list);
    }
  } catch {}
})();
