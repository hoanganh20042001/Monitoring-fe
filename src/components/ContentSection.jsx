import { useState } from "react";

import brigade1 from "../assets/brigade1.jpg";
import brigade2 from "../assets/brigade2.jpg";
import brigade3 from "../assets/brigade3.jpg";
import brigade4 from "../assets/brigade4.jpg";

export default function ContentSection({ tab }) {
  const [selectedItem, setSelectedItem] = useState(null);

  // ========================== DỮ LIỆU DEMO ============================= //
  const data = {
    home: [
      { title: "Tập huấn phòng hóa", desc: "Đào tạo chuyên sâu kỹ thuật tẩy độc.", img: brigade1, detail: "Chi tiết nội dung tập huấn..." },
      { title: "Diễn tập CBRN", desc: "Ứng phó sự cố hóa chất quy mô lớn.", img: brigade2, detail: "Chi tiết diễn tập..." },
      { title: "Khử khuẩn môi trường", desc: "Khử trùng diện rộng phòng chống dịch.", img: brigade3, detail: "Chi tiết khử khuẩn..." },
      { title: "Xử lý rò rỉ khí độc", desc: "Triển khai lực lượng CBRN cơ động.", img: brigade4, detail: "Chi tiết xử lý rò rỉ..." },
      { title: "Huấn luyện chiến sĩ mới", desc: "Rèn luyện bản lĩnh – kỹ thuật chiến đấu.", img: brigade2, detail: "Chi tiết huấn luyện..." },
      { title: "Kiểm tra phóng xạ", desc: "Giám sát môi trường định kỳ.", img: brigade1, detail: "Chi tiết kiểm tra..." },
      { title: "Khử độc vùng công nghiệp", desc: "Bảo đảm an toàn khu vực nhà máy.", img: brigade3, detail: "Chi tiết khử độc..." },
      { title: "Hội thao phòng hóa", desc: "Giao lưu – rèn luyện thể lực.", img: brigade4, detail: "Chi tiết hội thao..." },
      { title: "Trang bị mới", desc: "Cập nhật thiết bị phòng hóa hiện đại.", img: brigade2, detail: "Chi tiết trang bị..." },
    ],

    news: [
      { title: "Huấn luyện phòng hóa 2025", desc: "Tổ chức huấn luyện tại miền Trung.", img: brigade1, detail: "Chi tiết bài viết huấn luyện 2025..." },
      { title: "Diễn tập ứng phó hóa chất", desc: "Triển khai tại KCN Dung Quất.", img: brigade2, detail: "Toàn bộ nội dung diễn tập..." },
      { title: "Hội thao kỹ thuật", desc: "Các đơn vị tranh tài chuyên môn.", img: brigade3, detail: "Chi tiết hội thao..." },
      { title: "Khen thưởng chiến sĩ", desc: "Tuyên dương 12 cá nhân xuất sắc.", img: brigade4, detail: "Danh sách khen thưởng..." },
      { title: "Tiếp nhận trang bị mới", desc: "Nhiều thiết bị hiện đại được cấp.", img: brigade1, detail: "Các khí tài được tiếp nhận..." },
      { title: "Dân vận khu dân cư", desc: "Tuyên truyền an toàn hóa chất.", img: brigade2, detail: "Nội dung dân vận chi tiết..." },
    ],

    images: Array(12).fill(0).map((_, i) => ({
      title: `Hình ảnh hoạt động ${i + 1}`,
      desc: "Ảnh minh họa hoạt động phòng hóa.",
      img: [brigade1, brigade2, brigade3, brigade4][i % 4],
      detail: "Mô tả chi tiết hình ảnh hoạt động."
    })),

    videos: Array(6).fill(0).map((_, i) => ({
      title: `Video ${i + 1}`,
      desc: "Video tư liệu hoạt động.",
      img: [brigade1, brigade2, brigade3, brigade4][i % 4],
      url: [
        "https://www.youtube.com/embed/ysz5S6PUM-U",
        "https://www.youtube.com/embed/O5A5WzrIc6E",
      ][i % 2],
      detail: "Giải thích nội dung video."
    })),

    docs: Array(10).fill(0).map((_, i) => ({
      title: `Văn bản số ${100 + i}`,
      desc: "Tài liệu chỉ đạo - báo cáo.",
      img: brigade1,
      detail: "Nội dung văn bản chi tiết..."
    })),
  };

  const items = data[tab] || data.home;

  // ========================== TRANG CHI TIẾT ============================= //
  if (selectedItem) {
    return (
      <div className="p-6">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">
          <span className="text-[#1E90FF] font-semibold cursor-pointer" onClick={() => setSelectedItem(null)}>
            ← Quay lại
          </span>
          {" / "}
          <span className="font-bold">{selectedItem.title}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#1E90FF] mb-4">{selectedItem.title}</h1>

        {/* Image / Video */}
        {selectedItem.url ? (
          <iframe
            src={selectedItem.url}
            className="w-full h-[400px] rounded-xl shadow mb-6"
          />
        ) : (
          <img src={selectedItem.img} className="w-full rounded-xl shadow mb-6" />
        )}

        {/* Detail text */}
        <p className="text-gray-700 text-lg leading-relaxed">
          {selectedItem.detail}
        </p>
      </div>
    );
  }

  // ========================== DANH SÁCH 3×3 ============================= //

  return (
    <div>
      <h2 className="text-3xl font-bold text-[#C1121F] mb-6 capitalize">
        {tab === "home" ? "Nội dung nổi bật" :
         tab === "news" ? "Tin tức" :
         tab === "images" ? "Thư viện hình ảnh" :
         tab === "videos" ? "Phim - Video" :
         "Tài liệu - Văn bản"}
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => setSelectedItem(item)}
            className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg 
                       hover:shadow-2xl hover:scale-[1.05] transition overflow-hidden cursor-pointer"
          >
            {item.url ? (
              <iframe src={item.url} className="w-full h-48 rounded-t-xl" />
            ) : (
              <img src={item.img} className="w-full h-48 object-cover rounded-t-xl" />
            )}

            <div className="p-4">
              <h3 className="text-xl font-semibold text-[#1E90FF]">{item.title}</h3>
              <p className="text-gray-700 text-sm mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
