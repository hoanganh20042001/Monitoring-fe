import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';


export default function Register() {
const { register } = useAuth();
const nav = useNavigate();
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [err, setErr] = useState('');


async function onSubmit(e) {
e.preventDefault();
try {
await register(name, email, password);
nav('/dashboard', { replace: true });
} catch (e) { setErr(e.message || 'Đăng ký thất bại'); }
}


return (
<div className="max-w-md mx-auto">
<div className="card">
<div className="card-body">
<div className="form-title">Đăng ký</div>
<div className="form-subtle">Tạo tài khoản mới để sử dụng hệ thống.</div>
{err && <div className="mb-3 text-sm text-red-600">{err}</div>}
<form className="space-y-3" onSubmit={onSubmit}>
<div>
<label className="text-sm">Họ và tên</label>
<input className="input" value={name} onChange={e=>setName(e.target.value)} required />
</div>
<div>
<label className="text-sm">Email</label>
<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
</div>
<div>
<label className="text-sm">Mật khẩu</label>
<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
</div>
<button className="btn btn-primary w-full" type="submit">Đăng ký</button>
</form>
<div className="mt-3 text-sm">Đã có tài khoản? <Link to="/login" className="underline">Đăng nhập</Link></div>
</div>
</div>
</div>
);
}