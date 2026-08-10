import { useEffect, useMemo } from "react";
import { Download, X, RefreshCw, QrCode, ShieldCheck } from "lucide-react";
import { DialogShell } from "./DialogShell";
import { generateDocumentPdf, type DocSpec } from "../lib/document";
import { useT, useLang } from "../i18n";
import { useQuery } from "../api/hooks";
import { me } from "../api/endpoints";
import { docSpecFromDocument, type DocumentPayload } from "../data/documents";

/*
 * Full-screen document viewer. Shows a PDF in an iframe with Download + Close.
 *
 * The document can come from three places, in order of precedence:
 *   • `documentId` — fetched from /me/documents/{id} and rendered from the real
 *     payload (holder, place, issue and expiry dates, verification code);
 *   • `spec`       — a spec the caller already has;
 *   • `staticUrl`  — a pre-existing PDF asset.
 */
export function DocumentViewer({
  title,
  spec,
  staticUrl,
  downloadName,
  documentId,
  verifyCode,
  qrPayload,
  onClose,
}: {
  title: string;
  spec?: DocSpec;
  staticUrl?: string;
  downloadName: string;
  /** Load the printable payload from /me/documents/{id}. */
  documentId?: string;
  /** Verification code shown under the document; falls back to the payload's. */
  verifyCode?: string;
  /** QR payload behind the verification code. */
  qrPayload?: string;
  onClose: () => void;
}) {
  const tc = useT("common");
  const { lang } = useLang();

  const { data, loading, error, refetch } = useQuery<DocumentPayload>(
    (signal) => me.document(documentId as string, signal) as Promise<DocumentPayload>,
    [documentId],
    { enabled: Boolean(documentId) },
  );

  const resolved = useMemo<DocSpec | undefined>(() => {
    if (documentId) return data ? docSpecFromDocument(data, lang) : undefined;
    return spec;
  }, [documentId, data, lang, spec]);

  // Generate once; object URLs are revoked on unmount to avoid leaks.
  const url = useMemo(() => {
    if (staticUrl) return staticUrl;
    if (resolved) return URL.createObjectURL(generateDocumentPdf(resolved));
    return "";
  }, [resolved, staticUrl]);

  useEffect(() => {
    return () => {
      if (!staticUrl && url) URL.revokeObjectURL(url);
    };
  }, [url, staticUrl]);

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const code = verifyCode ?? data?.verify_code;
  const payload = qrPayload ?? data?.qr_payload;

  return (
    <DialogShell
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[100] flex flex-col bg-black/60"
      dialogClassName="flex flex-col flex-1 min-h-0"
      label={title}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#344EAD] text-white flex-shrink-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            disabled={!url}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 border border-white/20 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            {tc("download")}
          </button>
          <button
            onClick={onClose}
            aria-label={tc("close")}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center">
        {loading && !url ? (
          <div className="w-full max-w-md mx-auto p-6">
            <div className="bg-white rounded-2xl p-6 animate-pulse space-y-3">
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
              <div className="h-40 w-full bg-gray-100 rounded-xl" />
              <div className="h-3 w-1/3 bg-gray-100 rounded" />
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">{tc("loading")}</p>
          </div>
        ) : error ? (
          <div className="w-full max-w-sm mx-auto p-6 text-center">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-sm text-gray-700">{error.message}</p>
              <button
                onClick={refetch}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#344EAD" }}
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "lo" ? "ລອງໃໝ່" : "Try again"}
              </button>
            </div>
          </div>
        ) : url ? (
          <iframe title={title} src={url} className="w-full h-full border-0" />
        ) : (
          <div className="w-full max-w-sm mx-auto p-6 text-center">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-sm text-gray-600">
                {lang === "lo"
                  ? "ເອກະສານນີ້ຍັງບໍ່ພ້ອມໃຫ້ເບິ່ງເທື່ອ."
                  : "This document is not available to view yet."}
              </p>
            </div>
          </div>
        )}
      </div>

      {code && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#EEF2FF" }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: "#344EAD" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">
              {lang === "lo" ? "ລະຫັດກວດສອບ" : "Verification code"}
            </p>
            <p className="text-sm font-semibold text-gray-800 font-mono truncate">{code}</p>
          </div>
          {payload && (
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-400 min-w-0">
              <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate font-mono">{payload}</span>
            </div>
          )}
        </div>
      )}
    </DialogShell>
  );
}
