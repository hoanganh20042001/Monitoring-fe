import { useEffect, useState } from "react";
import brigade1 from "../../assets/brigade1.jpg";
import brigade2 from "../../assets/brigade2.jpg";
import brigade3 from "../../assets/brigade3.jpg";
import brigade4 from "../../assets/brigade4.jpg";

export default function Banner() {
  const images = [brigade1, brigade2, brigade3, brigade4];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex justify-center pt-6 bg-white">
      <div className="w-full max-w-4xl aspect-[16/9] overflow-hidden rounded-xl shadow-lg">
        <img
          src={images[index]}
          className="w-full h-full object-cover transition duration-700 hover:scale-105"
        />
      </div>
    </div>
  );
}
