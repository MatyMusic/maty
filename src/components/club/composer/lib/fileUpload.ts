/** תחליף העלאה: יוצר Object URL לפריוויו. חבר בעתיד ל־/api/upload אמיתי. */
export async function handleFileUpload(file: File): Promise<string> {
  return URL.createObjectURL(file);
}
