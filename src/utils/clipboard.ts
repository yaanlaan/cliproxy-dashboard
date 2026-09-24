/**
 * Cross-platform clipboard copy utility that works on both HTTPS (secure context)
 * and HTTP (non-secure context, such as accessing NAS via local IP http://192.168.x.x:12345).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard if available
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // 2. Reliable fallback using hidden textarea and document.execCommand('copy')
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return false;
  }
}
