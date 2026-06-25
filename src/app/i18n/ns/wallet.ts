import { ns } from "../types";

export const wallet = ns({
  en: {
    // Header
    title: "My Wallet",
    subtitle: "Manage your bills, payments, and balance",
    availableBalance: "Available balance",
    topUp: "Top up",
    transfer: "Transfer",

    // Quick payment
    quickPayment: "Quick payment",
    seeAll: "See all",

    // Quick action labels (keyed by action id)
    qaTopup: "Top up",
    qaTransfer: "Transfer",
    qaScan: "Scan & Pay",
    qaMobile: "Mobile Top-up",
    qaElectricity: "Electricity",
    qaWater: "Water",
    qaInternet: "Internet",
    qaFines: "Fines",

    // Bills due
    billsDue: "Bills due",
    billsSummary: "Total {total} across {count} bills",
    noBillsDue: "No bills due",
    viewAll: "View all",
    pay: "Pay",
    signInBills: "Sign in to see your bills",

    // Bill names (keyed by bill id)
    billElecName: "Electricity Bill",
    billElecDesc: "EDL — April 2026",
    billWaterName: "Water Bill",
    billWaterDesc: "Nampapa Lao — April",
    billInternetName: "Internet",
    billInternetDesc: "Lao Telecom Fiber",
    billFineName: "Traffic Fine",
    billFineDesc: "Reference TF-22841",

    // Bill due/status labels
    dueInDays: "Due in {n} days",
    overdueDays: "Overdue {n} days",

    // Recent transactions
    recentTransactions: "Recent transactions",
    history: "History",
    noRecentTransactions: "No recent transactions",
    signInActivity: "Sign in to see your activity",

    // Transaction names (keyed by transaction id)
    txTaxName: "Tax Payment",
    txTaxDesc: "Personal income tax",
    txTopupName: "Top up",
    txTopupDesc: "From BCEL Bank",
    txLicenseName: "Driver's License Fee",
    txLicenseDesc: "Renewal payment",
    txElecName: "Electricity Bill",
    txElecDesc: "EDL — March",
    txRefundName: "Refund",
    txRefundDesc: "Cancelled appointment",

    // Transaction dates
    dateToday: "Today, 09:24",
    dateYesterday: "Yesterday",
    date06Jun: "06 Jun 2026",
    date02Jun: "02 Jun 2026",
    date30May: "30 May 2026",
  },
  lo: {
    // Header
    title: "ກະເປົາເງິນຂອງຂ້ອຍ",
    subtitle: "ຈັດການໃບບິນ, ການຈ່າຍເງິນ ແລະ ຍອດເງິນຂອງທ່ານ",
    availableBalance: "ຍອດເງິນທີ່ໃຊ້ໄດ້",
    topUp: "ຕື່ມເງິນ",
    transfer: "ໂອນເງິນ",

    // Quick payment
    quickPayment: "ຈ່າຍດ່ວນ",
    seeAll: "ເບິ່ງທັງໝົດ",

    // Quick action labels
    qaTopup: "ຕື່ມເງິນ",
    qaTransfer: "ໂອນເງິນ",
    qaScan: "ສະແກນ & ຈ່າຍ",
    qaMobile: "ຕື່ມເງິນໂທລະສັບ",
    qaElectricity: "ຄ່າໄຟຟ້າ",
    qaWater: "ຄ່ານ້ຳປະປາ",
    qaInternet: "ອິນເຕີເນັດ",
    qaFines: "ຄ່າປັບໄໝ",

    // Bills due
    billsDue: "ໃບບິນທີ່ຄ້າງຈ່າຍ",
    billsSummary: "ລວມ {total} ຈາກ {count} ໃບບິນ",
    noBillsDue: "ບໍ່ມີໃບບິນຄ້າງຈ່າຍ",
    viewAll: "ເບິ່ງທັງໝົດ",
    pay: "ຈ່າຍ",
    signInBills: "ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງໃບບິນຂອງທ່ານ",

    // Bill names
    billElecName: "ໃບບິນຄ່າໄຟຟ້າ",
    billElecDesc: "ຟຟລ — ເມສາ 2026",
    billWaterName: "ໃບບິນຄ່ານ້ຳ",
    billWaterDesc: "ນ້ຳປະປາລາວ — ເມສາ",
    billInternetName: "ອິນເຕີເນັດ",
    billInternetDesc: "ໄຟເບີ ໂທລະຄົມລາວ",
    billFineName: "ຄ່າປັບໄໝຈາລະຈອນ",
    billFineDesc: "ເລກອ້າງອີງ TF-22841",

    // Bill due/status labels
    dueInDays: "ກຳນົດຈ່າຍໃນ {n} ມື້",
    overdueDays: "ເກີນກຳນົດ {n} ມື້",

    // Recent transactions
    recentTransactions: "ລາຍການລ່າສຸດ",
    history: "ປະຫວັດ",
    noRecentTransactions: "ບໍ່ມີລາຍການລ່າສຸດ",
    signInActivity: "ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງການເຄື່ອນໄຫວຂອງທ່ານ",

    // Transaction names
    txTaxName: "ການຈ່າຍພາສີ",
    txTaxDesc: "ພາສີລາຍໄດ້ບຸກຄົນ",
    txTopupName: "ຕື່ມເງິນ",
    txTopupDesc: "ຈາກທະນາຄານ BCEL",
    txLicenseName: "ຄ່າທຳນຽມໃບຂັບຂີ່",
    txLicenseDesc: "ການຈ່າຍຕໍ່ອາຍຸ",
    txElecName: "ໃບບິນຄ່າໄຟຟ້າ",
    txElecDesc: "ຟຟລ — ມີນາ",
    txRefundName: "ການຄືນເງິນ",
    txRefundDesc: "ນັດໝາຍທີ່ຍົກເລີກ",

    // Transaction dates
    dateToday: "ມື້ນີ້, 09:24",
    dateYesterday: "ມື້ວານນີ້",
    date06Jun: "06 ມິຖຸນາ 2026",
    date02Jun: "02 ມິຖຸນາ 2026",
    date30May: "30 ພຶດສະພາ 2026",
  },
});
