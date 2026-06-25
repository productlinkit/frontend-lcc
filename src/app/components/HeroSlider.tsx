import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import slide1 from "../../imports/image-3.png";
import slide2 from "../../imports/image-4.png";
import slide3 from "../../imports/image-5.png";
import type { Lang } from "../App";

const SLIDES = {
  en: [
    {
      id: 1,
      image: slide1,
      title: "Welcome to Lao Citizen Center",
      subtitle: "Your one-stop platform for all government services",
      tag: "Lao Citizen Center",
    },
    {
      id: 2,
      image: slide2,
      title: "Celebrating Our Rich Culture",
      subtitle: "Preserving Lao traditions through digital public services",
      tag: "Lao Culture",
    },
    {
      id: 3,
      image: slide3,
      title: "Serving Every Lao Citizen",
      subtitle: "Fast, transparent & accessible services for all",
      tag: "Citizen Services",
    },
  ],
  lo: [
    {
      id: 1,
      image: slide1,
      title: "ຍິນດີຕ້ອນຮັບສູ່ ສູນພົນລະເມືອງລາວ",
      subtitle: "ສູນກາງການບໍລິການລັດຖະບານໃນບ່ອນດຽວ",
      tag: "ສູນພົນລະເມືອງລາວ",
    },
    {
      id: 2,
      image: slide2,
      title: "ສະເຫຼີມສະຫຼອງວັດທະນະທຳອັນອຸດົມສົມບູນ",
      subtitle: "ຮັກສາປະເພນີລາວຜ່ານການບໍລິການສາທາລະນະດິຈິຕອນ",
      tag: "ວັດທະນະທຳລາວ",
    },
    {
      id: 3,
      image: slide3,
      title: "ບໍລິການພົນລະເມືອງລາວທຸກຄົນ",
      subtitle: "ໄວ, ໂປ່ງໃສ ແລະ ເຂົ້າເຖິງໄດ້ສຳລັບທຸກຄົນ",
      tag: "ບໍລິການປະຊາຊົນ",
    },
  ],
} as const;

interface HeroSliderProps {
  greeting: string;
  name: string;
  lang?: Lang;
  children?: React.ReactNode;
}

export function HeroSlider({ greeting, name, lang = "en", children }: HeroSliderProps) {
  const slides = SLIDES[lang];
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(idx);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [isTransitioning]
  );

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, goTo]);

  const slide = slides[current];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "340px" }}>
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(20,35,90,0.82) 0%, rgba(20,35,90,0.50) 55%, rgba(20,35,90,0.15) 100%)",
            }}
          />
        </div>
      ))}

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between px-6 lg:px-10 py-6 z-10">
        {/* Top: greeting */}
        <div>
          <span
            className="inline-block text-xs px-3 py-1 rounded-full mb-3 font-medium border border-white/30"
            style={{ backgroundColor: "rgba(244,163,0,0.25)", color: "#F9D97A" }}
          >
            {slide.tag}
          </span>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white/70 text-sm">{greeting},</p>
            <p className="text-white text-sm font-semibold">{name}</p>
          </div>
          <h2
            className="text-white max-w-sm leading-snug"
            style={{ fontSize: "1.25rem" }}
          >
            {slide.title}
          </h2>
          <p className="text-white/70 text-sm mt-1 max-w-xs leading-relaxed">
            {slide.subtitle}
          </p>
        </div>

        {/* Bottom: search + dots */}
        <div className="space-y-4">
          {children}
          {/* Dots + arrows */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === current ? "24px" : "8px",
                    height: "8px",
                    backgroundColor:
                      i === current ? "#F59E0B" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 border border-white/30 flex items-center justify-center transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={next}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 border border-white/30 flex items-center justify-center transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}