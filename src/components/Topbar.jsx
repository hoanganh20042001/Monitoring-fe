import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut,
  X,
  ClipboardList,
  KeyRound,
  AtSign,
  ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logoBCHH from "../assets/logo-bchh.png";

import { getByUser } from "../api/task";
import { getMe, changePassMe } from "../api/users";

// ✅ Notification component
import Notification from "./Notification.jsx";

function formatDateTime(d) {
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export default function Topbar({ onToggleSidebar }) {
  const GREEN = "#2E7D32";
  const RED = "#DC2626";
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const wrapRef = useRef(null);

  // dropdown
  const [openProfile, setOpenProfile] = useState(false);
  const [openNoti, setOpenNoti] = useState(false);

  // tasks notify
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksErr, setTasksErr] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // profile modal
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState("info"); // info | pass
  const [loadingMe, setLoadingMe] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [profileErr, setProfileErr] = useState(null);

  const [me, setMe] = useState(null);
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });

  // ✅ show/hide password states
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ✅ toast notification state
  const [noti, setNoti] = useState(null);
  // noti = { type: "success" | "error" | "warning", message: string }

  // ========= Fetch tasks =========
  const fetchMyTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      setTasksErr(null);

      const res = await getByUser();
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : payload?.data || [];

      setTasks(list);
      setLastUpdated(new Date());
    } catch (e) {
      setTasksErr(e?.message || "Không tải được công việc");
      setTasks([]);
      setLastUpdated(new Date());
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // mount / reload
  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  // auth user changed
  useEffect(() => {
    if (user) fetchMyTasks();
  }, [user, fetchMyTasks]);

  // focus / visible
  useEffect(() => {
    const onFocus = () => fetchMyTasks();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchMyTasks();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchMyTasks]);

  // tasks changed event
  useEffect(() => {
    const onTasksChanged = () => fetchMyTasks();
    window.addEventListener("tasks:changed", onTasksChanged);
    return () => window.removeEventListener("tasks:changed", onTasksChanged);
  }, [fetchMyTasks]);

  // polling (tuỳ chọn)
  useEffect(() => {
    const t = setInterval(() => fetchMyTasks(), 30000);
    return () => clearInterval(t);
  }, [fetchMyTasks]);

  // click outside close dropdown
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setOpenNoti(false);
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const notiCount = useMemo(() => tasks.length, [tasks]);
  const bellColor = notiCount > 0 ? RED : GREEN;

  // ========= Profile: open modal & load me =========
  const openProfileEditor = async () => {
    try {
      setOpenProfile(false);
      setOpenNoti(false);
      setProfileErr(null);
      setProfileTab("info");
      setOpenProfileModal(true);

      setLoadingMe(true);
      const res = await getMe();
      const payload = res?.data ?? res;
      const meData = payload?.user || payload;

      setMe(meData);

      if (typeof setUser === "function" && meData) {
        setUser((prev) => ({ ...(prev || {}), ...(meData || {}) }));
      }
    } catch (e) {
      setProfileErr(e?.message || "Không tải được thông tin cá nhân");
      setMe(null);
    } finally {
      setLoadingMe(false);
    }
  };

  const submitChangePass = async () => {
    try {
      setProfileErr(null);

      const { oldPassword, newPassword, confirm } = passForm;
      if (!oldPassword || !newPassword) {
        setProfileErr("Vui lòng nhập mật khẩu cũ và mật khẩu mới.");
        setNoti({
          type: "warning",
          message: "Vui lòng nhập mật khẩu cũ và mật khẩu mới.",
        });
        return;
      }
      if (String(newPassword).length < 6) {
        setProfileErr("Mật khẩu mới tối thiểu 6 ký tự.");
        setNoti({
          type: "warning",
          message: "Mật khẩu mới tối thiểu 6 ký tự.",
        });
        return;
      }
      if (newPassword !== confirm) {
        setProfileErr("Xác nhận mật khẩu mới không khớp.");
        setNoti({
          type: "warning",
          message: "Xác nhận mật khẩu mới không khớp.",
        });
        return;
      }

      setSavingPass(true);

      await changePassMe({ oldPassword, newPassword });

      setPassForm({ oldPassword: "", newPassword: "", confirm: "" });

      // ✅ success toast
      setNoti({ type: "success", message: "Đổi mật khẩu thành công!" });

      // ✅ reset eye state (optional)
      setShowOldPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);

      // ✅ close modal after a tick (avoid re-render issues)
      setTimeout(() => setOpenProfileModal(false), 100);

      fetchMyTasks();
    } catch (e) {
      const msg = e?.message || "Đổi mật khẩu thất bại";
      setProfileErr(msg);
      setNoti({ type: "error", message: msg });
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = () => {
    logout();
    setOpenProfile(false);
    setOpenNoti(false);
    setTasks([]);
    setLastUpdated(null);
    setTasksErr(null);
    setMe(null);
    setTimeout(() => (window.location.href = "/home"), 200);
  };

  const displayName = user?.name || user?.username || "Khách";

  return (
    <>
      <header
        ref={wrapRef}
        className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between h-16 px-6">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 hover:bg-green-100 rounded-md transition"
              onClick={onToggleSidebar}
            >
              <Menu size={24} color={GREEN} />
            </button>

            <img
              src={logoBCHH}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="hidden sm:block font-semibold text-yellow-700">
              BINH CHỦNG HÓA HỌC
            </span>
          </div>

          {/* CENTER */}
          <h1
            className="flex-1 text-center text-2xl md:text-3xl font-extrabold uppercase tracking-wide"
            style={{ color: GREEN }}
          >
            HỆ THỐNG THEO DÕI NỒNG ĐỘ HÓA CHẤT
          </h1>

          {/* RIGHT */}
          <div className="flex items-center gap-4 relative">
            {/* ===== NOTIFICATIONS ===== */}
            <div className="relative">
              <button
                className="p-2 hover:bg-green-100 rounded-md transition relative"
                onClick={() => {
                  setOpenProfile(false);
                  setOpenNoti((v) => !v);
                }}
                title={`Cập nhật: ${formatDateTime(lastUpdated)}`}
              >
                <Bell size={20} color={bellColor} />
                {notiCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[11px] min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white flex items-center justify-center">
                    {notiCount > 99 ? "99+" : notiCount}
                  </span>
                )}
              </button>

              {openNoti && (
                <div className="absolute right-0 mt-2 w-[380px] bg-white border border-green-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-green-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-green-700 flex items-center gap-2">
                        <ClipboardList size={16} color={GREEN} />
                        Việc chưa hoàn thành ({notiCount})
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Cập nhật: {formatDateTime(lastUpdated)}
                        {loadingTasks ? " • đang tải..." : ""}
                      </div>
                    </div>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setOpenNoti(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-auto">
                    {tasksErr && (
                      <div className="px-4 py-3 text-sm text-red-600">
                        {tasksErr}
                      </div>
                    )}

                    {!tasksErr && tasks.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-600">
                        Không có công việc nào chưa hoàn thành 🎉
                      </div>
                    )}

                    {!tasksErr &&
                      tasks.map((t) => (
                        <button
                          key={t.id}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 border-b last:border-b-0"
                          onClick={() => {
                            setOpenNoti(false);
                            navigate(`/tasks/${t.id}`);
                          }}
                        >
                          <div className="text-sm font-semibold text-gray-800 line-clamp-1">
                            {t.title || t.name || `Task #${t.id}`}
                          </div>
                          <div className="mt-1 text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                            {t.status && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100">
                                {t.status}
                              </span>
                            )}
                            {t.priority && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100">
                                {t.priority}
                              </span>
                            )}
                            {t.due_from && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100">
                                Hạn: {String(t.due_from)}
                              </span>
                            )}
                            {Number(t.overdue) === 1 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                                Quá hạn
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* ===== PROFILE ===== */}
            <div className="relative">
              <button
                onClick={() => {
                  setOpenNoti(false);
                  setOpenProfile((v) => !v);
                }}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg transition border-green-300 hover:bg-green-50"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 ring-1 ring-green-300 flex items-center justify-center overflow-hidden">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} color={GREEN} />
                  )}
                </div>
                <span
                  className="hidden sm:inline font-semibold"
                  style={{ color: GREEN }}
                >
                  {displayName}
                </span>
                <ChevronDown size={16} color={GREEN} />
              </button>

              {openProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-green-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-green-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 ring-1 ring-green-300 flex items-center justify-center overflow-hidden">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={18} color={GREEN} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-green-700">
                        {displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.username ? `@${user.username}` : ""}
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-green-50 text-green-700 font-medium transition"
                    onClick={openProfileEditor}
                  >
                    <User size={16} color={GREEN} />
                    Thông tin cá nhân
                  </button>

                  <button
                    className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-green-50 text-green-700 font-medium transition"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} color={GREEN} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= PROFILE MODAL ================= */}
      {openProfileModal && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-green-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-green-100 flex items-center justify-between">
              <div className="font-semibold text-green-700">
                Thông tin cá nhân
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setOpenProfileModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pt-4 flex gap-2">
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                  profileTab === "info"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setProfileTab("info")}
              >
                Thông tin
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${
                  profileTab === "pass"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setProfileTab("pass")}
              >
                <KeyRound size={16} /> Đổi mật khẩu
              </button>
            </div>

            <div className="p-5 space-y-4">
              {profileErr && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {profileErr}
                </div>
              )}

              {profileTab === "info" && (
                <>
                  {loadingMe ? (
                    <div className="text-sm text-gray-600">Đang tải...</div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <User size={16} className="text-green-600" />
                          <span>Họ tên</span>
                        </div>
                        <div className="mt-1 text-gray-800 font-semibold">
                          {me?.fullname || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <AtSign size={16} className="text-green-600" />
                          <span>Tên đăng nhập</span>
                        </div>
                        <div className="mt-1 text-gray-800 font-semibold">
                          {me?.username || "—"}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                          onClick={() => setOpenProfileModal(false)}
                        >
                          Đóng
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {profileTab === "pass" && (
                <>
                  {/* OLD PASS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu cũ
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPass ? "text" : "password"}
                        className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-200"
                        value={passForm.oldPassword}
                        onChange={(e) =>
                          setPassForm((p) => ({
                            ...p,
                            oldPassword: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowOldPass((v) => !v)}
                        aria-label="Toggle password visibility"
                      >
                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {/* NEW PASS */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-200"
                          value={passForm.newPassword}
                          onChange={(e) =>
                            setPassForm((p) => ({
                              ...p,
                              newPassword: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowNewPass((v) => !v)}
                          aria-label="Toggle password visibility"
                        >
                          {showNewPass ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CONFIRM PASS */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nhập lại mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? "text" : "password"}
                          className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-200"
                          value={passForm.confirm}
                          onChange={(e) =>
                            setPassForm((p) => ({
                              ...p,
                              confirm: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowConfirmPass((v) => !v)}
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmPass ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                      onClick={() => setOpenProfileModal(false)}
                      disabled={savingPass}
                    >
                      Huỷ
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-60"
                      onClick={submitChangePass}
                      disabled={savingPass}
                    >
                      {savingPass ? "Đang đổi..." : "Đổi mật khẩu"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ TOAST NOTIFICATION */}
      {noti && (
        <Notification
          type={noti.type}
          message={noti.message}
          onClose={() => setNoti(null)}
        />
      )}
    </>
  );
}
