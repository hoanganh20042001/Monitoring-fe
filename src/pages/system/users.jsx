import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Table from "../../components/Table.jsx";
import Modal from "../../components/Modal.jsx";
import Notification from "../../components/Notification.jsx";

import {
  Plus,
  Trash2,
  Edit2,
  Search,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  get as getUsers,
  create as createUser,
  update as updateUser,
  remove as deleteUser,
} from "../../api/users.js";

import { get as getRoles } from "../../api/roles.js";

const EMPTY_USER = {
  id: "",
  username: "",
  name: "",
  role_id: "",
  status: 1,
  password: "12345678",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(EMPTY_USER);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    new_pass: "",
    confirm: "",
  });
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [showPasswordAdd, setShowPasswordAdd] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const [notify, setNotify] = useState(null);

  // LOAD USERS + ROLES
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  async function loadUsers() {
    try {
      const res = await getUsers();
      const list = (res.data || []).map((u, idx) => ({
        ...u,
        stt: idx + 1,
        status: u.status == 1 || u.status === true ? 1 : 0,
      }));
      setUsers(list);
    } catch (err) {
      setNotify({ type: "error", message: err.message });
    }
  }

  async function loadRoles() {
    try {
      const res = await getRoles();
      setRoles(res.data || []);
    } catch (err) {
      console.error("Lỗi load roles:", err);
    }
  }

  // FILTER
  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(query.toLowerCase()) ||
        u.name?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, users]);

  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, filtered]);

  // SAVE USER
  async function saveUser() {
    try {
      if (editing.id) {
        const payload = { ...editing };
        delete payload.password;
        await updateUser(editing.id, payload);
        setNotify({ type: "success", message: "Cập nhật người dùng thành công!" });
      } else {
        if (!editing.password)
          return setNotify({
            type: "error",
            message: "Mật khẩu không được để trống",
          });
        const payload = { ...editing };
        delete payload.id;
        await createUser(payload);
        setNotify({ type: "success", message: "Thêm người dùng mới thành công!" });
      }

      setEditorOpen(false);
      loadUsers();
    } catch (err) {
      setNotify({ type: "error", message: err.message });
    }
  }

  // DELETE USER
  async function confirmDeleteFn() {
    try {
      await deleteUser(pendingDelete.id);
      setNotify({ type: "success", message: "Đã xóa người dùng" });
      setConfirmOpen(false);
      loadUsers();
    } catch (err) {
      setNotify({ type: "error", message: err.message });
    }
  }

  return (
    <div className="space-y-4">
      {/* ===== HEADER ===== */}
      <div className="text-green-700">
        <PageHeader
          title={
            <span className="font-bold text-green-700">
              Quản lý người dùng hệ thống
            </span>
          }
          subtitle={
            <span className="text-green-600">
              Quản lý tài khoản, phân quyền và trạng thái sử dụng hệ thống
            </span>
          }
        />
      </div>

      {/* ===== SEARCH + ADD ===== */}
      <div className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-green-700" />
          <input
            placeholder="Tìm theo tên hoặc tên đăng nhập..."
            className="input w-96"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          className="btn flex items-center gap-2"
          onClick={() => {
            setEditing(EMPTY_USER);
            setShowPasswordAdd(false);
            setEditorOpen(true);
          }}
        >
          <Plus size={18} />
          Thêm người dùng
        </button>
      </div>

      {/* ===== TABLE ===== */}
      <Table
        columns={[
          { title: "STT", key: "stt", className: "w-16" },
          { title: "Tên đăng nhập", key: "username" },
          { title: "Họ tên", key: "fullname" },
          // {
          //   title: "Quyền",
          //   key: "role",
          //   render: (value) => value?.name || "—",
          // },
          {
            title: "Trạng thái",
            key: "activated",
            render: (value) => (
              <span
                className={
                  value == 0 ? "text-green-700 font-medium" : "text-gray-500"
                }
              >
                {value == 0 ? "Hoạt động" : "Không hoạt động"}
              </span>
            ),
          },
        ]}
        data={paged}
        renderActions={(row) => (
          <div className="flex gap-2">
            <button
              className="btn-icon"
              title="Đổi mật khẩu"
              onClick={() => {
                setEditing(row);
                setPasswordOpen(true);
              }}
            >
              <KeyRound size={18} />
            </button>

            <button
              className="btn-icon"
              title="Chỉnh sửa"
              onClick={() => {
                setEditing({ ...row });
                setEditorOpen(true);
              }}
            >
              <Edit2 size={18} />
            </button>

            <button
              className="btn-icon"
              title="Xóa"
              onClick={() => {
                setPendingDelete(row);
                setConfirmOpen(true);
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      />

      {/* ===== PAGINATION ===== */}
      <div className="flex justify-between items-center text-sm">
        <span>
          Trang {page} / {Math.ceil(filtered.length / rowsPerPage)}
        </span>
        <div className="flex gap-2">
          <button className="btn" onClick={() => page > 1 && setPage(page - 1)}>
            {"<"}
          </button>
          <button
            className="btn"
            onClick={() =>
              page < Math.ceil(filtered.length / rowsPerPage) &&
              setPage(page + 1)
            }
          >
            {">"}
          </button>
        </div>
      </div>

      {/* ===== ADD / EDIT MODAL ===== */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        className="max-w-[550px]"
        title={
          editing.id ? "Chỉnh sửa thông tin người dùng" : "Thêm người dùng mới"
        }
        footer={
          <>
            <button className="btn" onClick={() => setEditorOpen(false)}>
              Hủy
            </button>
            <button className="btn" onClick={saveUser}>
              Lưu
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-green-700">
              Họ tên *
            </label>
            <input
              className="input w-full"
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Tên đăng nhập *
            </label>
            <input
              className="input w-full"
              value={editing.username}
              onChange={(e) =>
                setEditing({ ...editing, username: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Quyền *
            </label>
            <select
              className="select w-full"
              value={editing.role_id}
              onChange={(e) =>
                setEditing({ ...editing, role_id: e.target.value })
              }
            >
              <option value="">-- Chọn quyền --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!editing.id && (
          <div className="mt-6 border-t pt-4">
            <label className="text-sm font-medium text-green-700">
              Mật khẩu đăng nhập *
            </label>
            <div className="relative">
              <input
                type={showPasswordAdd ? "text" : "password"}
                className="input w-full pr-10"
                value={editing.password}
                onChange={(e) =>
                  setEditing({ ...editing, password: e.target.value })
                }
              />
              <button
                onClick={() => setShowPasswordAdd(!showPasswordAdd)}
                className="absolute right-3 top-3"
              >
                {showPasswordAdd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== DELETE CONFIRM ===== */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận xóa người dùng"
        className="max-w-[400px]"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-danger" onClick={confirmDeleteFn}>
              Xóa
            </button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa người dùng:{" "}
          <b className="text-green-700">{pendingDelete?.name}</b>?
        </p>
      </Modal>

      {/* ===== NOTIFICATION ===== */}
      {notify && (
        <Notification
          type={notify.type}
          message={notify.message}
          onClose={() => setNotify(null)}
        />
      )}
    </div>
  );
}
