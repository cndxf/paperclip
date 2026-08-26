import { describe, expect, it } from "vitest";
import { buildOnboardingGreeting } from "./onboarding-greeting.js";

describe("buildOnboardingGreeting", () => {
  it("introduces the agent by name as the user's first teammate and reflects the goals", () => {
    const greeting = buildOnboardingGreeting({
      agentName: "Nova",
      teamName: "Acme",
      goals: "Launch a marketplace for local makers.",
    });

    expect(greeting).toContain(
      "您好！我是 Nova，您在 Paperclip 中的首位智能体伙伴。",
    );
    expect(greeting).toContain("我目前理解您的目标是：");
    expect(greeting).toContain("> Launch a marketplace for local makers.");
    expect(greeting).toContain("提议一组智能体协助执行");
    expect(greeting).toContain("几个重点问题");
  });

  it("falls back to a generic teammate intro when no agent name is set", () => {
    const greeting = buildOnboardingGreeting({ agentName: null, goals: null });

    expect(greeting).toContain(
      "您好！我是您在 Paperclip 中的首位智能体伙伴。",
    );
  });

  it("collapses whitespace in the reflected goals", () => {
    const greeting = buildOnboardingGreeting({
      goals: "  Build\n\n  a  SaaS product.  ",
    });

    expect(greeting).toContain("> Build a SaaS product.");
  });

  it("omits the reflect-back block when no goals are provided", () => {
    const greeting = buildOnboardingGreeting({ agentName: "Nova", goals: null });

    expect(greeting).not.toContain("您的目标是");
    expect(greeting).toContain("提议一组智能体协助执行");
  });
});
