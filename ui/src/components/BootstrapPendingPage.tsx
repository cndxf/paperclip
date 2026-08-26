import type { ReactNode } from "react";
import { Loader2, ShieldCheck, Terminal, TriangleAlert } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { BOOTSTRAP_FALLBACK_COMMAND } from "@/bootstrapSetup";
import type { AuthSession } from "@paperclipai/shared";
import { Card } from "@/components/ui/card";

type BootstrapPendingPageProps = {
  claimAvailable: boolean;
  hasActiveInvite?: boolean;
  session: AuthSession | null | undefined;
  claimState: "idle" | "claiming" | "success";
  claimError?: { status?: number; message?: string } | null;
  onClaim: () => void;
};

function CliFallback({ hasActiveInvite = false }: { hasActiveInvite?: boolean }) {
  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Terminal className="size-4 text-muted-foreground" aria-hidden />
        <span>是否要在主机上完成设置？</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasActiveInvite
          ? "管理员邀请链接已生效。请查看 Paperclip 启动日志获取链接，或在主机上执行此命令重新生成："
          : "请在运行 Paperclip 的主机上执行此命令，以生成一次性管理员邀请链接："}
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
{BOOTSTRAP_FALLBACK_COMMAND}
      </pre>
    </div>
  );
}

function StateChrome({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="block p-6">{children}</Card>
    </div>
  );
}

function displayIdentity(session: AuthSession) {
  return session.user.email || session.user.name || session.user.id;
}

function claimErrorCopy(error: BootstrapPendingPageProps["claimError"]) {
  if (error?.status === 409) {
    return {
      title: "其他用户已经认领了此实例。",
      body: "请刷新页面重新登录，或让现有管理员从“设置 -> 访问权限”邀请您。",
    };
  }
  if (error?.status === 401) {
    return {
      title: "登录会话已过期，请重新登录以认领此实例。",
      body: "",
    };
  }
  return {
    title: "无法连接服务器，请稍后重试。",
    body: "",
  };
}

export function BootstrapPendingPage({
  claimAvailable,
  hasActiveInvite = false,
  session,
  claimState,
  claimError,
  onClaim,
}: BootstrapPendingPageProps) {
  if (!claimAvailable) {
    return (
      <StateChrome>
        <h1 className="text-xl font-semibold">此 Paperclip 正在等待首位管理员</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          此实例仅允许通过邀请访问。管理员必须在主机上生成一次性邀请链接。获取链接后，请在此浏览器中打开以完成设置。
        </p>
        <CliFallback hasActiveInvite={hasActiveInvite} />
        <p className="mt-4 text-xs text-muted-foreground">
          公开模式下已关闭浏览器直接认领，防止网络中的任何人将自己提升为管理员。
        </p>
      </StateChrome>
    );
  }

  if (claimState === "success") {
    return (
      <StateChrome>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <div>
        <h1 className="text-xl font-semibold">您已成为实例管理员</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              设置已完成，正在进入入门引导以创建您的第一个公司……
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">正在跳转……</span>
        </div>
        <div className="mt-5">
          <Button asChild variant="outline">
            <a href="/">继续前往控制台</a>
          </Button>
        </div>
      </StateChrome>
    );
  }

  if (!session) {
    return (
      <StateChrome>
        <h1 className="text-xl font-semibold">完成此 Paperclip 的设置</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          尚未有管理员认领此实例。请登录或创建 Paperclip 账户，以便在此浏览器中成为首位管理员。
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link to="/auth?next=/">登录 / 创建账户</Link>
          </Button>
        </div>
        <CliFallback hasActiveInvite={hasActiveInvite} />
      </StateChrome>
    );
  }

  const errorCopy = claimErrorCopy(claimError);
  const isClaiming = claimState === "claiming";
  return (
    <StateChrome>
        <h1 className="text-xl font-semibold">完成此 Paperclip 的设置</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        尚未有管理员认领此实例。现在认领即可成为首位管理员并开始入门引导。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={onClaim} disabled={isClaiming}>
          {isClaiming && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
          {isClaiming ? "认领中……" : "认领此实例"}
        </Button>
        <span className="text-sm text-muted-foreground">
          当前登录账户：<span className="font-medium text-foreground">{displayIdentity(session)}</span>
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        登录账户不正确？{" "}
        <Link to="/auth?next=/" className="underline underline-offset-2">
          切换账户
        </Link>
        .
      </p>
      {claimError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 flex-shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{errorCopy.title}</p>
            {errorCopy.body && <p className="mt-1 text-destructive/90">{errorCopy.body}</p>}
          </div>
        </div>
      )}
      <CliFallback hasActiveInvite={hasActiveInvite} />
    </StateChrome>
  );
}
