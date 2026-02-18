import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./utils";

describe("sanitizeHtml", () => {
  it("allows safe HTML", () => {
    const html = "<p>Hello</p><ul><li>Item</li></ul>";
    expect(sanitizeHtml(html)).toContain("<p>Hello</p>");
    expect(sanitizeHtml(html)).toContain("<ul>");
  });

  it("strips script tags to prevent XSS", () => {
    const html = '<p>Safe</p><script>alert("xss")</script>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
    expect(result).toContain("<p>Safe</p>");
  });

  it("strips event handlers", () => {
    const html = '<p onclick="alert(1)">Click</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain("onclick");
  });
});
