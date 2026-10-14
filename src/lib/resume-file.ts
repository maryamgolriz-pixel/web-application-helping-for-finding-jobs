import "server-only";
import mammoth from "mammoth";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ResumeInput =
  | { kind: "pdf"; base64: string }
  | { kind: "text"; text: string; source: "pasted" | "docx" | "txt" };

export class ResumeFileError extends Error {}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

// Turns an uploaded resume into something Claude can read. PDFs go to Claude
// as-is (it sees the layout, photos and tables). Word files are converted to
// HTML so tables and images are still visible to the format check.
export async function readResumeFile(file: File): Promise<ResumeInput> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ResumeFileError("حجم فایل بیشتر از ۵ مگابایت است. لطفاً فایل کوچک‌تری بفرستید.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());

  switch (extensionOf(file.name)) {
    case "pdf":
      return { kind: "pdf", base64: bytes.toString("base64") };
    case "docx": {
      const { value } = await mammoth.convertToHtml(
        { buffer: bytes },
        {
          convertImage: mammoth.images.imgElement(async () => ({
            src: "",
            alt: "[embedded image in resume]",
          })),
        },
      );
      if (!value.trim()) {
        throw new ResumeFileError("متنی در این فایل Word پیدا نشد. لطفاً متن رزومه را کپی و جای‌گذاری کنید.");
      }
      return { kind: "text", text: value, source: "docx" };
    }
    case "txt":
      return { kind: "text", text: bytes.toString("utf8"), source: "txt" };
    case "doc":
      throw new ResumeFileError(
        "فرمت قدیمی ‎.doc‎ پشتیبانی نمی‌شود. لطفاً فایل را در Word با فرمت ‎.docx‎ یا PDF ذخیره کنید.",
      );
    default:
      throw new ResumeFileError("فقط فایل‌های PDF، Word ‏(‎.docx‎) و متنی ‏(‎.txt‎) پشتیبانی می‌شوند.");
  }
}
