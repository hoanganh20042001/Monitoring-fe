import brigade1 from "../../assets/brigade1.jpg";
import brigade2 from "../../assets/brigade2.jpg";
import brigade3 from "../../assets/brigade3.jpg";
import brigade4 from "../../assets/brigade4.jpg";

export default function HomeSection() {
  return (
    <div className="px-8 sm:px-16 py-10">

      <h2 className="text-4xl font-extrabold text-center text-[#1E90FF] mb-4">
        Lữ Đoàn Phòng Hóa 88
      </h2>

      <p className="text-center text-gray-700 text-lg max-w-3xl mx-auto mb-10">
        Đơn vị chủ lực trong công tác phòng chống hóa học – sinh học – phóng xạ – hạt nhân.
      </p>

      <div className="grid md:grid-cols-3 gap-8 mt-10">
        <Card icon="🛡️" title="Sẵn sàng chiến đấu" desc="Luôn duy trì quân số và phương tiện ở mức cao nhất." />
        <Card icon="🎯" title="Huấn luyện & diễn tập" desc="Các đợt huấn luyện hiện đại, sát thực tế chiến đấu." />
        <Card icon="🌿" title="Xử lý môi trường" desc="Tẩy độc, xử lý hóa chất và bảo vệ môi trường." />
      </div>

      <div className="mt-14">
        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
          <img src={brigade1} className="w-full h-[350px] object-cover hover:scale-105 transition duration-500" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-center text-[#1E90FF] mt-12 mb-6">
        Hình ảnh hoạt động
      </h3>

      <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6">
        {[brigade1, brigade2, brigade3, brigade4].map((img, i) => (
          <img
            key={i}
            src={img}
            className="rounded-xl shadow hover:shadow-2xl hover:scale-110 transition h-40 object-cover w-full"
          />
        ))}
      </div>
    </div>
  );
}

function Card({ icon, title, desc }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow hover:shadow-xl hover:scale-105 transform transition text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-[#1E90FF] mb-2">{title}</h3>
      <p className="text-gray-700">{desc}</p>
    </div>
  );
}
