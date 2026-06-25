import { ns } from "../types";

export const history = ns({
  en: {
    // Page header
    title: "Application History",
    subtitle: "Track every request you've submitted",
    searchPlaceholder: "Search by service or reference number...",

    // Stats
    statTotal: "Total",
    statApproved: "Approved",
    statInReview: "In Review",
    statRejected: "Rejected",

    // Filters
    filterAll: "All",
    filterInReview: "In Review",
    filterApproved: "Approved",
    filterRejected: "Rejected",

    // Status labels
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusInReview: "In Review",

    // List rows
    ref: "Ref",
    stepProgress: "Step {current} of {total} · {label}",
    submittedOn: "Submitted {date}",
    viewDetails: "View details",

    // Empty state
    emptyTitle: "No applications found",
    emptySubtitle: "Try a different filter or search",

    // Detail header
    backToHistory: "Back to history",
    applicationLabel: "Application",

    // Status hero
    approvedHeadline: "Application approved",
    approvedSub: "Your document is ready to download.",
    rejectedHeadline: "Application rejected",
    rejectedSub: "Please review the reason below and resubmit.",
    pendingHeadline: "Application in review",
    pendingSub: "Officials are currently processing your request.",
    overallProgress: "Overall progress",

    // Actions
    downloadDocument: "Download document",
    fixAndResubmit: "Fix & resubmit",
    refreshStatus: "Refresh status",
    contactOfficer: "Contact officer",
    reuploadDocument: "Re-upload document",

    // Rejection section
    whyRejected: "Why was this rejected?",
    howToFix: "How to fix it",

    // Timeline
    applicationProgress: "Application progress",
    eta: "ETA {value}",

    // Application info
    applicationInfo: "Application info",
    referenceNumber: "Reference number",
    submitted: "Submitted",
    processingOffice: "Processing office",
    serviceFee: "Service fee",

    // Services (demo data labels)
    serviceResidentCertificate: "Resident Certificate",
    serviceBiographyCv: "Biography / CV",
    serviceBirthCertificate: "Birth Certificate",
    serviceGeneralApplication: "General Application",

    // Offices (demo data labels)
    officeVientianeDistrict: "Vientiane Capital — District Office",
    officeMinistryOfLabour: "Ministry of Labour",
    officeCivilRegistryVientiane: "Civil Registry — Vientiane",
    officeDistrictAdministrative: "District Administrative Office",

    // Timeline step labels (demo data labels)
    stepSubmitted: "Submitted",
    stepUnderReview: "Under Review",
    stepDocumentVerified: "Document Verified",
    stepApproved: "Approved",
    stepRejected: "Rejected",
    dateEstimatedDays: "Estimated 2 days",
    datePending: "—",

    // Estimated completion (demo data labels)
    eta23BusinessDays: "2–3 business days",

    // Rejection reason & fix steps (demo data labels)
    rejectionReasonUnclearId:
      "The uploaded identity document is unclear and partly cropped. Officials cannot verify your full name and ID number.",
    fixStepRescan: "Re-scan your National ID using good lighting, no shadows.",
    fixStepCorners: "Make sure all four corners of the card are visible.",
    fixStepResolution:
      "Use a resolution of at least 1080p (JPG or PDF, max 5MB).",
    fixStepReupload: "Re-upload the document and re-submit the application.",
  },
  lo: {
    // Page header
    title: "ປະຫວັດການຍື່ນຄຳຮ້ອງ",
    subtitle: "ຕິດຕາມທຸກຄຳຮ້ອງທີ່ທ່ານໄດ້ຍື່ນ",
    searchPlaceholder: "ຄົ້ນຫາຕາມບໍລິການ ຫຼື ເລກອ້າງອີງ...",

    // Stats
    statTotal: "ທັງໝົດ",
    statApproved: "ອະນຸມັດແລ້ວ",
    statInReview: "ກຳລັງກວດສອບ",
    statRejected: "ຖືກປະຕິເສດ",

    // Filters
    filterAll: "ທັງໝົດ",
    filterInReview: "ກຳລັງກວດສອບ",
    filterApproved: "ອະນຸມັດແລ້ວ",
    filterRejected: "ຖືກປະຕິເສດ",

    // Status labels
    statusApproved: "ອະນຸມັດແລ້ວ",
    statusRejected: "ຖືກປະຕິເສດ",
    statusInReview: "ກຳລັງກວດສອບ",

    // List rows
    ref: "ອ້າງອີງ",
    stepProgress: "ຂັ້ນຕອນ {current} ຈາກ {total} · {label}",
    submittedOn: "ຍື່ນເມື່ອ {date}",
    viewDetails: "ເບິ່ງລາຍລະອຽດ",

    // Empty state
    emptyTitle: "ບໍ່ພົບຄຳຮ້ອງ",
    emptySubtitle: "ລອງປ່ຽນຕົວກັ່ນຕອງ ຫຼື ການຄົ້ນຫາ",

    // Detail header
    backToHistory: "ກັບໄປປະຫວັດ",
    applicationLabel: "ຄຳຮ້ອງ",

    // Status hero
    approvedHeadline: "ຄຳຮ້ອງໄດ້ຮັບການອະນຸມັດ",
    approvedSub: "ເອກະສານຂອງທ່ານພ້ອມໃຫ້ດາວໂຫຼດແລ້ວ.",
    rejectedHeadline: "ຄຳຮ້ອງຖືກປະຕິເສດ",
    rejectedSub: "ກະລຸນາກວດເບິ່ງເຫດຜົນດ້ານລຸ່ມ ແລ້ວຍື່ນຄືນໃໝ່.",
    pendingHeadline: "ຄຳຮ້ອງກຳລັງຖືກກວດສອບ",
    pendingSub: "ເຈົ້າໜ້າທີ່ກຳລັງດຳເນີນການຄຳຮ້ອງຂອງທ່ານ.",
    overallProgress: "ຄວາມຄືບໜ້າລວມ",

    // Actions
    downloadDocument: "ດາວໂຫຼດເອກະສານ",
    fixAndResubmit: "ແກ້ໄຂ ແລະ ຍື່ນຄືນ",
    refreshStatus: "ໂຫຼດສະຖານະໃໝ່",
    contactOfficer: "ຕິດຕໍ່ເຈົ້າໜ້າທີ່",
    reuploadDocument: "ອັບໂຫຼດເອກະສານຄືນໃໝ່",

    // Rejection section
    whyRejected: "ເປັນຫຍັງຈຶ່ງຖືກປະຕິເສດ?",
    howToFix: "ວິທີແກ້ໄຂ",

    // Timeline
    applicationProgress: "ຄວາມຄືບໜ້າຂອງຄຳຮ້ອງ",
    eta: "ຄາດວ່າ {value}",

    // Application info
    applicationInfo: "ຂໍ້ມູນຄຳຮ້ອງ",
    referenceNumber: "ເລກອ້າງອີງ",
    submitted: "ຍື່ນເມື່ອ",
    processingOffice: "ຫ້ອງການທີ່ດຳເນີນການ",
    serviceFee: "ຄ່າບໍລິການ",

    // Services (demo data labels)
    serviceResidentCertificate: "ໃບຢັ້ງຢືນທີ່ຢູ່ອາໄສ",
    serviceBiographyCv: "ປະຫວັດຫຍໍ້ / CV",
    serviceBirthCertificate: "ໃບຢັ້ງຢືນການເກີດ",
    serviceGeneralApplication: "ຄຳຮ້ອງທົ່ວໄປ",

    // Offices (demo data labels)
    officeVientianeDistrict: "ນະຄອນຫຼວງວຽງຈັນ — ຫ້ອງການເມືອງ",
    officeMinistryOfLabour: "ກະຊວງແຮງງານ",
    officeCivilRegistryVientiane: "ທະບຽນພົນລະເມືອງ — ວຽງຈັນ",
    officeDistrictAdministrative: "ຫ້ອງການປົກຄອງເມືອງ",

    // Timeline step labels (demo data labels)
    stepSubmitted: "ຍື່ນແລ້ວ",
    stepUnderReview: "ກຳລັງກວດສອບ",
    stepDocumentVerified: "ກວດສອບເອກະສານແລ້ວ",
    stepApproved: "ອະນຸມັດແລ້ວ",
    stepRejected: "ຖືກປະຕິເສດ",
    dateEstimatedDays: "ຄາດວ່າ 2 ມື້",
    datePending: "—",

    // Estimated completion (demo data labels)
    eta23BusinessDays: "2–3 ມື້ລັດຖະການ",

    // Rejection reason & fix steps (demo data labels)
    rejectionReasonUnclearId:
      "ເອກະສານຢັ້ງຢືນຕົວຕົນທີ່ອັບໂຫຼດບໍ່ຊັດເຈນ ແລະ ຖືກຕັດບາງສ່ວນ. ເຈົ້າໜ້າທີ່ບໍ່ສາມາດກວດສອບຊື່ເຕັມ ແລະ ເລກບັດປະຈຳຕົວຂອງທ່ານໄດ້.",
    fixStepRescan: "ສະແກນບັດປະຈຳຕົວແຫ່ງຊາດຄືນໃໝ່ ໂດຍໃຊ້ແສງສະຫວ່າງດີ ບໍ່ມີເງົາ.",
    fixStepCorners: "ໃຫ້ແນ່ໃຈວ່າເຫັນທັງສີ່ມຸມຂອງບັດ.",
    fixStepResolution: "ໃຊ້ຄວາມລະອຽດຢ່າງໜ້ອຍ 1080p (JPG ຫຼື PDF, ສູງສຸດ 5MB).",
    fixStepReupload: "ອັບໂຫຼດເອກະສານຄືນໃໝ່ ແລ້ວຍື່ນຄຳຮ້ອງອີກຄັ້ງ.",
  },
});
