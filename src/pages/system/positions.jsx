// src/pages/positions/PositionsManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Modal from "../../components/Modal.jsx";
import Table from "../../components/Table.jsx";
import Notification from "../../components/Notification.jsx";

import { Plus, RefreshCw, Edit2, Trash2 } from "lucide-react";

// API (tùy bạn map BE)
// import {
// //   get as getPositions,
//   create as createPosition,
//   update as updatePosition,
//   remove as deletePosition,
// } from "../../api/positions.js";

export default function PositionsManagement() {
  const [items, setItems] = useState([]);
  const [notify, setNotify] = useState(null);

  const [query, setQuery] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const EMPTY = { id: null, name: "", symbol: "", note: "" };
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);

  // Load positions
  const loadData = async () => {
    try {
      const res = await getPositions();
      setItems(res.data || []);
    } catch (err) {
      setNotify({
        type: "error",
        message: "Không tải được danh sách chức vụ!",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // filter
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q
      ? items.filter((i) =>
          `${i.name} ${i.symbol}`.toLowerCase().includes(q)
        )
      : items;
  }, [query, items]);

  // pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const currentRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // open add
  const openAdd = () => {
    setForm(EMPTY);
    setEditorOpen(true);
  };

  // open edit
  const openEdit = (item) => {
    setForm(item);
    setEditorOpen(true);
  };

  // submit add/edit
  const submit = async () => {
    if (!form.name)
      return setNotify({
        type: "error",
        message: "Tên chức vụ là bắt buộc!",
      });

    try {
      if (!form.id) {
        await createPosition(form);
        setNotify({ type: "success", message: "Thêm chức vụ thành công!" });
      } else {
        await updatePosition(form.id, form);
        setNotify({ type: "success", message: "Cập nhật thành công!" });
      }

      loadData();
      setEditorOpen(false);
    } catch (e) {
      setNotify({ type: "error", message: "Lỗi khi lưu dữ liệu!" });
    }
  };

  // ask delete
  const askDelete = (item) => {
    setSelected(item);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    try {
      await deletePosition(selected.id);
      setNotify({ type: "success", message: "Đã xoá chức vụ!" });
      loadData();
      setDeleteOpen(false);
    } catch {
      setNotify({ type: "error", message: "Không thể xoá!" });
    }
  };

  // table columns
  const columns = [
    { key: "stt", title: "STT", render: (_, r) => r.__stt },
    { key: "name", title: "Tên chức vụ" },
    { key: "symbol", title: "Ký hiệu" },
    { key: "note", title: "Ghi chú" },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <button className="text-blue-600" onClick={() => openEdit(row)}>
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
        title="Quản lý chức vụ"
        subtitle="Danh sách chức vụ – thêm, sửa, xoá và phân trang."
        right={
          <>
            <button className="btn" onClick={loadData}>
              <RefreshCw size={16} /> Làm mới
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Thêm chức vụ
            </button>
          </>
        }
      />

      {/* TABLE */}
      <div className="card">
        <div className="px-4 py-3 border-b bg-blue-50 flex justify-between">
          <input
            className="input w-64"
            placeholder="Tìm kiếm tên, ký hiệu..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="card-body">
          <Table
            columns={columns}
            data={currentRows.map((i, idx) => ({
              ...i,
              __rowKey: i.id,
              __stt: (page - 1) * rowsPerPage + idx + 1,
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

      {/* MODAL — ADD/EDIT */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={form.id ? "Cập nhật chức vụ" : "Thêm chức vụ"}
        className="max-w-md"
        footer={
          <>
            <button className="btn" onClick={() => setEditorOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={submit}>
              Lưu
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label>Tên chức vụ</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label>Ký hiệu</label>
            <input
              className="input"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
          </div>

          <div>
            <label>Ghi chú</label>
            <textarea
              className="input"
              value={form.note || ""}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL — DELETE */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Xác nhận xoá chức vụ"
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
        <p>
          Bạn có chắc muốn xoá chức vụ: <b>{selected?.name}</b>?
        </p>
      </Modal>

      {/* NOTIFICATION */}
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
