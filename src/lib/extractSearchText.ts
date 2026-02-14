import type { JSONContent } from "@tiptap/react";

/**
 * Recursively extract plaintext from TipTap JSON for search indexing.
 * Walks the content tree and collects all text nodes.
 * 
 * @param content - TipTap JSONContent structure
 * @returns Plaintext string with normalized whitespace
 */
export function extractSearchText(content: JSONContent | null | undefined): string {
  if (!content) return "";

  const textParts: string[] = [];

  function walk(node: JSONContent) {
    // If this is a text node, collect its content
    if (node.type === "text" && node.text) {
      textParts.push(node.text);
    }

    // If this node has content array, recursively process children
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  walk(content);

  // Join all text parts with spaces and normalize whitespace
  return textParts
    .join(" ")
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}
