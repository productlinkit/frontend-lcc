/*
 * The wire types, mirroring what the Go API actually sends.
 *
 * Money is always a whole number of kip in a *_lak field. Dates are
 * "YYYY-MM-DD"; timestamps are RFC3339. Bilingual text is a { en, lo } pair,
 * which the i18n layer picks from with the current language.
 */

export interface Bilingual {
  en: string;
  lo: string;
}

export type Lang = "en" | "lo";

/** Read the side of a bilingual pair the user is reading, with a fallback. */
export function text(value: Bilingual | undefined | null, lang: Lang): string {
  if (!value) return "";
  const wanted = lang === "lo" ? value.lo : value.en;
  return wanted || value.en || value.lo || "";
}

/* ── Case lifecycle ────────────────────────────────────────────────────── */

export type CaseStatus =
  | "draft"
  | "submitted"
  | "certified"
  | "under-review"
  | "returned"
  | "registered"
  | "issued"
  | "rejected"
  | "revoked";

export type PaymentState = "paid" | "pending" | "failed" | "refunded" | "free";

export interface StatusMeta {
  status: CaseStatus;
  label: string;
  label_lo: string;
  color: string;
  background: string;
  meaning: string;
  acting_role: string;
  is_open: boolean;
  is_terminal: boolean;
  is_editable: boolean;
  transitions: Array<{
    action: string;
    to: CaseStatus;
    label: string;
    roles: string[] | null;
    requires_reason: boolean;
    requires_signature: boolean;
    requires_paid_fee: boolean;
  }>;
}

export interface StatusCatalogue {
  statuses: StatusMeta[];
  pipeline_order: CaseStatus[];
}

/* ── Locations ─────────────────────────────────────────────────────────── */

export interface Province {
  id: string;
  code: string;
  name: Bilingual;
  region: string;
  capital: string;
  latitude: number;
  longitude: number;
  geo_name: string;
  active: boolean;
}

export interface District {
  id: string;
  province_id: string;
  code: string;
  name: Bilingual;
  active: boolean;
}

export interface Village {
  id: string;
  district_id: string;
  province_id: string;
  code: string;
  name: Bilingual;
  active: boolean;
}

export interface Jurisdiction {
  province_id?: string;
  province_name?: string;
  district_id?: string;
  district_name?: string;
  village_id?: string;
  village_name?: string;
}

/* ── Service catalogue ─────────────────────────────────────────────────── */

export interface ServiceCategory {
  id: string;
  code: string;
  name: Bilingual;
  icon: string;
  color: string;
  sort_order: number;
  active: boolean;
}

export interface Service {
  id: string;
  code: string;
  category_id: string;
  category_code: string;
  name: Bilingual;
  short_name: string;
  description: Bilingual;
  icon: string;
  color: string;
  fee_lak: number;
  fee_max_lak: number;
  fee_is_range: boolean;
  sla_days: number;
  processing_time: Bilingual;
  required_docs: Bilingual[];
  requires_payment: boolean;
  is_phase1: boolean;
  active: boolean;
  sort_order: number;
  route_path: string;
  family_book_effect: string;
}

export interface ServicePricing {
  service_code: string;
  fee_lak: number;
  copy_fee_lak: number;
  late_fine_lak: number;
  effective_at: string;
  note: string;
}

export interface FeeQuote {
  service_code: string;
  fee_lak: number;
  breakdown?: Array<{ label: Bilingual; amount_lak: number }>;
  currency?: string;
}

/* ── Dynamic forms ─────────────────────────────────────────────────────── */

export type FieldRequirement = "mandatory" | "conditional" | "optional";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "choice"
  | "lookup"
  | "image"
  | "document"
  | "signature"
  | "boolean"
  | "auto"
  | "static";

export interface FormFieldOption {
  value: string;
  label: Bilingual;
}

export interface FormField {
  id: string;
  key: string;
  label: Bilingual;
  description: string;
  type: FieldType;
  requirement: FieldRequirement;
  options: FormFieldOption[] | null;
  lookup_key: string;
  placeholder?: Bilingual;
  pattern?: string;
  min?: number | null;
  max?: number | null;
  max_length?: number;
  depends_on?: string;
  depends_value?: string;
  sort_order: number;
}

export interface FormSection {
  id: string;
  key: string;
  title: Bilingual;
  note?: string;
  /** Repeated groups: Mother / Father, Spouse A / Spouse B. */
  instances: string[] | null;
  repeatable: boolean;
  sort_order: number;
  fields: FormField[];
}

export interface FormSchema {
  id: string;
  service_id: string;
  service_code: string;
  service_name: Bilingual;
  version: number;
  source: string;
  published: boolean;
  section_count: number;
  field_count: number;
  sections: FormSection[];
}

export interface ReferenceItem {
  id: string;
  type: string;
  code: string;
  label: Bilingual;
  note?: string;
  sort_order: number;
  active: boolean;
}

export interface PrerequisiteRecord {
  id: string;
  record_no: string;
  kind: "betrothal" | "mediation" | "marriage-certificate";
  service_code: string;
  party_a_name: string;
  party_b_name: string;
  party_a_uin?: string;
  party_b_uin?: string;
  recorded_at: string;
  recorded_by: string;
  status: string;
  fee_lak: number;
  payload?: Record<string, unknown>;
}

/* ── Identity ──────────────────────────────────────────────────────────── */

export interface CitizenAccount {
  id: string;
  uin: string;
  name: string;
  phone: string;
  email: string;
  national_id_no: string;
  date_of_birth: string;
  gender: string;
  avatar_url?: string;
  preferred_lang: Lang;
  jurisdiction: Jurisdiction;
  household_no: string;
  address: string;
  verified: boolean;
  eid_verified: boolean;
  active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface PlaceNames {
  province?: Bilingual;
  district?: Bilingual;
  village?: Bilingual;
}

export interface RegistryPerson {
  id: string;
  uin: string;
  national_id_no: string;
  name: Bilingual;
  gender: string;
  date_of_birth: string;
  age: number;
  place_of_birth: string;
  nationality: string;
  ethnicity: string;
  religion: string;
  marital_status: string;
  house_no: string;
  relation: string;
  status: string;
}

export interface CitizenProfile {
  account: CitizenAccount;
  place: PlaceNames;
  household_no: string;
  registry?: RegistryPerson;
  household?: HouseholdSummary;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_at?: string;
}

export interface CitizenSession {
  actor: "citizen";
  citizen: CitizenAccount;
  tokens: AuthTokens;
}

/**
 * A sign-in opened through a Google account.
 *
 * `registered` means this sign-in created the account rather than found one.
 * Such an account has no phone number and is not verified yet, so the app
 * should send the citizen to complete their profile instead of straight to the
 * home screen.
 */
export interface GoogleSession extends CitizenSession {
  registered: boolean;
}

export interface OTPChallenge {
  phone: string;
  purpose: string;
  expires_at?: string;
  expires_in?: number;
  resend_after?: number;
  /** Present outside production so the demo flow is testable. */
  dev_code?: string;
}

/** Registration returns the new account id alongside its verification challenge. */
export interface RegisterResult {
  citizen_id: string;
  challenge: OTPChallenge;
}

export interface CitizenPreferences {
  language: Lang;
  notifications: { in_app: boolean; email: boolean; sms: boolean };
  biometric_login: boolean;
}

/* ── Documents, identity card, life events ─────────────────────────────── */

export interface CitizenDocument {
  id: string;
  type: string;
  title: Bilingual;
  number: string;
  status: "valid" | "expired" | "missing";
  issued_at?: string;
  expires_at?: string;
  authority: string;
  available: boolean;
  file_url?: string;
  verify_code?: string;
}

export interface DocumentDetail extends CitizenDocument {
  holder_name?: string;
  fields?: Array<{ label: Bilingual; value: string }>;
  certificate_id?: string;
  verify_url?: string;
  qr_payload?: string;
}

export interface DigitalID {
  uin: string;
  card_no: string;
  name: Bilingual;
  date_of_birth: string;
  gender: string;
  nationality: string;
  place_of_birth: string;
  address: string;
  photo_url?: string;
  issued_at?: string;
  expires_at?: string;
  issued_by: string;
  status: string;
  verify_code?: string;
  verify_url?: string;
  qr_payload?: string;
}

export interface LifeEvent {
  id: string;
  event_type: string;
  title: string;
  detail: string;
  occurred_at: string;
  reference_no?: string;
}

export interface HomeSummary {
  name: string;
  verified: boolean;
  eid_verified: boolean;
  active_applications: number;
  ready_documents: number;
  unread_notifications: number;
  wallet_balance_lak: number;
  // The server points the citizen at whatever needs them next. It may be null,
  // and its fields vary by what is pending, so every field here is optional.
  next_action: {
    action?: string;
    label?: Bilingual;
    tab?: string;
    application_id?: string;
    reference_no?: string;
    status?: string;
  } | null;
  generated_at: string;
}

/* ── Applications ──────────────────────────────────────────────────────── */

export interface ApplicationRow {
  id: string;
  reference_no: string;
  service_code: string;
  service_name: Bilingual;
  applicant: string;
  subject_name: string;
  status: CaseStatus;
  status_label: Bilingual;
  payment_state: PaymentState;
  fee_lak: number;
  channel: string;
  jurisdiction: Jurisdiction;
  assigned_officer?: string;
  sla_days: number;
  days_waiting: number;
  days_overdue: number;
  is_overdue: boolean;
  submitted_at?: string;
  due_at?: string;
  issued_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  reason_note?: string;
  certificate_id?: string;
  certificate_no?: string;
}

export interface Attachment {
  id: string;
  kind: "document" | "photo" | "signature" | "stamp";
  slot: string;
  label: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface CaseEvent {
  id: string;
  action: string;
  from_status?: CaseStatus;
  to_status: CaseStatus;
  status_label?: Bilingual;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  reason_code?: string;
  note?: string;
  occurred_at: string;
}

export interface AllowedAction {
  action: string;
  to: CaseStatus;
  label: string;
  requires_reason: boolean;
  requires_signature: boolean;
  requires_paid_fee: boolean;
}

export interface ApplicationDetail extends ApplicationRow {
  form_data: Record<string, unknown>;
  attachments: Attachment[];
  timeline?: CaseEvent[];
  allowed_actions?: AllowedAction[];
  linked_reference_no?: string;
}

export interface CaseTimeline {
  application_id: string;
  reference_no: string;
  status: CaseStatus;
  events: CaseEvent[];
}

export interface CreateApplicationInput {
  service_code: string;
  province_id?: string;
  district_id?: string;
  village_id?: string;
  event_date?: string;
  linked_reference_no?: string;
  form_data: Record<string, unknown>;
}

/* ── Money ─────────────────────────────────────────────────────────────── */

export interface PaymentMethod {
  id: string;
  code: string;
  label: Bilingual;
  kind: "wallet" | "bank" | "cash" | "qr";
  enabled: boolean;
  fee_percent: number;
  note: string;
  logo_url?: string;
  color: string;
}

export interface Transaction {
  id: string;
  receipt_no: string;
  application_id?: string;
  reference_no?: string;
  payer_name: string;
  service_code: string;
  service_name?: Bilingual;
  kind: string;
  method_code: string;
  method_label?: Bilingual;
  amount_lak: number;
  status: "paid" | "pending" | "refunded" | "failed";
  paid_at?: string;
  date?: string;
  note?: string;
}

export interface Wallet {
  id: string;
  account_no: string;
  balance_lak: number;
  currency: string;
  status: string;
}

export interface WalletEntry {
  id: string;
  direction: "credit" | "debit";
  kind: string;
  amount_lak: number;
  balance_after_lak: number;
  description: Bilingual;
  reference_no?: string;
  method_code?: string;
  status: string;
  date: string;
  occurred_at: string;
}

export interface WalletOverview {
  wallet: Wallet;
  recent_entries: WalletEntry[];
  entry_count: number;
  can_top_up: boolean;
  min_top_up_lak: number;
  max_top_up_lak: number;
}

export interface PaymentResult {
  receipt_no: string;
  amount_lak: number;
  status: string;
  payment_state: PaymentState;
  method_code: string;
  /** Set when the method needs the citizen to complete the payment elsewhere. */
  instruction?: { qr_payload?: string; account?: string; note?: Bilingual };
  wallet_balance_lak?: number;
}

/* ── Family book ───────────────────────────────────────────────────────── */

export interface HouseholdMember {
  id: string;
  person_id?: string;
  uin: string;
  name: string;
  gender: string;
  date_of_birth?: string;
  age?: number;
  relation: string;
  nationality: string;
  photo_url?: string;
  status: string;
}

export interface HouseholdSummary {
  id: string;
  household_no: string;
  head_name: string;
  address: string;
  house_no: string;
  unit: string;
  group: string;
  total_members: number;
  male_members: number;
  female_members: number;
  status: string;
  issued_at?: string;
}

export interface FamilyBook extends HouseholdSummary {
  jurisdiction?: Jurisdiction;
  place?: PlaceNames;
  members: HouseholdMember[];
  registered_at?: string;
  reissue_count?: number;
}

/* ── Certificates and verification ─────────────────────────────────────── */

export interface Certificate {
  id: string;
  certificate_no: string;
  application_id?: string;
  reference_no?: string;
  service_code: string;
  service_name?: Bilingual;
  holder_name: string;
  uin?: string;
  issued_at: string;
  issued_by_name?: string;
  status: string;
  verify_code: string;
  verify_url?: string;
  qr_payload?: string;
  file_url?: string;
  document_hash?: string;
}

export interface VerificationResult {
  valid: boolean;
  status?: string;
  certificate_no?: string;
  service?: Bilingual;
  service_code?: string;
  holder_name?: string;
  issued_at?: string;
  issuing_office?: Bilingual;
  revoked_at?: string;
  revoke_reason?: string;
  document_hash?: string;
}

/* ── Content ───────────────────────────────────────────────────────────── */

export interface NewsCategory {
  id: string;
  code: string;
  name: Bilingual;
  color: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  category: string;
  category_name: Bilingual;
  category_color: string;
  title: Bilingual;
  excerpt: Bilingual;
  body?: Bilingual;
  cover_url?: string;
  author: string;
  source: string;
  tags: string[];
  featured: boolean;
  pinned: boolean;
  view_count: number;
  read_minutes: number;
  published_date: string;
  published_at: string;
}

export interface FaqCategory {
  id: string;
  code: string;
  name: Bilingual;
  icon: string;
}

export interface FaqItem {
  id: string;
  category: string;
  category_name?: Bilingual;
  question: Bilingual;
  answer: Bilingual;
  tags: string[];
  helpful: number;
  not_helpful: number;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: Bilingual;
  body?: Bilingual;
}

export interface SupportChannel {
  id: string;
  kind: string;
  label: Bilingual;
  value: string;
  hours: Bilingual;
  icon: string;
}

export interface ChatThread {
  id: string;
  subject: string;
  topic: string;
  status: "open" | "pending" | "resolved" | "closed";
  assigned_name?: string;
  application_id?: string;
  last_message_at?: string;
  unread_citizen: number;
  rating?: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_type: "citizen" | "agent" | "bot" | "system";
  sender_name: string;
  body: string;
  suggestions?: string[] | null;
  attachment_url?: string;
  read_at?: string;
  sent_at: string;
}

export interface SendMessageResult {
  message: ChatMessage;
  suggestions?: string[] | null;
}

/* ── Notifications ─────────────────────────────────────────────────────── */

export interface Notification {
  id: string;
  template?: string;
  title: Bilingual;
  body: Bilingual;
  channel: string;
  category: string;
  severity: string;
  ref_type?: string;
  ref_id?: string;
  action_url?: string;
  read_at?: string;
  sent_at: string;
}
