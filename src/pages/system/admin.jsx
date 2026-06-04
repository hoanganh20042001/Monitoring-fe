import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";

import {
  Users,
  MapPin,
  FlaskConical,
  Factory,
  ClipboardCheck,
  Layers,
  Ruler,
  ShieldAlert,
  Activity,
  BarChart2,
  PieChart as PieChartIcon,
  FileText,
  CalendarDays,
  UserCheck,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { get as getViTriLayMau } from "../../api/vi_tri_lay_mau";
import { get as getMauThu } from "../../api/mau_thu";
import { get as getKiemTraMau } from "../../api/kiem_tra_mau";
import { get as getKhuVucLayMau } from "../../api/khu_vuc_lay_mau";
import { get as getLoaiMau } from "../../api/loai_mau";
import { get as getDonViTinh } from "../../api/don_vi_tinh";

// import { get as getUsers } from "../../api/users";
// import { get as getLogs } from "../../api/logs";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [locations, setLocations] = useState([]);
  const [samples, setSamples] = useState([]);
  const [checks, setChecks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sampleTypes, setSampleTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setApiError("");

    try {
      const [
        viTriResponse,
        mauThuResponse,
        kiemTraResponse,
        khuVucResponse,
        loaiMauResponse,
        donViResponse,
        usersResponse,
        logsResponse,
      ] = await Promise.all([
        getViTriLayMau().catch(() => []),
        getMauThu().catch(() => []),
        getKiemTraMau().catch(() => []),
        getKhuVucLayMau().catch(() => []),
        getLoaiMau().catch(() => []),
        getDonViTinh().catch(() => []),
        getUsers().catch(() => []),
        getLogs().catch(() => []),
      ]);

      setLocations(asArray(viTriResponse));
      setSamples(asArray(mauThuResponse));
      setChecks(asArray(kiemTraResponse));
      setAreas(asArray(khuVucResponse));
      setSampleTypes(asArray(loaiMauResponse));
      setUnits(asArray(donViResponse));
      setUsers(asArray(usersResponse));
      setLogs(asArray(logsResponse));
    } catch (error) {
      console.error("Không tải được dữ liệu dashboard hóa chất:", error);
      setApiError("Không tải được dữ liệu thống kê dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalLocations = locations.length;
    const totalSamples = samples.length;
    const totalChecks = checks.length;
    const totalAreas = areas.length;
    const totalSampleTypes = sampleTypes.length;
    const totalUnits = units.length;

    const totalUsers = users.length;
    const totalVisits = logs.length;

    const today = new Date().toISOString().slice(0, 10);

    const todayVisits = logs.filter((item) => {
      const dateValue = firstValue(
        item,
        ["created_at", "ngay_tao", "time", "date", "createdAt"],
        ""
      );

      return String(dateValue).slice(0, 10) === today;
    }).length;

    const activeUsers = users.filter((item) => {
      const status = String(
        firstValue(item, ["status", "trang_thai", "active", "is_active"], "")
      ).toLowerCase();

      return (
        status === "active" ||
        status === "1" ||
        status === "true" ||
        status === "hoạt động" ||
        status === "hoat dong"
      );
    }).length;

    const samplesWithResult = samples.filter((item) => {
      const value = firstValue(item, ["ket_qua", "gia_tri", "resultValue"], "");
      return value !== "" && value !== null && value !== undefined;
    }).length;

    const pxCount = checks.filter((item) => {
      const value = String(
        firstValue(item, ["doi_tuong", "objectType", "doi_tuong_kiem_tra"], "")
      ).toUpperCase();

      return value === "PX";
    }).length;

    const hhCount = checks.filter((item) => {
      const value = String(
        firstValue(item, ["doi_tuong", "objectType", "doi_tuong_kiem_tra"], "")
      ).toUpperCase();

      return value === "HH";
    }).length;

    const checkedLocationIds = new Set(
      checks
        .map((item) =>
          String(
            firstValue(
              item,
              [
                "vi_tri_id",
                "vi_tri_lay_mau_id",
                "id_vi_tri_lay_mau",
                "locationId",
              ],
              ""
            )
          )
        )
        .filter(Boolean)
    );

    const locationsWithCheck = checkedLocationIds.size;

    return {
      totalUsers,
      activeUsers,
      totalVisits,
      todayVisits,
      totalLocations,
      totalSamples,
      totalChecks,
      totalAreas,
      totalSampleTypes,
      totalUnits,
      samplesWithResult,
      pxCount,
      hhCount,
      locationsWithCheck,
    };
  }, [locations, samples, checks, areas, sampleTypes, units, users, logs]);

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => ({
      month: `T${index + 1}`,
      truyCap: 0,
      kiemTra: 0,
      mauThu: 0,
      ketQua: 0,
    }));

    logs.forEach((item) => {
      const monthIndex = getMonthIndex(
        firstValue(item, ["created_at", "ngay_tao", "time", "date", "createdAt"], "")
      );

      if (monthIndex >= 0) {
        months[monthIndex].truyCap += 1;
      }
    });

    checks.forEach((item) => {
      const monthIndex = getMonthIndex(
        firstValue(
          item,
          ["ngay_bat_dau", "ngay_kiem_tra", "ngay_lay_mau", "created_at", "date"],
          ""
        )
      );

      if (monthIndex >= 0) {
        months[monthIndex].kiemTra += 1;
      }
    });

    samples.forEach((item) => {
      const monthIndex = getMonthIndex(
        firstValue(item, ["created_at", "ngay_lay_mau", "ngay_kiem_tra", "date"], "")
      );

      if (monthIndex >= 0) {
        months[monthIndex].mauThu += 1;

        const result = firstValue(item, ["ket_qua", "gia_tri", "resultValue"], "");
        if (result !== "" && result !== null && result !== undefined) {
          months[monthIndex].ketQua += 1;
        }
      }
    });

    return months;
  }, [checks, samples, logs]);

  const objectTypeData = useMemo(() => {
    return [
      { name: "PX - Phóng xạ", value: stats.pxCount },
      { name: "HH - Hóa học", value: stats.hhCount },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const recentChecks = useMemo(() => {
    return [...checks]
      .sort((a, b) => {
        const dateA = new Date(
          firstValue(a, ["created_at", "ngay_bat_dau", "ngay_kiem_tra"], 0)
        ).getTime();

        const dateB = new Date(
          firstValue(b, ["created_at", "ngay_bat_dau", "ngay_kiem_tra"], 0)
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [checks]);

  const completionRate = useMemo(() => {
    if (!stats.totalSamples) return 0;
    return Math.round((stats.samplesWithResult / stats.totalSamples) * 100);
  }, [stats]);

  const locationCheckRate = useMemo(() => {
    if (!stats.totalLocations) return 0;
    return Math.round((stats.locationsWithCheck / stats.totalLocations) * 100);
  }, [stats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard phần mềm theo dõi hóa chất"
        subtitle="Tổng quan người dùng, lượt truy cập, vị trí lấy mẫu, kiểm tra mẫu, mẫu thử và kết quả thử nghiệm."
      />

      {loading && (
        <div className="rounded-xl border bg-white p-4 text-sm font-semibold text-blue-600 shadow">
          Đang tải dữ liệu thống kê...
        </div>
      )}

      {apiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {apiError}
        </div>
      )}

      {/* ====== SUMMARY CARDS ====== */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-8">
        <Card
          icon={<Users size={28} />}
          label="Người dùng"
          value={stats.totalUsers}
          color="blue"
        />

        <Card
          icon={<Activity size={28} />}
          label="Lượt truy cập"
          value={stats.totalVisits}
          color="green"
        />

        <Card
          icon={<CalendarDays size={28} />}
          label="Truy cập hôm nay"
          value={stats.todayVisits}
          color="purple"
        />

        <Card
          icon={<MapPin size={28} />}
          label="Vị trí lấy mẫu"
          value={stats.totalLocations}
          color="blue"
        />

        <Card
          icon={<ClipboardCheck size={28} />}
          label="Kiểm tra mẫu"
          value={stats.totalChecks}
          color="green"
        />

        <Card
          icon={<FlaskConical size={28} />}
          label="Mẫu thử"
          value={stats.totalSamples}
          color="purple"
        />

        <Card
          icon={<FileText size={28} />}
          label="Có kết quả"
          value={stats.samplesWithResult}
          color="emerald"
        />

        <Card
          icon={<Factory size={28} />}
          label="Khu vực mẫu"
          value={stats.totalAreas}
          color="yellow"
        />
      </div>

      {/* ====== DETAIL CARDS ====== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ProgressCard
          title="Tỷ lệ mẫu đã có kết quả"
          value={`${completionRate}%`}
          percent={completionRate}
          icon={<Activity size={22} />}
          helper={`${stats.samplesWithResult}/${stats.totalSamples} mẫu thử đã nhập kết quả`}
        />

        <ProgressCard
          title="Vị trí đã kiểm tra"
          value={stats.locationsWithCheck}
          percent={locationCheckRate}
          icon={<MapPin size={22} />}
          helper={`${stats.locationsWithCheck}/${stats.totalLocations} vị trí đã phát sinh kiểm tra`}
        />

        <ProgressCard
          title="Người dùng hoạt động"
          value={stats.activeUsers}
          percent={
            stats.totalUsers
              ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
              : 0
          }
          icon={<UserCheck size={22} />}
          helper={`${stats.activeUsers}/${stats.totalUsers} tài khoản đang hoạt động`}
        />
      </div>

      {/* ====== CHARTS ====== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BarChart2 size={20} />
            Thống kê truy cập, kiểm tra mẫu và kết quả theo tháng
          </h3>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="truyCap"
                  name="Lượt truy cập"
                  stroke="#9333ea"
                  strokeWidth={3}
                />

                <Line
                  type="monotone"
                  dataKey="kiemTra"
                  name="Kiểm tra mẫu"
                  stroke="#2563eb"
                  strokeWidth={3}
                />

                <Line
                  type="monotone"
                  dataKey="mauThu"
                  name="Mẫu thử"
                  stroke="#16a34a"
                  strokeWidth={3}
                />

                <Line
                  type="monotone"
                  dataKey="ketQua"
                  name="Có kết quả"
                  stroke="#dc2626"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <PieChartIcon size={20} />
            Phân loại đối tượng
          </h3>

          <div className="h-80 w-full">
            {objectTypeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={objectTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {objectTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#2563eb" : "#16a34a"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-sm text-gray-500">
                Chưa có dữ liệu PX/HH
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== STAT BLOCKS ====== */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatBlock
          title="Thống kê hệ thống"
          icon={<Activity size={22} />}
          items={[
            { label: "Tổng người dùng", value: stats.totalUsers },
            { label: "Người dùng hoạt động", value: stats.activeUsers },
            { label: "Tổng lượt truy cập", value: stats.totalVisits },
            { label: "Lượt truy cập hôm nay", value: stats.todayVisits },
          ]}
        />

        <StatBlock
          title="Dữ liệu lấy mẫu"
          icon={<FlaskConical size={22} />}
          items={[
            { label: "Vị trí lấy mẫu", value: stats.totalLocations },
            { label: "Khu vực lấy mẫu", value: stats.totalAreas },
            { label: "Loại mẫu", value: stats.totalSampleTypes },
            { label: "Đơn vị tính", value: stats.totalUnits },
          ]}
        />

        <StatBlock
          title="Kiểm tra mẫu"
          icon={<ClipboardCheck size={22} />}
          items={[
            { label: "Tổng kiểm tra mẫu", value: stats.totalChecks },
            { label: "Tổng mẫu thử", value: stats.totalSamples },
            { label: "Mẫu đã có kết quả", value: stats.samplesWithResult },
            { label: "Tỷ lệ có kết quả", value: `${completionRate}%` },
          ]}
        />

        <StatBlock
          title="Đối tượng quan trắc"
          icon={<ShieldAlert size={22} />}
          items={[
            { label: "PX - Phóng xạ", value: stats.pxCount },
            { label: "HH - Hóa học", value: stats.hhCount },
            {
              label: "Tổng đối tượng đã ghi nhận",
              value: stats.pxCount + stats.hhCount,
            },
          ]}
        />
      </div>

      {/* ====== RECENT CHECKS ====== */}
      <div className="card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CalendarDays size={20} />
          Kiểm tra mẫu gần đây
        </h3>

        {recentChecks.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-3">Mã mẫu KH</th>
                  <th className="px-4 py-3">Loại mẫu</th>
                  <th className="px-4 py-3">Khu vực</th>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Ngày bắt đầu</th>
                  <th className="px-4 py-3">Người thử nghiệm</th>
                </tr>
              </thead>

              <tbody>
                {recentChecks.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">
                      {firstValue(item, ["ma_mau_khach_hang", "ma_mau", "code"], "—")}
                    </td>

                    <td className="px-4 py-3">
                      {firstValue(
                        item,
                        ["loai_mau_so_hieu", "loai_mau", "ten_loai_mau"],
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {firstValue(
                        item,
                        ["khu_vuc_lay_mau", "ten_khu_vuc", "khu_vuc"],
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {firstValue(
                          item,
                          ["doi_tuong", "objectType", "doi_tuong_kiem_tra"],
                          "—"
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(
                        firstValue(
                          item,
                          ["ngay_bat_dau", "ngay_kiem_tra", "created_at"],
                          ""
                        )
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {firstValue(
                        item,
                        ["nguoi_thu_nghiem", "tester", "nguoi_lay_mau"],
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-500">
            Chưa có dữ liệu kiểm tra mẫu.
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= HELPER FUNCTIONS ================= */

function unwrapApiData(response) {
  return (
    response?.data?.data ??
    response?.data?.items ??
    response?.data?.records ??
    response?.data ??
    response?.items ??
    response?.records ??
    response?.result ??
    response
  );
}

function asArray(response) {
  const source = unwrapApiData(response);

  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.data)) return source.data;
  if (Array.isArray(source?.items)) return source.items;
  if (Array.isArray(source?.records)) return source.records;
  if (Array.isArray(source?.results)) return source.results;

  return [];
}

function firstValue(item, keys, fallback = "") {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function getMonthIndex(value) {
  if (!value) return -1;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return -1;
  }

  return date.getMonth();
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("vi-VN");
}

/* ================= COMPONENT: SUMMARY CARD ================= */

function Card({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    emerald: "bg-emerald-100 text-emerald-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow transition hover:shadow-md">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${
          colors[color] || colors.gray
        }`}
      >
        {icon}
      </div>

      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

/* ================= COMPONENT: PROGRESS CARD ================= */

function ProgressCard({ title, value, percent, icon, helper }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));

  return (
    <div className="rounded-xl border bg-white p-5 shadow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-800">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">{icon}</div>
      </div>

      <div className="text-3xl font-bold text-gray-900">{value}</div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

/* ================= COMPONENT: STAT BLOCK ================= */

function StatBlock({ title, icon, items }) {
  return (
    <div className="card p-5 shadow">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-700">
        {icon}
        {title}
      </h3>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex justify-between border-b pb-2 text-gray-700"
          >
            <span>{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}