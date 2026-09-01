/*
 * Every backend call the citizen portal makes, in one place.
 *
 * A page imports the function it needs rather than assembling a path, so a
 * change to the API surface shows up here as a compile error instead of a 404
 * at runtime.
 */


import { api, type Paged, type QueryValue } from "./client";
import type {
  ApplicationDetail,
  ApplicationRow,
  Attachment,
  CaseTimeline,
  Certificate,
  ChatMessage,
  ChatThread,
  CitizenDocument,
  CitizenPreferences,
  CitizenProfile,
  CitizenSession,
  CreateApplicationInput,
  DigitalID,
  DocumentDetail,
  FamilyBook,
  FaqCategory,
  FaqItem,
  FeeQuote,
  FormSchema,
  GoogleSession,
  HelpArticle,
  HomeSummary,
  LifeEvent,
  NewsArticle,
  NewsCategory,
  Notification,
  OTPChallenge,
  RegisterResult,
  PaymentMethod,
  PaymentResult,
  PrerequisiteRecord,
  Province,
  District,
  ReferenceItem,
  SendMessageResult,
  Service,
  ServiceCategory,
  ServicePricing,
  StatusCatalogue,
  SupportChannel,
  Transaction,
  VerificationResult,
  Village,
  WalletEntry,
  WalletOverview,
} from "./types";

type Query = Record<string, QueryValue>;

/* ── Auth ──────────────────────────────────────────────────────────────── */

export const auth = {
  register: (body: { phone: string; name: string; password: string; national_id_no?: string; email?: string }) =>
    api.post<RegisterResult>("/auth/citizen/register", body, { anonymous: true }),

  requestOTP: (body: { phone: string; purpose: string }) =>
    api.post<OTPChallenge>("/auth/citizen/request-otp", body, { anonymous: true }),

  verifyOTP: (body: { phone: string; code: string; purpose: string }) =>
    api.post<CitizenSession>("/auth/citizen/verify-otp", body, { anonymous: true }),

  login: (body: { phone: string; password: string }) =>
    api.post<CitizenSession>("/auth/citizen/login", body, { anonymous: true }),

  loginWithEID: (body: { eid_token?: string; national_id_no?: string }) =>
    api.post<CitizenSession>("/auth/citizen/login/eid", body, { anonymous: true }),

  // id_token is the credential Google handed the browser. The server verifies
  // it against Google's keys — nothing here is trusted on the client's word.
  loginWithGoogle: (body: { id_token: string }) =>
    api.post<GoogleSession>("/auth/citizen/login/google", body, { anonymous: true }),

  forgotPassword: (body: { phone: string }) =>
    api.post<OTPChallenge>("/auth/citizen/forgot-password", body, { anonymous: true }),

  resetPassword: (body: { phone: string; code: string; new_password: string }) =>
    api.post<{ reset: boolean }>("/auth/citizen/reset-password", body, { anonymous: true }),

  me: () => api.get<{ actor: string; citizen?: CitizenProfile["account"] }>("/auth/me"),

  logout: (refresh_token: string) => api.post<unknown>("/auth/logout", { refresh_token }),

  changePassword: (body: { current_password: string; new_password: string }) =>
    api.post<unknown>("/auth/change-password", body),
};

/* ── The signed-in citizen ─────────────────────────────────────────────── */

export const me = {
  profile: (signal?: AbortSignal) => api.get<CitizenProfile>("/me/profile", { signal }),

  updateProfile: (body: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    province_id: string;
    district_id: string;
    village_id: string;
    preferred_lang: string;
  }>) => api.patch<CitizenProfile>("/me/profile", body),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ avatar_url: string }>("/me/avatar", form);
  },

  digitalID: (signal?: AbortSignal) => api.get<DigitalID>("/me/digital-id", { signal }),

  documents: (signal?: AbortSignal) => api.get<CitizenDocument[]>("/me/documents", { signal }),
  document: (id: string, signal?: AbortSignal) => api.get<DocumentDetail>(`/me/documents/${id}`, { signal }),

  lifeEvents: (signal?: AbortSignal) => api.get<LifeEvent[]>("/me/life-events", { signal }),

  homeSummary: (signal?: AbortSignal) => api.get<HomeSummary>("/me/home-summary", { signal }),

  preferences: (signal?: AbortSignal) => api.get<CitizenPreferences>("/me/preferences", { signal }),
  savePreferences: (body: CitizenPreferences) => api.put<CitizenPreferences>("/me/preferences", body),

  deactivate: (body?: { reason?: string }) => api.delete<unknown>("/me/account", { body }),

  familyBook: (signal?: AbortSignal) => api.get<FamilyBook>("/me/family-book", { signal }),
  requestFamilyBookCopy: (body?: { reason?: string }) =>
    api.post<ApplicationRow>("/me/family-book/request-copy", body ?? {}),

  certificates: (signal?: AbortSignal) => api.get<Certificate[]>("/me/certificates", { signal }),
  certificate: (id: string, signal?: AbortSignal) => api.get<Certificate>(`/me/certificates/${id}`, { signal }),
  certificateQR: (id: string) => api.get<{ verify_code: string; verify_url: string; qr_payload: string }>(`/me/certificates/${id}/qr`),

  notifications: (query?: Query, signal?: AbortSignal) =>
    api.paged<Notification>("/me/notifications", { query, signal }),
  unreadCount: (signal?: AbortSignal) => api.get<{ unread: number }>("/me/notifications/unread-count", { signal }),
  readNotification: (id: string) => api.post<unknown>(`/me/notifications/${id}/read`),
  readAllNotifications: () => api.post<unknown>("/me/notifications/read-all"),
  deleteNotification: (id: string) => api.delete<unknown>(`/me/notifications/${id}`),

  transactions: (query?: Query, signal?: AbortSignal) =>
    api.paged<Transaction>("/me/transactions", { query, signal }),
  transaction: (receiptNo: string, signal?: AbortSignal) =>
    api.get<Transaction>(`/me/transactions/${receiptNo}`, { signal }),

  wallet: (signal?: AbortSignal) => api.get<WalletOverview>("/me/wallet", { signal }),
  walletEntries: (query?: Query, signal?: AbortSignal) =>
    api.paged<WalletEntry>("/me/wallet/entries", { query, signal }),
  topUpWallet: (body: { amount_lak: number; method_code: string }) =>
    api.post<{ wallet: WalletOverview["wallet"]; entry: WalletEntry }>("/me/wallet/topup", body),

  chatThreads: (signal?: AbortSignal) => api.get<ChatThread[]>("/me/chat/threads", { signal }),
  startChatThread: (body: { subject: string; topic?: string; application_id?: string; message: string }) =>
    api.post<{ thread: ChatThread; message: ChatMessage; suggestions?: string[] | null }>("/me/chat/threads", body),
  chatMessages: (threadId: string, query?: Query, signal?: AbortSignal) =>
    api.paged<ChatMessage>(`/me/chat/threads/${threadId}/messages`, { query, signal }),
  sendChatMessage: (threadId: string, body: { body: string; attachment_url?: string }) =>
    api.post<SendMessageResult>(`/me/chat/threads/${threadId}/messages`, body),
  readChatThread: (threadId: string) => api.post<unknown>(`/me/chat/threads/${threadId}/read`),
  closeChatThread: (threadId: string, body?: { rating?: number }) =>
    api.post<unknown>(`/me/chat/threads/${threadId}/close`, body ?? {}),
};

/* ── Service catalogue ─────────────────────────────────────────────────── */

export const catalog = {
  categories: (signal?: AbortSignal) => api.get<ServiceCategory[]>("/service-categories", { signal, anonymous: true }),

  services: (query?: Query, signal?: AbortSignal) =>
    api.get<Service[]>("/services", { query, signal, anonymous: true }),

  service: (code: string, signal?: AbortSignal) =>
    api.get<Service>(`/services/${code}`, { signal, anonymous: true }),

  formSchema: (code: string, signal?: AbortSignal) =>
    api.get<FormSchema>(`/services/${code}/form-schema`, { signal, anonymous: true }),

  pricing: (code: string, signal?: AbortSignal) =>
    api.get<ServicePricing>(`/services/${code}/pricing`, { signal, anonymous: true }),

  quote: (code: string, body: Record<string, unknown>) =>
    api.post<FeeQuote>(`/services/${code}/quote`, body, { anonymous: true }),

  referenceList: (type: string, signal?: AbortSignal) =>
    api.get<ReferenceItem[]>(`/reference-lists/${type}`, { signal, anonymous: true }),

  referenceTypes: (signal?: AbortSignal) =>
    api.get<Array<{ type: string; count: number }>>("/reference-lists", { signal, anonymous: true }),

  statusCatalogue: (signal?: AbortSignal) =>
    api.get<StatusCatalogue>("/status-catalogue", { signal, anonymous: true }),

  prerequisiteRecords: (query?: Query, signal?: AbortSignal) =>
    api.paged<PrerequisiteRecord>("/prerequisite-records", { query, signal }),

  prerequisiteRecord: (recordNo: string, signal?: AbortSignal) =>
    api.get<PrerequisiteRecord>(`/prerequisite-records/${recordNo}`, { signal }),
};

/* ── Locations ─────────────────────────────────────────────────────────── */

export const locations = {
  provinces: (signal?: AbortSignal) => api.get<Province[]>("/locations/provinces", { signal, anonymous: true }),

  districts: (provinceId: string, signal?: AbortSignal) =>
    api.get<District[]>(`/locations/provinces/${provinceId}/districts`, { signal, anonymous: true }),

  villages: (districtId: string, signal?: AbortSignal): Promise<Paged<Village>> =>
    api.paged<Village>(`/locations/districts/${districtId}/villages`, {
      query: { per_page: 200 },
      signal,
      anonymous: true,
    }),
};

/* ── Applications ──────────────────────────────────────────────────────── */

export const applications = {
  list: (query?: Query, signal?: AbortSignal) => api.paged<ApplicationRow>("/applications", { query, signal }),

  get: (id: string, signal?: AbortSignal) => api.get<ApplicationDetail>(`/applications/${id}`, { signal }),

  create: (body: CreateApplicationInput) => api.post<ApplicationDetail>("/applications", body),

  update: (id: string, body: { form_data: Record<string, unknown>; event_date?: string }) =>
    api.patch<ApplicationDetail>(`/applications/${id}`, body),

  /**
   * Submit for village certification.
   *
   * On an incomplete form the API answers 422 with one field error per missing
   * mandatory field, which surfaces as ApiError.fields — the PRD requires the
   * Continue button to point at every offending field at once rather than
   * failing on the first.
   */
  submit: (id: string) => api.post<ApplicationDetail>(`/applications/${id}/submit`, {}),

  cancel: (id: string) => api.delete<unknown>(`/applications/${id}`),

  timeline: (id: string, signal?: AbortSignal) => api.get<CaseTimeline>(`/applications/${id}/timeline`, { signal }),

  addAttachment: (id: string, file: File, slot: string, kind: string, label?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("slot", slot);
    form.append("kind", kind);
    if (label) form.append("label", label);
    return api.upload<Attachment>(`/applications/${id}/attachments`, form);
  },

  removeAttachment: (id: string, attachmentId: string) =>
    api.delete<unknown>(`/applications/${id}/attachments/${attachmentId}`),

  pay: (id: string, body: { method_code: string }) => api.post<PaymentResult>(`/applications/${id}/pay`, body),
};

/* ── Payments ──────────────────────────────────────────────────────────── */

export const payments = {
  methods: (signal?: AbortSignal) => api.get<PaymentMethod[]>("/payment-methods", { signal, anonymous: true }),
};

/* ── Content ───────────────────────────────────────────────────────────── */

export const content = {
  news: (query?: Query, signal?: AbortSignal) => api.paged<NewsArticle>("/news", { query, signal, anonymous: true }),
  newsCategories: (signal?: AbortSignal) => api.get<NewsCategory[]>("/news/categories", { signal, anonymous: true }),
  newsArticle: (slug: string, signal?: AbortSignal) =>
    api.get<NewsArticle>(`/news/${slug}`, { signal, anonymous: true }),

  helpCategories: (signal?: AbortSignal) => api.get<FaqCategory[]>("/help/categories", { signal, anonymous: true }),
  faqs: (query?: Query, signal?: AbortSignal) => api.paged<FaqItem>("/help/faqs", { query, signal, anonymous: true }),
  faqFeedback: (id: string, helpful: boolean) => api.post<unknown>(`/help/faqs/${id}/feedback`, { helpful }),
  helpArticles: (signal?: AbortSignal) => api.get<HelpArticle[]>("/help/articles", { signal, anonymous: true }),
  helpArticle: (slug: string, signal?: AbortSignal) =>
    api.get<HelpArticle>(`/help/articles/${slug}`, { signal, anonymous: true }),
  supportChannels: (signal?: AbortSignal) =>
    api.get<SupportChannel[]>("/help/channels", { signal, anonymous: true }),
};

/* ── Public verification ───────────────────────────────────────────────── */

export const verification = {
  verify: (code: string, signal?: AbortSignal) =>
    api.get<VerificationResult>(`/verify/${code}`, { signal, anonymous: true }),
  verifyHash: (hash: string) =>
    api.post<VerificationResult>("/verify/document-hash", { hash }, { anonymous: true }),
};
