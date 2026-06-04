import React, { useEffect, useMemo, useRef, useState } from "react";
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

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = new L.Icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const DA_NANG_CENTER = [16.0544, 108.2022];
const STORAGE_KEY = "chemical-monitoring-records-v2";
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

const UNIT_OPTIONS = ["ppm", "mg/m3", "mg/L", "%", "ppb"];
const WIND_OPTIONS = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];

const fakeLocations = [
  {
    id: "LOC-001",
    name: "Kho hóa chất Liên Chiểu",
    address: "KCN Hòa Khánh, Liên Chiểu, Đà Nẵng",
    longitude: 108.1538,
    latitude: 16.0742,
    manager: "Nguyễn Văn An",
    phone: "0901 222 333",
    chemicals: [
      {
        id: "CHEM-001",
        name: "Clo (Cl2)",
        cas: "7782-50-5",
        concentration: 8.6,
        unit: "ppm",
        threshold: 5,
        risk: "HIGH",
        dateMode: "range",
        date: "",
        startDate: "2026-05-01",
        endDate: "2026-05-10",
        windDirection: "Đông Bắc",
        windSpeed: 3.5,
        temperature: 31,
        humidity: 72,
        note: "Nồng độ tăng tại khu bồn chứa phía Bắc, cần kiểm tra hệ thống thông gió.",
      },
    ],
  },
  {
    id: "LOC-002",
    name: "Nhà máy xử lý nước Sơn Trà",
    address: "Phường Thọ Quang, Sơn Trà, Đà Nẵng",
    longitude: 108.2476,
    latitude: 16.0991,
    manager: "Trần Thị Bình",
    phone: "0905 888 777",
    chemicals: [
      {
        id: "CHEM-002",
        name: "Amoniac (NH3)",
        cas: "7664-41-7",
        concentration: 2.1,
        unit: "ppm",
        threshold: 25,
        risk: "LOW",
        dateMode: "single",
        date: "2026-05-09",
        startDate: "",
        endDate: "",
        windDirection: "Tây Nam",
        windSpeed: 1.2,
        temperature: 29,
        humidity: 68,
        note: "Nằm trong ngưỡng an toàn, tiếp tục theo dõi định kỳ.",
      },
    ],
  },
  {
    id: "LOC-003",
    name: "Cảng hóa chất Tiên Sa",
    address: "Cảng Tiên Sa, Sơn Trà, Đà Nẵng",
    longitude: 108.2262,
    latitude: 16.1198,
    manager: "Lê Minh Quân",
    phone: "0913 555 888",
    chemicals: [
      {
        id: "CHEM-003",
        name: "Dung môi hữu cơ",
        cas: "MIX-ORG-01",
        concentration: 41,
        unit: "mg/m3",
        threshold: 50,
        risk: "MEDIUM",
        dateMode: "single",
        date: "2026-05-10",
        startDate: "",
        endDate: "",
        windDirection: "Đông",
        windSpeed: 4.8,
        temperature: 33,
        humidity: 64,
        note: "Có mùi dung môi tại khu vực nhập hàng, khuyến nghị tăng tần suất đo.",
      },
    ],
  },
];

const emptyLocationForm = {
  locationName: "",
  address: "",
  longitude: "",
  latitude: "",
  manager: "",
  phone: "",
};

const emptyChemicalForm = {
  chemicalName: "Clo (Cl2)",
  cas: "",
  concentration: "",
  unit: "ppm",
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
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function NumberInput({ label, value, onChange, placeholder, step = "any", suffix }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
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

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
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
      onPick({ latitude: e.latlng.lat.toFixed(6), longitude: e.latlng.lng.toFixed(6) });
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

function ChemicalModal({ open, location, form, setForm, onClose, onSubmit }) {
  if (!open || !location) return null;

  function updateChemicalForm(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "concentration" || key === "threshold") {
        next.risk = getRiskFromValue(
          key === "concentration" ? value : next.concentration,
          key === "threshold" ? value : next.threshold
        );
      }
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <FlaskConical className="h-4 w-4" />
              Nhập hóa chất sau khi xác định vị trí
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{location.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {location.address} · {location.latitude}, {location.longitude}
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
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Thời gian quan trắc
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateChemicalForm("dateMode", "single")}
                  className={cx(
                    "h-10 rounded-xl border text-sm font-semibold transition",
                    form.dateMode === "single"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Ngày cụ thể
                </button>
                <button
                  type="button"
                  onClick={() => updateChemicalForm("dateMode", "range")}
                  className={cx(
                    "h-10 rounded-xl border text-sm font-semibold transition",
                    form.dateMode === "range"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Khoảng thời gian
                </button>
              </div>

              {form.dateMode === "single" ? (
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateChemicalForm("date", e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateChemicalForm("startDate", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateChemicalForm("endDate", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <Wind className="h-5 w-5 text-blue-600" />
                Điều kiện môi trường
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectInput label="Hướng gió" value={form.windDirection} onChange={(v) => updateChemicalForm("windDirection", v)} options={WIND_OPTIONS} />
                <NumberInput label="Tốc độ gió" value={form.windSpeed} onChange={(v) => updateChemicalForm("windSpeed", v)} suffix="m/s" />
                <NumberInput label="Nhiệt độ" value={form.temperature} onChange={(v) => updateChemicalForm("temperature", v)} suffix="°C" />
                <NumberInput label="Độ ẩm" value={form.humidity} onChange={(v) => updateChemicalForm("humidity", v)} suffix="%" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                <FlaskConical className="h-5 w-5 text-blue-600" />
                Thông tin hóa chất
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SelectInput label="Tên hóa chất" value={form.chemicalName} onChange={(v) => updateChemicalForm("chemicalName", v)} options={CHEMICAL_TYPES} />
                <TextInput label="Mã CAS / mã nội bộ" value={form.cas} onChange={(v) => updateChemicalForm("cas", v)} placeholder="VD: 7782-50-5" />
                <NumberInput label="Nồng độ đo được" value={form.concentration} onChange={(v) => updateChemicalForm("concentration", v)} placeholder="8.5" />
                <SelectInput label="Đơn vị" value={form.unit} onChange={(v) => updateChemicalForm("unit", v)} options={UNIT_OPTIONS} />
                <NumberInput label="Ngưỡng cảnh báo" value={form.threshold} onChange={(v) => updateChemicalForm("threshold", v)} placeholder="5" />
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600">Mức rủi ro</span>
                  <select
                    value={form.risk}
                    onChange={(e) => updateChemicalForm("risk", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {Object.entries(RISK_STYLE).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-3 block space-y-1.5">
                <span className="text-xs font-semibold text-slate-600">Ghi chú / khuyến nghị</span>
                <textarea
                  value={form.note}
                  onChange={(e) => updateChemicalForm("note", e.target.value)}
                  placeholder="Nhập tình trạng hiện trường, hướng xử lý, yêu cầu cảnh báo..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>
          </div>

          <div className="sticky bottom-0 mt-5 flex justify-end gap-3 border-t border-slate-200 bg-white pt-4">
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
              Lưu hóa chất
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChemicalMonitoringDashboard() {
  const [records, setRecords] = useState(() => {
    try {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      const parsed = cached ? JSON.parse(cached) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : fakeLocations;
    } catch {
      return fakeLocations;
    }
  });

  const [selectedId, setSelectedId] = useState(fakeLocations[0].id);
  const [locationForm, setLocationForm] = useState(emptyLocationForm);
  const [chemicalForm, setChemicalForm] = useState(emptyChemicalForm);
  const [chemicalModalOpen, setChemicalModalOpen] = useState(false);
  const [chemicalTargetLocationId, setChemicalTargetLocationId] = useState(null);
  const [search, setSearch] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mapSourceKey, setMapSourceKey] = useState(() => {
    try {
      const cached = window.localStorage.getItem(MAP_SOURCE_KEY);
      return MAP_SOURCES[cached] ? cached : DEFAULT_MAP_SOURCE;
    } catch {
      return DEFAULT_MAP_SOURCE;
    }
  });
  const mapRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage.
    }
  }, [records]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MAP_SOURCE_KEY, mapSourceKey);
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage.
    }
  }, [mapSourceKey]);

  const selectedRecord = useMemo(
    () => records.find((item) => item.id === selectedId) || records[0],
    [records, selectedId]
  );

  const selectedChemical = getMainChemical(selectedRecord);

  const chemicalTargetLocation = useMemo(
    () => records.find((item) => item.id === chemicalTargetLocationId) || null,
    [records, chemicalTargetLocationId]
  );

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((item) => {
      const chemicals = (item.chemicals || [])
        .map((chemical) => `${chemical.name} ${chemical.cas} ${chemical.risk}`)
        .join(" ");

      return [item.name, item.address, item.manager, item.phone, chemicals]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [records, search]);

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

  const mapCenter = selectedRecord
    ? [selectedRecord.latitude, selectedRecord.longitude]
    : DA_NANG_CENTER;

  const activeMapSource = MAP_SOURCES[mapSourceKey] || MAP_SOURCES[DEFAULT_MAP_SOURCE];

  function updateLocationForm(key, value) {
    setLocationForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddLocation(e) {
    e.preventDefault();

    const latitude = Number(locationForm.latitude);
    const longitude = Number(locationForm.longitude);
    if (!locationForm.locationName.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      alert("Vui lòng nhập tên vị trí, kinh độ và vĩ độ hợp lệ.");
      return;
    }

    const newLocation = {
      id: `LOC-${String(Date.now()).slice(-5)}`,
      name: locationForm.locationName.trim(),
      address: locationForm.address.trim() || "Chưa nhập địa điểm",
      longitude,
      latitude,
      manager: locationForm.manager.trim(),
      phone: locationForm.phone.trim(),
      chemicals: [],
    };

    setRecords((prev) => [newLocation, ...prev]);
    setSelectedId(newLocation.id);
    setLocationForm(emptyLocationForm);
    openChemicalModal(newLocation.id);
  }

  function openChemicalModal(locationId) {
    setChemicalTargetLocationId(locationId);
    setChemicalForm(emptyChemicalForm);
    setChemicalModalOpen(true);
  }

  function handleAddChemical(e) {
    e.preventDefault();
    if (!chemicalTargetLocationId) return;

    if (!chemicalForm.chemicalName || !chemicalForm.concentration || !chemicalForm.threshold) {
      alert("Vui lòng nhập tên hóa chất, nồng độ và ngưỡng cảnh báo.");
      return;
    }

    const newChemical = {
      id: `CHEM-${String(Date.now()).slice(-6)}`,
      name: chemicalForm.chemicalName,
      cas: chemicalForm.cas.trim(),
      concentration: Number(chemicalForm.concentration || 0),
      unit: chemicalForm.unit,
      threshold: Number(chemicalForm.threshold || 0),
      risk: chemicalForm.risk,
      dateMode: chemicalForm.dateMode,
      date: chemicalForm.date,
      startDate: chemicalForm.startDate,
      endDate: chemicalForm.endDate,
      windDirection: chemicalForm.windDirection,
      windSpeed: Number(chemicalForm.windSpeed || 0),
      temperature: Number(chemicalForm.temperature || 0),
      humidity: Number(chemicalForm.humidity || 0),
      note: chemicalForm.note.trim(),
    };

    setRecords((prev) =>
      prev.map((location) =>
        location.id === chemicalTargetLocationId
          ? { ...location, chemicals: [newChemical, ...(location.chemicals || [])] }
          : location
      )
    );

    setSelectedId(chemicalTargetLocationId);
    setChemicalModalOpen(false);
    setChemicalTargetLocationId(null);
    setChemicalForm(emptyChemicalForm);
  }

  function removeLocation(id) {
    const ok = window.confirm("Bạn có chắc muốn xóa vị trí này không?");
    if (!ok) return;

    setRecords((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id || "");
      return next;
    });
  }

  function focusCurrentLocation() {
    const map = mapRef.current;
    if (!map || !selectedRecord) return;

    map.flyTo([selectedRecord.latitude, selectedRecord.longitude], 15, {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.2,
    });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-[1000] border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
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
                  Chỉ nhập thông tin vị trí. Sau khi lưu sẽ mở modal nhập hóa chất.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Bước 1
              </span>
            </div>

            <div className="space-y-3">
              <TextInput label="Tên vị trí" value={locationForm.locationName} onChange={(v) => updateLocationForm("locationName", v)} placeholder="VD: Kho hóa chất A" />
              <TextInput label="Địa điểm / địa chỉ" value={locationForm.address} onChange={(v) => updateLocationForm("address", v)} placeholder="VD: KCN Hòa Khánh, Đà Nẵng" />
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Kinh độ" value={locationForm.longitude} onChange={(v) => updateLocationForm("longitude", v)} placeholder="108.2022" />
                <NumberInput label="Vĩ độ" value={locationForm.latitude} onChange={(v) => updateLocationForm("latitude", v)} placeholder="16.0544" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Người phụ trách" value={locationForm.manager} onChange={(v) => updateLocationForm("manager", v)} placeholder="Họ tên" />
                <TextInput label="Số điện thoại" value={locationForm.phone} onChange={(v) => updateLocationForm("phone", v)} placeholder="090..." />
              </div>

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
                Lưu vị trí và nhập hóa chất
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
                  updateLocationForm("latitude", coord.latitude);
                  updateLocationForm("longitude", coord.longitude);
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
                        center={[record.latitude, record.longitude]}
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
                      position={[record.latitude, record.longitude]}
                      zIndexOffset={isSelected ? 1000 : 0}
                      eventHandlers={{ click: () => setSelectedId(record.id) }}
                    >
                      {isSelected && (
                        <Tooltip permanent direction="top" offset={[0, -32]} className="!rounded-full !border-0 !bg-slate-900 !px-3 !py-1 !text-xs !font-bold !text-white !shadow-lg">
                          {record.name}
                        </Tooltip>
                      )}
                      <Popup>
                        <div className="w-72 space-y-3 text-sm">
                          <div>
                            <div className="font-bold text-slate-900">{record.name}</div>
                            <div className="text-xs text-slate-500">{record.address}</div>
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
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedId(record.id)}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Xem chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => openChemicalModal(record.id)}
                              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                            >
                              Thêm hóa chất
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
              {filteredRecords.map((record) => {
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
                        <div className="mt-1 line-clamp-1 text-xs text-slate-500">{record.address}</div>
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
                  <p className="mt-1 text-sm text-slate-500">{selectedRecord.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeLocation(selectedRecord.id)}
                  className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Kinh độ</div>
                  <div className="mt-1 font-mono font-bold">{selectedRecord.longitude}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Vĩ độ</div>
                  <div className="mt-1 font-mono font-bold">{selectedRecord.latitude}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Người phụ trách</div>
                  <div className="mt-1 font-bold">{selectedRecord.manager || "—"}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Liên hệ</div>
                  <div className="mt-1 font-bold">{selectedRecord.phone || "—"}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openChemicalModal(selectedRecord.id)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
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

      <ChemicalModal
        open={chemicalModalOpen}
        location={chemicalTargetLocation}
        form={chemicalForm}
        setForm={setChemicalForm}
        onClose={() => {
          setChemicalModalOpen(false);
          setChemicalTargetLocationId(null);
        }}
        onSubmit={handleAddChemical}
      />
    </div>
  );
}
