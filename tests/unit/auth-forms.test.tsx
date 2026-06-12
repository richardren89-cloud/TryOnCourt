import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

const push = vi.fn();
const refresh = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => searchParams,
}));

describe("auth forms", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    push.mockReset();
    refresh.mockReset();
  });

  it("submits login credentials and redirects home", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ user: { id: "u1" } })));

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("用户名"), { target: { value: "player1" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "Correct-Horse-123" } });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            username: "player1",
            password: "Correct-Horse-123",
          }),
        }),
      );
    });
    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows login errors without redirecting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Invalid username or password." }, 401)),
    );

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("用户名"), { target: { value: "player1" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
    expect(push).not.toHaveBeenCalled();
  });

  it("submits registration details and redirects to credits", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ user: { id: "u1" } }, 201)));

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText("用户名"), { target: { value: "player1" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "Correct-Horse-123" } });
    fireEvent.change(screen.getByLabelText("出生年份"), { target: { value: "2000" } });
    fireEvent.click(screen.getByLabelText("我确认自己年满 13 岁"));
    fireEvent.click(screen.getByRole("button", { name: "注册并领取 5 积分" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            username: "player1",
            password: "Correct-Horse-123",
            birthYear: 2000,
            ageConfirmed: true,
            guardianConsent: false,
            termsVersion: "terms-2026-06",
            privacyVersion: "privacy-2026-06",
          }),
        }),
      );
    });
    expect(push).toHaveBeenCalledWith("/credits");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows registration errors without redirecting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "用户名已存在，请换一个用户名。" }, 400)),
    );

    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText("用户名"), { target: { value: "player1" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "Correct-Horse-123" } });
    fireEvent.change(screen.getByLabelText("出生年份"), { target: { value: "2010" } });
    fireEvent.click(screen.getByLabelText("我确认自己年满 13 岁"));
    fireEvent.click(screen.getByLabelText("未满 18 岁时，我已获得监护人同意"));
    fireEvent.click(screen.getByRole("button", { name: "注册并领取 5 积分" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("用户名已存在，请换一个用户名。");
    expect(push).not.toHaveBeenCalled();
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
