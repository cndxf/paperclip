// Deterministic, template-driven greeting seeded as an agent-authored comment on
// the onboarding first task. No LLM call: it reflects back the onboarding context
// (team name + goals) so the user lands on a waiting greeting instead of a
// right-aligned "user" bubble showing the agent's own seeded instructions.

export const ONBOARDING_GREETING_AUTHORIZATION_REASON = "onboarding first-task greeting";

export function buildOnboardingGreeting(input: {
  agentName?: string | null;
  teamName?: string | null;
  goals?: string | null;
}): string {
  const agentName = input.agentName?.trim();
  const goals = input.goals?.replace(/\s+/g, " ").trim();

  // Introduce the agent by the name the user chose in onboarding when we have
  // it, so the first message reads as coming from *their* first teammate rather
  // than a generic agent. Fall back to the generic phrasing otherwise.
  const identity = agentName
    ? `您好！我是 ${agentName}，您在 Paperclip 中的首位智能体伙伴。`
    : "您好！我是您在 Paperclip 中的首位智能体伙伴。";

  const lines: string[] = [];
  lines.push(identity);

  if (goals) {
    lines.push("");
    lines.push("我目前理解您的目标是：");
    lines.push("");
    lines.push(`> ${goals}`);
  }

  lines.push("");
  lines.push(
    "我想先收集更多背景信息，以便制定计划，并提议一组智能体协助执行。我会先整理几个重点问题，帮助我们确定要优先处理的具体目标。请稍等片刻……",
  );

  return lines.join("\n");
}
