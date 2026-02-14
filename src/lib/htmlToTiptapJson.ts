import type { JSONContent } from "@tiptap/react";

/**
 * Convert legacy HTML content to TipTap JSON format.
 * Handles basic formatting from the old RichTextEditor:
 * - Bold, italic, underline
 * - Headings (h1, h2, h3)
 * - Lists (ul, ol)
 * - Links
 * - Colors (inline styles)
 * 
 * @param html - HTML string from legacy content field
 * @returns TipTap JSONContent structure
 */
export function htmlToTiptapJson(html: string): JSONContent {
  // Handle empty or null content
  if (!html || html.trim() === "") {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    };
  }

  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  // Convert DOM nodes to TipTap JSON
  const content: JSONContent[] = [];

  function processList(
    listElement: HTMLUListElement | HTMLOListElement
  ): JSONContent {
    const listType = listElement.tagName === "UL" ? "bulletList" : "orderedList";
    const items: JSONContent[] = [];

    for (const li of Array.from(listElement.children)) {
      if (li.tagName === "LI") {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: processInlineContent(li),
            },
          ],
        });
      }
    }

    return {
      type: listType,
      content: items,
    };
  }

  function processInlineContent(element: Element): JSONContent[] {
    const content: JSONContent[] = [];
    const childNodes = Array.from(element.childNodes);

    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text) {
          content.push({
            type: "text",
            text,
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const marks: any[] = [];

        // Check for formatting
        if (el.tagName === "B" || el.tagName === "STRONG") {
          marks.push({ type: "bold" });
        }
        if (el.tagName === "I" || el.tagName === "EM") {
          marks.push({ type: "italic" });
        }
        if (el.tagName === "U") {
          marks.push({ type: "underline" });
        }
        if (el.tagName === "S" || el.tagName === "STRIKE") {
          marks.push({ type: "strike" });
        }

        // Check for color in span elements
        if (el.tagName === "SPAN") {
          const style = el.getAttribute("style");
          if (style) {
            const colorMatch = style.match(/color:\s*([^;]+)/);
            if (colorMatch) {
              marks.push({
                type: "textStyle",
                attrs: { color: colorMatch[1].trim() },
              });
            }
          }
        }

        // Handle links
        if (el.tagName === "A") {
          const href = el.getAttribute("href");
          if (href) {
            marks.push({
              type: "link",
              attrs: {
                href,
                target: "_blank",
                rel: "noopener noreferrer",
              },
            });
          }
        }

        // Get text content
        const text = el.textContent || "";
        if (text) {
          const textNode: JSONContent = {
            type: "text",
            text,
          };
          if (marks.length > 0) {
            textNode.marks = marks;
          }
          content.push(textNode);
        }

        // Handle nested inline elements
        if (
          el.tagName === "B" ||
          el.tagName === "STRONG" ||
          el.tagName === "I" ||
          el.tagName === "EM" ||
          el.tagName === "U" ||
          el.tagName === "S" ||
          el.tagName === "STRIKE" ||
          el.tagName === "SPAN" ||
          el.tagName === "A"
        ) {
          // Already processed above
        } else if (el.tagName === "BR") {
          content.push({ type: "hardBreak" });
        }
      }
    }

    return content;
  }

  function processBlockElement(element: Element): JSONContent | null {
    const tagName = element.tagName;

    // Handle headings
    if (tagName === "H1" || tagName === "H2" || tagName === "H3") {
      const level = parseInt(tagName[1]) as 1 | 2 | 3;
      return {
        type: "heading",
        attrs: { level },
        content: processInlineContent(element),
      };
    }

    // Handle paragraphs
    if (tagName === "P" || tagName === "DIV") {
      const inlineContent = processInlineContent(element);
      if (inlineContent.length === 0) {
        return {
          type: "paragraph",
          content: [],
        };
      }
      return {
        type: "paragraph",
        content: inlineContent,
      };
    }

    // Handle lists
    if (tagName === "UL" || tagName === "OL") {
      return processList(element as HTMLUListElement | HTMLOListElement);
    }

    // Handle horizontal rules
    if (tagName === "HR") {
      return {
        type: "horizontalRule",
      };
    }

    return null;
  }

  // Process all children of body
  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const block = processBlockElement(child as Element);
      if (block) {
        content.push(block);
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        // Wrap bare text in a paragraph
        content.push({
          type: "paragraph",
          content: [{ type: "text", text }],
        });
      }
    }
  }

  // If no content was generated, add an empty paragraph
  if (content.length === 0) {
    content.push({
      type: "paragraph",
      content: [],
    });
  }

  return {
    type: "doc",
    content,
  };
}
