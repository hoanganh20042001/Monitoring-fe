// src/pages/AccessControl.jsx
import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Modal from "../../components/Modal.jsx";
import Table from "../../components/Table.jsx";
import Notification from "../../components/Notification.jsx";

import { Plus, Trash2, Edit2, RefreshCw } from "lucide-react";

// --- API giả, thay bằng API thật của bạn ---
// import {
// //   get as getRoles,
//   create as createRole,
//   update as updateRole,
//   remove as deleteRole,
// } from "../../api/roles.js";

export default function AccessControl() {
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState("");
  const [notify, setNotify] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // modals
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const EMPTY_ROLE = {
    id: null,
    role_code: "",
    role_name: "",
    description: "",
  };

  const [form, setForm] = useState(EMPTY_ROLE);
  const [selectedRole, setSelectedRole] = useState(null);

  // LOAD DATA
  const loadRoles = async () => {
    try {
      const res = await getRoles();
      setRoles(res.data || []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // FILTER
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q
      ? roles.filter((r) =>
          `${r.role_name} ${r.role_code} ${r.description}`
            .toLowerCase()
            .includes(q)
        )
      : roles;
  }, [query, roles]);

  // pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const currentRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // CRUD
  const openAdd = () => {
    setForm(EMPTY_ROLE);
    setEditOpen(true);
  };

  const openEdit = (r) => {
    setForm(r);
    setEditOpen(true);
  };

  const submitRole = async () => {
    if (!form.role_code || !form.role_name)
      return setNotify({
        type: "error",
        message: "Mã quyền và tên quyền là bắt buộc!",
      });

    try {
      if (!form.id) {
        await createRole(form);
        setNotify({ type: "success", message: "Thêm quyền thành công!" });
      } else {
        await updateRole(form.id, form);
        setNotify({ type: "success", message: "Cập nhật thành công!" });
      }

      setEditOpen(false);
      loadRoles();
    } catch {
      setNotify({ type: "error", message: "Lỗi ghi dữ liệu!" });
    }
  };

  const askDelete = (r) => {
    setSelectedRole(r);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    try {
      await deleteRole(selectedRole.id);
      setNotify({ type: "success", message: "Đã xóa!" });
      setDeleteOpen(false);
      loadRoles();
    } catch {
      setNotify({ type: "error", message: "Không thể xóa!" });
    }
  };

  // TABLE columns
  const columns = [
    { key: "stt", title: "STT", render: (_, r) => r.__stt },
    { key: "role_code", title: "Mã quyền" },
    { key: "role_name", title: "Tên quyền" },
    { key: "description", title: "Mô tả" },
    {
      key: "actions",
      title: "Hành động",
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <button className="text-green-600" onClick={() => openEdit(row)}>
            <Edit2 size={16} />
          </button>

          <button className="text-red-600" onClick={() => askDelete(row)}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản lý quyền truy cập"
        subtitle="Thiết lập và phân quyền người dùng trong hệ thống."
        right={
          <>
            <button className="btn" onClick={loadRoles}>
              <RefreshCw size={16} /> Làm mới
            </button>

            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Thêm quyền
            </button>
          </>
        }
      />

      {/* TABLE */}
      <div className="card">
        <div className="px-4 py-3 border-b bg-blue-50 flex justify-between">
          <input
            className="input w-64"
            placeholder="Tìm kiếm theo tên, mã..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="card-body">
          <Table
            columns={columns}
            data={currentRows.map((r, i) => ({
              ...r,
              __rowKey: r.id,
              __stt: (page - 1) * rowsPerPage + i + 1,
            }))}
          />

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 text-sm">
            <select
              className="border px-2 py-1 rounded"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 dòng</option>
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                className="btn-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>

              <span>
                {page}/{totalPages || 1}
              </span>

              <button
                className="btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL — ADD / EDIT */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={form.id ? "Cập nhật quyền truy cập" : "Thêm quyền truy cập"}
        className="max-w-md"
        footer={
          <>
            <button className="btn" onClick={() => setEditOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={submitRole}>
              Lưu
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label>Mã quyền *</label>
            <input
              className="input"
              value={form.role_code}
              onChange={(e) =>
                setForm({ ...form, role_code: e.target.value })
              }
            />
          </div>

          <div>
            <label>Tên quyền *</label>
            <input
              className="input"
              value={form.role_name}
              onChange={(e) =>
                setForm({ ...form, role_name: e.target.value })
              }
            />
          </div>

          <div>
            <label>Mô tả</label>
            <textarea
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      {/* MODAL — DELETE */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Xác nhận xoá quyền"
        className="max-w-sm"
        footer={
          <>
            <button className="btn" onClick={() => setDeleteOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-danger" onClick={doDelete}>
              Xóa
            </button>
          </>
        }
      >
        Xoá quyền: <b>{selectedRole?.role_name}</b>?
      </Modal>

      {/* Notification */}
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
