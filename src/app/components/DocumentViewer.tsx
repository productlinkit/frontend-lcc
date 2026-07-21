import { useEffect, useMemo } from "react";
import { Download, X } from "lucide-react";
import { DialogShell } from "./DialogShell";
import { generateDocumentPdf, type DocSpec } from "../lib/document";
import { useT } from "../i18n";

/*
 * Full-screen document viewer. Shows a PDF in an iframe with Download + Close.
 * Either renders a generated dummy document (`spec`) or a pre-existing PDF asset
 * (`staticUrl`, e.g. the real Residence Certificate).
 */
export function DocumentViewer({
  title,
  spec,
  staticUrl,
  downloadName,
  onClose,
}: {
  title: string;
  spec?: DocSpec;
  staticUrl?: string;
  downloadName: string;
  onClose: () => void;
}) {
  const tc = useT("common");

  // Generate once; object URLs are revoked on unmount to avoid leaks.
  const url = useMemo(() => {
    if (staticUrl) return staticUrl;
    if (spec) return URL.createObjectURL(generateDocumentPdf(spec));
    return "";
  }, [spec, staticUrl]);

  useEffect(() => {
    return () => {
      if (!staticUrl && url) URL.revokeObjectURL(url);
    };
  }, [url, staticUrl]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
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
      <div className="flex-1 overflow-auto bg-gray-200">
        <iframe title={title} src={url} className="w-full h-full border-0" />
      </div>
    </DialogShell>
  );
}
