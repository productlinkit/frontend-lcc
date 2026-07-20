/*
 * Single source of truth for News & Announcements — used by the home slider,
 * the /news list, and the /news/:id detail page.
 *
 * Taxonomy (4 mutually-exclusive categories, all AA-contrast on their tint):
 *   announcement — official notices: policy, law, scheduled maintenance
 *   service      — a public service that is new or has changed
 *   security     — account / identity protection
 *   event        — happenings, workshops, public programmes
 *
 * Article text lives here (bilingual) rather than in the i18n dictionary so a
 * writer can add an item in one place; UI chrome strings stay in the `news` ns.
 */

export type NewsCategory = "announcement" | "service" | "security" | "event";

export interface NewsCategoryMeta {
  color: string; // text/icon colour — measured >= 4.5:1 on `bg`
  bg: string;
  en: string;
  lo: string;
}

export const NEWS_CATEGORIES: Record<NewsCategory, NewsCategoryMeta> = {
  announcement: { color: "#344EAD", bg: "#EEF2FF", en: "Announcement", lo: "ປະກາດ" },
  service: { color: "#15803D", bg: "#DCFCE7", en: "Service", lo: "ບໍລິການ" },
  security: { color: "#B91C1C", bg: "#FEE2E2", en: "Security", lo: "ຄວາມປອດໄພ" },
  event: { color: "#0369A1", bg: "#E0F2FE", en: "Event", lo: "ກິດຈະກຳ" },
};

interface NewsCopy {
  title: string;
  desc: string; // one-line summary for cards
  body: string[]; // full article paragraphs for the detail page
}

export interface NewsItem {
  id: number;
  category: NewsCategory;
  img: string; // Unsplash photo id
  date: { en: string; lo: string };
  /** Optional in-app destination this article points to (a service/account tab). */
  relatedTab?: string;
  en: NewsCopy;
  lo: NewsCopy;
}

/** Unsplash URL for a photo id at a given width. */
export function newsImage(id: string, width = 520) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;
}

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    category: "announcement",
    img: "1486406146926-c627a92ad1ab",
    date: { en: "10 Apr 2026", lo: "10 ເມສາ 2026" },
    relatedTab: "account",
    en: {
      title: "New Digital Identity System launching August 2026",
      desc: "A comprehensive LaoID framework rolls out nationwide with faster verification.",
      body: [
        "The Ministry of Interior has confirmed that a new nationwide digital identity framework, LaoID, will begin its phased rollout in August 2026. The system links every citizen's civil-registration record to a single verified profile used across all public services.",
        "Once activated, your name, unique identification number and nationality are filled in automatically on every application form, removing the need to re-enter or re-upload the same details for each request.",
        "Existing accounts will be upgraded automatically. Citizens will be invited to verify their identity in person at any district office, or remotely using the in-app QR verification, before the old identity numbers are retired at the end of 2026.",
      ],
    },
    lo: {
      title: "ລະບົບເອກະລັກດິຈິຕອນໃໝ່ ເລີ່ມໃຊ້ ສິງຫາ 2026",
      desc: "ກອບ LaoID ແບບຄົບວົງຈອນ ເລີ່ມໃຊ້ທົ່ວປະເທດ ພ້ອມການຢືນຢັນທີ່ໄວຂຶ້ນ.",
      body: [
        "ກະຊວງພາຍໃນ ໄດ້ຢືນຢັນວ່າ ກອບເອກະລັກດິຈິຕອນໃໝ່ທົ່ວປະເທດ LaoID ຈະເລີ່ມນຳໃຊ້ແບບເປັນໄລຍະ ໃນເດືອນສິງຫາ 2026. ລະບົບເຊື່ອມຕໍ່ຂໍ້ມູນທະບຽນພົນລະເມືອງຂອງແຕ່ລະຄົນ ເຂົ້າກັບໂປຣໄຟລ໌ທີ່ຢືນຢັນແລ້ວອັນດຽວ ທີ່ໃຊ້ໄດ້ກັບທຸກການບໍລິການສາທາລະນະ.",
        "ເມື່ອເປີດໃຊ້ແລ້ວ, ຊື່, ເລກປະຈຳຕົວ ແລະ ສັນຊາດຂອງທ່ານ ຈະຖືກຕື່ມໃສ່ແບບຟອມອັດຕະໂນມັດ ໂດຍບໍ່ຕ້ອງປ້ອນ ຫຼື ອັບໂຫຼດຂໍ້ມູນເດີມຊ້ຳສຳລັບແຕ່ລະຄຳຮ້ອງ.",
        "ບັນຊີທີ່ມີຢູ່ແລ້ວຈະຖືກອັບເກຣດອັດຕະໂນມັດ. ພົນລະເມືອງຈະໄດ້ຮັບການເຊື້ອເຊີນໃຫ້ຢືນຢັນຕົວຕົນຕໍ່ໜ້າ ຢູ່ຫ້ອງການເມືອງໃດກໍໄດ້ ຫຼື ຜ່ານການສະແກນ QR ໃນແອັບ ກ່ອນທີ່ເລກເອກະລັກເກົ່າຈະຖືກຍົກເລີກໃນທ້າຍປີ 2026.",
      ],
    },
  },
  {
    id: 2,
    category: "announcement",
    img: "1454165804606-c3d57bc86b40",
    date: { en: "08 Apr 2026", lo: "08 ເມສາ 2026" },
    relatedTab: "family-book",
    en: {
      title: "Updated Family Registration Law now in effect",
      desc: "Civil registration procedures are simplified under the revised regulation.",
      body: [
        "The revised Family Registration Law took effect this week, simplifying several civil-registration procedures. The number of supporting documents required for common requests has been reduced, and district offices now accept digital copies verified through the platform.",
        "Family Book updates — adding a newborn, recording a marriage, or correcting an entry — can now be started online and completed with a single in-person visit for signature, where one is still required.",
        "Citizens with a pending request under the previous rules do not need to resubmit; existing applications are processed under whichever set of requirements is more favourable to the applicant.",
      ],
    },
    lo: {
      title: "ກົດໝາຍທະບຽນຄອບຄົວສະບັບປັບປຸງ ມີຜົນບັງຄັບໃຊ້ແລ້ວ",
      desc: "ຂັ້ນຕອນການທະບຽນພົນລະເມືອງ ຖືກເຮັດໃຫ້ງ່າຍຂຶ້ນ ຕາມລະບຽບໃໝ່.",
      body: [
        "ກົດໝາຍທະບຽນຄອບຄົວສະບັບປັບປຸງ ໄດ້ມີຜົນບັງຄັບໃຊ້ໃນອາທິດນີ້ ໂດຍເຮັດໃຫ້ຂັ້ນຕອນການທະບຽນພົນລະເມືອງຫຼາຍຢ່າງງ່າຍຂຶ້ນ. ຈຳນວນເອກະສານປະກອບທີ່ຕ້ອງການສຳລັບຄຳຮ້ອງທົ່ວໄປ ໄດ້ຫຼຸດລົງ ແລະ ຫ້ອງການເມືອງ ຮັບເອົາສຳເນົາດິຈິຕອນທີ່ຢືນຢັນຜ່ານແພລດຟອມແລ້ວ.",
        "ການອັບເດດປຶ້ມສຳມະໂນຄົວ — ເພີ່ມເດັກເກີດໃໝ່, ບັນທຶກການແຕ່ງງານ ຫຼື ແກ້ໄຂຂໍ້ມູນ — ດຽວນີ້ສາມາດເລີ່ມທາງອອນລາຍໄດ້ ແລະ ສຳເລັດດ້ວຍການໄປພົບຕົວຄັ້ງດຽວເພື່ອເຊັນ ໃນກໍລະນີທີ່ຍັງຕ້ອງການ.",
        "ພົນລະເມືອງທີ່ມີຄຳຮ້ອງຄ້າງຢູ່ຕາມລະບຽບເກົ່າ ບໍ່ຈຳເປັນຕ້ອງຍື່ນຄືນໃໝ່; ຄຳຮ້ອງທີ່ມີຢູ່ຈະຖືກດຳເນີນການຕາມຊຸດເງື່ອນໄຂທີ່ເປັນປະໂຫຍດແກ່ຜູ້ຍື່ນຫຼາຍກວ່າ.",
      ],
    },
  },
  {
    id: 3,
    category: "announcement",
    img: "1497366754035-f200968a6e72",
    date: { en: "05 Apr 2026", lo: "05 ເມສາ 2026" },
    en: {
      title: "Scheduled maintenance for the e-Governance Portal",
      desc: "The portal will be briefly unavailable on Sunday, 12 April for upgrades.",
      body: [
        "The e-Governance Portal will undergo scheduled maintenance on Sunday, 12 April 2026, from 01:00 to 05:00 (Vientiane time). During this window the portal and mobile app may be briefly unavailable.",
        "The maintenance upgrades the payment gateway and improves the speed of document verification. No action is required from citizens, and any application already submitted will be unaffected.",
        "We recommend completing time-sensitive payments before the maintenance window. Service will resume automatically once the upgrade is complete.",
      ],
    },
    lo: {
      title: "ການບຳລຸງຮັກສາລະບົບ e-Governance Portal",
      desc: "ລະບົບຈະບໍ່ສາມາດໃຊ້ໄດ້ຊົ່ວຄາວ ໃນວັນອາທິດທີ 12 ເມສາ ເພື່ອປັບປຸງ.",
      body: [
        "ລະບົບ e-Governance Portal ຈະດຳເນີນການບຳລຸງຮັກສາຕາມກຳນົດ ໃນວັນອາທິດທີ 12 ເມສາ 2026, ຕັ້ງແຕ່ເວລາ 01:00 ຫາ 05:00 (ເວລາວຽງຈັນ). ໃນຊ່ວງເວລານີ້ ລະບົບ ແລະ ແອັບມືຖື ອາດຈະໃຊ້ບໍ່ໄດ້ຊົ່ວຄາວ.",
        "ການບຳລຸງຮັກສານີ້ ເປັນການປັບປຸງລະບົບຊຳລະເງິນ ແລະ ເພີ່ມຄວາມໄວຂອງການຢືນຢັນເອກະສານ. ພົນລະເມືອງບໍ່ຈຳເປັນຕ້ອງເຮັດຫຍັງ ແລະ ຄຳຮ້ອງທີ່ຍື່ນໄປແລ້ວ ຈະບໍ່ໄດ້ຮັບຜົນກະທົບ.",
        "ພວກເຮົາແນະນຳໃຫ້ຊຳລະລາຍການທີ່ຮີບດ່ວນ ກ່ອນຊ່ວງເວລາບຳລຸງຮັກສາ. ການບໍລິການຈະກັບຄືນມາອັດຕະໂນມັດ ເມື່ອການປັບປຸງສຳເລັດ.",
      ],
    },
  },
  {
    id: 4,
    category: "service",
    img: "1519494026892-80bbd2d6fd0d",
    date: { en: "02 Apr 2026", lo: "02 ເມສາ 2026" },
    relatedTab: "resident-certificate",
    en: {
      title: "Residence Certificates now fully online",
      desc: "Apply, pay and receive your certificate without visiting an office.",
      body: [
        "Residence Certificates can now be requested entirely online, from application through payment to receiving the signed certificate as a downloadable PDF — no office visit required.",
        "The service shows the exact required documents and fee up front, before you commit to applying. Processing usually completes within three working days, and you are notified the moment your certificate is approved.",
        "You can track progress at any time from your History, and download the finished certificate from your Account page whenever you need it.",
      ],
    },
    lo: {
      title: "ໃບຢັ້ງຢືນທີ່ຢູ່ ສາມາດຂໍອອນລາຍໄດ້ທັງໝົດແລ້ວ",
      desc: "ຍື່ນຂໍ, ຊຳລະ ແລະ ຮັບໃບຢັ້ງຢືນ ໂດຍບໍ່ຕ້ອງໄປຫ້ອງການ.",
      body: [
        "ໃບຢັ້ງຢືນທີ່ຢູ່ອາໄສ ດຽວນີ້ສາມາດຮ້ອງຂໍທາງອອນລາຍໄດ້ທັງໝົດ ຕັ້ງແຕ່ການຍື່ນຄຳຮ້ອງ ຈົນເຖິງການຊຳລະ ແລະ ຮັບໃບຢັ້ງຢືນທີ່ເຊັນແລ້ວ ເປັນໄຟລ໌ PDF ທີ່ດາວໂຫຼດໄດ້ — ໂດຍບໍ່ຕ້ອງໄປຫ້ອງການ.",
        "ການບໍລິການສະແດງເອກະສານທີ່ຕ້ອງການ ແລະ ຄ່າທຳນຽມທີ່ແນ່ນອນ ຕັ້ງແຕ່ຕົ້ນ ກ່ອນທີ່ທ່ານຈະຕັດສິນໃຈຍື່ນ. ປົກກະຕິດຳເນີນການສຳເລັດພາຍໃນ 3 ວັນລັດຖະການ ແລະ ທ່ານຈະໄດ້ຮັບການແຈ້ງເຕືອນທັນທີເມື່ອໃບຢັ້ງຢືນອະນຸມັດ.",
        "ທ່ານສາມາດຕິດຕາມຄວາມຄືບໜ້າໄດ້ທຸກເວລາຈາກ ປະຫວັດ ແລະ ດາວໂຫຼດໃບຢັ້ງຢືນທີ່ສຳເລັດ ຈາກໜ້າບັນຊີຂອງທ່ານ ເມື່ອໃດກໍໄດ້ທີ່ຕ້ອງການ.",
      ],
    },
  },
  {
    id: 5,
    category: "security",
    img: "1487958449943-2429e8be8625",
    date: { en: "28 Mar 2026", lo: "28 ມີນາ 2026" },
    relatedTab: "account",
    en: {
      title: "Enable two-factor authentication for your account",
      desc: "Add an extra layer of protection to keep your identity safe.",
      body: [
        "Two-factor authentication (2FA) is now available for every account. With it enabled, signing in requires both your password and a one-time code sent to your registered phone, so your identity stays protected even if your password is exposed.",
        "You can turn it on from Account → Privacy & Security. Setup takes less than a minute and you only need to confirm the code once per trusted device.",
        "For a government account tied to your civil records, we strongly recommend enabling 2FA today.",
      ],
    },
    lo: {
      title: "ເປີດໃຊ້ການຢືນຢັນສອງຊັ້ນ ສຳລັບບັນຊີຂອງທ່ານ",
      desc: "ເພີ່ມການປົກປ້ອງອີກຊັ້ນ ເພື່ອຮັກສາຄວາມປອດໄພຂອງຕົວຕົນ.",
      body: [
        "ການຢືນຢັນສອງຊັ້ນ (2FA) ດຽວນີ້ມີໃຫ້ໃຊ້ສຳລັບທຸກບັນຊີ. ເມື່ອເປີດໃຊ້ແລ້ວ ການເຂົ້າສູ່ລະບົບຕ້ອງໃຊ້ທັງລະຫັດຜ່ານ ແລະ ລະຫັດຄັ້ງດຽວທີ່ສົ່ງໄປຫາເບີໂທທີ່ລົງທະບຽນໄວ້ ດັ່ງນັ້ນຕົວຕົນຂອງທ່ານຈຶ່ງໄດ້ຮັບການປົກປ້ອງ ເຖິງແມ່ນວ່າລະຫັດຜ່ານຈະຮົ່ວໄຫຼ.",
        "ທ່ານສາມາດເປີດໃຊ້ໄດ້ຈາກ ບັນຊີ → ຄວາມເປັນສ່ວນຕົວ ແລະ ຄວາມປອດໄພ. ການຕັ້ງຄ່າໃຊ້ເວລາໜ້ອຍກວ່າໜຶ່ງນາທີ ແລະ ທ່ານພຽງແຕ່ຢືນຢັນລະຫັດຄັ້ງດຽວຕໍ່ອຸປະກອນທີ່ເຊື່ອຖືໄດ້.",
        "ສຳລັບບັນຊີລັດຖະບານທີ່ຜູກກັບຂໍ້ມູນພົນລະເມືອງຂອງທ່ານ ພວກເຮົາຂໍແນະນຳຢ່າງໜັກແໜ້ນ ໃຫ້ເປີດໃຊ້ 2FA ໃນມື້ນີ້.",
      ],
    },
  },
  {
    id: 6,
    category: "event",
    img: "1541339907198-e08756dedf3f",
    date: { en: "24 Mar 2026", lo: "24 ມີນາ 2026" },
    en: {
      title: "Digital Government Week 2026 opens in Vientiane",
      desc: "Join workshops and demos showcasing new public digital services.",
      body: [
        "Digital Government Week 2026 opens this month in Vientiane, bringing together ministries, developers and citizens to showcase the country's growing catalogue of public digital services.",
        "The programme includes hands-on workshops on the LaoID system, live demonstrations of online civil-registration services, and open sessions where citizens can give feedback directly to the teams building the platform.",
        "Entry is free and open to the public. A full schedule and registration details are available at participating district offices and on the portal.",
      ],
    },
    lo: {
      title: "ອາທິດລັດຖະບານດິຈິຕອນ 2026 ເປີດຂຶ້ນທີ່ ວຽງຈັນ",
      desc: "ຮ່ວມເຝິກອົບຮົມ ແລະ ການສາທິດ ການບໍລິການສາທາລະນະດິຈິຕອນໃໝ່.",
      body: [
        "ອາທິດລັດຖະບານດິຈິຕອນ 2026 ເປີດຂຶ້ນໃນເດືອນນີ້ທີ່ວຽງຈັນ ໂດຍນຳເອົາບັນດາກະຊວງ, ນັກພັດທະນາ ແລະ ພົນລະເມືອງ ມາຮ່ວມກັນເພື່ອສະແດງ ລາຍການບໍລິການສາທາລະນະດິຈິຕອນຂອງປະເທດ ທີ່ນັບມື້ນັບເພີ່ມຂຶ້ນ.",
        "ໂປຣແກຣມປະກອບມີ ການເຝິກອົບຮົມພາກປະຕິບັດ ກ່ຽວກັບລະບົບ LaoID, ການສາທິດສົດ ຂອງການບໍລິການທະບຽນພົນລະເມືອງອອນລາຍ ແລະ ຊ່ວງເປີດກວ້າງ ທີ່ພົນລະເມືອງສາມາດໃຫ້ຄຳຄິດເຫັນໂດຍກົງແກ່ທີມງານທີ່ສ້າງແພລດຟອມ.",
        "ເຂົ້າຮ່ວມຟຣີ ແລະ ເປີດກວ້າງໃຫ້ປະຊາຊົນທົ່ວໄປ. ຕາຕະລາງເຕັມ ແລະ ລາຍລະອຽດການລົງທະບຽນ ມີຢູ່ທີ່ຫ້ອງການເມືອງທີ່ເຂົ້າຮ່ວມ ແລະ ຢູ່ໃນລະບົບ.",
      ],
    },
  },
];

export function getNewsItem(id: number): NewsItem | undefined {
  return NEWS_ITEMS.find((n) => n.id === id);
}
