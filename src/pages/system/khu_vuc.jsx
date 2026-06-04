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
  get as getKhuVucLayMau,
  create as createKhuVucLayMau,
  update as updateKhuVucLayMau,
  remove as deleteKhuVucLayMau,
} from "../../api/khu_vuc_lay_mau.js";

const EMPTY_ITEM = {
  id: "",
  ma_loai: "",
  ten_khu_vuc: "",
  ky_hieu: "",
  ghi_chu: "",
};

export default function KhuVucLayMau() {
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
      const res = await getKhuVucLayMau();
      const list = unwrapArray(res).map((item, idx) => ({
        ...item,
        stt: idx + 1,
      }));
      setItems(list);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không tải được danh sách khu vực lấy mẫu",
      });
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return items.filter(
      (item) =>
        item.ma_loai?.toLowerCase().includes(q) ||
        item.ten_khu_vuc?.toLowerCase().includes(q) ||
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
        return setNotify({ type: "error", message: "Mã khu vực không được để trống" });
      }

      if (!editing.ten_khu_vuc?.trim()) {
        return setNotify({ type: "error", message: "Tên khu vực không được để trống" });
      }

      const payload = {
        ma_loai: editing.ma_loai.trim(),
        ten_khu_vuc: editing.ten_khu_vuc.trim(),
        ky_hieu: editing.ky_hieu?.trim() || "",
        ghi_chu: editing.ghi_chu?.trim() || "",
      };

      if (editing.id) {
        await updateKhuVucLayMau(editing.id, payload);
        setNotify({ type: "success", message: "Cập nhật khu vực lấy mẫu thành công!" });
      } else {
        await createKhuVucLayMau(payload);
        setNotify({ type: "success", message: "Thêm khu vực lấy mẫu thành công!" });
      }

      setEditorOpen(false);
      setEditing(EMPTY_ITEM);
      loadItems();
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không lưu được khu vực lấy mẫu",
      });
    }
  }

  async function confirmDeleteFn() {
    try {
      await deleteKhuVucLayMau(pendingDelete.id);
      setNotify({ type: "success", message: "Đã xóa khu vực lấy mẫu" });
      setConfirmOpen(false);
      setPendingDelete(null);
      loadItems();
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không xóa được khu vực lấy mẫu",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-green-700">
        <PageHeader
          title={
            <span className="font-bold text-green-700">
              Quản lý khu vực lấy mẫu
            </span>
          }
          subtitle={
            <span className="text-green-600">
              Quản lý danh mục khu vực lấy mẫu phục vụ quá trình kiểm tra mẫu
            </span>
          }
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-green-700" />
          <input
            placeholder="Tìm theo mã khu vực, tên khu vực, ký hiệu..."
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
          Thêm khu vực
        </button>
      </div>

      <Table
        columns={[
          { title: "STT", key: "stt", className: "w-16" },
          { title: "Mã khu vực", key: "ma_loai" },
          { title: "Tên khu vực", key: "ten_khu_vuc" },
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
        title={editing.id ? "Chỉnh sửa khu vực lấy mẫu" : "Thêm khu vực lấy mẫu"}
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
        <FormKhuVuc editing={editing} setEditing={setEditing} />
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Chi tiết khu vực lấy mẫu"
        className="max-w-[500px]"
        footer={<button className="btn" onClick={() => setDetailOpen(false)}>Đóng</button>}
      >
        <div className="space-y-3">
          <DetailItem label="Mã khu vực" value={detail?.ma_loai} />
          <DetailItem label="Tên khu vực" value={detail?.ten_khu_vuc} />
          <DetailItem label="Ký hiệu" value={detail?.ky_hieu} />
          <DetailItem label="Ghi chú" value={detail?.ghi_chu} />
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận xóa khu vực lấy mẫu"
        className="max-w-[400px]"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)}>Hủy</button>
            <button className="btn btn-danger" onClick={confirmDeleteFn}>Xóa</button>
          </>
        }
      >
        <p>
          Bạn có chắc muốn xóa khu vực:{" "}
          <b className="text-green-700">{pendingDelete?.ten_khu_vuc}</b>?
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

function FormKhuVuc({ editing, setEditing }) {
  return (
    <div className="space-y-4">
      <Input label="Mã khu vực *" value={editing.ma_loai} onChange={(v) => setEditing({ ...editing, ma_loai: v })} />
      <Input label="Tên khu vực *" value={editing.ten_khu_vuc} onChange={(v) => setEditing({ ...editing, ten_khu_vuc: v })} />
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