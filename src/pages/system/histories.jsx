import React, { useEffect, useState } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Notification from "../../components/Notification";
import { Eye, Search, RefreshCcw } from "lucide-react";

// ✅ import api từ service bạn đã tạo
// import { get as getMissions } from "../../api/missions";

/* =====================
   MAIN COMPONENT
===================== */
export default function MissionHistory() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const [notify, setNotify] = useState(null);
  const [loading, setLoading] = useState(false);

  // server-side pagination
  const [page, setPage] = useState(1);
  const size = 10;
  const totalPages = Math.ceil(total / size) || 1;

  /* =====================
        FETCH DATA
  ===================== */
  const fetchData = async ({ pageParam = page, queryParam = query } = {}) => {
    try {
      setLoading(true);
      const res = await getMissions({
        page: pageParam,
        size,
        search_text: queryParam,
      });

      // res thường có dạng: { total, data }
      setData(res?.data || []);
      setTotal(res?.total || 0);
    } catch (err) {
      setNotify({
        type: "error",
        message: "Không thể tải lịch sử nhiệm vụ. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
        LOAD WHEN PAGE CHANGES
  ===================== */
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page]);

  /* =====================
        SEARCH (DEBOUNCE)
  ===================== */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData({ pageParam: 1, queryParam: query });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [query]);

  /* =====================
        COLUMNS
  ===================== */
  const columns = [
    { key: "stt", title: "STT", className: "w-14" },
    { key: "name", title: "Tên nhiệm vụ" },
    { key: "scenario_name", title: "Scenario" },
    { key: "base_dosage_name", title: "Liều cơ bản" },
    { key: "risk_coefficient_description", title: "Hệ số rủi ro" },
    { key: "activity_coefficient_description", title: "Hệ số hoạt động" },
    { key: "safety_coefficient_description", title: "Hệ số an toàn" },
    { key: "createdAt", title: "Thời gian cấp phát", className: "whitespace-nowrap" },
    { key: "updatedAt", title: "Cập nhật lần cuối", className: "whitespace-nowrap" },
    // { key: "id", title: "ID nhiệm vụ", className: "whitespace-nowrap" },
    // { key: "actions", title: "Hành động", className: "w-20" },
    // { key: "status", title: "Trạng thái", className: "w-24" },
    // { key: "notes", title: "Ghi chú" },
    { key: "created_by", title: "Người cấp phát" },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-700">
            Lịch sử cấp phát nhiệm vụ
          </h1>
          <p className="text-green-600">
            Theo dõi & tra cứu nhiệm vụ theo scenario và các hệ số
          </p>
        </div>

        <button
          className="btn flex items-center gap-2"
          disabled={loading}
          onClick={() => fetchData()}
        >
          <RefreshCcw size={16} />
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className="bg-white p-4 rounded-lg border shadow flex items-center gap-2">
        <Search size={18} className="text-green-700" />
        <input
          className="input w-[450px]"
          placeholder="Tìm theo tên nhiệm vụ, scenario, hệ số..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* ===== TABLE ===== */}
      <Table
        columns={columns}
        loading={loading}
        data={data.map((i, idx) => ({
          ...i,
          stt: (page - 1) * size + idx + 1,
        }))}
        renderActions={(row) => (
          <button
            className="text-green-700 hover:text-green-900"
            onClick={() => {
              setSelected(row);
              setOpenDetail(true);
            }}
          >
            <Eye size={18} />
          </button>
        )}
      />

      {/* ===== PAGINATION ===== */}
      <div className="flex justify-between items-center text-sm">
        <span>
          Tổng: {total} bản ghi — Trang {page} / {totalPages}
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

      {/* ===== DETAIL MODAL ===== */}
      <Modal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        title="Chi tiết nhiệm vụ"
        className="max-w-[650px]"
        footer={
          <button className="btn" onClick={() => setOpenDetail(false)}>
            Đóng
          </button>
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div>
              <b>Tên nhiệm vụ:</b> {selected.name}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="Scenario" value={selected.scenario_name} />
              <InfoBox label="Liều cơ bản" value={selected.base_dosage_name} />
              <InfoBox label="Hệ số rủi ro" value={selected.risk_coefficient_name} />
              <InfoBox label="Hệ số hoạt động" value={selected.activity_coefficient_name} />
              <InfoBox label="Hệ số an toàn" value={selected.safety_coefficient_name} />
              <InfoBox label="ID nhiệm vụ" value={selected.id} />
            </div>
          </div>
        )}
      </Modal>

      {/* ===== NOTIFICATION ===== */}
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

/* =====================
   SMALL UI COMPONENT
===================== */
function InfoBox({ label, value }) {
  return (
    <div className="p-3 border rounded-lg bg-gray-50">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="font-semibold">{value || "—"}</div>
    </div>
  );
}
