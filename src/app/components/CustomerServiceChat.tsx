import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Bot, User, Phone, Mail, ChevronDown } from "lucide-react";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  "How to apply for Birth Certificate?",
  "Track my application",
  "Required documents",
  "Office hours",
];

const BOT_RESPONSES: Record<string, string> = {
  "How to apply for Birth Certificate?":
    "To apply for a Birth Certificate:\n1. Go to 'Services' → 'Birth Certificate'\n2. Fill in the required information\n3. Upload supporting documents\n4. Submit and pay the fee (20,000 LAK)\n\nProcessing takes 3–5 business days. 📄",
  "Track my application":
    "You can track your application status in the **History** tab at the bottom navigation. All submitted applications will be listed there with real-time status updates. 🔍",
  "Required documents":
    "General required documents:\n• National ID Card\n• Household Registration Book\n• Passport-sized photo\n\nSpecific documents may vary by service type. Please check each service for details. 📋",
  "Office hours":
    "Our office hours are:\n🕗 Monday – Friday: 08:00 – 17:00\n🕗 Saturday: 08:00 – 12:00\n🚫 Sunday & Public Holidays: Closed\n\nOnline services are available 24/7! 🌐",
};

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    from: "bot",
    text: "Sabaidi! 👋 Welcome to Lao Citizen Center support. How can I help you today?",
    time: getTime(),
  },
];

export function CustomerServiceChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, open, minimized]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now(), from: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response =
        BOT_RESPONSES[text] ||
        "Thank you for your message! Our team will get back to you shortly. For urgent matters, please call us at **+856 21 123456** or email **support@laocitizen.gov.la** 😊";

      const botMsg: Message = {
        id: Date.now() + 1,
        from: "bot",
        text: response,
        time: getTime(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
      if (!open || minimized) setUnread((u) => u + 1);
    }, 1200);
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
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
                <p className="text-white text-sm font-semibold leading-tight">LCC Support</p>
                <p className="text-white/60 text-xs">Online · Replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="tel:+85621123456"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <Phone className="w-4 h-4 text-white" />
              </a>
              <a
                href="mailto:support@laocitizen.gov.la"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>
              <button
                onClick={() => setMinimized((m) => !m)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <ChevronDown
                  className="w-4 h-4 text-white transition-transform duration-300"
                  style={{ transform: minimized ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!minimized && (
            <>
              <div className="flex-1 overflow-y-auto bg-[#F5F7FF] px-4 py-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: msg.from === "bot" ? "#344EAD" : "#E5E7EB",
                      }}
                    >
                      {msg.from === "bot" ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div
                        className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                        style={
                          msg.from === "user"
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
                        {formatText(msg.text)}
                      </div>
                      <span className="text-xs text-gray-400 px-1">{msg.time}</span>
                    </div>
                  </div>
                ))}

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

              {/* Quick replies */}
              <div className="bg-white border-t border-gray-100 px-3 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
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
                    {qr}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="bg-white px-3 pb-4 pt-2 flex items-center gap-2 flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none text-gray-700 placeholder:text-gray-400"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
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
