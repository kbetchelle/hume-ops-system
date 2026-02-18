import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { sanitizeHtml } from "@/lib/utils";

/** Minimal policy content renderer mirroring PolicyManagement.tsx usage */
function PolicyContent({ html }: { html: string }) {
  return (
    <div
      data-testid="policy-content"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

describe("Policy rendering (safe HTML)", () => {
  it("renders safe HTML content", () => {
    const { getByTestId } = render(
      <PolicyContent html="<p>Club hours are 9–5.</p>" />
    );
    const el = getByTestId("policy-content");
    expect(el.innerHTML).toContain("<p>Club hours are 9–5.</p>");
  });

  it("does not render script tags (XSS prevention)", () => {
    const unsafe = '<p>Safe</p><script>document.steal = true</script>';
    const { container } = render(<PolicyContent html={unsafe} />);
    const scripts = container.querySelectorAll("script");
    expect(scripts.length).toBe(0);
    expect(container.textContent).toContain("Safe");
  });
});
