export default function MainNavbar({ currentTab, setCurrentTab, setShowLogin }) {
  const menus = [
    { id: "home", label: "TRANG CHỦ" },
    { id: "news", label: "TIN TỨC" },
    { id: "images", label: "HÌNH ẢNH" },
    { id: "videos", label: "PHIM - VIDEO" },
    { id: "docs", label: "TÀI LIỆU - VĂN BẢN" },
    { id: "other", label: "TÀI LIỆU KHÁC" },
  ];

  return (
    <nav className="w-full bg-[#1E90FF] mt-6 py-4 shadow-lg flex justify-center">
      <div className="flex gap-10 items-center">

        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => setCurrentTab(menu.id)}
            className={`text-white font-bold text-lg transition hover:scale-110 ${
              currentTab === menu.id ? "border-b-2 pb-1 border-white" : ""
            }`}
          >
            {menu.label}
          </button>
        ))}

        <button
          onClick={() => setShowLogin(true)}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-bold text-white"
        >
          ĐĂNG NHẬP
        </button>
      </div>
    </nav>
  );
}
