import { Megaphone, ChevronRight } from "lucide-react";

const NEWS = [
  {
    id: 1,
    date: "10 Apr 2026",
    category: "System Update",
    categoryColor: "#344EAD",
    categoryBg: "#EEF2FF",
    title: "New Digital Identity System launching August 2026",
    desc:
      "The government announced a new comprehensive digital identity framework that will integrate all public service applications into a single platform, making it easier for citizens to access government services.",
    isNew: true,
  },
  {
    id: 2,
    date: "08 Apr 2026",
    category: "Services",
    categoryColor: "#16A34A",
    categoryBg: "#DCFCE7",
    title: "Simplified process for Resident Certificate applications",
    desc:
      "Starting this month, certificates can be fully processed online. The new streamlined process reduces the number of required documents from 8 to just 3.",
    isNew: true,
  },
  {
    id: 3,
    date: "05 Apr 2026",
    category: "Maintenance",
    categoryColor: "#D97706",
    categoryBg: "#FEF3C7",
    title: "Scheduled maintenance for e-Governance Portal",
    desc:
      "The portal will undergo maintenance on Sunday, 12 April from 00:00 to 06:00 (Vientiane time). All services will be temporarily unavailable.",
    isNew: false,
  },
  {
    id: 4,
    date: "01 Apr 2026",
    category: "Policy",
    categoryColor: "#9333EA",
    categoryBg: "#F3E8FF",
    title: "New regulations for Biography / CV submissions",
    desc:
      "The Ministry of Labour has updated requirements for official biography submissions. All CVs must now be digitally signed using the LaoGov platform.",
    isNew: false,
  },
  {
    id: 5,
    date: "28 Mar 2026",
    category: "Services",
    categoryColor: "#16A34A",
    categoryBg: "#DCFCE7",
    title: "Birth & Death Certificate processing now fully digital",
    desc:
      "Citizens can now complete the entire birth and death certificate process online, including digital signatures and official stamps.",
    isNew: false,
  },
];

export function NewsPage() {
  return (
    <div className="min-h-full">
      {/* Header */}
      <div
        className="relative px-4 pt-6 pb-6 lg:px-8"
        style={{
          background: "linear-gradient(135deg, #1A2D6B 0%, #344EAD 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">Stay informed</p>
            <h1 className="text-2xl text-white">Latest News</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 max-w-2xl space-y-4">
        {NEWS.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: item.categoryBg,
                    color: item.categoryColor,
                  }}
                >
                  {item.category}
                </span>
                {item.isNew && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
                    New
                  </span>
                )}
              </div>
              <span className="text-gray-400 text-xs">{item.date}</span>
            </div>

            <h3 className="text-gray-800 text-sm font-medium leading-snug mb-2">
              {item.title}
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>

            <button
              className="mt-3 flex items-center gap-1 text-xs font-medium"
              style={{ color: "#344EAD" }}
            >
              Read more <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}

        <div className="h-4" />
      </div>
    </div>
  );
}