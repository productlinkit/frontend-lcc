import logoLcc from "../../imports/logo-lcc.png";
import { useLang } from "../i18n";

// Footer columns — bilingual; links with a `tab` navigate in-app
const FOOTER_COLS = [
  {
    title: { en: "Services", lo: "ບໍລິການ" },
    links: [
      { label: { en: "All services", lo: "ການບໍລິການທັງໝົດ" }, tab: "service" },
      { label: { en: "My account", lo: "ບັນຊີຂອງຂ້ອຍ" }, tab: "account" },
      { label: { en: "History", lo: "ປະຫວັດ" }, tab: "history" },
    ],
  },
  {
    title: { en: "Support", lo: "ຊ່ວຍເຫຼືອ" },
    links: [
      { label: { en: "Help center", lo: "ສູນຊ່ວຍເຫຼືອ" } },
      { label: { en: "Contact us", lo: "ຕິດຕໍ່ພວກເຮົາ" } },
      { label: { en: "FAQ", lo: "ຄຳຖາມທີ່ພົບເລື້ອຍ" } },
    ],
  },
  {
    title: { en: "Legal", lo: "ກົດໝາຍ" },
    links: [
      { label: { en: "Privacy policy", lo: "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ" } },
      { label: { en: "Terms of service", lo: "ເງື່ອນໄຂການໃຊ້ບໍລິການ" } },
    ],
  },
] as const;

// Site footer — hidden on mobile (bottom nav takes that space there).
export function Footer({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const { lang } = useLang();
  return (
    <footer className="hidden lg:block w-full text-white" style={{ backgroundColor: "#161d3a" }}>
      <div className="max-w-screen-xl mx-auto px-8 py-12">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoLcc}
                alt="Lao Citizen Center"
                className="h-10 w-10 object-contain rounded-lg bg-white p-0.5"
              />
              <p className="font-semibold leading-tight">
                {lang === "lo" ? "ສູນພົນລະເມືອງລາວ" : "Lao Citizen Center"}
              </p>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              {lang === "lo"
                ? "ປະຕູທີ່ປອດໄພສູ່ການບໍລິການລັດຖະບານລາວ."
                : "Your secure gateway to Lao government services."}
            </p>
            <p className="text-white/35 text-xs leading-relaxed mt-4">
              {lang === "lo"
                ? "ກະຊວງພາຍໃນ · ກະຊວງປ້ອງກັນຄວາມສະຫງົບ"
                : "Ministry of Home Affairs · Ministry of Public Security"}
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title.en}>
              <h4 className="text-sm font-semibold text-white/90 mb-4">{col.title[lang]}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label.en}>
                    <button
                      onClick={() => "tab" in link && link.tab && onTabChange(link.tab)}
                      className="text-white/55 hover:text-white text-sm transition-colors"
                    >
                      {link.label[lang]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex items-center justify-between text-white/40 text-xs">
          <span>
            {lang === "lo"
              ? "© 2026 ສູນພົນລະເມືອງລາວ. ສະຫງວນລິຂະສິດ."
              : "© 2026 Lao Citizen Center. All rights reserved."}
          </span>
          <span>{lang === "lo" ? "ສປປ ລາວ" : "Lao PDR"}</span>
        </div>
      </div>
    </footer>
  );
}
