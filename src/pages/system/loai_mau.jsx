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
  Eye,
} from "lucide-react";

import {
  get as getLoaiMau,
  create as createLoaiMau,
  update as updateLoaiMau,
  remove as deleteLoaiMau,
} from "../../api/loai_mau.js";

const EMPTY_ITEM = {
  id: "",
  ma_loai: "",
  ten_loai: "",
  ky_hieu: "",
  ghi_chu: "",
};

export default function LoaiMau() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(EMPTY_ITEM);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const [notify, setNotify] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const res = await getLoaiMau();
      const list = unwrapArray(res).map((item, idx) => ({
        ...item,
        stt: idx + 1,
      }));
      setItems(list);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không tải được danh sách loại mẫu",
      });
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return items.filter(
      (item) =>
        item.ma_loai?.toLowerCase().includes(q) ||
        item.ten_loai?.toLowerCase().includes(q) ||
        item.ky_hieu?.toLowerCase().includes(q) ||
        item.ghi_chu?.toLowerCase().includes(q)
    );
  }, [query, items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, filtered]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  async function saveItem() {
    try {
      if (!editing.ma_loai?.trim()) {
        return setNotify({ type: "error", message: "Mã loại không được để trống" });
      }

      if (!editing.ten_loai?.trim()) {
        return setNotify({ type: "error", message: "Tên loại mẫu không được để trống" });
      }

      const payload = {
        ma_loai: editing.ma_loai.trim(),
        ten_loai: editing.ten_loai.trim(),
        ky_hieu: editing.ky_hieu?.trim() || "",
        ghi_chu: editing.ghi_chu?.trim() || "",
      };

      if (editing.id) {
        await updateLoaiMau(editing.id, payload);
        setNotify({ type: "success", message: "Cập nhật loại mẫu thành công!" });
      } else {
        await createLoaiMau(payload);
        setNotify({ type: "success", message: "Thêm loại mẫu thành công!" });
      }

      setEditorOpen(false);
      setEditing(EMPTY_ITEM);
      loadItems();
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không lưu được loại mẫu",
      });
    }
  }

  async function confirmDeleteFn() {
    try {
      await deleteLoaiMau(pendingDelete.id);
      setNotify({ type: "success", message: "Đã xóa loại mẫu" });
      setConfirmOpen(false);
      setPendingDelete(null);
      loadItems();
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không xóa được loại mẫu",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-green-700">
        <PageHeader
          title={
            <span className="font-bold text-green-700">
              Quản lý loại mẫu
            </span>
          }
          subtitle={
            <span className="text-green-600">
              Quản lý danh mục loại mẫu dùng trong quá trình lấy mẫu và kiểm tra mẫu
            </span>
          }
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-green-700" />
          <input
            placeholder="Tìm theo mã loại, tên loại, ký hiệu..."
            className="input w-96"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          className="btn flex items-center gap-2"
          onClick={() => {
            setEditing(EMPTY_ITEM);
            setEditorOpen(true);
          }}
        >
          <Plus size={18} />
          Thêm loại mẫu
        </button>
      </div>

      <Table
        columns={[
          { title: "STT", key: "stt", className: "w-16" },
          { title: "Mã loại", key: "ma_loai" },
          { title: "Tên loại mẫu", key: "ten_loai" },
          { title: "Ký hiệu", key: "ky_hieu" },
          { title: "Ghi chú", key: "ghi_chu" },
        ]}
        data={paged}
        renderActions={(row) => (
          <div className="flex gap-2">
            <button className="btn-icon" title="Xem chi tiết" onClick={() => {
              setDetail(row);
              setDetailOpen(true);
            }}>
              <Eye size={18} />
            </button>

            <button className="btn-icon" title="Chỉnh sửa" onClick={() => {
              setEditing({ ...row });
              setEditorOpen(true);
            }}>
              <Edit2 size={18} />
            </button>

            <button className="btn-icon" title="Xóa" onClick={() => {
              setPendingDelete(row);
              setConfirmOpen(true);
            }}>
              <Trash2 size={18} />
            </button>
          </div>
        )}
      />

      <Pagination page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} />

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        className="max-w-[550px]"
        title={editing.id ? "Chỉnh sửa loại mẫu" : "Thêm loại mẫu"}
        footer={
          <>
            <button className="btn" onClick={() => setEditorOpen(false)}>
              Hủy
            </button>
            <button className="btn" onClick={saveItem}>
              Lưu
            </button>
          </>
        }
      >
        <FormLoaiMau editing={editing} setEditing={setEditing} />
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Chi tiết loại mẫu"
        className="max-w-[500px]"
        footer={<button className="btn" onClick={() => setDetailOpen(false)}>Đóng</button>}
      >
        <div className="space-y-3">
          <DetailItem label="Mã loại" value={detail?.ma_loai} />
          <DetailItem label="Tên loại mẫu" value={detail?.ten_loai} />
          <DetailItem label="Ký hiệu" value={detail?.ky_hieu} />
          <DetailItem label="Ghi chú" value={detail?.ghi_chu} />
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận xóa loại mẫu"
        className="max-w-[400px]"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)}>Hủy</button>
            <button className="btn btn-danger" onClick={confirmDeleteFn}>Xóa</button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa loại mẫu:{" "}
          <b className="text-green-700">{pendingDelete?.ten_loai}</b>?
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

function FormLoaiMau({ editing, setEditing }) {
  return (
    <div className="space-y-4">
      <Input label="Mã loại *" value={editing.ma_loai} onChange={(v) => setEditing({ ...editing, ma_loai: v })} />
      <Input label="Tên loại mẫu *" value={editing.ten_loai} onChange={(v) => setEditing({ ...editing, ten_loai: v })} />
      <Input label="Ký hiệu" value={editing.ky_hieu} onChange={(v) => setEditing({ ...editing, ky_hieu: v })} />

      <div>
        <label className="text-sm font-medium text-green-700">Ghi chú</label>
        <textarea
          className="input w-full min-h-[90px]"
          value={editing.ghi_chu}
          onChange={(e) => setEditing({ ...editing, ghi_chu: e.target.value })}
        />
      </div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-green-700">{label}</label>
      <input className="input w-full" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Pagination({ page, setPage, totalPages, total }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span>Trang {page} / {totalPages} - Tổng {total} bản ghi</span>
      <div className="flex gap-2">
        <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>{"<"}</button>
        <button className="btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{">"}</button>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="text-xs font-semibold text-green-700">{label}</div>
      <div className="mt-1 text-sm text-gray-800">{value || "—"}</div>
    </div>
  );
}

function unwrapArray(res) {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res)) return res;
  return [];
}