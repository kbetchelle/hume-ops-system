import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MyChecklistsPage from "./MyChecklistsPage";

vi.mock("@/hooks/useUserRoles", () => ({
  useUserRoles: vi.fn(),
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuthContext: vi.fn(),
}));

vi.mock("@/components/checklists/concierge/ConciergeChecklistView", () => ({
  ConciergeChecklistView: () => <div data-testid="concierge-checklist-view">Concierge Checklists</div>,
}));

vi.mock("@/components/checklists/boh/BoHChecklistView", () => ({
  BoHChecklistView: () => <div data-testid="boh-checklist-view">BoH Checklists</div>,
}));

vi.mock("@/components/checklists/cafe/CafeChecklistView", () => ({
  CafeChecklistView: () => <div data-testid="cafe-checklist-view">Cafe Checklists</div>,
}));

vi.mock("@/components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="dashboard-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

const { useUserRoles } = await import("@/hooks/useUserRoles");
const { useAuthContext } = await import("@/features/auth/AuthProvider");

function renderMyChecklistsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyChecklistsPage />
    </QueryClientProvider>
  );
}

describe("MyChecklistsPage", () => {
  beforeEach(() => {
    vi.mocked(useAuthContext).mockReturnValue({
      user: { id: "user-1" },
    } as ReturnType<typeof useAuthContext>);
  });

  it("shows concierge checklist view when user has concierge role", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "concierge" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByTestId("concierge-checklist-view")).toBeInTheDocument();
    expect(screen.getByText("Concierge Checklists")).toBeInTheDocument();
    expect(screen.queryByTestId("boh-checklist-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cafe-checklist-view")).not.toBeInTheDocument();
    expect(screen.queryByText(/No checklists available for your role/)).not.toBeInTheDocument();
  });

  it("shows BoH checklist view when user has floater role", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "floater" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByTestId("boh-checklist-view")).toBeInTheDocument();
    expect(screen.getByText("BoH Checklists")).toBeInTheDocument();
    expect(screen.queryByTestId("concierge-checklist-view")).not.toBeInTheDocument();
    expect(screen.queryByText(/No checklists available for your role/)).not.toBeInTheDocument();
  });

  it("shows BoH checklist view when user has female_spa_attendant role", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "female_spa_attendant" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByTestId("boh-checklist-view")).toBeInTheDocument();
    expect(screen.queryByText(/No checklists available for your role/)).not.toBeInTheDocument();
  });

  it("shows BoH checklist view when user has male_spa_attendant role", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "male_spa_attendant" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByTestId("boh-checklist-view")).toBeInTheDocument();
  });

  it("shows cafe checklist view when user has cafe role", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "cafe" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByTestId("cafe-checklist-view")).toBeInTheDocument();
    expect(screen.getByText("Cafe Checklists")).toBeInTheDocument();
    expect(screen.queryByText(/No checklists available for your role/)).not.toBeInTheDocument();
  });

  it("shows no-checklists message when user has no checklist role (e.g. admin)", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "admin" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByText("No checklists available for your role.")).toBeInTheDocument();
    expect(screen.getByText(/Contact your manager if you should have access/)).toBeInTheDocument();
    expect(screen.queryByTestId("concierge-checklist-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("boh-checklist-view")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cafe-checklist-view")).not.toBeInTheDocument();
  });

  it("shows no-checklists message when user has manager role only", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "manager" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByText("No checklists available for your role.")).toBeInTheDocument();
  });

  it("when roles default to empty array (e.g. still loading), shows no-checklists fallback", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [],
      isLoading: true,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByText("No checklists available for your role.")).toBeInTheDocument();
  });

  it("user with multiple checklist roles sees all matching views", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      data: [{ role: "concierge" }, { role: "cafe" }],
      isLoading: false,
    } as ReturnType<typeof useUserRoles>);

    renderMyChecklistsPage();

    expect(screen.getByTestId("concierge-checklist-view")).toBeInTheDocument();
    expect(screen.getByTestId("cafe-checklist-view")).toBeInTheDocument();
  });
});
