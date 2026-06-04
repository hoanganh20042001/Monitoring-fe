// src/pages/system/ContentManagement.jsx
import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Table from "../../components/Table.jsx";
import Modal from "../../components/Modal.jsx";
import Notification from "../../components/Notification.jsx";

import {
  Plus, Trash2, Edit2, ImageIcon, Video, Newspaper, ChevronDown,
} from "lucide-react";

const role_id = localStorage.getItem("role_id"); // A = Admin

export default function ContentManagement() {
  const [type, setType] = useState("news"); // news | videos | images | banners
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [notify, setNotify] = useState(null);

  // DEMO DATA
  const loadData = () => {
    const demo = {
      news: [
        { id: 1, title: "Khai mạc diễn tập 2025", status: 1, author: "Admin", created: "2025-01-12" },
        { id: 2, title: "Huấn luyện phòng hóa", status: 1, author: "User1", created: "2025-02-04" },
      ],
      videos: [
        { id: 1, title: "Video diễn tập", status: 1, url: "https://youtube.com/1" },
      ],
      images: [
        { id: 1, title: "Hình huấn luyện 1", status: 1, path: "/uploads/1.jpg" },
      ],
      banners: [
        { id: 1, title: "Banner chủ đề 2025", status: 1 },
      ],
    };

    setItems(demo[type]);
  };

  useEffect(() => {
    loadData();
  }, [type]);

  // Lọc
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((i) => `${i.title}`.toLowerCase().includes(q));
  }, [query, items]);

  // Mở modal thêm
  const openAdd = () => {
    setForm({});
    setEditOpen(true);
  };

  // Mở modal sửa
  const openEdit = (row) => {
    setForm(row);
    setEditOpen(true);
  };

  const askDelete = (row) => {
    setSelectedItem(row);
    setDeleteOpen(true);
  };

  const submitSave = () => {
    setNotify({ type: "success", message: "Lưu dữ liệu thành công!" });
    setEditOpen(false);
    loadData();
  };

  const doDelete = () => {
    setNotify({ type: "success", message: "Xoá thành công!" });
    setDeleteOpen(false);
    loadData();
  };

  // Cột theo từng loại nội dung
  const columns = [
    { key: "stt", title: "STT", render: (_, r) => r.__stt },
    { key: "title", title: "Tiêu đề" },
    type === "news" && { key: "author", title: "Tác giả" },
    type === "news" && { key: "created", title: "Ngày tạo" },
    {
      key: "status",
      title: "Trạng thái",
      render: (v) =>
        v === 1 ? (
          <span className="text-green-600">Hiển thị</span>
        ) : (
          <span className="text-red-600">Ẩn</span>
        ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, row) =>
        role_id !== "A" ? (
          "-" // user thường không có quyền
        ) : (
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
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quản trị nội dung trang chủ"
        subtitle="Quản lý tin bài, hình ảnh, video và banner."
        right={
          role_id === "A" && (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Thêm nội dung
            </button>
          )
        }
      />

      {/* Bộ chọn loại nội dung */}
      <div className="flex gap-2">
        <button
          onClick={() => setType("news")}
          className={`tab-btn ${type === "news" && "tab-btn-active"}`}
        >
          <Newspaper size={16} /> Tin tức
        </button>
        <button
          onClick={() => setType("videos")}
          className={`tab-btn ${type === "videos" && "tab-btn-active"}`}
        >
          <Video size={16} /> Video
        </button>
        <button
          onClick={() => setType("images")}
          className={`tab-btn ${type === "images" && "tab-btn-active"}`}
        >
          <ImageIcon size={16} /> Hình ảnh
        </button>
        <button
          onClick={() => setType("banners")}
          className={`tab-btn ${type === "banners" && "tab-btn-active"}`}
        >
          📢 Banner
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="card p-3">
        <input
          className="input w-72"
          placeholder="Tìm kiếm tiêu đề..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Bảng dữ liệu */}
      <Table
        columns={columns}
        data={filtered.map((i, idx) => ({
          ...i,
          __stt: idx + 1,
          __rowKey: i.id,
        }))}
      />

      {/* Modal thêm/sửa */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={form.id ? "Cập nhật nội dung" : "Thêm nội dung"}
        className="max-w-lg"
        footer={
          <>
            <button className="btn" onClick={() => setEditOpen(false)}>
              Hủy
            </button>
            <button className="btn btn-primary" onClick={submitSave}>
              Lưu
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label>Tiêu đề</label>
            <input
              className="input"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Tùy loại nội dung */}
          {type === "news" && (
            <textarea
              className="textarea w-full h-32"
              placeholder="Nội dung bài viết..."
            ></textarea>
          )}

          {type === "videos" && (
            <input
              className="input"
              placeholder="URL video YouTube..."
              value={form.url || ""}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          )}

          {type === "images" && (
            <input type="file" className="input" accept="image/*" />
          )}

          <div>
            <label>Trạng thái</label>
            <select
              className="input"
              value={form.status || 1}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
            >
              <option value={1}>Hiển thị</option>
              <option value={0}>Ẩn</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal xoá */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Xoá nội dung"
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
        Bạn chắc chắn muốn xoá <b>{selectedItem?.title}</b>?
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
