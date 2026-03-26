/**
 * Clean a raw file path from user input.
 *
 * 1. Strips surrounding quotes (shells / copy-paste)
 * 2. Resolves literal Unicode escapes (\u{202f}, \u202F) that terminals may
 *    insert when rendering macOS screenshot filenames containing U+202F
 * 3. Resolves shell backslash escapes (\ , \(, etc.) from drag-and-drop
 * 4. Normalises to Unicode NFC for consistent filesystem lookups
 */
export function cleanFilePath(raw: string): string {
  let cleaned = raw.trim().replace(/^["']+|["']+$/g, "");

  // Resolve literal JS Unicode escapes: \u{202f} → U+202F, \u202F → U+202F
  cleaned = cleaned
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    );

  // Resolve shell backslash escapes (e.g. drag-and-drop: "\ " → " ")
  cleaned = cleaned.replace(/\\(.)/g, "$1");

  return cleaned.trim().normalize("NFC");
}
