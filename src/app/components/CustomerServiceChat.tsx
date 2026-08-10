import { useState, useRef, useEffect, useMemo } from "react";
import { X, Send, MessageCircle, Bot, User, Phone, Mail, ChevronDown, LogIn, CheckCheck, Star } from "lucide-react";
import { useLang, useT } from "../i18n";
import type { Lang } from "../i18n";
import { me } from "../api/endpoints";
import { useMutation, useQuery } from "../api/hooks";
import type { ChatMessage } from "../api/types";
import { navigateTo } from "../routes";
import { useSession } from "../api/session";

/** How often the open transcript is re-read while the panel is on screen. */
const POLL_MS = 4000;

const L = (lang: Lang, en: string, lo: string) => (lang === "lo" ? lo : en);

// Opening quick replies, shown before the citizen has said anything; once a
// thread exists the chips come from the API's bot suggestions instead.
const QUICK_REPLIES = ["qrBirthCert", "qrTrack", "qrDocuments", "qrHours"] as const;

function clockTime(value: string | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CustomerServiceChat() {
  const t = useT("chat");
  const { lang } = useLang();
  const { isAuthenticated } = useSession();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [rating, setRating] = useState(false);
  const [tick, setTick] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const live = open && !minimized && isAuthenticated;

  /* ── Data ───────────────────────────────────────────────────────────── */

  const threads = useQuery((signal) => me.chatThreads(signal), [tick, isAuthenticated], {
    enabled: isAuthenticated,
  });

  // Threads ended in this session, so a stale list cannot re-adopt one between
  // the close call and the next poll.
  const ended = useRef<Set<string>>(new Set());

  // Continue the conversation the citizen already has; a closed one is left
  // alone and the next message opens a fresh thread.
  const activeThread = useMemo(
    () =>
      (threads.data ?? []).find(
        (th) => (th.status === "open" || th.status === "pending") && !ended.current.has(th.id),
      ),
    [threads.data],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setThreadId(null);
      return;
    }
    if (!threadId && activeThread) setThreadId(activeThread.id);
  }, [isAuthenticated, threadId, activeThread]);

  const transcript = useQuery(
    (signal) => me.chatMessages(threadId as string, { per_page: 100 }, signal),
    [threadId, tick],
    { enabled: Boolean(threadId) && isAuthenticated },
  );

  // Guard on threadId: a closed thread leaves its last transcript in the query
  // cache, and that must not linger behind a fresh conversation.
  const messages: ChatMessage[] = threadId ? (transcript.data?.data ?? []) : [];

  // Poll while a thread is on screen; the interval is torn down on unmount, on
  // minimise and on sign-out, so a closed widget costs nothing.
  useEffect(() => {
    if (!live || !threadId) return;
    const timer = setInterval(() => setTick((n) => n + 1), POLL_MS);
    return () => clearInterval(timer);
  }, [live, threadId]);

  // Clear the citizen's unread marker whenever the transcript is on screen.
  useEffect(() => {
    if (!live || !threadId) return;
    me.readChatThread(threadId).catch(() => undefined);
  }, [live, threadId, messages.length]);

  const start = useMutation((body: { subject: string; message: string }) =>
    me.startChatThread({ subject: body.subject, topic: "general", message: body.message }),
  );
  const sendOne = useMutation((args: { id: string; body: string }) =>
    me.sendChatMessage(args.id, { body: args.body }),
  );
  const closeThread = useMutation((args: { id: string; rating: number }) =>
    me.closeChatThread(args.id, { rating: args.rating }),
  );

  const isTyping = start.pending || sendOne.pending;

  /* ── Behaviour ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      const focus = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(focus);
    }
  }, [messages.length, pendingText, open, minimized]);

  const unread = live ? 0 : (threads.data ?? []).reduce((sum, th) => sum + (th.unread_citizen ?? 0), 0);

  const sendMessage = async (raw: string) => {
    const body = raw.trim();
    if (!body || !isAuthenticated || isTyping) return;

    setInput("");
    setPendingText(body);
    try {
      if (threadId) {
        await sendOne.run({ id: threadId, body });
      } else {
        // The first line doubles as the subject an agent sees in their queue.
        const created = await start.run({ subject: body.slice(0, 80), message: body });
        setThreadId(created.thread.id);
      }
      setTick((n) => n + 1);
    } catch {
      // The failure is on the mutation; the composer keeps the text so the
      // citizen can try again rather than losing what they wrote.
      setInput(body);
    } finally {
      setPendingText(null);
    }
  };

  const endChat = async (stars: number) => {
    if (!threadId) return;
    ended.current.add(threadId);
    try {
      await closeThread.run({ id: threadId, rating: stars });
    } catch {
      /* the thread stays open; nothing the citizen must act on */
    }
    setRating(false);
    setThreadId(null);
    setTick((n) => n + 1);
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
  };

  const formatText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  const agentName = threadId ? threads.data?.find((th) => th.id === threadId)?.assigned_name : undefined;

  // Chips: the opening quick replies until the citizen writes, then whatever the
  // bot suggested with its latest reply. Once an agent is on the thread the API
  // stops suggesting and so does the UI.
  const suggestions: string[] =
    messages.length === 0
      ? QUICK_REPLIES.map((key) => t(key))
      : agentName
        ? []
        : (messages[messages.length - 1]?.suggestions ?? []);

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div
          className={`fixed z-50 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden
            bottom-24 right-4 w-[calc(100vw-2rem)] max-w-sm rounded-3xl
            lg:bottom-8 lg:right-8 lg:w-96`}
          style={{ maxHeight: minimized ? "64px" : "520px" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ backgroundColor: "#344EAD" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{agentName ?? t("agentName")}</p>
                <p className="text-white/60 text-xs">{t("status")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {threadId && !minimized && (
                <button
                  onClick={() => setRating(true)}
                  aria-label={L(lang, "End this conversation", "ຈົບການສົນທະນາ")}
                  title={L(lang, "End this conversation", "ຈົບການສົນທະນາ")}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
                >
                  <CheckCheck className="w-4 h-4 text-white" />
                </button>
              )}
              <a
                href="tel:+85621123456"
                aria-label={t("callUs")}
                title={t("callUs")}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <Phone className="w-4 h-4 text-white" />
              </a>
              <a
                href="mailto:support@laocitizen.gov.la"
                aria-label={t("emailUs")}
                title={t("emailUs")}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>
              <button
                onClick={() => setMinimized((m) => !m)}
                aria-label={t("minimize")}
                title={t("minimize")}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <ChevronDown
                  className="w-4 h-4 text-white transition-transform duration-300"
                  style={{ transform: minimized ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                title={t("close")}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Signed out — the conversation belongs to an account, so ask first */}
          {!minimized && !isAuthenticated && (
            <div className="bg-[#F5F7FF] px-6 py-8 text-center">
              <div
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3"
                style={{ backgroundColor: "#EEF2FF" }}
              >
                <LogIn className="w-6 h-6" style={{ color: "#344EAD" }} />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {L(lang, "Sign in to chat with support", "ເຂົ້າສູ່ລະບົບເພື່ອສົນທະນາກັບຝ່າຍຊ່ວຍເຫຼືອ")}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {L(
                  lang,
                  "Your conversation is kept with your account so an officer can follow it up.",
                  "ການສົນທະນາຈະຖືກເກັບໄວ້ກັບບັນຊີຂອງທ່ານ ເພື່ອໃຫ້ເຈົ້າໜ້າທີ່ຕິດຕາມໄດ້.",
                )}
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  navigateTo("auth");
                }}
                className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#344EAD" }}
              >
                {L(lang, "Sign in", "ເຂົ້າສູ່ລະບົບ")}
              </button>
            </div>
          )}

          {/* Messages */}
          {!minimized && isAuthenticated && (
            <>
              <div className="flex-1 overflow-y-auto bg-[#F5F7FF] px-4 py-4 space-y-3">
                {transcript.loading && messages.length === 0 ? (
                  <div className="space-y-3" aria-busy="true">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex items-end gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                        <div className="h-10 w-48 rounded-2xl bg-gray-200 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : transcript.error ? (
                  <div className="text-center py-6">
                    <p className="text-gray-700 text-sm">{transcript.error.message}</p>
                    <button
                      onClick={transcript.refetch}
                      className="mt-3 px-4 py-2 rounded-xl text-white text-xs font-semibold"
                      style={{ backgroundColor: "#344EAD" }}
                    >
                      {L(lang, "Try again", "ລອງໃໝ່")}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Nothing said yet — the assistant opens the conversation */}
                    {messages.length === 0 && (
                      <div className="flex items-end gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#344EAD" }}
                        >
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-[75%] items-start flex flex-col gap-1">
                          <div
                            className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                            style={{
                              backgroundColor: "white",
                              color: "#1F2937",
                              borderBottomLeftRadius: "4px",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                            }}
                          >
                            {formatText(t("greeting"))}
                          </div>
                        </div>
                      </div>
                    )}

                    {messages.map((msg) => {
                      const mine = msg.sender_type === "citizen";
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Avatar */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: mine ? "#E5E7EB" : "#344EAD" }}
                          >
                            {mine ? (
                              <User className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>

                          {/* Bubble */}
                          <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                            <div
                              className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                              style={
                                mine
                                  ? {
                                      backgroundColor: "#344EAD",
                                      color: "white",
                                      borderBottomRightRadius: "4px",
                                    }
                                  : {
                                      backgroundColor: "white",
                                      color: "#1F2937",
                                      borderBottomLeftRadius: "4px",
                                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                                    }
                              }
                            >
                              {formatText(msg.body)}
                            </div>
                            <span className="text-xs text-gray-400 px-1">{clockTime(msg.sent_at)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* The message currently in flight */}
                    {pendingText && (
                      <div className="flex items-end gap-2 flex-row-reverse opacity-70">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#E5E7EB" }}
                        >
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="max-w-[75%] items-end flex flex-col gap-1">
                          <div
                            className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                            style={{ backgroundColor: "#344EAD", color: "white", borderBottomRightRadius: "4px" }}
                          >
                            {formatText(pendingText)}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#344EAD" }}
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl bg-white shadow-sm"
                      style={{ borderBottomLeftRadius: "4px" }}
                    >
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{
                              backgroundColor: "#344EAD",
                              opacity: 0.6,
                              animationDelay: `${i * 0.18}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Rate and close */}
              {rating && (
                <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0 text-center">
                  <p className="text-gray-700 text-xs font-semibold">
                    {L(lang, "How did we do?", "ພວກເຮົາເຮັດໄດ້ແນວໃດ?")}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => endChat(n)}
                        disabled={closeThread.pending}
                        aria-label={L(lang, `${n} out of 5`, `${n} ຈາກ 5`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-500 transition-colors disabled:opacity-40"
                      >
                        <Star className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setRating(false)}
                    className="mt-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {L(lang, "Not now", "ຍັງກ່ອນ")}
                  </button>
                </div>
              )}

              {/* Quick replies — bot suggestions once the conversation is running */}
              {!rating && suggestions.length > 0 && (
                <div className="bg-white border-t border-gray-100 px-3 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                  {suggestions.map((label) => (
                    <button
                      key={label}
                      onClick={() => sendMessage(label)}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 hover:text-white hover:border-transparent"
                      style={{ borderColor: "#344EAD", color: "#344EAD" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#344EAD";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color = "#344EAD";
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="bg-white px-3 pb-4 pt-2 flex items-center gap-2 flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder={t("placeholder")}
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none text-gray-700 placeholder:text-gray-400"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  aria-label={t("send")}
                  title={t("send")}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40"
                  style={{ backgroundColor: "#344EAD" }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label={t("openChat")}
          title={t("openChat")}
          className="fixed z-50 bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ backgroundColor: "#344EAD" }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {unread > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-white font-semibold"
            >
              {unread}
            </span>
          )}
        </button>
      )}
    </>
  );
}
