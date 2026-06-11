import React, { useEffect, useMemo, useState } from "react";
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
  changePassBySa,
} from "../../api/nguoi_dung.js";

const EMPTY_USER = {
  id: "",
  ho_ten: "",
  ten_dang_nhap: "",
  quyen: "nguoi_xem",
  so_dien_thoai: "",
  trang_thai: "hoat_dong",
  password: "123456",
};

const QUYEN_LABEL = {
  admin: "Quản trị",
  nhap_lieu: "Nhập liệu",
  nguoi_xem: "Người xem",
};

const TRANG_THAI_LABEL = {
  hoat_dong: "Hoạt động",
  tam_khoa: "Tạm khóa",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(EMPTY_USER);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm: "",
  });

  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [showPasswordAdd, setShowPasswordAdd] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const [notify, setNotify] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await getUsers();
      console.log("API response for users:", res);
      const source = res?.data?.data || res?.data || [];

      const list = source.map((u, idx) => ({
        ...u,
        stt: idx + 1,
      }));

      setUsers(list);
    } catch (err) {
      setNotify({
        type: "error",
        message: err?.response?.data?.message || err.message,
      });
    }
  }

  const filtered = useMemo(() => {
    const keyword = query.toLowerCase();

    return users.filter(
      (u) =>
        u.ten_dang_nhap?.toLowerCase().includes(keyword) ||
        u.ho_ten?.toLowerCase().includes(keyword) ||
        u.so_dien_thoai?.toLowerCase().includes(keyword) ||
        u.quyen?.toLowerCase().includes(keyword)
    );
  }, [query, users]);

  const totalPage = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, filtered]);

  async function saveUser() {
    try {
      if (!editing.ho_ten?.trim()) {
        return setNotify({
          type: "error",
          message: "Vui lòng nhập họ tên!",
        });
      }

      if (!editing.ten_dang_nhap?.trim()) {
        return setNotify({
          type: "error",
          message: "Vui lòng nhập tên đăng nhập!",
        });
      }

      if (editing.id) {
        const payload = {
          ho_ten: editing.ho_ten,
          ten_dang_nhap: editing.ten_dang_nhap,
          quyen: editing.quyen,
          so_dien_thoai: editing.so_dien_thoai,
          trang_thai: editing.trang_thai,
        };

        await updateUser(editing.id, payload);

        setNotify({
          type: "success",
          message: "Cập nhật người dùng thành công!",
        });
      } else {
        if (!editing.password?.trim()) {
          return setNotify({
            type: "error",
            message: "Mật khẩu không được để trống!",
          });
        }

        const payload = {
          ho_ten: editing.ho_ten,
          ten_dang_nhap: editing.ten_dang_nhap,
          quyen: editing.quyen,
          so_dien_thoai: editing.so_dien_thoai,
          trang_thai: editing.trang_thai,
          password: editing.password,
        };

        await createUser(payload);

        setNotify({
          type: "success",
          message: "Thêm người dùng mới thành công!",
        });
      }

      setEditorOpen(false);
      setEditing(EMPTY_USER);
      loadUsers();
    } catch (err) {
      setNotify({
        type: "error",
        message: err?.response?.data || err.message,
      });
    }
  }

  async function confirmDeleteFn() {
    try {
      await deleteUser(pendingDelete.id);

      setNotify({
        type: "success",
        message: "Đã xóa người dùng!",
      });

      setConfirmOpen(false);
      setPendingDelete(null);
      loadUsers();
    } catch (err) {
      setNotify({
        type: "error",
        message: err?.response?.data || err.message,
      });
    }
  }

  async function savePassword() {
    try {
      if (!passwordData.new_password?.trim()) {
        return setNotify({
          type: "error",
          message: "Vui lòng nhập mật khẩu mới!",
        });
      }

      if (passwordData.new_password !== passwordData.confirm) {
        return setNotify({
          type: "error",
          message: "Mật khẩu xác nhận không khớp!",
        });
      }

      await changePassBySa(editing.id, {
        new_password: passwordData.new_password,
      });

      setNotify({
        type: "success",
        message: "Đổi mật khẩu thành công!",
      });

      setPasswordOpen(false);
      setPasswordData({
        new_password: "",
        confirm: "",
      });
    } catch (err) {
      setNotify({
        type: "error",
        message: err?.response?.data?.message || err.message,
      });
    }
  }

  return (
    <div className="space-y-4">
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

      <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-green-700" />

          <input
            placeholder="Tìm theo họ tên, tên đăng nhập, số điện thoại..."
            className="input w-96"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
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

      <Table
        columns={[
          {
            title: "STT",
            key: "stt",
            className: "w-16",
          },
          {
            title: "Tên đăng nhập",
            key: "ten_dang_nhap",
          },
          {
            title: "Họ tên",
            key: "ho_ten",
          },
          {
            title: "Số điện thoại",
            key: "so_dien_thoai",
            render: (value) => value || "—",
          },
          {
            title: "Quyền",
            key: "quyen",
            render: (value) => (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {QUYEN_LABEL[value] || value || "—"}
              </span>
            ),
          },
          {
            title: "Trạng thái",
            key: "trang_thai",
            render: (value) => (
              <span
                className={
                  value === "hoat_dong"
                    ? "font-semibold text-green-700"
                    : "font-semibold text-red-600"
                }
              >
                {TRANG_THAI_LABEL[value] || value || "—"}
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
                setPasswordData({
                  new_password: "",
                  confirm: "",
                });
                setPasswordOpen(true);
              }}
            >
              <KeyRound size={18} />
            </button>

            <button
              className="btn-icon"
              title="Chỉnh sửa"
              onClick={() => {
                setEditing({
                  id: row.id,
                  ho_ten: row.ho_ten || "",
                  ten_dang_nhap: row.ten_dang_nhap || "",
                  quyen: row.quyen || "nguoi_xem",
                  so_dien_thoai: row.so_dien_thoai || "",
                  trang_thai: row.trang_thai || "hoat_dong",
                  password: "",
                });
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

      <div className="flex items-center justify-between text-sm">
        <span>
          Trang {page} / {totalPage} — Tổng {filtered.length} người dùng
        </span>

        <div className="flex gap-2">
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => page > 1 && setPage(page - 1)}
          >
            {"<"}
          </button>

          <button
            className="btn"
            disabled={page >= totalPage}
            onClick={() => page < totalPage && setPage(page + 1)}
          >
            {">"}
          </button>
        </div>
      </div>

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
              value={editing.ho_ten}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  ho_ten: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Tên đăng nhập *
            </label>

            <input
              className="input w-full"
              value={editing.ten_dang_nhap}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  ten_dang_nhap: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Số điện thoại
            </label>

            <input
              className="input w-full"
              value={editing.so_dien_thoai || ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  so_dien_thoai: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Quyền *
            </label>

            <select
              className="select w-full"
              value={editing.quyen}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  quyen: e.target.value,
                })
              }
            >
              <option value="admin">Quản trị</option>
              <option value="nhap_lieu">Nhập liệu</option>
              <option value="nguoi_xem">Người xem</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Trạng thái *
            </label>

            <select
              className="select w-full"
              value={editing.trang_thai}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  trang_thai: e.target.value,
                })
              }
            >
              <option value="hoat_dong">Hoạt động</option>
              <option value="tam_khoa">Tạm khóa</option>
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
                  setEditing({
                    ...editing,
                    password: e.target.value,
                  })
                }
              />

              <button
                type="button"
                onClick={() => setShowPasswordAdd(!showPasswordAdd)}
                className="absolute right-3 top-3"
              >
                {showPasswordAdd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        className="max-w-[450px]"
        title={`Đổi mật khẩu: ${editing?.ho_ten || ""}`}
        footer={
          <>
            <button className="btn" onClick={() => setPasswordOpen(false)}>
              Hủy
            </button>

            <button className="btn" onClick={savePassword}>
              Lưu mật khẩu
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-green-700">
              Mật khẩu mới *
            </label>

            <div className="relative">
              <input
                type={showPwNew ? "text" : "password"}
                className="input w-full pr-10"
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  })
                }
              />

              <button
                type="button"
                onClick={() => setShowPwNew(!showPwNew)}
                className="absolute right-3 top-3"
              >
                {showPwNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Xác nhận mật khẩu *
            </label>

            <div className="relative">
              <input
                type={showPwConfirm ? "text" : "password"}
                className="input w-full pr-10"
                value={passwordData.confirm}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirm: e.target.value,
                  })
                }
              />

              <button
                type="button"
                onClick={() => setShowPwConfirm(!showPwConfirm)}
                className="absolute right-3 top-3"
              >
                {showPwConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </Modal>

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
          <b className="text-green-700">{pendingDelete?.ho_ten}</b>?
        </p>
      </Modal>

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