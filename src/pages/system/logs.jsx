// src/pages/AccessLogs.jsx
import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Table from "../../components/Table.jsx";
import Modal from "../../components/Modal.jsx";
import Notification from "../../components/Notification.jsx";

import { RefreshCw, Eye, Search } from "lucide-react";

import {
  get as getAccessLogs,
  getById,
} from "../../api/lich_su_nguoi_dung.js";

const ACTION_MAP = {
  "Đăng nhập": "Đăng nhập hệ thống",
  "Sửa dữ liệu": "Sửa dữ liệu",
  GET: "Xem dữ liệu",
  POST: "Thêm dữ liệu",
  PUT: "Cập nhật dữ liệu",
  PATCH: "Cập nhật một phần",
  DELETE: "Xóa dữ liệu",
  LOGIN: "Đăng nhập hệ thống",
  LOGOUT: "Đăng xuất hệ thống",
};

export default function AccessLogs() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [notify, setNotify] = useState(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const res = await getAccessLogs();

      const rows = res?.data || [];
      setLogs(rows);
    } catch (err) {
      setNotify({
        type: "error",
        message: "Không thể tải nhật ký truy cập hệ thống!",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (row) => {
    try {
      setLoading(true);

      const res = await getById(row.id);

      setSelectedLog(res || row);
      setDetailOpen(true);
    } catch (err) {
      setNotify({
        type: "error",
        message: "Không thể tải chi tiết nhật ký!",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return logs;

    return logs.filter((item) =>
      [
        item.ten_dang_nhap,
        item.ho_ten,
        item.hanh_dong,
        item.ten_bang,
        item.ban_ghi_id,
        item.noi_dung,
        item.ip_address,
        item.user_agent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, logs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const currentRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage).map((item, index) => ({
      ...item,
      __rowKey: item.id,
      __stt: start + index + 1,
    }));
  }, [filtered, page, rowsPerPage]);

  const columns = [
    {
      key: "stt",
      title: "STT",
      render: (_, row) => row.__stt,
    },
    {
      key: "ten_dang_nhap",
      title: "Tên đăng nhập",
      render: (value) => value || "—",
    },
    {
      key: "ho_ten",
      title: "Họ tên",
      render: (value) => value || "—",
    },
    {
      key: "hanh_dong",
      title: "Loại thao tác",
      render: (value) => (
        <span className="font-medium text-green-700">
          {ACTION_MAP[value] || value || "Không xác định"}
        </span>
      ),
    },
    {
      key: "ten_bang",
      title: "Bảng dữ liệu",
      render: (value) => value || "—",
    },
    {
      key: "ban_ghi_id",
      title: "ID bản ghi",
      render: (value) => value || "—",
    },
    {
      key: "ip_address",
      title: "Địa chỉ IP",
      render: (value) => value || "—",
    },
    {
      key: "thoi_gian",
      title: "Thời gian",
      render: (value) => formatDateTime(value),
    },
    {
      key: "actions",
      title: "Chi tiết",
      render: (_, row) => (
        <button
          className="text-green-700 hover:text-green-900"
          title="Xem chi tiết"
          onClick={() => openDetail(row)}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-green-700">
        <PageHeader
          title={
            <span className="font-bold text-green-700">
              Nhật ký truy cập hệ thống
            </span>
          }
          subtitle={
            <span className="text-green-600">
              Theo dõi thao tác đăng nhập và sửa dữ liệu trong hệ thống
            </span>
          }
          right={
            <button className="btn flex items-center gap-2" onClick={loadLogs}>
              <RefreshCw size={16} />
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          }
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b bg-green-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-green-700" />

            <input
              className="input w-96"
              placeholder="Tìm theo tài khoản, họ tên, thao tác, IP..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="card-body">
          <Table columns={columns} data={currentRows} loading={loading} />

          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              Tổng: <b>{filtered.length}</b> bản ghi
            </div>

            <div className="flex items-center gap-3">
              <select
                className="rounded border px-2 py-1"
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

              <button
                className="btn-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>

              <span>
                {page} / {totalPages}
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

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Chi tiết nhật ký truy cập"
        className="max-w-[800px]"
        footer={
          <button className="btn" onClick={() => setDetailOpen(false)}>
            Đóng
          </button>
        }
      >
        {selectedLog ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="ID lịch sử" value={selectedLog.id} />
              <InfoBox label="ID người dùng" value={selectedLog.nguoi_dung_id} />
              <InfoBox label="Tên đăng nhập" value={selectedLog.ten_dang_nhap} />
              <InfoBox label="Họ tên" value={selectedLog.ho_ten} />
              <InfoBox
                label="Loại thao tác"
                value={ACTION_MAP[selectedLog.hanh_dong] || selectedLog.hanh_dong}
              />
              <InfoBox label="Bảng dữ liệu" value={selectedLog.ten_bang} />
              <InfoBox label="ID bản ghi" value={selectedLog.ban_ghi_id} />
              <InfoBox label="Địa chỉ IP" value={selectedLog.ip_address} />
              <InfoBox
                label="Thời gian"
                value={formatDateTime(selectedLog.thoi_gian)}
              />
            </div>

            <InfoArea label="Nội dung" value={selectedLog.noi_dung} />
            <InfoArea label="User Agent" value={selectedLog.user_agent} />

            <JsonBox label="Dữ liệu cũ" value={selectedLog.du_lieu_cu} />
            <JsonBox label="Dữ liệu mới" value={selectedLog.du_lieu_moi} />
          </div>
        ) : (
          "Không có dữ liệu."
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
      <div className="break-words font-medium">
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