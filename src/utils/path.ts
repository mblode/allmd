/**
 * Normalize a raw file path from user input.
 *
 * macOS inserts Unicode space separators (e.g. U+202F narrow no-break space)
 * in generated filenames like screenshots. These look identical to regular
 * spaces but cause ENOENT when the filesystem expects U+0020. We use the
 * Unicode property escape \p{Zs} to replace *any* Space_Separator with a
 * standard space, then strip surrounding quotes that shells or copy-paste
 * may introduce.
 */
export function cleanFilePath(raw: string): string {
  return raw
    .replace(/\p{Zs}/gu, " ")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}
