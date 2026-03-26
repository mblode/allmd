import clipboardy from "clipboardy";

export async function readClipboard(): Promise<string> {
  const content = await clipboardy.read();
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Clipboard is empty. Copy a URL or file path first.");
  }
  return trimmed;
}

export async function writeClipboard(text: string): Promise<void> {
  await clipboardy.write(text);
}
