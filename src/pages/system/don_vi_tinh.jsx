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
  Ruler,
} from "lucide-react";

import {
  get as getDonViTinh,
  create as createDonViTinh,
  update as updateDonViTinh,
  remove as deleteDonViTinh,
} from "../../api/don_vi_tinh.js";

const EMPTY_ITEM = {
  id: "",
  ten_don_vi: "",
  ky_hieu: "",
  ghi_chu: "",
};

export default function DonViTinh() {
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
      const res = await getDonViTinh();
      const list = unwrapArray(res).map((item, idx) => ({
        ...item,
        stt: idx + 1,
      }));
      setItems(list);
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không tải được danh sách đơn vị tính",
      });
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return items.filter(
      (item) =>
        item.ten_don_vi?.toLowerCase().includes(q) ||
        item.ky_hieu?.toLowerCase().includes(q) ||
        item.ghi_chu?.toLowerCase().includes(q)
    );
  }, [query, items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, filtered]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  async function saveItem() {
    try {
      if (!editing.ten_don_vi?.trim()) {
        return setNotify({ type: "error", message: "Tên đơn vị không được để trống" });
      }

      if (!editing.ky_hieu?.trim()) {
        return setNotify({ type: "error", message: "Ký hiệu không được để trống" });
      }

      const payload = {
        ten_don_vi: editing.ten_don_vi.trim(),
        ky_hieu: editing.ky_hieu.trim(),
        ghi_chu: editing.ghi_chu?.trim() || "",
      };

      if (editing.id) {
        await updateDonViTinh(editing.id, payload);
        setNotify({ type: "success", message: "Cập nhật đơn vị tính thành công!" });
      } else {
        await createDonViTinh(payload);
        setNotify({ type: "success", message: "Thêm đơn vị tính thành công!" });
      }

      setEditorOpen(false);
      setEditing(EMPTY_ITEM);
      loadItems();
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không lưu được đơn vị tính",
      });
    }
  }

  async function confirmDeleteFn() {
    try {
      await deleteDonViTinh(pendingDelete.id);
      setNotify({ type: "success", message: "Đã xóa đơn vị tính" });
      setConfirmOpen(false);
      setPendingDelete(null);
      loadItems();
    } catch (err) {
      setNotify({
        type: "error",
        message: err.message || "Không xóa được đơn vị tính",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-green-700">
        <PageHeader
          title={
            <span className="font-bold text-green-700">
              Quản lý đơn vị tính
            </span>
          }
          subtitle={
            <span className="text-green-600">
              Quản lý danh mục đơn vị tính sử dụng trong kết quả thử nghiệm
            </span>
          }
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-green-700" />
          <input
            placeholder="Tìm theo tên đơn vị, ký hiệu..."
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
          Thêm đơn vị tính
        </button>
      </div>

      <Table
        columns={[
          { title: "STT", key: "stt", className: "w-16" },
          { title: "Tên đơn vị", key: "ten_don_vi" },
          {
            title: "Ký hiệu",
            key: "ky_hieu",
            render: (value) => (
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 font-bold text-xs">
                {value || "—"}
              </span>
            ),
          },
          { title: "Ghi chú", key: "ghi_chu" },
        ]}
        data={paged}
        renderActions={(row) => (
          <div className="flex gap-2">
            <button
              className="btn-icon"
              title="Xem chi tiết"
              onClick={() => {
                setDetail(row);
                setDetailOpen(true);
              }}
            >
              <Eye size={18} />
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

      <div className="flex justify-between items-center text-sm">
        <span>
          Trang {page} / {totalPages} - Tổng {filtered.length} bản ghi
        </span>
        <div className="flex gap-2">
          <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {"<"}
          </button>
          <button className="btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            {">"}
          </button>
        </div>
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        className="max-w-[550px]"
        title={editing.id ? "Chỉnh sửa đơn vị tính" : "Thêm đơn vị tính"}
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
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-green-700">
              Tên đơn vị *
            </label>
            <input
              className="input w-full"
              value={editing.ten_don_vi}
              onChange={(e) =>
                setEditing({ ...editing, ten_don_vi: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Ký hiệu *
            </label>
            <input
              className="input w-full"
              value={editing.ky_hieu}
              onChange={(e) =>
                setEditing({ ...editing, ky_hieu: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-700">
              Ghi chú
            </label>
            <textarea
              className="input w-full min-h-[90px]"
              value={editing.ghi_chu}
              onChange={(e) =>
                setEditing({ ...editing, ghi_chu: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Chi tiết đơn vị tính"
        className="max-w-[500px]"
        footer={
          <button className="btn" onClick={() => setDetailOpen(false)}>
            Đóng
          </button>
        }
      >
        <div className="space-y-3">
          <DetailItem label="Tên đơn vị" value={detail?.ten_don_vi} />
          <DetailItem label="Ký hiệu" value={detail?.ky_hieu} />
          <DetailItem label="Ghi chú" value={detail?.ghi_chu} />
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận xóa đơn vị tính"
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
          Bạn có chắc muốn xóa đơn vị tính:{" "}
          <b className="text-green-700">{pendingDelete?.ten_don_vi}</b>?
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