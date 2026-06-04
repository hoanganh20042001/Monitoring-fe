// Home.jsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ShieldAlert,
  FlaskConical,
  Biohazard,
  Radiation,
  Atom,
} from "lucide-react";
import { login as loginApi } from "../api/auth.js";
import Notification from "../components/Notification.jsx";
import coverImage from "../assets/A80.jpg";

/** Nhiều icon CBRN bay nhanh hơn (nhẹ, không che form) */
function FloatingIcons() {
  const ICONS = [Biohazard, Radiation, Atom, FlaskConical];

  // memo để tránh mỗi render lại random vị trí -> giật
  const items = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => {
      const Icon = ICONS[i % ICONS.length];

      // phân bố icon chủ yếu ở rìa để ít đè lên card
      const edge = i % 4; // 0 top, 1 right, 2 bottom, 3 left
      const rand = Math.random();
      const pad = 6; // % padding khỏi sát mép
      const edgeSpread = 100 - pad * 2;

      let left = "50%";
      let top = "50%";

      if (edge === 0) {
        left = `${pad + rand * edgeSpread}%`;
        top = `${pad + Math.random() * 18}%`;
      } else if (edge === 1) {
        left = `${80 + Math.random() * 18}%`;
        top = `${pad + rand * edgeSpread}%`;
      } else if (edge === 2) {
        left = `${pad + rand * edgeSpread}%`;
        top = `${76 + Math.random() * 18}%`;
      } else {
        left = `${pad + Math.random() * 18}%`;
        top = `${pad + rand * edgeSpread}%`;
      }

      const size = 20 + Math.random() * 22;
      const duration = 3.2 + Math.random() * 2.6; // nhanh hơn
      const delay = Math.random() * 0.9; // ít delay hơn
      const opacity = 0.25 + Math.random() * 0.35;
      const rotate = Math.random() > 0.35;

      // biên độ bay lớn hơn chút
      const dx = 18 + Math.random() * 18;
      const dy = 16 + Math.random() * 22;

      return { Icon, left, top, size, duration, delay, opacity, rotate, dx, dy };
    });
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ left: item.left, top: item.top }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: item.opacity,
            y: [0, -item.dy, 0, item.dy * 0.7, 0],
            x: [0, item.dx, -item.dx * 0.7, item.dx * 0.35, 0],
            rotate: item.rotate ? [0, 18, -14, 0] : 0,
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="rounded-2xl backdrop-blur-md border border-white/40"
            style={{
              padding: 8,
              background: "rgba(255,255,255,0.38)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
          >
            <item.Icon
              style={{ width: item.size, height: item.size }}
              className="text-emerald-700"
            />
          </div>
        </motion.div>
      ))}

      {/* Glow blobs */}
      <motion.div
        className="absolute -left-44 top-24 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ background: "rgba(16,185,129,0.30)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-44 top-8 w-[520px] h-[520px] rounded-full blur-3xl"
        style={{ background: "rgba(250,204,21,0.28)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 bottom-[-120px] -translate-x-1/2 w-[620px] h-[620px] rounded-full blur-3xl"
        style={{ background: "rgba(34,211,238,0.22)" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 7.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);

const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const data = await loginApi(
      e.target.username.value,
      e.target.password.value
    );

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    console.log("Login successful, user data:", data);

    setNotification({
      type: "success",
      message: "Đăng nhập thành công!",
    });

    const roleId = localStorage.getItem("role_id");
    console.log("User role_id:", roleId);
    setTimeout(() => {
      if (roleId === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/trang_chu";
      }
    }, 900);
  } catch (error) {
    console.error("Login error:", error);

    setNotification({
      type: "error",
      message: "Sai tên đăng nhập hoặc mật khẩu!",
    });
  }
};

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      {/* Decor icons bay */}
      <FloatingIcons />

      {/* Light grid */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(16,185,129,0.30) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(16,185,129,0.20) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />

      {/* HEADER */}
      <div className="absolute top-6 text-center w-full px-4">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="inline-flex flex-col items-center gap-2"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/75 border border-emerald-200/70 backdrop-blur">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span className="text-emerald-900 text-sm font-extrabold tracking-wide">
              CBRN
            </span>
            <Atom className="w-5 h-5 text-emerald-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-900 drop-shadow-[0_10px_25px_rgba(0,0,0,0.10)]">
             CHEMICAL CONCENTRATION MONITORING SOFTWARE
          </h1>
          <p className="text-emerald-900/70 font-semibold tracking-wide">
            PHẦN MỀM THEO DÕI NỒNG ĐỘ HÓA CHẤT
          </p>
        </motion.div>
      </div>

      {/* CARD */}
      <div className="relative z-10 w-full max-w-5xl mt-24">
        {/* glow border */}
        <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-emerald-400/30 via-amber-300/35 to-cyan-300/35 blur-xl opacity-80" />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden bg-white/80 border border-white/65 backdrop-blur-xl
                     shadow-[0_25px_60px_rgba(0,0,0,0.14)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[560px]">
            {/* LEFT IMAGE */}
            <div className="hidden md:block relative h-full">
              <motion.img
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                src={coverImage}
                alt="CBRN MEDIC"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/55 via-emerald-900/15 to-transparent" />

              <div className="absolute top-6 left-6 right-6">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/25 border border-white/35 backdrop-blur">
                  <Biohazard className="w-5 h-5 text-amber-200" />
                  <Radiation className="w-5 h-5 text-amber-200" />
                  <Atom className="w-5 h-5 text-amber-200" />
                  <span className="text-white font-extrabold tracking-wide">
                    BINH CHỦNG HÓA HỌC
                  </span>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-2xl bg-amber-300/25 border border-amber-200/30 backdrop-blur">
                    <FlaskConical className="w-6 h-6 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold tracking-wide">BCHH</p>
                    {/* <p className="text-white/85 text-sm">
                      Khu vực truy cập hệ thống tác nghiệp • CBRN MEDIC
                    </p> */}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT FORM */}
            <div className="p-8 sm:p-10 md:p-14 flex flex-col justify-center">
              <div className="text-center mb-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-sm font-extrabold">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Secure Login
                </div>

                <h2 className="text-3xl font-extrabold text-emerald-900 mt-3">
                  ĐĂNG NHẬP HỆ THỐNG
                </h2>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                {/* Username */}
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <label className="text-sm font-semibold text-emerald-900/80">
                    Tên đăng nhập
                  </label>
                  <input
                    name="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    required
                    className="w-full mt-2 px-4 py-3.5 rounded-xl border border-emerald-200
                               bg-white text-emerald-950 placeholder:text-emerald-400
                               focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300
                               outline-none text-lg transition-all shadow-sm"
                  />
                </motion.div>

                {/* Password */}
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <label className="text-sm font-semibold text-emerald-900/80">
                    Mật khẩu
                  </label>
                  <div className="relative mt-2">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-emerald-200
                                 bg-white text-emerald-950 placeholder:text-emerald-400
                                 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300
                                 outline-none text-lg transition-all shadow-sm pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 p-2 rounded-lg text-emerald-700 hover:text-emerald-900
                                 hover:bg-emerald-50 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </motion.div>

                {/* Login Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-3.5 rounded-xl font-extrabold text-lg text-white
                             bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800
                             shadow-[0_18px_40px_rgba(16,185,129,0.25)]
                             transition overflow-hidden"
                >
                  <span className="relative z-10">Đăng nhập</span>
                  <motion.span
                    className="absolute inset-0 opacity-25"
                    initial={{ x: "-60%" }}
                    animate={{ x: "60%" }}
                    transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
                    }}
                  />
                </motion.button>
              </form>

              {/* Register */}
              <motion.div className="text-center mt-6" whileHover={{ scale: 1.03 }}>
                <a
                  href="/register"
                  className="text-emerald-800 font-extrabold hover:underline underline-offset-4"
                >
                  Chưa có tài khoản? Đăng ký ngay
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* NOTIFICATION */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
