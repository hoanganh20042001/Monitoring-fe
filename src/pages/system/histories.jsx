import React, { useEffect, useMemo, useState } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Notification from "../../components/Notification";
import PageHeader from "../../components/PageHeader";
import { Eye, Search, RefreshCcw } from "lucide-react";

import {
  get as getHistory,
  getById,
} from "../../api/lich_su_nguoi_dung";

export default function UserHistory() {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const [notify, setNotify] = useState(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const size = 10;

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await getHistory();
      const rows = res?.data || [];

      setData(rows);
    } catch (err) {
      setNotify({
        type: "error",
        message: "Không thể tải lịch sử người dùng.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = async (id) => {
    try {
      setLoading(true);

      const res = await getById(id);
      setSelected(res);
      setOpenDetail(true);
    } catch (err) {
      setNotify({
        type: "error",
        message: "Không thể tải chi tiết lịch sử.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.toLowerCase();

    return data.filter((item) => {
      return (
        item.ten_dang_nhap?.toLowerCase().includes(keyword) ||
        item.ho_ten?.toLowerCase().includes(keyword) ||
        item.hanh_dong?.toLowerCase().includes(keyword) ||
        item.ten_bang?.toLowerCase().includes(keyword) ||
        item.noi_dung?.toLowerCase().includes(keyword) ||
        item.ip_address?.toLowerCase().includes(keyword)
      );
    });
  }, [data, query]);

  const totalPages = Math.ceil(filtered.length / size) || 1;

  const paged = useMemo(() => {
    const start = (page - 1) * size;

    return filtered.slice(start, start + size).map((item, idx) => ({
      ...item,
      stt: start + idx + 1,
    }));
  }, [filtered, page]);

  const columns = [
    {
      key: "stt",
      title: "STT",
      className: "w-14",
    },
    {
      key: "ten_dang_nhap",
      title: "Tên đăng nhập",
    },
    {
      key: "ho_ten",
      title: "Họ tên",
    },
    {
      key: "hanh_dong",
      title: "Hành động",
      render: (value) => (
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
          {value || "—"}
        </span>
      ),
    },
    {
      key: "ten_bang",
      title: "Tên bảng",
      render: (value) => value || "—",
    },
    {
      key: "ban_ghi_id",
      title: "ID bản ghi",
      render: (value) => value || "—",
    },
    {
      key: "ip_address",
      title: "IP",
      render: (value) => value || "—",
    },
    {
      key: "thoi_gian",
      title: "Thời gian",
      className: "whitespace-nowrap",
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={
          <span className="font-bold text-green-700">
            Lịch sử người dùng
          </span>
        }
        subtitle={
          <span className="text-green-600">
            Theo dõi thao tác đăng nhập và sửa dữ liệu trong hệ thống
          </span>
        }
      />

      <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-green-700" />

          <input
            className="input w-[420px]"
            placeholder="Tìm theo tài khoản, họ tên, hành động, bảng, IP..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          className="btn flex items-center gap-2"
          disabled={loading}
          onClick={fetchData}
        >
          <RefreshCcw size={16} />
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      <Table
        columns={columns}
        loading={loading}
        data={paged}
        renderActions={(row) => (
          <button
            className="text-green-700 hover:text-green-900"
            title="Xem chi tiết"
            onClick={() => openDetailModal(row.id)}
          >
            <Eye size={18} />
          </button>
        )}
      />

      <div className="flex items-center justify-between text-sm">
        <span>
          Tổng: {filtered.length} bản ghi — Trang {page} / {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            className="btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </button>

          <button
            className="btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </button>
        </div>
      </div>

      <Modal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        title="Chi tiết lịch sử người dùng"
        className="max-w-[800px]"
        footer={
          <button className="btn" onClick={() => setOpenDetail(false)}>
            Đóng
          </button>
        }
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="ID lịch sử" value={selected.id} />
              <InfoBox label="ID người dùng" value={selected.nguoi_dung_id} />
              <InfoBox label="Tên đăng nhập" value={selected.ten_dang_nhap} />
              <InfoBox label="Họ tên" value={selected.ho_ten} />
              <InfoBox label="Hành động" value={selected.hanh_dong} />
              <InfoBox label="Tên bảng" value={selected.ten_bang} />
              <InfoBox label="ID bản ghi" value={selected.ban_ghi_id} />
              <InfoBox label="IP" value={selected.ip_address} />
              <InfoBox
                label="Thời gian"
                value={formatDateTime(selected.thoi_gian)}
              />
            </div>

            <InfoArea label="Nội dung" value={selected.noi_dung} />
            <InfoArea label="User Agent" value={selected.user_agent} />

            <JsonBox label="Dữ liệu cũ" value={selected.du_lieu_cu} />
            <JsonBox label="Dữ liệu mới" value={selected.du_lieu_moi} />
          </div>
        )}
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold">{value || "—"}</div>
    </div>
  );
}

function InfoArea({ label, value }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3">
      <div className="mb-1 text-xs text-gray-500">{label}</div>
      <div className="whitespace-pre-wrap break-words font-medium">
        {value || "—"}
      </div>
    </div>
  );
}

function JsonBox({ label, value }) {
  let content = "—";

  if (value) {
    try {
      content =
        typeof value === "string"
          ? JSON.stringify(JSON.parse(value), null, 2)
          : JSON.stringify(value, null, 2);
    } catch {
      content = String(value);
    }
  }

  return (
    <div className="rounded-lg border bg-gray-900 p-3 text-white">
      <div className="mb-2 text-xs text-gray-300">{label}</div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">
        {content}
      </pre>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("vi-VN");
}