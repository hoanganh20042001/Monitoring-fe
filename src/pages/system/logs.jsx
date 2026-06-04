// src/pages/AccessLogs.jsx
import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Table from "../../components/Table.jsx";
import Modal from "../../components/Modal.jsx";
import Notification from "../../components/Notification.jsx";

import { RefreshCw, Eye } from "lucide-react";
import { get as getAccessLogs } from "../../api/userHistories.js";

// Map mô tả phương thức
const METHOD_MAP = {
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

  // pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Load logs
  const loadLogs = async () => {
    try {
      const res = await getAccessLogs();
      setLogs(res.data || []);
    } catch (err) {
      setNotify({
        type: "error",
        message: "Không thể tải nhật ký truy cập hệ thống!",
      });
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q
      ? logs.filter((l) =>
          `${l.username} ${l.method} ${l.path} ${l.ip}`
            .toLowerCase()
            .includes(q)
        )
      : logs;
  }, [query, logs]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const currentRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Table columns
  const columns = [
    { key: "stt", title: "STT", render: (_, r) => r.__stt },
    { key: "username", title: "Người dùng" },

    {
      key: "method",
      title: "Loại thao tác",
      render: (v) => (
        <span className="font-medium text-green-700">
          {METHOD_MAP[v] || v || "Không xác định"}
        </span>
      ),
    },

    { key: "path", title: "Chức năng truy cập" },
    { key: "ip", title: "Địa chỉ IP" },

    {
      key: "time",
      title: "Thời gian",
      render: (v) =>
        v ? new Date(v).toLocaleString("vi-VN") : "—",
    },

    {
      key: "actions",
      title: "Chi tiết",
      render: (_, r) => (
        <button
          className="text-green-700 hover:text-green-900"
          onClick={() => {
            setSelectedLog(r);
            setDetailOpen(true);
          }}
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* ===== HEADER (FORCED GREEN) ===== */}
      <div className="text-green-700">
        <PageHeader
          title={
            <span className="text-green-700 font-bold">
              Nhật ký truy cập hệ thống
            </span>
          }
          subtitle={
            <span className="text-green-600">
              Theo dõi các thao tác truy cập, sử dụng chức năng trong hệ thống
            </span>
          }
          right={
            <button className="btn" onClick={loadLogs}>
              <RefreshCw size={16} /> Làm mới
            </button>
          }
        />
      </div>

      {/* ===== SEARCH + TABLE ===== */}
      <div className="card">
        <div className="px-4 py-3 border-b bg-green-50 flex justify-between">
          <input
            className="input w-72"
            placeholder="Tìm theo người dùng, thao tác, IP..."
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
            data={currentRows.map((l, i) => ({
              ...l,
              __rowKey: l.id,
              __stt: (page - 1) * rowsPerPage + i + 1,
            }))}
          />

          {/* ===== PAGINATION ===== */}
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

      {/* ===== DETAIL MODAL ===== */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Chi tiết nhật ký truy cập"
        className="max-w-md"
        footer={
          <button className="btn" onClick={() => setDetailOpen(false)}>
            Đóng
          </button>
        }
      >
        {selectedLog ? (
          <div className="space-y-2 text-sm">
            <div>
              <b>Người dùng:</b> {selectedLog.username}
            </div>
            <div>
              <b>Loại thao tác:</b>{" "}
              {METHOD_MAP[selectedLog.method] || selectedLog.method}
            </div>
            <div>
              <b>Chức năng truy cập:</b> {selectedLog.path}
            </div>
            <div>
              <b>Địa chỉ IP:</b> {selectedLog.ip}
            </div>
            <div>
              <b>Thời gian:</b>{" "}
              {new Date(selectedLog.time).toLocaleString("vi-VN")}
            </div>
            <div>
              <b>User Agent:</b>
              <div className="text-gray-600 text-xs">
                {selectedLog.user_agent || "—"}
              </div>
            </div>
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
