import { ns } from "../types";

export const auth = ns({
  en: {
    // Left panel
    brand: "Lao Citizen Center",
    brandTagline: "Information and daily-life service center for Lao citizens",
    featureRequestDocs: "Request official documents",
    featurePayFees: "Pay fees and electricity bills",
    featureTrackStatus: "Track request status",
    ministry: "Ministry of Interior · Lao PDR",

    // Back links
    back: "Back",
    backToHome: "Back to Home",

    // Headings
    welcomeBack: "Welcome Back",
    welcomeBackSub: "Sign in to access your citizen services",
    createAccount: "Create Account",
    createAccountSub: "Join Lao Citizen Center today",

    // Tabs
    login: "Login",
    register: "Register",

    // Login fields
    loginIdLabel: "Phone Number or Email",
    loginIdPlaceholder: "+856 20 XXXX XXXX or email@...",
    passwordLabel: "Password",
    forgotPassword: "Forgot password?",
    passwordPlaceholder: "Enter your password",
    securityCheckLabel: "Security Check",
    answerPlaceholder: "Answer",
    newQuestion: "New question",
    signIn: "Sign In",
    orContinueWith: "or continue with",
    continueWithGoogle: "Continue with Google",
    noAccount: "Don't have an account?",

    // Register fields
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "As on your ID card",
    phoneLabel: "Phone Number",
    phonePlaceholder: "+856 20 XXXX XXXX",
    emailLabel: "Email Address",
    optional: "(optional)",
    emailPlaceholder: "you@example.com",
    registerPasswordPlaceholder: "Min. 8 characters",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    agreePrefix: "I agree to the",
    termsOfService: "Terms of Service",
    and: "and",
    privacyPolicy: "Privacy Policy",
    agreeSuffix: "of Lao Citizen Center",
    haveAccount: "Already have an account?",

    // OTP
    otpVerification: "OTP Verification",
    otpSentTo: "We sent a 6-digit code to",
    verifyCode: "Verify Code",
    resendIn: "Resend in {seconds}s",
    resendOtp: "Resend OTP",

    // Validation
    errLoginIdRequired: "Phone number or email is required",
    errPasswordRequired: "Password is required",
    errSecurityRequired: "Please answer the security question",
    errSecurityIncorrect: "Incorrect answer, please try again",
    errFullNameRequired: "Full name is required",
    errPhoneRequired: "Phone number is required",
    errPhoneInvalid: "Enter a valid phone number",
    errEmailInvalid: "Enter a valid email address",
    errPasswordMin: "At least 8 characters",
    errConfirmRequired: "Please confirm your password",
    errPasswordMismatch: "Passwords do not match",
    errMustAgree: "You must agree to continue",
    errOtpIncomplete: "Please enter all 6 digits",
  },
  lo: {
    // Left panel
    brand: "ສູນພົນລະເມືອງລາວ",
    brandTagline: "ສູນບໍລິການດ້ານຂໍ້ມູນຂ່າວສານ ແລະ ການດຳລົງຊີວິດຂອງພົນລະເມືອງລາວ",
    featureRequestDocs: "ຮ້ອງຂໍເອກະສານລັດຖະການ",
    featurePayFees: "ຊຳລະຄ່າທຳນຽມ ແລະ ຄ່າໄຟ",
    featureTrackStatus: "ຕິດຕາມສະຖານະຄຳຮ້ອງ",
    ministry: "ກະຊວງພາຍໃນ · ສປປ ລາວ",

    // Back links
    back: "ກັບຄືນ",
    backToHome: "ກັບໄປໜ້າຫຼັກ",

    // Headings
    welcomeBack: "ຍິນດີຕ້ອນຮັບກັບມາ",
    welcomeBackSub: "ເຂົ້າສູ່ລະບົບເພື່ອໃຊ້ບໍລິການພົນລະເມືອງ",
    createAccount: "ສ້າງບັນຊີ",
    createAccountSub: "ເຂົ້າຮ່ວມສູນພົນລະເມືອງລາວມື້ນີ້",

    // Tabs
    login: "ເຂົ້າສູ່ລະບົບ",
    register: "ລົງທະບຽນ",

    // Login fields
    loginIdLabel: "ເບີໂທ ຫຼື ອີເມວ",
    loginIdPlaceholder: "+856 20 XXXX XXXX ຫຼື email@...",
    passwordLabel: "ລະຫັດຜ່ານ",
    forgotPassword: "ລືມລະຫັດຜ່ານ?",
    passwordPlaceholder: "ປ້ອນລະຫັດຜ່ານຂອງທ່ານ",
    securityCheckLabel: "ກວດສອບຄວາມປອດໄພ",
    answerPlaceholder: "ຄຳຕອບ",
    newQuestion: "ຄຳຖາມໃໝ່",
    signIn: "ເຂົ້າສູ່ລະບົບ",
    orContinueWith: "ຫຼື ສືບຕໍ່ດ້ວຍ",
    continueWithGoogle: "ສືບຕໍ່ດ້ວຍ Google",
    noAccount: "ຍັງບໍ່ມີບັນຊີ?",

    // Register fields
    fullNameLabel: "ຊື່ ແລະ ນາມສະກຸນ",
    fullNamePlaceholder: "ຕາມບັດປະຈຳຕົວຂອງທ່ານ",
    phoneLabel: "ເບີໂທລະສັບ",
    phonePlaceholder: "+856 20 XXXX XXXX",
    emailLabel: "ທີ່ຢູ່ອີເມວ",
    optional: "(ບໍ່ບັງຄັບ)",
    emailPlaceholder: "you@example.com",
    registerPasswordPlaceholder: "ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ",
    confirmPasswordLabel: "ຢືນຢັນລະຫັດຜ່ານ",
    confirmPasswordPlaceholder: "ປ້ອນລະຫັດຜ່ານອີກຄັ້ງ",
    agreePrefix: "ຂ້ອຍຍອມຮັບ",
    termsOfService: "ເງື່ອນໄຂການໃຫ້ບໍລິການ",
    and: "ແລະ",
    privacyPolicy: "ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ",
    agreeSuffix: "ຂອງສູນພົນລະເມືອງລາວ",
    haveAccount: "ມີບັນຊີຢູ່ແລ້ວ?",

    // OTP
    otpVerification: "ຢືນຢັນລະຫັດ OTP",
    otpSentTo: "ພວກເຮົາໄດ້ສົ່ງລະຫັດ 6 ຕົວເລກໄປຫາ",
    verifyCode: "ຢືນຢັນລະຫັດ",
    resendIn: "ສົ່ງໃໝ່ໃນ {seconds} ວິນາທີ",
    resendOtp: "ສົ່ງ OTP ໃໝ່",

    // Validation
    errLoginIdRequired: "ຕ້ອງປ້ອນເບີໂທ ຫຼື ອີເມວ",
    errPasswordRequired: "ຕ້ອງປ້ອນລະຫັດຜ່ານ",
    errSecurityRequired: "ກະລຸນາຕອບຄຳຖາມຄວາມປອດໄພ",
    errSecurityIncorrect: "ຄຳຕອບບໍ່ຖືກຕ້ອງ, ກະລຸນາລອງໃໝ່",
    errFullNameRequired: "ຕ້ອງປ້ອນຊື່ ແລະ ນາມສະກຸນ",
    errPhoneRequired: "ຕ້ອງປ້ອນເບີໂທລະສັບ",
    errPhoneInvalid: "ກະລຸນາປ້ອນເບີໂທທີ່ຖືກຕ້ອງ",
    errEmailInvalid: "ກະລຸນາປ້ອນທີ່ຢູ່ອີເມວທີ່ຖືກຕ້ອງ",
    errPasswordMin: "ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ",
    errConfirmRequired: "ກະລຸນາຢືນຢັນລະຫັດຜ່ານ",
    errPasswordMismatch: "ລະຫັດຜ່ານບໍ່ກົງກັນ",
    errMustAgree: "ທ່ານຕ້ອງຍອມຮັບເພື່ອສືບຕໍ່",
    errOtpIncomplete: "ກະລຸນາປ້ອນລະຫັດໃຫ້ຄົບ 6 ຕົວ",
  },
});
