import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Notification from "../components/Notification";
import {
  Search,
  Filter,
  Plus,
  CalendarClock,
  Flame,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Layers,
  Link2,
  X,
  Send,
  Trash2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
const role_id = localStorage.getItem("role_id")
import { get as boardApi } from "../api/board";
import { create as createTa, update as updateTa, updateStatus, remove as removeTa, getById } from "../api/task";
import { get as getCo, create as createCo } from "../api/comments";
import { getList } from "../api/users";
// import { createBulk as createAssignBulk } from "../api/assign"; // ✅ nếu bạn có API bulk thì bật dòng này

/* =====================================================
   CONSTANTS
===================================================== */

const STATUSES = [
  { id: "TODO", name: "To Do" },
  { id: "IN_PROGRESS", name: "In Progress" },
  { id: "IN_REVIEW", name: "In Review" },
  { id: "DONE", name: "Done" },
];

const ISSUE_TYPES = [
  { id: "MISSION", label: "Nhiệm vụ", pill: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "SSCĐ", label: "Sẵn sàng chiến đấu", pill: "bg-red-50 text-red-700 border-red-200" },
  { id: "TRAINING", label: "Huấn luyện", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "INSPECTION", label: "Kiểm tra", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "FORCE", label: "Quân lực", pill: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "LOGISTICS", label: "Hậu cần", pill: "bg-slate-50 text-slate-700 border-slate-200" },
  { id: "KHCN", label: "Khoa học – Công nghệ", pill: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "CNTT", label: "Công nghệ thông tin", pill: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  { id: "COMMUNICATION", label: "Thông tin – liên lạc", pill: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "REPORT", label: "Báo cáo", pill: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "OTHER", label: "Nhiệm vụ khác", pill: "bg-neutral-50 text-neutral-700 border-neutral-200" },
];

const PRIORITY = [
  { id: "HIGH", label: "Cao", pill: "bg-red-50 text-red-700 border-red-200" },
  { id: "MEDIUM", label: "TB", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "LOW", label: "Thấp", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const toISO = (d) => d.toISOString().slice(0, 10);
const fmtVN = (isoDate) => {
  if (!isoDate) return "—";
  const [y, m, dd] = isoDate.split("-");
  return `${dd}/${m}/${y}`;
};
const todayISO = () => toISO(new Date());

/* =====================================================
   UI HELPERS
===================================================== */
function Pill({ className = "", children }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs border rounded-full ${className}`}>
      {children}
    </span>
  );
}

function Avatar({ label }) {
  const initials = (label || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");

  return (
    <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold border border-green-200">
      {initials || "?"}
    </div>
  );
}

/** ✅ Avatar dạng chip + tooltip khi hover */
function AvatarChip({ name, active = false, onClick }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold transition
        ${active ? "bg-green-700 text-white border-green-700" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}
    >
      {initials || "?"}
      <span
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap
          rounded-lg bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
      >
        {name}
      </span>
    </button>
  );
}

function UserRow({ user, right }) {
  const name = user.fullname || user.name || user.username || `User #${user.id}`;
  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded-xl border bg-white hover:bg-gray-50">
      <div className="flex items-center gap-3 min-w-0">
        <AvatarChip name={name} active={false} onClick={() => { }} />
        <div className="min-w-0">
          <div className="font-medium text-gray-800 truncate">{name}</div>
          <div className="text-xs text-gray-500 truncate">
            {user.fullname ? `@${user.username}` : `ID: ${user.id}`}
          </div>
        </div>
      </div>
      {right}
    </div>
  );
}

function MembersPicker({ users, leaderId, memberIds, onAdd, onRemove }) {
  const selectedSet = useMemo(() => new Set(memberIds), [memberIds]);

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedSet.has(u.id)),
    [users, selectedSet]
  );

  const availableUsers = useMemo(
    () => users.filter((u) => !selectedSet.has(u.id)),
    [users, selectedSet]
  );

  return (
    <div className="space-y-4">
      {/* Selected members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-800">
            Thành viên đã chọn ({selectedUsers.length})
          </div>
          <div className="text-xs text-gray-500">
            {leaderId ? "Leader sẽ luôn nằm trong danh sách" : "Chưa chọn leader"}
          </div>
        </div>

        {selectedUsers.length === 0 ? (
          <div className="text-sm text-gray-600 p-3 rounded-xl border bg-white">
            Chưa chọn thành viên. Hãy thêm từ danh sách bên dưới.
          </div>
        ) : (
          // ✅ THÊM SCROLL Ở ĐÂY
          <div className="max-h-[260px] overflow-auto pr-1 space-y-2">
            {selectedUsers.map((u) => {
              const name = u.fullname || u.name || u.username || `User #${u.id}`;
              const isLeader = leaderId && Number(leaderId) === Number(u.id);

              return (
                <UserRow
                  key={u.id}
                  user={u}
                  right={
                    <div className="flex items-center gap-2">
                      {isLeader && (
                        <span className="text-xs px-2 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
                          Leader
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={isLeader}
                        onClick={() => onRemove(u.id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm
                    ${isLeader ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50 text-red-700"}`}
                        title={isLeader ? "Không thể xoá Leader khỏi thành viên" : "Xoá khỏi thành viên"}
                      >
                        Xoá
                      </button>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>


      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">
          Tất cả người dùng ({availableUsers.length})
        </div>

        {availableUsers.length === 0 ? (
          <div className="text-sm text-gray-600 p-3 rounded-xl border bg-white">
            Tất cả người dùng đã được thêm vào thành viên.
          </div>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {availableUsers.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                right={
                  <button
                    type="button"
                    onClick={() => onAdd(u.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-green-50 text-green-700"
                    title="Thêm vào thành viên"
                  >
                    + Thêm
                  </button>
                }
              />
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          * Di chuột lên avatar để xem tên. Nhấn “+ Thêm” để đưa vào danh sách thành viên.
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, note }) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 text-green-700">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      <div className="text-2xl font-bold text-green-700 mt-2">{value}</div>
      <div className="text-sm text-gray-600">{note}</div>
    </div>
  );
}

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>Tiến độ</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden border">
        <div className="h-full bg-green-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, right }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border shadow-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold text-gray-800">{title}</div>
          <div className="flex items-center gap-2">
            {right}
            <button onClick={onClose} className="text-sm px-3 py-1 rounded border hover:bg-gray-50">
              Đóng
            </button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* =====================================================
   CARD
===================================================== */

function IssueCard({ task, onOpen }) {
  const pr = PRIORITY.find((x) => x.id === (task.priority || "MEDIUM")) || PRIORITY[1];
  const tp = ISSUE_TYPES.find((x) => x.id === (task.type || "MISSION")) || ISSUE_TYPES[0];

  const key = `TASK-${task.id}`;
  const dueText = task.due_to ? fmtVN(task.due_to) : "—";
  const isOverdue = task.due_to && task.status !== "DONE" && task.due_to < todayISO();

  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  const leader = assignees.find((a) => Number(a.leader) === 1) || null;

  return (
    <button
      onClick={() => onOpen(task)}
      className="w-full text-left bg-white rounded-xl border shadow-sm p-3 hover:bg-green-50 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-gray-500 font-medium">{key}</div>
          <div className="font-semibold text-gray-800 leading-snug">{task.title || "(Không có tiêu đề)"}</div>
        </div>

        <Avatar label={leader ? `${leader.fullname}` : "?"} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <Pill className={tp.pill}>{tp.label}</Pill>
        <Pill className={pr.pill}>Ưu tiên {pr.label}</Pill>
        <Pill className="bg-slate-50 text-slate-700 border-slate-200">
          Ước tính {Number(task.originalEstimate || 0)}h
        </Pill>

        {isOverdue && (
          <Pill className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle size={14} className="mr-1" /> Quá hạn
          </Pill>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <CalendarClock size={14} /> Hạn: <b className="text-gray-800">{dueText}</b>
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-gray-700">
            <Link2 size={14} />Số lượng thành viên: {task.assignees?.length || 0}
          </span>
        </span>
      </div>
    </button>
  );
}

/* =====================================================
   MAIN PAGE
===================================================== */

export default function TienDoCongViecPage() {
  // Filters
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [priority, setPriority] = useState("all");

  // Participant filter
  const [participantId, setParticipantId] = useState("all");

  // users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Deadline filters
  const [range, setRange] = useState("all");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Data
  const [loading, setLoading] = useState(false);
  const [boardData, setBoardData] = useState({ TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] });

  // Modals
  const [detail, setDetail] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [notify, setNotify] = useState(null);
  // Detail: comments
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Create form
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "MISSION",
    priority: "MEDIUM",
    due_to: "",
    originalEstimate: 4,
    leaderId: null,
    memberIds: [],
  });

  /** ✅ FIX: add/remove member phải nằm TRONG component để dùng được setForm */
  const addMember = (id) => {
    setForm((p) => {
      if (p.memberIds.includes(id)) return p;
      return { ...p, memberIds: [...p.memberIds, id] };
    });
  };

  const removeMember = (id) => {
    setForm((p) => {
      if (p.leaderId && Number(p.leaderId) === Number(id)) return p;
      return { ...p, memberIds: p.memberIds.filter((x) => x !== id) };
    });
  };

  // Helper calculate date range
  const calcRange = () => {
    const now = new Date();
    if (range === "all") return { from: dueFrom || undefined, to: dueTo || undefined };
    if (range === "today") return { from: toISO(now), to: toISO(now) };
    if (range === "7d") {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      return { from: toISO(from), to: toISO(now) };
    }
    if (range === "30d") {
      const from = new Date(now);
      from.setDate(now.getDate() - 29);
      return { from: toISO(from), to: toISO(now) };
    }
    return { from: dueFrom || undefined, to: dueTo || undefined };
  };

  // ✅ Load users from API
  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await getList({});
        if (mounted) setUsers(res?.data || []);
      } catch (e) {
        console.error(e);
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setUsersLoading(false);
      }
    };
    loadUsers();
    return () => (mounted = false);
  }, []);

  // ✅ ensure leader is always in members
  useEffect(() => {
    setForm((p) => {
      if (!p.leaderId) return p;
      const leader = Number(p.leaderId);
      if (p.memberIds.includes(leader)) return p;
      return { ...p, memberIds: [leader, ...p.memberIds] };
    });
  }, [form.leaderId]);

  // Load board
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const r = calcRange();

        const params = {
          search_text: q || undefined,
          type: type !== "all" ? type : undefined,
          priority: priority !== "all" ? priority : undefined,
          due_from: r.from,
          due_to: r.to,
          overdue: overdueOnly ? "1" : undefined,
        };

        const res = await boardApi(params);
        let columns = res?.columns || { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };

        // Filter by participant
        if (participantId !== "all") {
          const pid = String(participantId);

          const isParticipant = (t) => {
            const a = t.assignees;
            if (Array.isArray(a)) {
              if (a.some((x) => String(x?.userId ?? x?.id ?? x) === pid)) return true;
              if (a.map(String).includes(pid)) return true;
            }
            if (String(t.assigneeId || "") === pid) return true;
            if (String(t.leaderUserId || "") === pid) return true;
            const p = t.participants;
            if (Array.isArray(p) && p.map(String).includes(pid)) return true;
            return false;
          };

          const filterByParticipant = (arr) => (arr || []).filter(isParticipant);

          columns = {
            TODO: filterByParticipant(columns.TODO),
            IN_PROGRESS: filterByParticipant(columns.IN_PROGRESS),
            IN_REVIEW: filterByParticipant(columns.IN_REVIEW),
            DONE: filterByParticipant(columns.DONE),
          };
        }

        if (mounted) setBoardData(columns);
      } catch (e) {
        console.error(e);
        if (mounted) setBoardData({ TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, priority, range, dueFrom, dueTo, overdueOnly, participantId]);

  // Metrics
  const metrics = useMemo(() => {
    const all = [
      ...(boardData.TODO || []),
      ...(boardData.IN_PROGRESS || []),
      ...(boardData.IN_REVIEW || []),
      ...(boardData.DONE || []),
    ];

    const total = all.length;
    const done = (boardData.DONE || []).length;
    const inProgress = (boardData.IN_PROGRESS || []).length + (boardData.IN_REVIEW || []).length;
    const todo = (boardData.TODO || []).length;

    const overdue = all.filter(
      (x) => x.status !== "DONE" && x.due_to && x.due_to < todayISO()
    ).length;

    const remaining = all
      .filter((x) => x.status !== "DONE")
      .reduce((s, x) => s + Number(x.originalEstimate || 0), 0);

    const totalEstimate = all.reduce((s, x) => s + Number(x.originalEstimate || 0), 0);

    return { total, done, inProgress, todo, overdue, remaining, totalEstimate };
  }, [boardData]);

  // Burndown demo
  const burndownData = useMemo(() => {
    const base = metrics.remaining;
    const points = 10;
    const step = points <= 1 ? base : Math.max(1, Math.ceil(base / points));
    return Array.from({ length: points }, (_, i) => ({
      day: `D${i + 1}`,
      remaining: Math.max(0, base - step * i),
    }));
  }, [metrics.remaining]);

  const reloadBoard = async () => {
    const r = calcRange();
    const params = {
      search_text: q || undefined,
      type: type !== "all" ? type : undefined,
      priority: priority !== "all" ? priority : undefined,
      due_from: r.from,
      due_to: r.to,
      overdue: overdueOnly ? "1" : undefined,
    };
    const res = await boardApi(params);
    setBoardData(res?.columns || { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] });
  };

  // Open detail -> load comments
  const openDetail = async (task) => {
    const res = await getById(task.id);
    console.log(res)
    setDetail(res);
    setComments([]);
    setCommentText("");

    if (!task?.id) return;
    try {
      setCommentLoading(true);
      console.log(task.id)
      const res = await getCo({ taskId: task.id });
      setComments(res?.data || []);
    } catch (e) {
      console.error(e);
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  // Create task
  const createTask = async () => {
    if (!form.title.trim()) return;

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        name: form.title.trim(),
        status: "TODO",
        type: form.type,
        priority: form.priority,
        due_to: form.due_to || null,
        originalEstimate: Number(form.originalEstimate || 0),
        timeTrackingSpent: 0,
        timeTrackingRemaining: Number(form.originalEstimate || 0),
        projectId: 0,
        // createdBy: "System",

        // ✅ gộp vào 1 API
        leaderId: form.leaderId ? Number(form.leaderId) : null,
        memberIds: (form.memberIds || []).map(Number),
      };
      console.log("Creating task with payload:", payload);
      const created = await createTa(payload); // ✅ CHỈ 1 API

      setNotify({ type: "success", message: `Tạo công việc TASK-${created?.id} thành công!` });

      setCreateOpen(false);
      setForm({
        title: "",
        description: "",
        type: "MISSION",
        priority: "MEDIUM",
        due_to: "",
        originalEstimate: 4,
        leaderId: null,
        memberIds: [],
      });

      await reloadBoard();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Tạo công việc thất bại. Vui lòng thử lại!";
      setNotify({ type: "error", message: msg });
    }
  };


  // Update task status
  const quickMoveStatus = async (task, status) => {

    const res = await updateStatus(task.id, { status });
    console.log("Update status response:", res);

    // ✅ Update thành công
    if (res === "success") {
      setNotify({
        type: "success",
        message: `Cập nhật trạng thái TASK-${task.id} thành công!`,
      });

      // await reloadBoard();
        window.location.reload();

      if (detail?.id === task.id) {
        setDetail((prev) => (prev ? { ...prev, status } : prev));
      }
    } else {
      // ❌ Trường hợp hiếm: response nhưng status không phải 2xx
      setNotify({
        type: "error",
        message: `Bạn không có quyền cập nhật trạng thái!`,
      });
    }

  };


  // Add comment
  const addComment = async () => {
    if (!detail?.id) return;
    const content = commentText.trim();
    if (!content) return;

    await createCo({ content, taskId: detail.id });
    setCommentText("");
    const res = await getCo({ taskId: detail.id });
    setComments(res?.data || []);
  };

  // Delete task
  const deleteTask = async () => {
    if (!detail?.id) return;
    await removeTa(detail.id);
    setDetail(null);
    await reloadBoard();
  };

  function UserSelectSingle({ users, value, onChange }) {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full py-2 px-3 rounded-xl border bg-white hover:bg-gray-50"
      >
        <option value="">-- Chọn người phụ trách --</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.fullname || u.name || u.username || `User #${u.id}`}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* ===== HEADER ===== */}
      <div className="bg-white border rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Hệ thống / Quản lý công việc</div>
            <h1 className="text-2xl font-bold text-green-700">Tiến độ công việc</h1>
          </div>

          <div className="flex items-center gap-2">
            {(role_id === "A" || role_id === "M") && (
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-700 text-white hover:bg-green-800"
              >
                <Plus size={18} /> Tạo công việc
              </button>
            )}

           
          </div>
        </div>

        {/* Deadline filters */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-2">Khoảng thời gian (deadline)</div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border bg-white hover:bg-gray-50"
            >
              <option value="all">Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày gần nhất</option>
              <option value="30d">30 ngày gần nhất</option>
              <option value="custom">Tùy chọn</option>
            </select>

            {range === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <input
                  type="date"
                  value={dueFrom}
                  onChange={(e) => setDueFrom(e.target.value)}
                  className="py-2 px-3 rounded-xl border"
                />
                <input
                  type="date"
                  value={dueTo}
                  onChange={(e) => setDueTo(e.target.value)}
                  className="py-2 px-3 rounded-xl border"
                />
              </div>
            )}

            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
              />
              Chỉ hiển thị quá hạn
            </label>
          </div>

          <div className="border rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-2">Tiến độ tổng</div>
            <ProgressBar done={metrics.done} total={metrics.total} />
            <div className="mt-2 text-xs text-gray-600">
              Done: <b>{metrics.done}</b> • Đang xử lý: <b>{metrics.inProgress}</b> • To do: <b>{metrics.todo}</b>
            </div>
            <div className="mt-1 text-xs text-gray-600">
              Remaining (ước tính): <b>{metrics.remaining}</b>h / Tổng: <b>{metrics.totalEstimate}</b>h
            </div>
          </div>

          <div className="border rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-2">Burndown (ước tính còn lại)</div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="remaining" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              * Burndown tạm tính từ tổng giờ ước tính còn lại (chưa có worklog theo ngày).
            </div>
          </div>
        </div>
      </div>

      {/* ===== QUICK STATS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Layers className="text-green-700" />} title="Tổng công việc" value={metrics.total} note="Theo bộ lọc hiện tại" />
        <StatCard icon={<CheckCircle2 className="text-green-700" />} title="Đã hoàn thành" value={metrics.done} note="DONE" />
        <StatCard icon={<Timer className="text-green-700" />} title="Đang xử lý" value={metrics.inProgress} note="IN_PROGRESS + IN_REVIEW" />
        <StatCard icon={<Flame className="text-green-700" />} title="Quá hạn" value={metrics.overdue} note="Chưa DONE và quá deadline" />
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="bg-white border rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo mã (TASK-id) hoặc tiêu đề..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border bg-white hover:bg-gray-50"
              disabled={usersLoading}
            >
              <option value="all">{usersLoading ? "Đang tải..." : "Tất cả người tham gia"}</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.fullname || u.name || u.username || `User #${u.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border bg-white hover:bg-gray-50"
            >
              <option value="all">Tất cả loại yêu cầu</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border bg-white hover:bg-gray-50"
            >
              <option value="all">Tất cả ưu tiên</option>
              {PRIORITY.map((p) => (
                <option key={p.id} value={p.id}>
                  Ưu tiên {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== BOARD ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {STATUSES.map((col) => {
          const items = boardData[col.id] || [];
          const estimate = items.reduce((s, it) => s + Number(it.originalEstimate || 0), 0);

          return (
            <div key={col.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">{col.name}</div>
                  <div className="text-xs text-gray-500">{items.length} việc • {estimate}h</div>
                </div>

                {col.id === "IN_REVIEW" && (
                  <Pill className="bg-purple-50 text-purple-700 border-purple-200">Chờ duyệt</Pill>
                )}
                {col.id === "DONE" && (
                  <Pill className="bg-green-50 text-green-700 border-green-200">Hoàn thành</Pill>
                )}
              </div>

              <div className="p-3 space-y-3 bg-gray-50">
                {items.length === 0 ? (
                  <div className="text-sm text-gray-500 p-3 border rounded-xl bg-white">
                    {loading ? "Đang tải..." : "Không có công việc."}
                  </div>
                ) : (
                  items.map((t) => <IssueCard key={t.id} task={t} onOpen={openDetail} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `TASK-${detail.id} • Chi tiết công việc` : "Chi tiết"}
        right={
          detail ? (
            <button
              onClick={deleteTask}
              className="inline-flex items-center gap-2 px-3 py-1 rounded border text-red-700 hover:bg-red-50"
              title="Xoá"
            >
              <Trash2 size={16} /> Xoá
            </button>
          ) : null
        }
      >
        {detail && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Tiêu đề</div>
                <div className="text-lg font-bold text-gray-800">{detail.title}</div>
              </div>

              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-2">Mô tả</div>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {detail.description || "- Chưa có mô tả. Hãy bổ sung mục tiêu, DoD, phụ thuộc nếu có."}
                </div>
              </div>

              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-2">Cập nhật trạng thái nhanh</div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => quickMoveStatus(detail, s.id)}
                      className={`px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 ${detail.status === s.id ? "bg-green-50 border-green-300 text-green-800" : ""
                        }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-2">Bình luận</div>

                <div className="space-y-2">
                  {commentLoading ? (
                    <div className="text-sm text-gray-600">Đang tải bình luận...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-gray-500">Chưa có bình luận.</div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl border bg-white">
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>
                            {c.createdBy || "System"} • {c.createdDate ? new Date(c.createdDate).toLocaleString() : "—"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-800 mt-1 whitespace-pre-line">{c.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Nhập bình luận..."
                    className="flex-1 px-3 py-2 rounded-xl border"
                  />
                  <button
                    onClick={addComment}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-700 text-white hover:bg-green-800"
                  >
                    <Send size={16} /> Gửi
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-2">Thông tin</div>
                <div className="flex flex-wrap gap-2">
                  <Pill className={(ISSUE_TYPES.find((x) => x.id === detail.type) || ISSUE_TYPES[0]).pill}>
                    {(ISSUE_TYPES.find((x) => x.id === detail.type) || ISSUE_TYPES[0]).label}
                  </Pill>
                  <Pill className={(PRIORITY.find((x) => x.id === detail.priority) || PRIORITY[1]).pill}>
                    Ưu tiên {(PRIORITY.find((x) => x.id === detail.priority) || PRIORITY[1]).label}
                  </Pill>
                  <Pill className="bg-slate-50 text-slate-700 border-slate-200">
                    Ước tính {Number(detail.originalEstimate || 0)}h
                  </Pill>
                </div>
              </div>
              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Ngày tạo</div>
                {/* <div className="text-sm text-gray-800">
                  {detail.lastModifiedDate ? new Date(detail.lastModifiedDate).toLocaleString() : "—"}
                </div> */}
                <div className="text-sm text-gray-800">
                  {detail.due_from ? fmtVN(detail.due_from) : "—"}
                </div>
              </div>
              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Deadline</div>
                <div className="text-sm text-gray-800">
                  {detail.due_to ? fmtVN(detail.due_to) : "—"}
                </div>
                {detail.due_to && detail.status !== "DONE" && detail.due_to < todayISO() && (
                  <div className="mt-2 text-sm text-red-700 inline-flex items-center gap-1">
                    <AlertTriangle size={16} /> Quá hạn
                  </div>
                )}
              </div>




              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Người giao việc</div>
                <div className="text-sm text-gray-800">
                  {detail.createdBy
                    ? detail.createdBy : "—"}
                </div>

              </div>

              <div className="border rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Thành viên</div>

                <div className="text-sm text-gray-800 space-y-1">
                  {detail?.participants && detail.participants.length > 0 ? (
                    detail.participants.map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <span>{user.fullname}</span>
                        {user.leader === 1 && (
                          <span className="text-xs text-blue-600">(Leader)</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>

      {/* ===== CREATE MODAL ===== */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo công việc mới"
        right={
          <button
            onClick={() => setCreateOpen(false)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded border hover:bg-gray-50"
          >
            <X size={16} /> Huỷ
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-2xl p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Nội dung công việc</div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Tiêu đề</div>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="VD: Kiểm tra an toàn kho hóa chất"
                />
              </div>

              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-1">Mô tả</div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border bg-white min-h-[140px] focus:outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="- Mục tiêu\n- Tiêu chí hoàn thành (DoD)\n- Phụ thuộc / rủi ro"
                />
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">Thông tin & Deadline</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Loại</div>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
                  >
                    {ISSUE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Ưu tiên</div>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
                  >
                    {PRIORITY.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Deadline</div>
                  <input
                    type="date"
                    value={form.due_to}
                    onChange={(e) => setForm((p) => ({ ...p, due_to: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border"
                  />
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Ước tính (giờ)</div>
                  <input
                    type="number"
                    min={0}
                    value={form.originalEstimate}
                    onChange={(e) => setForm((p) => ({ ...p, originalEstimate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Người phụ trách (Leader)</div>

              {usersLoading ? (
                <div className="text-sm text-gray-600">Đang tải danh sách người dùng...</div>
              ) : (
                <UserSelectSingle
                  users={users}
                  value={form.leaderId}
                  onChange={(id) => setForm((p) => ({ ...p, leaderId: id }))}
                />
              )}

              {form.leaderId && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-gray-500">Leader đã chọn:</span>
                  <AvatarChip
                    name={
                      users.find((u) => Number(u.id) === Number(form.leaderId))?.fullName ||
                      users.find((u) => Number(u.id) === Number(form.leaderId))?.name ||
                      users.find((u) => Number(u.id) === Number(form.leaderId))?.username ||
                      `User #${form.leaderId}`
                    }
                    active
                    onClick={() => setForm((p) => ({ ...p, leaderId: null }))}
                  />
                  <span className="text-xs text-gray-500">(bấm avatar để bỏ chọn)</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">

            <div className="bg-gray-50 border rounded-2xl p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">Thành viên tham gia</div>

              {usersLoading ? (
                <div className="text-sm text-gray-600">Đang tải danh sách người dùng...</div>
              ) : users.length === 0 ? (
                <div className="text-sm text-gray-600">Chưa có người dùng.</div>
              ) : (
                <MembersPicker
                  users={users}
                  leaderId={form.leaderId}
                  memberIds={form.memberIds}
                  onAdd={addMember}
                  onRemove={removeMember}
                />
              )}

              <div className="mt-3 text-xs text-gray-600">
                * Hệ thống tự đảm bảo: nếu bạn chọn Leader, Leader sẽ được thêm vào danh sách thành viên.
              </div>
            </div>

            <div className="pt-1">

              <button
                onClick={createTask}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-green-700 text-white hover:bg-green-800"
              >
                <Plus size={18} /> Tạo công việc
              </button>

              <div className="text-xs text-gray-500 mt-2">
                * Sau khi tạo, task nằm ở cột <b>To Do</b>.
                {/* Nếu bạn bật bulk assign */}
                {/* Hệ thống sẽ gọi <code>/users-assign/bulk</code> để gán leader & thành viên. */}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <footer className="text-center text-xs text-gray-500 pt-6">
        © {new Date().getFullYear()} • Tiến độ công việc (Kanban + Deadline)
      </footer>
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
