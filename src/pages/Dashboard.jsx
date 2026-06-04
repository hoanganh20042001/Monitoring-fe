import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Factory,
  FlaskConical,
  Gauge,
  Layers,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Wind,
  X,
  Crosshair,
  Trash2,
  Edit3,
  MousePointer2,
  UserCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Notification from "../components/Notification";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

import {
  get as getTa,
  create as createTa,
  update as updateTa,
  remove as removeTa,
  getById as getTaById,
} from "../api/vi_tri_lay_mau";

import {
  get as getMT,
  create as createMT,
  update as updateMT,
  remove as removeMT,
  getById as getMTById,
} from "../api/mau_thu";

import {
  get as getDVT,
  create as createDVT,
  update as updateDVT,
  remove as removeDVT,
  getById as getDVTById,
} from "../api/don_vi_tinh";

import {
  get as getKVL,
  create as createKVL,
  update as updateKVL,
  remove as removeKVL,
  getById as getKVLById,
} from "../api/khu_vuc_lay_mau";

import {
  get as getLM,
  create as createLM,
  update as updateLM,
  remove as removeLM,
  getById as getLMById,
} from "../api/loai_mau";

import {
  get as getKTM,
  create as createKTM,
  update as updateKTM,
  remove as removeKTM,
  getById as getKTMById,
} from "../api/kiem_tra_mau";

const DefaultIcon = new L.Icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DA_NANG_CENTER = [16.0544, 108.2022];
const MAP_SOURCE_KEY = "chemical-monitoring-map-source-v1";

// ===== MAP SOURCES =====
// ONLINE: dùng OpenStreetMap online, giống bản đồ thật nhất khi có mạng.
// OFFLINE_TILES: dùng bộ tile thật trong public/tiles/{z}/{x}/{y}.png.
// LOCAL_SERVER: dùng tile server local, ví dụ TileServer GL chạy ở localhost:8080.
const MAP_SOURCES = {
  ONLINE: {
    key: "ONLINE",
    label: "Online",
    description: "OpenStreetMap qua internet",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    minZoom: 3,
    maxZoom: 19,
  },
  OFFLINE_TILES: {
    key: "OFFLINE_TILES",
    label: "Offline tiles",
    description: "Đọc từ public/tiles/{z}/{x}/{y}.png",
    url: "/tiles/{z}/{x}/{y}.png",
    attribution: "Bản đồ offline nội bộ",
    minZoom: 10,
    maxZoom: 18,
  },
  LOCAL_SERVER: {
    key: "LOCAL_SERVER",
    label: "Local server",
    description: "Đọc từ TileServer GL localhost",
    url: "http://localhost:8080/styles/osm-bright/{z}/{x}/{y}.png",
    attribution: "Bản đồ từ local tile server",
    minZoom: 3,
    maxZoom: 19,
  },
};

const DEFAULT_MAP_SOURCE = "ONLINE";
const TILE_ERROR_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='256' height='256' fill='%23f8fafc'/><path d='M0 0H256V256H0Z' fill='none' stroke='%23e2e8f0'/><text x='128' y='112' font-size='13' text-anchor='middle' fill='%23ef4444'>Không tìm thấy tile</text><text x='128' y='136' font-size='11' text-anchor='middle' fill='%2364748b'>Đổi Online hoặc kiểm tra offline tiles</text><text x='128' y='156' font-size='11' text-anchor='middle' fill='%2364748b'>/tiles/{z}/{x}/{y}.png</text></svg>";

const RISK_STYLE = {
  LOW: {
    label: "Thấp",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    circle: "#10b981",
  },
  MEDIUM: {
    label: "Trung bình",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    circle: "#f59e0b",
  },
  HIGH: {
    label: "Cao",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    circle: "#f97316",
  },
  CRITICAL: {
    label: "Nguy cấp",
    badge: "bg-red-50 text-red-700 border-red-200",
    circle: "#ef4444",
  },
};

const CHEMICAL_TYPES = [
  "Clo (Cl2)",
  "Amoniac (NH3)",
  "Axit sulfuric (H2SO4)",
  "Xăng dầu bay hơi",
  "Dung môi hữu cơ",
  "Hóa chất khác",
];

const UNIT_OPTIONS = ["Bq/L", "Bq/kg", "Bq/m3", "ppm", "mg/m3", "mg/L", "%", "ppb"];
const WIND_OPTIONS = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];

const SAMPLE_TYPE_OPTIONS = ["Mẫu nước", "Mẫu đất", "Mẫu không khí", "Mẫu bề mặt", "Mẫu thực phẩm", "Mẫu khác"]; // Fallback khi API loai_mau chưa có dữ liệu
const OBJECT_TYPE_OPTIONS = [
  { value: "PX", label: "PX - Phóng xạ" },
  { value: "HH", label: "HH - Hóa học" },
];

const emptyLocationForm = {
  ten_vi_tri: "",
  dia_chi: "",
  kinh_do: "",
  vi_do: "",
  ghi_chu: "",
};

const emptyMeasurementRow = {
  testIndicator: "",
  unit: "Bq/L",
  unitKyHieu: "Bq/L",
  resultValue: "",
  uncertainty: "",
  tester: "",
  note: "",
};

const emptyChemicalForm = {
  // Bước 2: thông tin mẫu / khu vực
  sampleType: "Mẫu nước",
  sampleTypeId: "",
  sampleTypeMaLoai: "",
  sampleTypeKyHieu: "",
  sampleAreaId: "",
  sampleAreaName: "",
  sampleAreaMaLoai: "",
  sampleAreaKyHieu: "",
  observationStartTime: "",
  observationEndTime: "",
  observationTime: "",
  objectType: "PX",

  // Bước 3: nhiều lượt đo / kết quả thử nghiệm
  measurementRows: [{ ...emptyMeasurementRow }],

  // Giữ lại các trường cũ để không mất tương thích dữ liệu cũ
  sampleCollector: "",
  samplePhone: "",
  chemicalName: "Clo (Cl2)",
  cas: "",
  concentration: "",
  unit: "Bq/L",
  threshold: "",
  risk: "MEDIUM",
  dateMode: "single",
  date: "2026-05-10",
  startDate: "2026-05-01",
  endDate: "2026-05-10",
  windDirection: "Đông Bắc",
  windSpeed: "2.5",
  temperature: "30",
  humidity: "70",
  note: "",
  testIndicator: "",
  resultValue: "",
  uncertainty: "",
  tester: "",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getStoredUser() {
  try {
    const keys = ["user", "authUser", "currentUser", "profile"];
    for (const key of keys) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        return { name: raw };
      }
    }
  } catch {
    // Bỏ qua nếu trình duyệt chặn localStorage.
  }
  return null;
}

function getDisplayUserName(user) {
  return user?.ho_ten || user?.fullName || user?.name || user?.ten || user?.username || user?.email || "Người dùng";
}

function handleLogout() {
  try {
    ["token", "accessToken", "refreshToken", "user", "authUser", "currentUser", "profile"].forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  } catch {
    // Bỏ qua nếu trình duyệt chặn storage.
  }
  window.location.href = "/login";
}

function getMainChemical(location) {
  return location?.chemicals?.[0] || null;
}

function formatDateRange(chemical) {
  if (!chemical) return "—";
  if (chemical.dateMode === "range") return `${chemical.startDate || "—"} → ${chemical.endDate || "—"}`;
  return chemical.date || "—";
}

function getRadiusByRisk(risk, concentration, threshold) {
  const ratio = Number(threshold) > 0 ? Number(concentration) / Number(threshold) : 1;
  const base = {
    LOW: 220,
    MEDIUM: 420,
    HIGH: 680,
    CRITICAL: 950,
  }[risk] || 420;
  return Math.max(180, Math.min(1500, base * Math.max(0.75, ratio)));
}

function getRiskFromValue(concentration, threshold) {
  const c = Number(concentration);
  const t = Number(threshold);
  if (!Number.isFinite(c) || !Number.isFinite(t) || t <= 0) return "MEDIUM";
  const ratio = c / t;
  if (ratio < 0.5) return "LOW";
  if (ratio < 1) return "MEDIUM";
  if (ratio < 2) return "HIGH";
  return "CRITICAL";
}

function RequiredLabel({ children, required }) {
  return (
    <span className="text-xs font-semibold text-slate-600">
      {children}
      {required && <span className="ml-1 text-red-600">*</span>}
    </span>
  );
}

function NumberInput({ label, value, onChange, placeholder, step = "any", suffix, required = false }) {
  return (
    <label className="space-y-1.5">
      <RequiredLabel required={required}>{label}</RequiredLabel>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, required = false }) {
  return (
    <label className="space-y-1.5">
      <RequiredLabel required={required}>{label}</RequiredLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options, required = false }) {
  return (
    <label className="space-y-1.5">
      <RequiredLabel required={required}>{label}</RequiredLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClickToPickLocation({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ vi_do: e.latlng.lat.toFixed(6), kinh_do: e.latlng.lng.toFixed(6) });
    },
  });
  return null;
}

function SmoothMapController({ center, selectedId }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.flyTo(center, Math.max(map.getZoom(), 13), {
      animate: true,
      duration: 0.85,
      easeLinearity: 0.2,
    });
  }, [map, center, selectedId]);

  return null;
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        <div className="rounded-2xl bg-blue-50 p-2 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ChemicalModal({
  open,
  location,
  form,
  setForm,
  onClose,
  onSubmit,
  notification,
  onCloseNotification,
  onInvalidNext = () => {},
  sampleAreaOptions = [],
  timeOptions = [],
  sampleTypeOptions = [],
  unitOptions = [],
}) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  if (!open || !location) return null;

  function updateChemicalForm(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "sampleType") {
        const type = sampleTypeOptions.find((item) => String(item.value) === String(value) || String(item.id) === String(value));
        next.sampleTypeId = type?.id || "";
        next.sampleTypeMaLoai = type?.ma_loai || type?.code || "";
        next.sampleTypeKyHieu = type?.ky_hieu || type?.code || "";
      }

      if (key === "sampleAreaId") {
        const area = sampleAreaOptions.find((item) => String(item.id) === String(value));
        next.sampleAreaName = area?.name || "";
        next.sampleAreaMaLoai = area?.ma_loai || area?.code || "";
        next.sampleAreaKyHieu = area?.ky_hieu || area?.code || "";
      }

      if (key === "observationStartTime" || key === "observationEndTime") {
        const start = key === "observationStartTime" ? value : next.observationStartTime;
        const end = key === "observationEndTime" ? value : next.observationEndTime;
        next.observationTime = end ? `${start} → ${end}` : start;
        next.dateMode = end ? "range" : "single";
        next.date = start;
        next.startDate = start;
        next.endDate = end;
      }

      return next;
    });
  }

  function updateMeasurementRow(index, key, value) {
    setForm((prev) => {
      const rows = [...(prev.measurementRows?.length ? prev.measurementRows : [{ ...emptyMeasurementRow }])];
      rows[index] = { ...rows[index], [key]: value };
      if (key === "unit") {
        const unit = unitOptions.find((item) => String(item.value) === String(value) || String(item.id) === String(value));
        rows[index].unitKyHieu = unit?.ky_hieu || value;
      }

      const first = rows[0] || emptyMeasurementRow;
      return {
        ...prev,
        measurementRows: rows,
        testIndicator: first.testIndicator,
        unit: first.unit,
        resultValue: first.resultValue,
        uncertainty: first.uncertainty,
        tester: first.tester,
        note: first.note,
        chemicalName: first.testIndicator || prev.chemicalName,
        concentration: first.resultValue,
      };
    });
  }

  function addMeasurementRow() {
    setForm((prev) => ({
      ...prev,
      measurementRows: [...(prev.measurementRows?.length ? prev.measurementRows : [{ ...emptyMeasurementRow }]), { ...emptyMeasurementRow }],
    }));
  }

  function removeMeasurementRow(index) {
    setForm((prev) => {
      const rows = (prev.measurementRows?.length ? prev.measurementRows : [{ ...emptyMeasurementRow }]).filter((_, rowIndex) => rowIndex !== index);
      return { ...prev, measurementRows: rows.length ? rows : [{ ...emptyMeasurementRow }] };
    });
  }

  function canGoNext() {
    if (step === 1) return true;
    if (step === 2) {
      return Boolean(form.sampleType && form.sampleAreaId && form.observationStartTime && form.objectType);
    }
    if (step === 3) {
      const rows = form.measurementRows?.length ? form.measurementRows : [];
      return rows.some((row) => row.testIndicator?.trim() && row.unit && row.resultValue !== "");
    }
    return true;
  }

  const steps = [
    { id: 1, title: "Vị trí", helper: "Kiểm tra điểm lấy mẫu" },
    { id: 2, title: "Mẫu & khu vực", helper: "Loại mẫu, khu vực, thời gian" },
    { id: 3, title: "Kết quả", helper: "Chỉ tiêu và kết quả thử nghiệm" },
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <AnimatePresence>
        {notification && (
          <div className="absolute right-6 top-6 z-[3600]">
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={onCloseNotification}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <FlaskConical className="h-4 w-4" />
              Quy trình nhập dữ liệu thử nghiệm
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{location.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {location.dia_chi} · {location.vi_do}, {location.kinh_do}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[calc(92vh-88px)] overflow-auto p-5">
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {steps.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 1) {
                    setStep(1);
                    return;
                  }

                  if (item.id === 2) {
                    setStep(2);
                    return;
                  }

                  if (item.id === 3) {
                    const step2Valid = Boolean(
                      form.sampleType &&
                      form.sampleAreaId &&
                      form.observationStartTime &&
                      form.objectType
                    );

                    if (!step2Valid) {
                      onInvalidNext("Vui lòng nhập đủ dữ liệu ở bước 2 trước khi sang bước 3.");
                      setStep(2);
                      return;
                    }

                    setStep(3);
                  }
                }}
                className={cx(
                  "rounded-2xl border p-4 text-left transition",
                  step === item.id
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cx(
                    "grid h-9 w-9 place-items-center rounded-full text-sm font-black",
                    step === item.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {item.id}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">Bước {item.id}: {item.title}</div>
                    <div className="text-xs text-slate-500">{item.helper}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {step === 1 && (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <MapPin className="h-5 w-5 text-blue-600" />
                Bước 1 - Thông tin vị trí lấy mẫu
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Tên vị trí</div>
                  <div className="mt-1 font-bold text-slate-900">{location.name}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Địa chỉ / địa điểm</div>
                  <div className="mt-1 font-bold text-slate-900">{location.dia_chi}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Kinh độ</div>
                  <div className="mt-1 font-mono font-bold text-slate-900">{location.kinh_do}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs text-slate-500">Vĩ độ</div>
                  <div className="mt-1 font-mono font-bold text-slate-900">{location.vi_do}</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 text-sm text-slate-600">
                <b>Ghi chú vị trí:</b> {location.ghi_chu || "—"}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Factory className="h-5 w-5 text-blue-600" />
                Bước 2 - Kiểm tra khu vực lấy mẫu
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <RequiredLabel required>Loại mẫu</RequiredLabel>
                  <select
                    value={form.sampleType}
                    onChange={(e) => updateChemicalForm("sampleType", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">-- Chọn loại mẫu --</option>
                    {(sampleTypeOptions.length ? sampleTypeOptions : SAMPLE_TYPE_OPTIONS.map((item) => ({ value: item, label: item }))).map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  {!sampleTypeOptions.length && (
                    <p className="text-[11px] text-amber-600">Đang dùng danh sách loại mẫu mặc định vì API loai_mau chưa có dữ liệu.</p>
                  )}
                </label>


                <label className="space-y-1.5">
                  <RequiredLabel required>Khu vực lấy mẫu</RequiredLabel>
                  <select
                    value={form.sampleAreaId}
                    onChange={(e) => updateChemicalForm("sampleAreaId", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">-- Chọn khu vực lấy mẫu --</option>
                    {sampleAreaOptions.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}{area.code ? ` (${area.code})` : ""}
                      </option>
                    ))}
                  </select>
                  {!sampleAreaOptions.length && (
                    <p className="text-[11px] font-semibold text-red-500">
                      Chưa tải được danh sách khu vực lấy mẫu từ API. Vui lòng kiểm tra endpoint khu vực lấy mẫu.
                    </p>
                  )}
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <RequiredLabel required>Ngày bắt đầu</RequiredLabel>
                    <input
                      type="date"
                      value={form.observationStartTime}
                      onChange={(e) => updateChemicalForm("observationStartTime", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600">Ngày kết thúc</span>
                    <input
                      type="date"
                      value={form.observationEndTime}
                      onChange={(e) => updateChemicalForm("observationEndTime", e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <p className="text-[11px] text-slate-400">
                      Chỉ lưu ngày, không lưu giờ. Chọn thêm ngày kết thúc nếu là khoảng thời gian.
                    </p>
                  </label>
                </div>

                <label className="space-y-1.5">
                  <RequiredLabel required>Đối tượng</RequiredLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {OBJECT_TYPE_OPTIONS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => updateChemicalForm("objectType", item.value)}
                        className={cx(
                          "h-11 rounded-xl border text-sm font-bold transition",
                          form.objectType === item.value
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Gauge className="h-5 w-5 text-blue-600" />
                  Bước 3 - Các mẫu thử / kết quả thử nghiệm
                </div>
                <button
                  type="button"
                  onClick={addMeasurementRow}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <Plus className="h-4 w-4" />
                  Thêm mẫu thử
                </button>
              </div>

              <div className="space-y-4">
                {(form.measurementRows?.length ? form.measurementRows : [{ ...emptyMeasurementRow }]).map((row, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="font-bold text-slate-900">Mẫu thử #{index + 1}</div>
                      {(form.measurementRows?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMeasurementRow(index)}
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                        >
                          Xóa mẫu thử
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        required
                        label="Tên chỉ tiêu thử nghiệm"
                        value={row.testIndicator}
                        onChange={(v) => updateMeasurementRow(index, "testIndicator", v)}
                        placeholder="VD: Cs-137, I-131, Clo dư, pH..."
                      />
                      <label className="space-y-1.5">
                        <RequiredLabel required>Đơn vị tính</RequiredLabel>
                        <select
                          value={row.unit}
                          onChange={(e) => updateMeasurementRow(index, "unit", e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">-- Chọn đơn vị tính --</option>
                          {(unitOptions.length ? unitOptions : UNIT_OPTIONS.map((item) => ({ value: item, label: item }))).map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                        {!unitOptions.length && (
                          <p className="text-[11px] text-amber-600">Đang dùng danh sách đơn vị mặc định vì API don_vi_tinh chưa có dữ liệu.</p>
                        )}
                      </label>
                      <NumberInput
                        required
                        label="Kết quả thử nghiệm"
                        value={row.resultValue}
                        onChange={(v) => updateMeasurementRow(index, "resultValue", v)}
                        placeholder="Nhập kết quả"
                      />
                      <NumberInput
                        label="Sai số"
                        value={row.uncertainty}
                        onChange={(v) => updateMeasurementRow(index, "uncertainty", v)}
                        placeholder="Có thể bỏ trống"
                      />
                      <TextInput
                        label="Người thử nghiệm"
                        value={row.tester}
                        onChange={(v) => updateMeasurementRow(index, "tester", v)}
                        placeholder="Có thể bỏ trống"
                      />
                      <label className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-600">Ghi chú</span>
                        <input
                          value={row.note}
                          onChange={(e) => updateMeasurementRow(index, "note", e.target.value)}
                          placeholder="Ghi chú cho lượt đo này"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 mt-5 flex justify-between gap-3 border-t border-slate-200 bg-white pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>

            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Quay lại
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (canGoNext()) {
                      setStep((prev) => Math.min(3, prev + 1));
                      return;
                    }
                    onInvalidNext(step === 2
                      ? "Vui lòng nhập đủ dữ liệu ở bước 2 trước khi sang bước 3."
                      : "Vui lòng nhập đủ dữ liệu trước khi tiếp tục."
                    );
                  }}
                  className={cx(
                    "inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-bold text-white shadow-lg transition",
                    canGoNext()
                      ? "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                      : "bg-slate-400 shadow-slate-200 hover:bg-slate-500"
                  )}
                >
                  Tiếp tục
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Lưu kết quả thử nghiệm
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function LocationModal({ open, mode, form, setForm, onClose, onSubmit, notification, onCloseNotification }) {
  if (!open) return null;

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const title = mode === "edit" ? "Sửa điểm lấy mẫu" : "Thêm điểm lấy mẫu";
  const helper = mode === "edit"
    ? "Cập nhật thông tin vị trí lấy mẫu. Dữ liệu sẽ được lưu qua API updateTa."
    : "Nhập thông tin vị trí lấy mẫu. Sau khi lưu sẽ mở modal nhập hóa chất.";

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <AnimatePresence>
        {notification && (
          <div className="absolute right-6 top-6 z-[3600]">
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={onCloseNotification}
            />
          </div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <MapPin className="h-4 w-4" />
              Điểm lấy mẫu
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{helper}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextInput required label="Tên vị trí" value={form.ten_vi_tri} onChange={(v) => updateField("ten_vi_tri", v)} placeholder="VD: Kho hóa chất A" />
            </div>
            <div className="md:col-span-2">
              <TextInput required label="Địa điểm / địa chỉ" value={form.dia_chi} onChange={(v) => updateField("dia_chi", v)} placeholder="VD: KCN Hòa Khánh, Đà Nẵng" />
            </div>
            <NumberInput required label="Kinh độ" value={form.kinh_do} onChange={(v) => updateField("kinh_do", v)} placeholder="108.2022" />
            <NumberInput required label="Vĩ độ" value={form.vi_do} onChange={(v) => updateField("vi_do", v)} placeholder="16.0544" />
            <div className="md:col-span-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-600">Ghi chú</span>
                <textarea
                  value={form.ghi_chu}
                  onChange={(e) => updateField("ghi_chu", e.target.value)}
                  placeholder="Nhập ghi chú cho vị trí..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {mode === "edit" ? "Cập nhật vị trí" : "Lưu vị trí"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SampleDetailModal({ open, location, onClose }) {
  if (!open || !location) return null;

  const chemicals = location.chemicals || [];

  return (
    <div className="fixed inset-0 z-[3200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Factory className="h-4 w-4" />
              Chi tiết vị trí và dữ liệu mẫu thử
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{location.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{location.dia_chi}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-auto p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500">Tên vị trí</div>
              <div className="mt-1 font-bold text-slate-900">{location.name}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500">Kinh độ</div>
              <div className="mt-1 font-mono font-bold text-slate-900">{location.kinh_do}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500">Vĩ độ</div>
              <div className="mt-1 font-mono font-bold text-slate-900">{location.vi_do}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm">
              <div className="text-xs text-slate-500">Số mẫu thử</div>
              <div className="mt-1 font-bold text-slate-900">{chemicals.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm md:col-span-4">
              <div className="text-xs text-slate-500">Ghi chú vị trí</div>
              <div className="mt-1 text-slate-900">{location.ghi_chu || "—"}</div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <FlaskConical className="h-5 w-5 text-blue-600" />
                Danh sách dữ liệu mẫu thử
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {chemicals.length} bản ghi
              </span>
            </div>

            {chemicals.length ? (
              <div className="space-y-4">
                {chemicals.map((chemical, index) => {
                  const risk = RISK_STYLE[chemical.risk] || RISK_STYLE.MEDIUM;
                  return (
                    <div key={chemical.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Mẫu thử #{index + 1}</div>
                          <div className="mt-1 text-lg font-bold text-slate-900">{chemical.name}</div>
                          <div className="mt-1 text-xs text-slate-500">CAS / mã nội bộ: {chemical.cas || "—"}</div>
                        </div>
                        <span className={cx("rounded-full border px-3 py-1 text-xs font-bold", risk.badge)}>
                          {risk.label}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Nồng độ đo được</div><div className="mt-1 font-bold text-slate-900">{chemical.concentration} {chemical.unit}</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Ngưỡng cảnh báo</div><div className="mt-1 font-bold text-slate-900">{chemical.threshold} {chemical.unit}</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Thời gian quan trắc</div><div className="mt-1 font-bold text-slate-900">{formatDateRange(chemical)}</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Người lấy mẫu</div><div className="mt-1 font-bold text-slate-900">{chemical.sampleCollector || "—"}</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Số điện thoại</div><div className="mt-1 font-bold text-slate-900">{chemical.samplePhone || "—"}</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Điều kiện gió</div><div className="mt-1 font-bold text-slate-900">{chemical.windDirection || "—"}, {chemical.windSpeed || "—"} m/s</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Nhiệt độ</div><div className="mt-1 font-bold text-slate-900">{chemical.temperature || "—"} °C</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">Độ ẩm</div><div className="mt-1 font-bold text-slate-900">{chemical.humidity || "—"} %</div></div>
                        <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">ID mẫu / kết quả</div><div className="mt-1 break-all text-xs font-semibold text-slate-700">Mẫu: {chemical.sampleId || "—"}<br />KQ: {chemical.resultId || "—"}</div></div>
                      </div>

                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                        <b>Ghi chú / khuyến nghị:</b> {chemical.note || "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Chưa có dữ liệu mẫu thử cho vị trí này.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function unwrapApiData(response) {
  return response?.data?.data ?? response?.data?.items ?? response?.data?.records ?? response?.data ?? response?.items ?? response?.records ?? response?.result ?? response;
}

function asArray(data) {
  const source = unwrapApiData(data);
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
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function getEntityId(item, fallbackPrefix) {
  return String(firstValue(item, ["id", "_id", "uuid", "code", "ma", "ma_dinh_danh"], `${fallbackPrefix}-${Date.now()}`));
}

function getLocationIdFromSample(item) {
  return String(firstValue(item, ["vi_tri_lay_mau_id", "id_vi_tri_lay_mau", "ma_vi_tri_lay_mau", "viTriLayMauId", "vi_tri_id", "locationId", "location_id", "id_vi_tri"], ""));
}

function getSampleIdFromResult(item) {
  return String(firstValue(item, ["mau_thu_id", "id_mau_thu", "ma_mau_thu", "mauThuId", "sampleId", "sample_id", "id_mau"], ""));
}

function getLocationIdFromResult(item) {
  return String(firstValue(item, ["vi_tri_lay_mau_id", "id_vi_tri_lay_mau", "ma_vi_tri_lay_mau", "viTriLayMauId", "vi_tri_id", "locationId", "location_id", "id_vi_tri"], ""));
}

function normalizeRisk(value, concentration, threshold) {
  const raw = String(value || "").trim().toUpperCase();
  if (RISK_STYLE[raw]) return raw;
  const viToRisk = {
    THAP: "LOW",
    "THẤP": "LOW",
    TRUNG_BINH: "MEDIUM",
    "TRUNG BÌNH": "MEDIUM",
    CAO: "HIGH",
    NGUY_CAP: "CRITICAL",
    "NGUY CẤP": "CRITICAL",
  };
  return viToRisk[raw] || getRiskFromValue(concentration, threshold);
}

function normalizeChemicalFromSampleAndResult(sample, result) {
  const concentration = parseResultNumber(firstValue(result, ["concentration", "nong_do", "gia_tri", "ket_qua", "resultValue", "value"], 0));
  const threshold = Number(firstValue(result, ["threshold", "nguong_canh_bao", "nguong", "limit", "gioi_han"], 0));
  const date = firstValue(sample, ["date", "ngay_quan_trac", "ngay_lay_mau", "thoi_gian_lay_mau", "created_at"], "");
  const startDate = firstValue(sample, ["startDate", "ngay_bat_dau", "tu_ngay"], "");
  const endDate = firstValue(sample, ["endDate", "ngay_ket_thuc", "den_ngay"], "");

  return {
    id: String(firstValue(result, ["id", "_id", "ma_ket_qua", "code"], firstValue(sample, ["id", "_id", "ma_mau", "ma_mau_thu", "code"], `CHEM-${Date.now()}`))),
    sampleId: String(firstValue(sample, ["id", "_id", "ma_mau", "ma_mau_thu", "code"], "")),
    resultId: String(firstValue(result, ["id", "_id", "ma_ket_qua", "code"], "")),
    name: firstValue(result, ["name", "ten_hoa_chat", "chi_tieu", "ten_chi_tieu", "chemicalName", "chemical_name"], firstValue(sample, ["ten_mau", "name"], "Hóa chất khác")),
    cas: firstValue(result, ["cas", "ma_cas", "ma_noi_bo"], ""),
    concentration,
    unit: firstValue(result, ["unit", "don_vi", "don_vi_tinh"], "ppm"),
    threshold,
    risk: normalizeRisk(firstValue(result, ["risk", "muc_rui_ro", "muc_do", "status"], ""), concentration, threshold),
    dateMode: startDate || endDate ? "range" : "single",
    date,
    startDate,
    endDate,
    windDirection: firstValue(sample, ["windDirection", "huong_gio"], "Đông Bắc"),
    windSpeed: Number(firstValue(sample, ["windSpeed", "toc_do_gio"], 0)),
    temperature: Number(firstValue(sample, ["temperature", "nhiet_do"], 0)),
    humidity: Number(firstValue(sample, ["humidity", "do_am"], 0)),
    sampleCollector: firstValue(sample, ["sampleCollector", "nguoi_lay_mau", "nguoi_thu_mau", "nguoi_lay", "collector"], ""),
    samplePhone: firstValue(sample, ["samplePhone", "so_dien_thoai", "sdt", "phone", "dien_thoai"], ""),
    note: firstValue(result, ["note", "ghi_chu", "khuyen_nghi"], firstValue(sample, ["ghi_chu", "note"], "")),
    rawSample: sample,
    rawResult: result,
  };
}

function normalizeChemical(item) {
  if (!item) return null;
  const concentration = parseResultNumber(firstValue(item, ["concentration", "nong_do", "gia_tri", "ket_qua"], 0));
  const threshold = Number(firstValue(item, ["threshold", "nguong_canh_bao", "nguong", "limit"], 0));
  return {
    id: String(firstValue(item, ["id", "_id", "ma_hoa_chat", "ma_ket_qua", "code"], `CHEM-${Date.now()}`)),
    sampleId: String(firstValue(item, ["sampleId", "mau_thu_id", "id_mau_thu", "ma_mau_thu"], "")),
    resultId: String(firstValue(item, ["resultId", "ket_qua_thu_nghiem_id", "id_ket_qua", "ma_ket_qua"], "")),
    name: firstValue(item, ["name", "ten_hoa_chat", "chemicalName", "chemical_name", "chi_tieu", "ten_chi_tieu"], "Hóa chất khác"),
    cas: firstValue(item, ["cas", "ma_cas", "ma_noi_bo"], ""),
    concentration,
    unit: firstValue(item, ["unit", "don_vi", "don_vi_tinh"], "ppm"),
    threshold,
    risk: normalizeRisk(firstValue(item, ["risk", "muc_rui_ro", "status"], ""), concentration, threshold),
    dateMode: firstValue(item, ["dateMode", "kieu_ngay"], firstValue(item, ["startDate", "ngay_bat_dau"], "") ? "range" : "single"),
    date: firstValue(item, ["date", "ngay_quan_trac", "ngay_lay_mau"], ""),
    startDate: firstValue(item, ["startDate", "ngay_bat_dau"], ""),
    endDate: firstValue(item, ["endDate", "ngay_ket_thuc"], ""),
    windDirection: firstValue(item, ["windDirection", "huong_gio"], "Đông Bắc"),
    windSpeed: Number(firstValue(item, ["windSpeed", "toc_do_gio"], 0)),
    temperature: Number(firstValue(item, ["temperature", "nhiet_do"], 0)),
    humidity: Number(firstValue(item, ["humidity", "do_am"], 0)),
    sampleCollector: firstValue(item, ["sampleCollector", "nguoi_lay_mau", "nguoi_thu_mau", "nguoi_lay", "collector"], ""),
    samplePhone: firstValue(item, ["samplePhone", "so_dien_thoai", "sdt", "phone", "dien_thoai"], ""),
    note: firstValue(item, ["note", "ghi_chu", "khuyen_nghi"], ""),
  };
}

function normalizeLocation(item, chemicals = []) {
  if (!item) return null;
  const inlineChemicals = item.chemicals ?? item.hoa_chat ?? item.chemical_records ?? item.chi_tiet_hoa_chat ?? [];
  const mergedChemicals = chemicals.length
    ? chemicals
    : Array.isArray(inlineChemicals)
      ? inlineChemicals.map(normalizeChemical).filter(Boolean)
      : [];

  return {
    id: String(firstValue(item, ["id", "_id", "ma_vi_tri", "ma_vi_tri_lay_mau", "code"], `LOC-${Date.now()}`)),
    name: firstValue(item, ["name", "ten_vi_tri", "ten_vi_tri_lay_mau", "ten"], "Chưa đặt tên"),
    dia_chi: firstValue(item, ["dia_chi", "dia_chi", "dia_diem", "vi_tri"], "Chưa nhập địa điểm"),
    kinh_do: Number(firstValue(item, ["kinh_do", "kinh_do", "lng", "lon"], 0)),
    vi_do: Number(firstValue(item, ["vi_do", "vi_do", "lat"], 0)),
    status: firstValue(item, ["status", "trang_thai"], "ACTIVE"),
    ghi_chu: firstValue(item, ["ghi_chu", "note", "mo_ta", "description"], ""),
    raw: item,
    chemicals: mergedChemicals,
  };
}

function buildLocationsFromApi(taResponse, mtResponse, kqtResponse) {
  const locations = asArray(taResponse);
  const samples = asArray(mtResponse);
  const results = asArray(kqtResponse);

  const samplesById = new Map(samples.map((sample) => [String(firstValue(sample, ["id", "_id", "ma_mau", "ma_mau_thu", "code"], "")), sample]));
  const samplesByLocation = new Map();
  samples.forEach((sample) => {
    const locationId = getLocationIdFromSample(sample);
    if (!locationId) return;
    if (!samplesByLocation.has(locationId)) samplesByLocation.set(locationId, []);
    samplesByLocation.get(locationId).push(sample);
  });

  const resultsBySample = new Map();
  const resultsByLocation = new Map();
  results.forEach((result) => {
    const sampleId = getSampleIdFromResult(result);
    if (sampleId) {
      if (!resultsBySample.has(sampleId)) resultsBySample.set(sampleId, []);
      resultsBySample.get(sampleId).push(result);
    }
    const locationId = getLocationIdFromResult(result);
    if (locationId) {
      if (!resultsByLocation.has(locationId)) resultsByLocation.set(locationId, []);
      resultsByLocation.get(locationId).push(result);
    }
  });

  return locations.map((location) => {
    const locationId = String(firstValue(location, ["id", "_id", "ma_vi_tri", "ma_vi_tri_lay_mau", "code"], ""));
    const locationSamples = samplesByLocation.get(locationId) || [];
    const chemicals = [];

    locationSamples.forEach((sample) => {
      const sampleId = String(firstValue(sample, ["id", "_id", "ma_mau", "ma_mau_thu", "code"], ""));
      const sampleResults = resultsBySample.get(sampleId) || [];
      if (sampleResults.length) {
        sampleResults.forEach((result) => chemicals.push(normalizeChemicalFromSampleAndResult(sample, result)));
      } else {
        chemicals.push(normalizeChemicalFromSampleAndResult(sample, {}));
      }
    });

    (resultsByLocation.get(locationId) || []).forEach((result) => {
      const sampleId = getSampleIdFromResult(result);
      const sample = samplesById.get(sampleId) || {};
      const resultId = String(firstValue(result, ["id", "_id", "ma_ket_qua", "code"], ""));
      if (!chemicals.some((item) => item.resultId === resultId && resultId)) {
        chemicals.push(normalizeChemicalFromSampleAndResult(sample, result));
      }
    });

    return normalizeLocation(location, chemicals);
  }).filter(Boolean);
}

function toLocationPayload(form, currentRaw = {}) {
  const vi_do = Number(form.vi_do);
  const kinh_do = Number(form.kinh_do);
  const name = form.ten_vi_tri.trim();
  const address = form.dia_chi.trim();
  const note = form.ghi_chu?.trim() || "";

  return {
    ...currentRaw,
    ten_vi_tri: name,
    dia_chi: address,
    kinh_do,
    vi_do,
    ghi_chu: note,
    note,
    // status: firstValue(currentRaw, ["status", "trang_thai"], "ACTIVE"),
    // trang_thai: firstValue(currentRaw, ["trang_thai", "status"], "ACTIVE"),
  };
}

function toLocationForm(location) {
  return {
    ten_vi_tri: location?.name || "",
    dia_chi: location?.dia_chi || "",
    kinh_do: location?.kinh_do ?? "",
    vi_do: location?.vi_do ?? "",
    ghi_chu: location?.ghi_chu || location?.raw?.ghi_chu || location?.raw?.note || "",
  };
}

function toDateOnly(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function generateCustomerSampleCode() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `BE${stamp}`;
}

function buildResultJson(rows) {
  const validRows = rows?.length ? rows : [];
  return JSON.stringify(
    validRows
      .filter((row) => row.testIndicator?.trim() || row.resultValue !== "")
      .map((row, index) => ({
        lan_do: index + 1,
        ten_chi_tieu: row.testIndicator?.trim?.() || "",
        don_vi_tinh: row.unitKyHieu || row.unit || "",
        ket_qua: row.resultValue === "" ? null : Number(row.resultValue || 0),
        sai_so: row.uncertainty === "" ? null : Number(row.uncertainty || 0),
        nguoi_thu_nghiem: row.tester?.trim?.() || "",
        ghi_chu: row.note?.trim?.() || "",
      }))
  );
}

function parseResultNumber(value) {
  if (value && typeof value === "object") {
    return Number(firstValue(value, ["ket_qua", "gia_tri", "resultValue", "value"], 0));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseResultNumber(parsed[0]);
      return parseResultNumber(parsed);
    } catch {
      return Number(trimmed || 0);
    }
  }

  return Number(value || 0);
}

function toCheckSamplePayload(form, locationId) {
  const rows = form.measurementRows?.length ? form.measurementRows : [];
  const firstTester = rows.find((row) => row.tester?.trim())?.tester?.trim() || form.tester?.trim?.() || form.sampleCollector?.trim?.() || "";
  const sampleCode = generateCustomerSampleCode();
  const sampleTypeId = form.sampleTypeId || null;
  const sampleAreaId = form.sampleAreaId || null;
  const maLoai = form.sampleTypeMaLoai || sampleTypeId || "";
  const kyHieu = form.sampleAreaKyHieu || sampleAreaId || "";

  return {
    vi_tri_id: locationId,
    ma_mau_khach_hang: sampleCode,
    loai_mau_so_hieu: form.sampleType || "",

    // Loại mẫu: ưu tiên gửi ma_loai; nếu API loại mẫu không có ma_loai thì gửi id để BE xử lý.
    loai_mau_id: sampleTypeId,
    id_loai_mau: sampleTypeId,
    ma_loai: maLoai,
    loai_mau_ma_loai: form.sampleTypeMaLoai || "",
    loai_mau_ky_hieu: form.sampleTypeKyHieu || "",

    // Khu vực lấy mẫu: ưu tiên gửi ky_hieu; nếu API khu vực không có ky_hieu thì gửi id để BE xử lý.
    khu_vuc_lay_mau_id: sampleAreaId,
    khu_vuc_id: sampleAreaId,
    id_khu_vuc_lay_mau: sampleAreaId,
    khu_vuc_lay_mau: form.sampleAreaName || "",
    ky_hieu: kyHieu,
    khu_vuc_ma_loai: form.sampleAreaMaLoai || "",
    khu_vuc_ky_hieu: form.sampleAreaKyHieu || "",

    // Đối tượng đã chọn ở bước 2.
    doi_tuong: form.objectType || "",
    objectType: form.objectType || "",
    doi_tuong_kiem_tra: form.objectType || "",

    ngay_bat_dau: toDateOnly(form.observationStartTime),
    ngay_ket_thuc: toDateOnly(form.observationEndTime || form.observationStartTime),
    nguoi_thu_nghiem: firstTester,
    ket_qua: buildResultJson(rows),
    ghi_chu: form.note?.trim?.() || "",
  };
}
function toSamplePayload(form, locationId) {
  const sampleTime = form.observationStartTime || form.observationTime || form.date || "";
  const sampleAreaName = form.sampleAreaName || form.sampleAreaId || "";

  return {
    vi_tri_lay_mau_id: locationId,
    id_vi_tri_lay_mau: locationId,
    viTriLayMauId: locationId,
    vi_tri_id: locationId,
    locationId,

    loai_mau: form.sampleType,
    sampleType: form.sampleType,
    khu_vuc_lay_mau_id: form.sampleAreaId || null,
    khu_vuc_id: form.sampleAreaId || null,
    sampleAreaId: form.sampleAreaId || null,
    khu_vuc_lay_mau: sampleAreaName,
    ten_khu_vuc: sampleAreaName,
    sampleAreaName,
    doi_tuong: form.objectType,
    objectType: form.objectType,

    name: `Mẫu ${form.sampleType || ""} ${sampleTime || ""}`.trim(),
    ten_mau: `Mẫu ${form.sampleType || ""} ${sampleTime || ""}`.trim(),
    ma_mau: `M-${Date.now()}`,
    date: sampleTime,
    ngay_lay_mau: sampleTime,
    ngay_quan_trac: sampleTime,
    thoi_gian_lay_mau: sampleTime,
    thoi_gian_tu: form.startDate,
    thoi_gian_den: form.observationEndTime || null,
    dateMode: form.dateMode,
    kieu_ngay: form.dateMode,
    startDate: form.startDate,
    ngay_bat_dau: form.startDate,
    endDate: form.observationEndTime || "",
    ngay_ket_thuc: form.observationEndTime || "",

    windDirection: form.windDirection,
    huong_gio: form.windDirection,
    windSpeed: Number(form.windSpeed || 0),
    toc_do_gio: Number(form.windSpeed || 0),
    temperature: Number(form.temperature || 0),
    nhiet_do: Number(form.temperature || 0),
    humidity: Number(form.humidity || 0),
    do_am: Number(form.humidity || 0),

    sampleCollector: form.sampleCollector || form.tester || "",
    nguoi_lay_mau: form.sampleCollector || form.tester || "",
    nguoi_thu_mau: form.sampleCollector || form.tester || "",
    samplePhone: form.samplePhone || "",
    so_dien_thoai: form.samplePhone || "",
    sdt: form.samplePhone || "",
    note: form.note.trim(),
    ghi_chu: form.note.trim(),
  };
}

function toResultPayload(form, locationId, sampleId, measurement = null) {
  const row = measurement || form;
  const indicator = row.testIndicator || form.testIndicator || form.chemicalName;
  const resultValue = row.resultValue ?? form.resultValue ?? form.concentration;

  return {
    vi_tri_lay_mau_id: locationId,
    id_vi_tri_lay_mau: locationId,
    vi_tri_id: locationId,
    locationId,
    mau_thu_id: sampleId,
    id_mau_thu: sampleId,
    mauThuId: sampleId,
    sampleId,

    name: indicator,
    ten_hoa_chat: indicator,
    ten_chi_tieu: indicator,
    chi_tieu: indicator,
    testIndicator: indicator,

    cas: form.cas?.trim?.() || "",
    ma_cas: form.cas?.trim?.() || "",
    concentration: Number(resultValue || 0),
    nong_do: Number(resultValue || 0),
    gia_tri: Number(resultValue || 0),
    ket_qua: Number(resultValue || 0),
    resultValue: Number(resultValue || 0),

    sai_so: row.uncertainty === "" ? null : Number(row.uncertainty || 0),
    uncertainty: row.uncertainty === "" ? null : Number(row.uncertainty || 0),
    nguoi_thu_nghiem: row.tester?.trim?.() || "",
    tester: row.tester?.trim?.() || "",

    unit: row.unit || form.unit,
    don_vi: row.unit || form.unit,
    don_vi_tinh: row.unit || form.unit,
    threshold: Number(form.threshold || 0),
    nguong_canh_bao: Number(form.threshold || 0),
    risk: form.risk,
    muc_rui_ro: form.risk,
    doi_tuong: form.objectType,
    objectType: form.objectType,
    note: row.note?.trim?.() || form.note?.trim?.() || "",
    ghi_chu: row.note?.trim?.() || form.note?.trim?.() || "",
  };
}


function toMauThuPayload(checkId, row, form) {
  const unitSymbol = row.unitKyHieu || row.unit || "";
  const resultJson = {
    ten_chi_tieu: row.testIndicator?.trim?.() || "",
    don_vi_tinh: unitSymbol,
    ket_qua: row.resultValue === "" ? null : Number(row.resultValue || 0),
    sai_so: row.uncertainty === "" ? null : Number(row.uncertainty || 0),
    nguoi_thu_nghiem: row.tester?.trim?.() || "",
    ghi_chu: row.note?.trim?.() || form.note?.trim?.() || "",
  };

  return {
    kiem_tra_id: checkId,
    ten_chi_tieu: resultJson.ten_chi_tieu,
    don_vi_tinh: unitSymbol,
    don_vi_ky_hieu: unitSymbol,
    ky_hieu: unitSymbol,
    ket_qua: resultJson.ket_qua,
    sai_so: resultJson.sai_so,
    nguoi_thu_nghiem: resultJson.nguoi_thu_nghiem,
    ghi_chu: resultJson.ghi_chu,
    deleted: 0,
  };
}

async function getTaWithSearch(searchText = "") {
  const keyword = searchText.trim();
  try {
    return await getTa({ searchText: keyword });
  } catch (error) {
    return keyword ? getTa(keyword) : getTa();
  }
}

async function getMtByLocation(locationId) {
  try {
    return await getMT({ vi_tri_lay_mau_id: locationId, id_vi_tri_lay_mau: locationId, locationId });
  } catch (error) {
    try {
      return await getMT(locationId);
    } catch (innerError) {
      return getMT();
    }
  }
}

async function getKqtByLocation() {
  // Không còn bảng ket_qua_thu_nghiem. Giữ hàm này trả mảng rỗng để không phá các chỗ gọi cũ.
  return [];
}

function buildChemicalsForLocation(location, mtResponse) {
  if (!location) return [];
  const locationId = String(location.id || "");
  const samples = asArray(mtResponse).filter((sample) => {
    const sampleLocationId = getLocationIdFromSample(sample);
    return !sampleLocationId || sampleLocationId === locationId;
  });

  return samples.map((sample) => normalizeChemicalFromSampleAndResult(sample, sample));
}

export default function ChemicalMonitoringDashboard() {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingChemicals, setLoadingChemicals] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [notification, setNotification] = useState(null);
  const [currentUser] = useState(() => getStoredUser());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [selectedId, setSelectedId] = useState("");
  const [locationForm, setLocationForm] = useState(emptyLocationForm);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState("create");
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [chemicalForm, setChemicalForm] = useState(emptyChemicalForm);
  const [chemicalModalOpen, setChemicalModalOpen] = useState(false);
  const [chemicalTargetLocationId, setChemicalTargetLocationId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLocationId, setDetailLocationId] = useState(null);
  const [search, setSearch] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [pickedMapCenter, setPickedMapCenter] = useState(null);
  const [sampleAreaOptions, setSampleAreaOptions] = useState([]);
  const [sampleTypeOptions, setSampleTypeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [timeOptions, setTimeOptions] = useState([]);
  const [mapSourceKey, setMapSourceKey] = useState(() => {
    try {
      const cached = window.localStorage.getItem(MAP_SOURCE_KEY);
      return MAP_SOURCES[cached] ? cached : DEFAULT_MAP_SOURCE;
    } catch {
      return DEFAULT_MAP_SOURCE;
    }
  });
  const mapRef = useRef(null);

  const loadRecords = useCallback(async (searchText = search) => {
    setLoadingRecords(true);
    setApiError("");
    try {
      console.log("Loading TA records with search:", searchText);
      const taResponse = await getTaWithSearch(searchText);
      console.log("Raw TA response:", taResponse);
      const locations = asArray(taResponse.data).map((item) => normalizeLocation(item, [])).filter(Boolean);
      setRecords(locations);
      setSelectedId((current) => (locations.some((item) => item.id === current) ? current : locations[0]?.id || ""));
    } catch (error) {
      console.error("Không tải được danh sách vị trí lấy mẫu từ API:", error);
      setApiError("Không tải được danh sách vị trí lấy mẫu từ API.");
      setRecords([]);
      setSelectedId("");
    } finally {
      setLoadingRecords(false);
    }
  }, [search]);

  const loadChemicalsForLocation = useCallback(async (locationId) => {
    if (!locationId) return;
    const current = records.find((item) => item.id === locationId);
    if (!current) return;

    setLoadingChemicals(true);
    setApiError("");
    try {
      const [detailResponse, mtResponse] = await Promise.all([
        getTaById(locationId).catch(() => null),
        getMtByLocation(locationId),
      ]);
      const detail = detailResponse ? normalizeLocation(unwrapApiData(detailResponse), current.chemicals || []) : current;
      const baseLocation = detail || current;
      const chemicals = buildChemicalsForLocation(baseLocation, mtResponse);
      setRecords((prev) =>
        prev.map((item) =>
          item.id === locationId
            ? { ...item, ...baseLocation, chemicals, chemicalsLoaded: true }
            : item
        )
      );
    } catch (error) {
      console.error("Không tải được mẫu thử/kết quả thử nghiệm của vị trí:", error);
      setApiError("Không tải được danh sách hóa chất của vị trí đang chọn.");
      setRecords((prev) => prev.map((item) => (item.id === locationId ? { ...item, chemicalsLoaded: true } : item)));
    } finally {
      setLoadingChemicals(false);
    }
  }, [records]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRecords(search);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, loadRecords]);

  useEffect(() => {
    if (!selectedId) return;
    const current = records.find((item) => item.id === selectedId);
    if (!current || current.chemicalsLoaded) return;
    loadChemicalsForLocation(selectedId);
  }, [selectedId, records, loadChemicalsForLocation]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MAP_SOURCE_KEY, mapSourceKey);
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage.
    }
  }, [mapSourceKey]);

  useEffect(() => {
    async function loadStepOptions() {
      try {
        const [dvtResponse, kvlResponse, lmResponse, ktmResponse] = await Promise.all([
          getDVT().catch(() => []),
          getKVL().catch(() => []),
          getLM().catch(() => []),
          getKTM().catch(() => []),
        ]);
        // console.log("DVT response:", dvtResponse);
        // console.log("KVL response:", kvlResponse);
        // console.log("LM response:", lmResponse);
        // console.log("KTM response:", ktmResponse);
        const units = asArray(dvtResponse.data).map((item) => {
          const id = String(firstValue(item, ["id", "_id", "ma_don_vi", "code"], ""));
          const symbol = firstValue(item, ["ky_hieu", "symbol", "unit", "ma_don_vi"], "");
          const name = firstValue(item, ["ten_don_vi", "name", "ten", "label"], symbol || "Chưa đặt tên");
          return {
            id: id || symbol || name,
            value: symbol || name,
            label: symbol ? `${name} (${symbol})` : name,
            ky_hieu: symbol,
            raw: item,
          };
        }).filter((item) => item.value);
        setUnitOptions(units);

        const areas = asArray(kvlResponse.data).map((item) => {
          const id = String(firstValue(item, ["id", "_id", "ma_khu_vuc", "code"], ""));
          const maLoai = firstValue(item, ["ma_loai", "ma_khu_vuc", "code", "ma"], "");
          const kyHieu = firstValue(item, ["ky_hieu", "symbol", "code"], maLoai);
          const name = firstValue(item, ["ten_khu_vuc", "name", "ten", "label"], "Chưa đặt tên");
          return {
            id,
            name,
            code: kyHieu || maLoai,
            ma_loai: maLoai,
            ky_hieu: kyHieu,
            note: firstValue(item, ["ghi_chu", "note", "mo_ta"], ""),
            raw: item,
          };
        }).filter((item) => item.id || item.name);
        setSampleAreaOptions(areas);

        const types = asArray(lmResponse).map((item) => {
          const id = String(firstValue(item, ["id", "_id", "ma_loai_mau", "code"], ""));
          const name = firstValue(item, ["ten_loai", "loai_mau", "name", "ten", "label"], "");
          const maLoai = firstValue(item, ["ma_loai", "ma_loai_mau", "code", "ma"], "");
          const kyHieu = firstValue(item, ["ky_hieu", "symbol", "code"], maLoai);
          return {
            id: id || maLoai || kyHieu || name,
            value: name || kyHieu || maLoai,
            label: kyHieu ? `${name || kyHieu} (${kyHieu})` : name,
            ma_loai: maLoai,
            ky_hieu: kyHieu,
            raw: item,
          };
        }).filter((item) => item.value);
        // console.log("Sample type options:", types);
        setSampleTypeOptions(types);

        const checks = asArray(ktmResponse.data);
        const times = checks
          .map((item) => firstValue(item, ["thoi_gian_lay_mau", "thoi_gian", "ngay_kiem_tra", "ngay_lay_mau", "date", "created_at"], ""))
          .filter(Boolean)
          .map((item) => String(item).slice(0, 10));
        setTimeOptions(Array.from(new Set(times)));
      } catch (error) {
        console.warn("Không tải được dữ liệu danh mục cho quy trình nhập mẫu:", error);
      }
    }

    loadStepOptions();
  }, []);

  const selectedRecord = useMemo(
    () => records.find((item) => item.id === selectedId) || records[0] || null,
    [records, selectedId]
  );

  const selectedChemical = getMainChemical(selectedRecord);
  const displayUserName = getDisplayUserName(currentUser);
  const displayUserRole = currentUser?.role || currentUser?.vai_tro || currentUser?.chuc_vu || currentUser?.username || "Tài khoản hệ thống";
  const displayUserEmail = currentUser?.email || currentUser?.mail || "";

  const chemicalTargetLocation = useMemo(
    () => records.find((item) => item.id === chemicalTargetLocationId) || null,
    [records, chemicalTargetLocationId]
  );

  const detailTargetLocation = useMemo(
    () => records.find((item) => item.id === detailLocationId) || null,
    [records, detailLocationId]
  );

  const summary = useMemo(() => {
    const allChemicals = records.flatMap((item) => item.chemicals || []);
    const critical = allChemicals.filter((item) => item.risk === "CRITICAL").length;
    const overThreshold = allChemicals.filter(
      (item) => Number(item.concentration) >= Number(item.threshold)
    ).length;
    const avg = allChemicals.length
      ? allChemicals.reduce((sum, item) => sum + Number(item.concentration || 0), 0) / allChemicals.length
      : 0;

    return {
      totalLocations: records.length,
      totalChemicals: allChemicals.length,
      critical,
      overThreshold,
      avg: avg.toFixed(1),
    };
  }, [records]);

  const mapCenter = pickedMapCenter || (selectedRecord
    ? [selectedRecord.vi_do, selectedRecord.kinh_do]
    : DA_NANG_CENTER);

  const activeMapSource = MAP_SOURCES[mapSourceKey] || MAP_SOURCES[DEFAULT_MAP_SOURCE];

  function showNotification(type, message) {
    setNotification({ type, message });
  }

  function showModalNotification(type, message) {
    setNotification({ type, message, scope: "modal" });
  }

  function showLocationModalNotification(type, message) {
    setNotification({ type, message, scope: "location-modal" });
  }

  function updateLocationForm(key, value) {
    setLocationForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateLocationForm() {
    const vi_do = Number(locationForm.vi_do);
    const kinh_do = Number(locationForm.kinh_do);

    if (!locationForm.ten_vi_tri.trim()) {
      if (locationModalOpen) showLocationModalNotification("error", "Vui lòng nhập tên vị trí.");
      else showNotification("error", "Vui lòng nhập tên vị trí.");
      return false;
    }

    if (!locationForm.dia_chi.trim()) {
      if (locationModalOpen) showLocationModalNotification("error", "Vui lòng nhập địa điểm / địa chỉ.");
      else showNotification("error", "Vui lòng nhập địa điểm / địa chỉ.");
      return false;
    }

    if (!Number.isFinite(kinh_do)) {
      if (locationModalOpen) showLocationModalNotification("error", "Vui lòng nhập kinh độ hợp lệ.");
      else showNotification("error", "Vui lòng nhập kinh độ hợp lệ.");
      return false;
    }

    if (!Number.isFinite(vi_do)) {
      if (locationModalOpen) showLocationModalNotification("error", "Vui lòng nhập vĩ độ hợp lệ.");
      else showNotification("error", "Vui lòng nhập vĩ độ hợp lệ.");
      return false;
    }

    return true;
  }

  function validateChemicalForm() {
    if (!chemicalForm.sampleType) {
      showModalNotification("error", "Vui lòng chọn loại mẫu.");
      return false;
    }


    if (!chemicalForm.sampleAreaId) {
      showModalNotification("error", "Vui lòng chọn khu vực lấy mẫu từ danh sách API.");
      return false;
    }

    if (!chemicalForm.observationStartTime) {
      showModalNotification("error", "Vui lòng chọn ngày bắt đầu.");
      return false;
    }

    if (!chemicalForm.objectType) {
      showModalNotification("error", "Vui lòng chọn đối tượng PX hoặc HH.");
      return false;
    }

    const rows = chemicalForm.measurementRows?.length ? chemicalForm.measurementRows : [];
    if (!rows.length) {
      showModalNotification("error", "Vui lòng nhập ít nhất một lượt đo.");
      return false;
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row.testIndicator?.trim()) {
        showModalNotification("error", `Vui lòng nhập tên chỉ tiêu thử nghiệm ở lượt đo #${index + 1}.`);
        return false;
      }
      if (!row.unit) {
        showModalNotification("error", `Vui lòng chọn đơn vị tính ở lượt đo #${index + 1}.`);
        return false;
      }
      if (row.resultValue === "") {
        showModalNotification("error", `Vui lòng nhập kết quả thử nghiệm ở lượt đo #${index + 1}.`);
        return false;
      }
    }

    return true;
  }

  function openCreateLocationModal(coord = null) {
    setLocationModalMode("create");
    setEditingLocationId(null);
    setLocationForm({
      ...emptyLocationForm,
      vi_do: coord?.vi_do || "",
      kinh_do: coord?.kinh_do || "",
    });
    setLocationModalOpen(true);
  }

  async function openEditLocationModal(locationId) {
    const current = records.find((item) => item.id === locationId);
    setLocationModalMode("edit");
    setEditingLocationId(locationId);
    setLocationForm(toLocationForm(current));
    setLocationModalOpen(true);

    try {
      const response = await getTaById(locationId);
      const detail = normalizeLocation(unwrapApiData(response), current?.chemicals || []);
      if (detail) {
        setLocationForm(toLocationForm(detail));
        setRecords((prev) => prev.map((item) => (item.id === locationId ? { ...item, ...detail, chemicals: item.chemicals } : item)));
      }
    } catch (error) {
      console.warn("Không lấy được chi tiết điểm lấy mẫu trước khi sửa:", error);
    }
  }

  async function handleSubmitLocation(e) {
    e.preventDefault();
    if (!validateLocationForm()) return;

    setSaving(true);
    setApiError("");
    try {
      if (locationModalMode === "edit" && editingLocationId) {
        const current = records.find((item) => item.id === editingLocationId);
        await updateTa(editingLocationId, toLocationPayload(locationForm, current?.raw || {}));
        await loadRecords(search);
        setSelectedId(editingLocationId);
        showLocationModalNotification("success", "Cập nhật vị trí thành công.");
        window.setTimeout(() => {
          setLocationModalOpen(false);
          setEditingLocationId(null);
          setLocationForm(emptyLocationForm);
          setNotification(null);
        }, 900);
        return;
      }

      const response = await createTa(toLocationPayload(locationForm));
      const createdData = unwrapApiData(response);
      const created = normalizeLocation(createdData);
      const createdId = created?.id || String(firstValue(createdData, ["id", "_id", "ma_vi_tri", "ma_vi_tri_lay_mau", "code"], ""));
      await loadRecords(search);
      showLocationModalNotification("success", "Lưu vị trí thành công.");
      window.setTimeout(async () => {
        setLocationForm(emptyLocationForm);
        setLocationModalOpen(false);
        setNotification(null);
        if (createdId) {
          setSelectedId(createdId);
          await openChemicalModal(createdId);
        }
      }, 900);
    } catch (error) {
      console.error("Không lưu được điểm lấy mẫu qua API:", error);
      setApiError("Không lưu được điểm lấy mẫu qua API. Dữ liệu không được ghi giả trên giao diện.");
      showLocationModalNotification("error", "Không lưu được điểm lấy mẫu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLocation(e) {
    e.preventDefault();
    if (!validateLocationForm()) return;

    setSaving(true);
    setApiError("");
    try {
      const response = await createTa(toLocationPayload(locationForm));
    
      const createdData = unwrapApiData(response);
      const created = normalizeLocation(createdData);
      const createdId = created?.id || String(firstValue(createdData, ["id", "_id", "ma_vi_tri", "ma_vi_tri_lay_mau", "code"], ""));
      await loadRecords(search);
      setLocationForm(emptyLocationForm);
      showNotification("success", "Lưu vị trí thành công.");
      if (createdId) {
        setSelectedId(createdId);
        await openChemicalModal(createdId);
      }
    } catch (error) {
      console.error("Không tạo được điểm lấy mẫu qua API:", error);
      setApiError("Không lưu được điểm lấy mẫu lên API. Dữ liệu trên giao diện không dùng fake hoặc localStorage.");
      showNotification("error", "Không lưu được điểm lấy mẫu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function openDetailModal(locationId) {
    setDetailLocationId(locationId);
    setDetailModalOpen(true);
    await loadChemicalsForLocation(locationId);
  }

  async function openChemicalModal(locationId) {
    // conssole.log("Opening chemical modal for location ID:", locationId);
    setChemicalTargetLocationId(locationId);
    setChemicalForm(emptyChemicalForm);
    setChemicalModalOpen(true);

    try {
      const response = await getTaById(locationId);
      const detail = normalizeLocation(unwrapApiData(response));
      if (detail) {
        setRecords((prev) => prev.map((item) => (item.id === locationId ? { ...item, ...detail, chemicals: item.chemicals } : item)));
      }
    } catch (error) {
      console.warn("Không lấy được chi tiết vị trí lấy mẫu:", error);
    }
  }

  async function handleAddChemical(e) {
    // conssole.log("Submitting chemical form for location ID:", chemicalTargetLocationId, "with form data:", chemicalForm);
    e.preventDefault();
    if (!chemicalTargetLocationId) return;

    if (!validateChemicalForm()) return;

    setSaving(true);
    setApiError("");
    try {
      const checkResponse = await createKTM(toCheckSamplePayload(chemicalForm, chemicalTargetLocationId));
      // conssole.log("Check sample response:", checkResponse);
      const checkData = unwrapApiData(checkResponse);
      const checkId = String(firstValue(checkData, ["id", "_id", "ma_kiem_tra", "code"], ""));

      const mauThuPayloads = (chemicalForm.measurementRows?.length ? chemicalForm.measurementRows : [{ ...emptyMeasurementRow }])
        .map((row) => toMauThuPayload(checkId, row, chemicalForm));

      await createMT(mauThuPayloads);

      await loadRecords(search);
      setSelectedId(chemicalTargetLocationId);
      setChemicalModalOpen(false);
      setChemicalTargetLocationId(null);
      setChemicalForm(emptyChemicalForm);
      showModalNotification("success", "Lưu kiểm tra mẫu và các mẫu thử thành công.");
    } catch (error) {
      console.error("Không lưu được kiểm tra mẫu/mẫu thử/kết quả thử nghiệm qua API:", error);
      setApiError("Không lưu được kiểm tra mẫu, mẫu thử hoặc kết quả thử nghiệm lên API.");
      showModalNotification("error", "Không lưu được kết quả thử nghiệm. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function removeLocation(id) {
    const ok = window.confirm("Bạn có chắc muốn xóa vị trí này không?");
    if (!ok) return;

    setSaving(true);
    setApiError("");
    try {
      await removeTa(id);
      await loadRecords(search);
    } catch (error) {
      console.error("Không xóa được vị trí qua API:", error);
      setApiError("Không xóa được vị trí trên API. Dữ liệu hiển thị được giữ theo lần tải API gần nhất.");
    } finally {
      setSaving(false);
    }
  }

  async function removeChemical(chemical) {
    const ok = window.confirm("Bạn có chắc muốn xóa mẫu thử/kết quả này không?");
    if (!ok) return;

    setSaving(true);
    setApiError("");
    try {
      if (chemical.sampleId) await removeMT(chemical.sampleId);
      await loadRecords(search);
    } catch (error) {
      console.error("Không xóa được mẫu thử/kết quả thử nghiệm qua API:", error);
      setApiError("Không xóa được mẫu thử hoặc kết quả thử nghiệm trên API.");
    } finally {
      setSaving(false);
    }
  }

  async function changeLocationStatus(id, status) {
    setSaving(true);
    setApiError("");
    try {
      const current = records.find((item) => item.id === id);
      await updateTa(id, {
        ...(current?.raw || {}),
        status,
        trang_thai: status,
      });
      await loadRecords(search);
    } catch (error) {
      console.error("Không cập nhật được trạng thái vị trí:", error);
      setApiError("Không cập nhật được trạng thái vị trí trên API.");
    } finally {
      setSaving(false);
    }
  }

  function focusCurrentLocation() {
    const map = mapRef.current;
    if (!map || !selectedRecord) return;

    map.flyTo([selectedRecord.vi_do, selectedRecord.kinh_do], 15, {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.2,
    });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-left shadow-sm transition hover:bg-slate-50"
                title="Thông tin cá nhân"
              >
                <UserCircle className="h-6 w-6 text-blue-600" />
                <div className="hidden sm:block">
                  <div className="max-w-[180px] truncate text-sm font-bold text-slate-900">{displayUserName}</div>
                  <div className="max-w-[180px] truncate text-xs text-slate-500">{displayUserRole}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute left-0 top-14 z-[1200] w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                        <UserCircle className="h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">{displayUserName}</div>
                        <div className="truncate text-xs text-slate-500">{displayUserEmail || displayUserRole}</div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                      <div><b>Vai trò:</b> {displayUserRole}</div>
                      {displayUserEmail && <div><b>Email:</b> {displayUserEmail}</div>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
                Phần mềm theo dõi nồng độ hóa chất
              </h1>
              <p className="text-sm text-slate-500">
                Xác định vị trí trước, sau đó nhập thông tin hóa chất theo từng địa điểm.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mapSourceKey}
              onChange={(e) => {
                setMapReady(false);
                setMapSourceKey(e.target.value);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              title="Chọn bản đồ online/offline"
            >
              {Object.values(MAP_SOURCES).map((source) => (
                <option key={source.key} value={source.key}>
                  Bản đồ: {source.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={focusCurrentLocation}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Crosshair className="h-4 w-4" />
              Tới vị trí đang chọn
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(records, null, 2)], {
                  type: "application/json;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "du-lieu-theo-doi-hoa-chat.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            >
              Xuất dữ liệu
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {(loadingRecords || loadingChemicals || saving || apiError) && (
        <div className="border-b border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          {loadingRecords && <span className="font-semibold text-blue-700">Đang tải vị trí lấy mẫu từ API...</span>}
          {!loadingRecords && loadingChemicals && <span className="font-semibold text-blue-700">Đang tải mẫu thử và hóa chất của vị trí đang chọn...</span>}
          {!loadingRecords && !loadingChemicals && saving && <span className="font-semibold text-blue-700">Đang đồng bộ dữ liệu...</span>}
          {apiError && <span className="ml-2 font-semibold text-amber-700">{apiError}</span>}
        </div>
      )}

      <main className="grid min-h-[calc(100vh-89px)] gap-4 p-4 2xl:grid-cols-[340px_minmax(760px,1fr)_390px] xl:grid-cols-[320px_minmax(640px,1fr)_360px]">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={MapPin} label="Vị trí" value={summary.totalLocations} helper="Điểm theo dõi" />
            <StatCard icon={FlaskConical} label="Hóa chất" value={summary.totalChemicals} helper="Lượt nhập" />
            <StatCard icon={ShieldAlert} label="Vượt ngưỡng" value={summary.overThreshold} helper="Cần xử lý" />
            <StatCard icon={AlertTriangle} label="Nguy cấp" value={summary.critical} helper="Ưu tiên cao" />
          </div>

          <form onSubmit={handleAddLocation} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Thêm vị trí</h2>
                <p className="text-xs text-slate-500">
                  Chỉ nhập thông tin vị trí khi chưa có. Sau khi lưu sẽ mở modal nhập hóa chất.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Bước 1
              </span>
            </div>

            <div className="space-y-3">
              <TextInput required label="Tên vị trí" value={locationForm.ten_vi_tri} onChange={(v) => updateLocationForm("ten_vi_tri", v)} placeholder="VD: Kho hóa chất A" />
              <TextInput required label="Địa điểm / địa chỉ" value={locationForm.dia_chi} onChange={(v) => updateLocationForm("dia_chi", v)} placeholder="VD: KCN Hòa Khánh, Đà Nẵng" />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput required label="Kinh độ" value={locationForm.kinh_do} onChange={(v) => updateLocationForm("kinh_do", v)} placeholder="108.2022" />
                <NumberInput required label="Vĩ độ" value={locationForm.vi_do} onChange={(v) => updateLocationForm("vi_do", v)} placeholder="16.0544" />
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-600">Ghi chú</span>
                <textarea
                  value={locationForm.ghi_chu}
                  onChange={(e) => updateLocationForm("ghi_chu", e.target.value)}
                  placeholder="Nhập ghi chú cho vị trí..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                <div className="mb-1 flex items-center gap-2 font-bold">
                  <MousePointer2 className="h-4 w-4" />
                  Gợi ý
                </div>
                Click trực tiếp lên bản đồ để tự điền kinh độ/vĩ độ, sau đó bấm “Lưu vị trí”.
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Lưu vị trí 
              </button>
            </div>
          </form>
        </section>

        <section className="min-h-[760px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:min-h-[calc(100vh-121px)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Bản đồ theo dõi nồng độ hóa chất</h2>
              <p className="text-xs text-slate-500">
                Bản đồ được mở rộng, zoom mượt bằng flyTo/fly animation. Click bản đồ để lấy tọa độ vị trí mới.
                <span className="ml-1 font-semibold text-slate-700">Nguồn hiện tại:</span> {activeMapSource.description}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <Layers className="h-4 w-4 text-blue-600" />
                {activeMapSource.label} + Leaflet
              </div>
              <select
                value={mapSourceKey}
                onChange={(e) => {
                  setMapReady(false);
                  setMapSourceKey(e.target.value);
                }}
                className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                title="Chọn nguồn bản đồ"
              >
                {Object.values(MAP_SOURCES).map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative h-[calc(100%-81px)] min-h-[680px] xl:min-h-[calc(100vh-202px)]">
            {!mapReady && (
              <div className="absolute inset-0 z-[500] grid place-items-center bg-white">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                  <p className="text-sm font-semibold text-slate-700">Đang tải bản đồ...</p>
                </div>
              </div>
            )}

            <MapContainer
              center={mapCenter}
              zoom={13}
              className="h-full w-full"
              scrollWheelZoom
              zoomControl={false}
              zoomAnimation
              markerZoomAnimation
              fadeAnimation
              preferCanvas
              wheelPxPerZoomLevel={90}
              whenCreated={(map) => {
                mapRef.current = map;
                setMapReady(true);
              }}
            >
              <SmoothMapController center={mapCenter} selectedId={selectedId} />
              <ZoomControl position="bottomright" />
              <ClickToPickLocation
                onPick={(coord) => {
                  updateLocationForm("vi_do", coord.vi_do);
                  updateLocationForm("kinh_do", coord.kinh_do);
                  setPickedMapCenter([Number(coord.vi_do), Number(coord.kinh_do)]);
                }}
              />
              <TileLayer
                key={activeMapSource.key}
                attribution={activeMapSource.attribution}
                url={activeMapSource.url}
                minZoom={activeMapSource.minZoom}
                maxZoom={activeMapSource.maxZoom}
                keepBuffer={8}
                updateWhenIdle={false}
                updateWhenZooming
                errorTileUrl={TILE_ERROR_SVG}
                eventHandlers={{
                  load: () => setMapReady(true),
                  tileerror: () => setMapReady(true),
                }}
              />

              {records.map((record) => {
                const mainChemical = getMainChemical(record);
                const riskKey = mainChemical?.risk || "MEDIUM";
                const risk = RISK_STYLE[riskKey] || RISK_STYLE.MEDIUM;
                const radius = mainChemical
                  ? getRadiusByRisk(mainChemical.risk, mainChemical.concentration, mainChemical.threshold)
                  : 180;
                const isSelected = selectedId === record.id;

                return (
                  <React.Fragment key={record.id}>
                    {mainChemical && (
                      <Circle
                        center={[record.vi_do, record.kinh_do]}
                        radius={radius}
                        pathOptions={{
                          color: risk.circle,
                          fillColor: risk.circle,
                          fillOpacity: isSelected ? 0.18 : 0.08,
                          weight: isSelected ? 3 : 1.6,
                        }}
                      >
                        <Tooltip>
                          <div className="text-sm">
                            <div className="font-bold">{record.name}</div>
                            <div>
                              {mainChemical.name}: {mainChemical.concentration} {mainChemical.unit}
                            </div>
                            <div>Bán kính ước tính: {Math.round(radius)} m</div>
                          </div>
                        </Tooltip>
                      </Circle>
                    )}

                    <Marker
                      position={[record.vi_do, record.kinh_do]}
                      zIndexOffset={isSelected ? 1000 : 0}
                      eventHandlers={{
                        click: () => {
                          setPickedMapCenter(null);
                          setSelectedId(record.id);
                        },
                        mouseover: (e) => e.target.openTooltip(),
                        mouseout: (e) => e.target.closeTooltip(),
                      }}
                    >
                    <Tooltip
                      permanent={false}
                      direction="top"
                      offset={[0, -32]}
                      opacity={1}
                      className={isSelected ? "!rounded-xl !border-0 !bg-slate-900 !px-3 !py-2 !text-xs !font-bold !text-white !shadow-lg" : ""}
                    >
                      <div className="text-xs leading-5">
                        <div className="font-bold">{record.name}</div>
                        <div>{record.dia_chi}</div>
                        <div>Kinh độ: {record.kinh_do}</div>
                        <div>Vĩ độ: {record.vi_do}</div>
                        {record.ghi_chu && <div>Ghi chú: {record.ghi_chu}</div>}
                        {mainChemical && (
                          <div>
                            {mainChemical.name}: {mainChemical.concentration} {mainChemical.unit}
                          </div>
                        )}
                      </div>
                    </Tooltip>
                      <Popup>
                        <div className="w-72 space-y-3 text-sm">
                          <div>
                            <div className="font-bold text-slate-900">{record.name}</div>
                            <div className="text-xs text-slate-500">{record.dia_chi}</div>
                              {record.ghi_chu && <div className="mt-1 text-xs text-slate-600">Ghi chú: {record.ghi_chu}</div>}
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2">
                            {mainChemical ? (
                              <>
                                <div className="font-semibold">{mainChemical.name}</div>
                                <div>
                                  Nồng độ: {mainChemical.concentration} {mainChemical.unit}
                                </div>
                                <div>Ngưỡng: {mainChemical.threshold} {mainChemical.unit}</div>
                                <div>Thời gian: {formatDateRange(mainChemical)}</div>
                              </>
                            ) : (
                              <div className="text-slate-500">Vị trí này chưa có dữ liệu hóa chất.</div>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPickedMapCenter(null);
                                setSelectedId(record.id);
                                openDetailModal(record.id);
                              }}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditLocationModal(record.id)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => openChemicalModal(record.id)}
                              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                            >
                              Hóa chất
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm vị trí, hóa chất, mã CAS..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="mt-4 max-h-[310px] space-y-2 overflow-auto pr-1">
              {records.map((record) => {
                // console.log("Rendering record in sidebar:", record);
                const mainChemical = getMainChemical(record);
                const risk = RISK_STYLE[mainChemical?.risk || "MEDIUM"] || RISK_STYLE.MEDIUM;
                const isSelected = selectedId === record.id;

                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setSelectedId(record.id)}
                    className={cx(
                      "w-full rounded-2xl border p-3 text-left transition",
                      isSelected
                        ? "border-blue-300 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{record.name}</div>
                        <div className="mt-1 line-clamp-1 text-xs text-slate-500">{record.dia_chi}</div>
                      </div>
                      {mainChemical ? (
                        <span className={cx("shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold", risk.badge)}>
                          {risk.label}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500">
                          Chưa nhập
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      {mainChemical
                        ? `${mainChemical.name} · ${mainChemical.concentration} ${mainChemical.unit}`
                        : "Chưa có thông tin hóa chất"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedRecord && (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedRecord.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedRecord.dia_chi}</p>
                    {selectedRecord.ghi_chu && <p className="mt-1 text-sm text-slate-600">Ghi chú: {selectedRecord.ghi_chu}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditLocationModal(selectedRecord.id)}
                    className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                    title="Sửa điểm lấy mẫu"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLocation(selectedRecord.id)}
                    className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                    title="Xóa điểm lấy mẫu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Kinh độ</div>
                  <div className="mt-1 font-mono font-bold">{selectedRecord.kinh_do}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Vĩ độ</div>
                  <div className="mt-1 font-mono font-bold">{selectedRecord.vi_do}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openDetailModal(selectedRecord.id)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                Chi tiết mẫu thử
              </button>

              <button
                type="button"
                onClick={() => openChemicalModal(selectedRecord.id)}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thêm thông tin hóa chất
              </button>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                  <Factory className="h-4 w-4 text-blue-600" />
                  Danh sách hóa chất tại vị trí
                </div>

                {selectedRecord.chemicals?.length ? (
                  <div className="space-y-3">
                    {selectedRecord.chemicals.map((chemical) => {
                      const risk = RISK_STYLE[chemical.risk] || RISK_STYLE.MEDIUM;
                      return (
                        <div key={chemical.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900">{chemical.name}</div>
                              <div className="mt-1 text-xs text-slate-500">CAS: {chemical.cas || "—"}</div>
                            </div>
                            <span className={cx("rounded-full border px-2 py-1 text-[11px] font-bold", risk.badge)}>
                              {risk.label}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div>Nồng độ: <b>{chemical.concentration} {chemical.unit}</b></div>
                            <div>Ngưỡng: <b>{chemical.threshold} {chemical.unit}</b></div>
                            <div>Thời gian: <b>{formatDateRange(chemical)}</b></div>
                            <div>Gió: <b>{chemical.windDirection}, {chemical.windSpeed} m/s</b></div>
                            <div>Người lấy mẫu: <b>{chemical.sampleCollector || "—"}</b></div>
                            <div>SĐT: <b>{chemical.samplePhone || "—"}</b></div>
                          </div>
                          {chemical.note && (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900">
                              {chemical.note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                    Chưa có dữ liệu hóa chất. Bấm “Thêm thông tin hóa chất” để nhập.
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </main>

      <LocationModal
        open={locationModalOpen}
        mode={locationModalMode}
        form={locationForm}
        setForm={setLocationForm}
        notification={notification?.scope === "location-modal" ? notification : null}
        onCloseNotification={() => setNotification(null)}
        onClose={() => {
          setLocationModalOpen(false);
          setEditingLocationId(null);
          setLocationForm(emptyLocationForm);
          setNotification(null);
        }}
        onSubmit={handleSubmitLocation}
      />

      <SampleDetailModal
        open={detailModalOpen}
        location={detailTargetLocation}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailLocationId(null);
        }}
      />

      <ChemicalModal
        open={chemicalModalOpen}
        location={chemicalTargetLocation}
        form={chemicalForm}
        setForm={setChemicalForm}
        onInvalidNext={(message) => showModalNotification("error", message)}
        sampleAreaOptions={sampleAreaOptions}
        sampleTypeOptions={sampleTypeOptions}
        unitOptions={unitOptions}
        timeOptions={timeOptions}
        notification={notification?.scope === "modal" ? notification : null}
        onCloseNotification={() => setNotification(null)}
        onClose={() => {
          setChemicalModalOpen(false);
          setChemicalTargetLocationId(null);
          setNotification(null);
        }}
        onSubmit={handleAddChemical}
      />

      <AnimatePresence>
        {notification && notification.scope !== "modal" && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );    
}
