import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import NotFound from "./NotFound";

describe("NotFound", () => {
  const renderWithRouter = (initialEntry: string) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {});
  });

  it("renders 404 UI for non-OAuth path", () => {
    renderWithRouter("/non-existent-page");
    expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to home/i })).toHaveAttribute("href", "/");
  });

  it("returns null for OAuth callback path so auth bridge can handle it", () => {
    const { container } = renderWithRouter("/~oauth/callback");
    // Component returns null for /~oauth so no 404 heading
    expect(screen.queryByRole("heading", { name: /404/i })).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });
});
