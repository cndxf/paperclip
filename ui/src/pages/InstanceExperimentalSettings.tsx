import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, FlaskConical, Lock, Play, Search } from "lucide-react";
import type {
  InstanceExperimentalSettings,
  InstanceExperimentalSettingsWithManaged,
  InstanceFeatureKey,
  IssueGraphLivenessAutoRecoveryPreview,
  ManagedSettingMetadata,
  PatchInstanceExperimentalSettings,
} from "@paperclipai/shared";
import { experimentalSettingKey } from "@paperclipai/shared";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { useHiddenSettings } from "@/hooks/useHiddenSettings";
import { getWorktreeInstanceId, isWorktreeRuntime } from "../lib/worktree-branding";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "../i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function issueHref(identifier: string | null, issueId: string) {
  if (!identifier) return `/issues/${issueId}`;
  const prefix = identifier.split("-")[0] || "PAP";
  return `/${prefix}/issues/${identifier}`;
}

function formatRecoveryState(state: string) {
  return state.replace(/_/g, " ");
}

type WorktreeRunExecutionDisplayState =
  | { kind: "off" }
  | { kind: "armed"; activatedAt: string }
  | { kind: "fail_closed"; reason: "missing_cutoff" | "missing_instance_id" | "instance_mismatch" };

/**
 * Mirror of the server's `resolveWorktreeRunExecutionActivation` fail-closed
 * ladder (server/src/services/instance-settings.ts) so the card never claims a
 * copied/legacy row is arming execution. The derived fields are display-only —
 * the PATCH the toggle sends still writes just the boolean.
 */
function resolveWorktreeRunExecutionDisplayState(
  settings:
    | Pick<
        InstanceExperimentalSettings,
        | "enableWorktreeRunExecution"
        | "worktreeRunExecutionActivatedAt"
        | "worktreeRunExecutionActivationInstanceId"
      >
    | undefined,
  currentInstanceId: string | null,
): WorktreeRunExecutionDisplayState {
  if (settings?.enableWorktreeRunExecution !== true) return { kind: "off" };
  if (!settings.worktreeRunExecutionActivatedAt) return { kind: "fail_closed", reason: "missing_cutoff" };
  if (!currentInstanceId) return { kind: "fail_closed", reason: "missing_instance_id" };
  if (settings.worktreeRunExecutionActivationInstanceId !== currentInstanceId) {
    return { kind: "fail_closed", reason: "instance_mismatch" };
  }
  return { kind: "armed", activatedAt: settings.worktreeRunExecutionActivatedAt };
}

function formatActivationTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// PAP-11233: keep Conference Room code intact, but hide the user-facing opt-in for now.
const SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING = false;

function ManagedByCloudBadge() {
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Lock aria-hidden="true" />
      Managed by Paperclip Cloud
    </Badge>
  );
}

function ExperimentalToggleCard({
  title,
  description,
  footnote,
  checked,
  onCheckedChange,
  disabled,
  settingKey,
  managed,
  ariaLabel,
}: {
  title: string;
  description: string;
  footnote?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
  /** Flag key backing this card; operator-hidden keys render nothing. */
  settingKey: InstanceFeatureKey;
  managed?: ManagedSettingMetadata;
  ariaLabel: string;
}) {
  const { hidden: hiddenSettings } = useHiddenSettings();
  const isManaged = managed?.managed === true;
  if (hiddenSettings.has(experimentalSettingKey(settingKey))) return null;
  return (
    <Card className="block p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {isManaged ? <ManagedByCloudBadge /> : null}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          {footnote ? <p className="max-w-2xl text-xs text-muted-foreground">{footnote}</p> : null}
        </div>
        <ToggleSwitch
          checked={checked}
          onCheckedChange={(next) => {
            if (isManaged) return;
            onCheckedChange(next);
          }}
          disabled={disabled || isManaged}
          aria-label={ariaLabel}
        />
      </div>
    </Card>
  );
}

function RecoveryPreviewDialog({
  preview,
  open,
  onOpenChange,
  onEnableOnly,
  onEnableAndRun,
  isPending,
}: {
  preview: IssueGraphLivenessAutoRecoveryPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnableOnly: () => void;
  onEnableAndRun: () => void;
  isPending: boolean;
}) {
  const count = preview?.recoverableFindings ?? 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Confirm auto-recovery</DialogTitle>
          <DialogDescription>
            {preview
              ? `${count} recovery ${count === 1 ? "task" : "tasks"} match the last ${preview.lookbackHours} hours.`
              : "Checking recovery candidates before enabling."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-(--sz-calc-36) space-y-3 overflow-y-auto pr-1">
          {preview && preview.items.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
              No recovery tasks would be created right now. Auto-recovery can still run for future liveness incidents in
              this window.
            </div>
          ) : null}

          {preview?.items.map((item) => (
            <Card key={item.incidentKey} className="block px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={issueHref(item.identifier, item.issueId)}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  {item.identifier ?? item.issueId}
                </a>
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {formatRecoveryState(item.state)}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Recovery target:{" "}
                <a
                  href={issueHref(item.recoveryIdentifier, item.recoveryIssueId)}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {item.recoveryIdentifier ?? item.recoveryIssueId}
                </a>
              </div>
            </Card>
          ))}
        </div>

        {preview && preview.skippedOutsideLookback > 0 ? (
          <p className="text-xs text-muted-foreground">
            {preview.skippedOutsideLookback} current{" "}
            {preview.skippedOutsideLookback === 1 ? "finding is" : "findings are"} outside the configured lookback and
            will not be touched.
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onEnableOnly} disabled={isPending || !preview}>
            Enable only
          </Button>
          <Button onClick={onEnableAndRun} disabled={isPending || !preview}>
            {count > 0 ? `Enable and create ${count}` : "Enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InstanceExperimentalSettings() {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [lookbackHoursDraft, setLookbackHoursDraft] = useState("24");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<IssueGraphLivenessAutoRecoveryPreview | null>(null);

  function closeRecoveryPreview() {
    setPreviewDialogOpen(false);
    setPendingPreview(null);
  }

  useEffect(() => {
    setBreadcrumbs([
      { label: "Settings", href: "/company/settings" },
      { label: "实验" },
    ]);
  }, [setBreadcrumbs]);

  const experimentalQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const toggleMutation = useMutation<
    InstanceExperimentalSettingsWithManaged,
    Error,
    PatchInstanceExperimentalSettings,
    { previousSettings?: InstanceExperimentalSettingsWithManaged }
  >({
    mutationFn: async (patch: PatchInstanceExperimentalSettings) =>
      instanceSettingsApi.updateExperimental(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.instance.experimentalSettings });
      const previousSettings = queryClient.getQueryData<InstanceExperimentalSettingsWithManaged>(
        queryKeys.instance.experimentalSettings,
      );
      if (previousSettings) {
        queryClient.setQueryData<InstanceExperimentalSettingsWithManaged>(
          queryKeys.instance.experimentalSettings,
          { ...previousSettings, ...patch },
        );
      }
      return { previousSettings };
    },
    onSuccess: async (updatedSettings) => {
      setActionError(null);
      queryClient.setQueryData(queryKeys.instance.experimentalSettings, updatedSettings);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: ["built-in-agents"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      ]);
    },
    onError: (error, _patch, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.instance.experimentalSettings, context.previousSettings);
      }
      setActionError(error instanceof Error ? error.message : "Failed to update experimental settings.");
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (lookbackHours: number) =>
      instanceSettingsApi.previewIssueGraphLivenessAutoRecovery({ lookbackHours }),
    onSuccess: (preview) => {
      setActionError(null);
      setPendingPreview(preview);
      setPreviewDialogOpen(true);
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to preview recovery tasks.");
    },
  });

  const runRecoveryMutation = useMutation({
    mutationFn: async (lookbackHours: number) =>
      instanceSettingsApi.runIssueGraphLivenessAutoRecovery({ lookbackHours }),
    onSuccess: async () => {
      setActionError(null);
      closeRecoveryPreview();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      ]);
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to create recovery tasks.");
    },
  });

  useEffect(() => {
    const next = experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours;
    if (typeof next === "number") {
      setLookbackHoursDraft(String(next));
    }
  }, [experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours]);

  const autoRecoveryManaged =
    experimentalQuery.data?.managedKeys?.enableIssueGraphLivenessAutoRecovery?.managed === true;

  // If refreshed settings mark auto-recovery as managed while the preview
  // dialog is open, close it so its confirmation actions cannot emit a PATCH.
  useEffect(() => {
    if (autoRecoveryManaged) {
      closeRecoveryPreview();
    }
  }, [autoRecoveryManaged]);

  if (experimentalQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t("experimental.loading")}</div>;
  }

  if (experimentalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {experimentalQuery.error instanceof Error
          ? experimentalQuery.error.message
          : "Failed to load experimental settings."}
      </div>
    );
  }

  const inWorktree = isWorktreeRuntime();
  // Present only on cloud-managed instances: keys the managed overlay controls
  // render locked with the "Managed by Paperclip Cloud" badge. Self-hosted
  // responses carry no `managedKeys`, so every card stays editable.
  const managedKeys = experimentalQuery.data?.managedKeys ?? {};
  const enableWorktreeRunExecution = experimentalQuery.data?.enableWorktreeRunExecution === true;
  const worktreeRunExecutionManaged = managedKeys.enableWorktreeRunExecution?.managed === true;
  const worktreeRunExecutionState = resolveWorktreeRunExecutionDisplayState(
    experimentalQuery.data,
    getWorktreeInstanceId(),
  );
  const enableEnvironments = experimentalQuery.data?.enableEnvironments === true;
  const enableManagedSandboxOnly = experimentalQuery.data?.enableManagedSandboxOnly === true;
  const enableIsolatedWorkspaces = experimentalQuery.data?.enableIsolatedWorkspaces === true;
  const enableApps = experimentalQuery.data?.enableApps === true;
  // Streamlined left navigation is now the standard sidebar (PAP-12472); the
  // experimental opt-out was retired, so it no longer surfaces a toggle here.
  const enableConferenceRoomChat = experimentalQuery.data?.enableConferenceRoomChat === true;
  const enableClassicTaskInterface = experimentalQuery.data?.enableClassicTaskInterface === true;
  const enableIssuePlanDecompositions =
    experimentalQuery.data?.enableIssuePlanDecompositions === true;
  const enableExperimentalFileViewer =
    experimentalQuery.data?.enableExperimentalFileViewer === true;
  const enableTaskWatchdogs = experimentalQuery.data?.enableTaskWatchdogs === true;
  const enableExternalObjects = experimentalQuery.data?.enableExternalObjects === true;
  const enableBuiltInAgents = experimentalQuery.data?.enableBuiltInAgents === true;
  const enableBetaSkills = experimentalQuery.data?.enableBetaSkills === true;
  const enableSummaries = experimentalQuery.data?.enableSummaries === true;
  const enableStatusCards = experimentalQuery.data?.enableStatusCards === true;
  const summariesManaged = managedKeys.enableSummaries?.managed === true;
  const statusCardsManaged = managedKeys.enableStatusCards?.managed === true;
  const statusCardsBlockedByManagedSummaries = summariesManaged && !enableSummaries;
  const summariesRequiredByManagedStatusCards = statusCardsManaged && enableStatusCards;
  const enableDecisions = experimentalQuery.data?.enableDecisions === true;
  const enableGoalsSidebarLink = experimentalQuery.data?.enableGoalsSidebarLink === true;
  const enableCases = experimentalQuery.data?.enableCases === true;
  const enableServerInfoDebugView = experimentalQuery.data?.enableServerInfoDebugView === true;
  const enableSimplifiedEnglishInteractions =
    experimentalQuery.data?.enableSimplifiedEnglishInteractions === true;
  const enableSmokeLab = experimentalQuery.data?.enableSmokeLab === true;
  const autoRestartDevServerWhenIdle = experimentalQuery.data?.autoRestartDevServerWhenIdle === true;
  const enableIssueGraphLivenessAutoRecovery =
    experimentalQuery.data?.enableIssueGraphLivenessAutoRecovery === true;
  const lookbackHours =
    experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours ?? 24;
  const parsedLookbackHours = Number.parseInt(lookbackHoursDraft, 10);
  const lookbackHoursIsValid =
    Number.isInteger(parsedLookbackHours) && parsedLookbackHours >= 1 && parsedLookbackHours <= 720;
  const recoveryActionPending =
    toggleMutation.isPending || previewMutation.isPending || runRecoveryMutation.isPending;

  function previewForEnable() {
    if (autoRecoveryManaged) return;
    if (!lookbackHoursIsValid) {
      setActionError("Lookback hours must be a whole number from 1 to 720.");
      return;
    }
    closeRecoveryPreview();
    previewMutation.mutate(parsedLookbackHours);
  }

  function enableOnly() {
    if (autoRecoveryManaged) return;
    if (!lookbackHoursIsValid) return;
    closeRecoveryPreview();
    toggleMutation.mutate({
      enableIssueGraphLivenessAutoRecovery: true,
      issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
    });
  }

  function enableAndRun() {
    if (autoRecoveryManaged) return;
    if (!lookbackHoursIsValid) return;
    closeRecoveryPreview();
    toggleMutation.mutate({
      enableIssueGraphLivenessAutoRecovery: true,
      issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
    }, {
      onSuccess: () => runRecoveryMutation.mutate(parsedLookbackHours),
    });
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t("experimental.title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Opt into features that are still being evaluated before they become default behavior.
        </p>
      </div>

      <div
        role="alert"
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{t("experimental.warning")}</p>
            <p className="text-muted-foreground">
              这些功能需要手动启用，不保证兼容性，可能在不另行通知的情况下变更、失效或移除。请勿在关键或生产工作流中依赖它们。
            </p>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <ExperimentalToggleCard
        title="应用"
        description="显示应用导航，并允许访问应用连接、网关和高级应用工具。"
        checked={enableApps}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableApps: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableApps"
        managed={managedKeys.enableApps}
        ariaLabel="Toggle apps experimental setting"
      />

      <Card className="block p-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">自动创建恢复任务</h2>
                {autoRecoveryManaged ? <ManagedByCloudBadge /> : null}
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                让心跳调度器在设定的回溯时间范围内，为任务依赖链自动创建恢复任务。
              </p>
            </div>
            <ToggleSwitch
              checked={enableIssueGraphLivenessAutoRecovery}
              onCheckedChange={() => {
                if (autoRecoveryManaged) return;
                if (enableIssueGraphLivenessAutoRecovery) {
                  toggleMutation.mutate({ enableIssueGraphLivenessAutoRecovery: false });
                  return;
                }
                previewForEnable();
              }}
              disabled={recoveryActionPending || autoRecoveryManaged}
              aria-label="Toggle task graph liveness auto-recovery"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-(--gtc-35) sm:items-end">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                回溯小时数
              </span>
              <Input
                type="number"
                min={1}
                max={720}
                step={1}
                value={lookbackHoursDraft}
                onChange={(event) => setLookbackHoursDraft(event.target.value)}
                aria-invalid={!lookbackHoursIsValid}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!lookbackHoursIsValid) {
                    setActionError("回溯小时数必须是 1 到 720 之间的整数。 ");
                    return;
                  }
                  toggleMutation.mutate({
                    issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
                  });
                }}
                disabled={recoveryActionPending || parsedLookbackHours === lookbackHours}
              >
                保存小时数
              </Button>
              <Button
                variant="outline"
                onClick={previewForEnable}
                disabled={recoveryActionPending}
              >
                <Search className="h-4 w-4" />
                预览
              </Button>
              <Button
                onClick={() => {
                  if (!lookbackHoursIsValid) {
                    setActionError("回溯小时数必须是 1 到 720 之间的整数。 ");
                    return;
                  }
                  runRecoveryMutation.mutate(parsedLookbackHours);
                }}
                disabled={recoveryActionPending || !enableIssueGraphLivenessAutoRecovery}
              >
                <Play className="h-4 w-4" />
                立即运行
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            当前时间范围：最近 {lookbackHours} 小时。
          </p>
        </div>
      </Card>

      <ExperimentalToggleCard
        title="空闲时自动重启开发服务器"
        description="在 `pnpm dev:once` 中等待排队和运行中的本地智能体任务完成；当后端变更或迁移导致当前启动过期时，自动重启服务器。"
        checked={autoRestartDevServerWhenIdle}
        onCheckedChange={(checked) => toggleMutation.mutate({ autoRestartDevServerWhenIdle: checked })}
        disabled={toggleMutation.isPending}
        settingKey="autoRestartDevServerWhenIdle"
        managed={managedKeys.autoRestartDevServerWhenIdle}
        ariaLabel="Toggle guarded dev-server auto-restart"
      />

      <ExperimentalToggleCard
        title="Beta 技能"
        description="允许智能体固定使用 Paperclip 核心技能的 Beta 版本。停用后会将所有智能体恢复到默认技能，但不会删除已保存的固定版本。"
        checked={enableBetaSkills}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableBetaSkills: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableBetaSkills"
        managed={managedKeys.enableBetaSkills}
        ariaLabel="Toggle beta skills experimental setting"
      />

      <ExperimentalToggleCard
        title="内置智能体"
        description="显示由 Paperclip 管理的内置智能体界面，包括内置成员徽章、内置智能体页签和设置控件。"
        checked={enableBuiltInAgents}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableBuiltInAgents: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableBuiltInAgents"
        managed={managedKeys.enableBuiltInAgents}
        ariaLabel="Toggle built-in agents experimental setting"
      />

      <ExperimentalToggleCard
        title="事项"
        description="任务创建并持续迭代的长期成果（如博客文章、推文串等）。启用后会增加“事项”页签和智能体事项 API。"
        footnote="停用“事项”后会隐藏页签并阻止事项 API，但会保留现有事项数据。"
        checked={enableCases}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableCases: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableCases"
        managed={managedKeys.enableCases}
        ariaLabel="Toggle cases experimental setting"
      />

      <ExperimentalToggleCard
        title="Classic Task Interface"
        description="恢复旧版任务详情页：页面级标题、可直接编辑描述、普通评论线程和固定属性侧栏。经典视图不提供聊天专属功能，包括活动流折叠、内嵌计划与问题卡片以及三模式编辑器。"
        footnote="切换会立即生效，不会影响任务数据。"
        checked={enableClassicTaskInterface}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableClassicTaskInterface: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableClassicTaskInterface"
        managed={managedKeys.enableClassicTaskInterface}
        ariaLabel="Toggle classic task interface experimental setting"
      />

      {SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING ? (
        <ExperimentalToggleCard
          title="会议室聊天"
          description="增加一个供你和团队协作的会议室聊天、实时动态和新版入门引导，并将任务线程改为聊天气泡。可随时关闭以恢复经典界面。"
          checked={enableConferenceRoomChat}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableConferenceRoomChat: checked })}
          disabled={toggleMutation.isPending}
          settingKey="enableConferenceRoomChat"
          managed={managedKeys.enableConferenceRoomChat}
          ariaLabel="Toggle conference room chat experimental setting"
        />
      ) : null}

      <ExperimentalToggleCard
        title="Decisions"
        description="在主侧边栏显示“决策”入口，集中展示等待您处理的任务；该功能仍在评估中。"
        checked={enableDecisions}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableDecisions: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableDecisions"
        managed={managedKeys.enableDecisions}
        ariaLabel="Toggle decisions experimental setting"
      />

      <ExperimentalToggleCard
        title="启用环境"
        description="在公司设置中显示环境管理，并允许为项目和智能体分配环境。"
        checked={enableEnvironments}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableEnvironments: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableEnvironments"
        managed={managedKeys.enableEnvironments}
        ariaLabel="Toggle environments experimental setting"
      />

      <ExperimentalToggleCard
        title="启用外部对象"
        description="识别任务中的外部 URL，并显示拉取请求、工单及其他引用工作对象的解析状态。"
        checked={enableExternalObjects}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableExternalObjects: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableExternalObjects"
        managed={managedKeys.enableExternalObjects}
        ariaLabel="Toggle external objects experimental setting"
      />

      <ExperimentalToggleCard
        title="启用隔离工作区"
        description="在项目配置中显示执行工作区控件，并允许新旧任务运行使用隔离工作区。"
        checked={enableIsolatedWorkspaces}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableIsolatedWorkspaces: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableIsolatedWorkspaces"
        managed={managedKeys.enableIsolatedWorkspaces}
        ariaLabel="Toggle isolated workspaces experimental setting"
      />

      <ExperimentalToggleCard
        title="实验性文件查看器"
        description="在任务详情中显示相对任务浏览和预览工作区文件的控件。"
        checked={enableExperimentalFileViewer}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableExperimentalFileViewer: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableExperimentalFileViewer"
        managed={managedKeys.enableExperimentalFileViewer}
        ariaLabel="Toggle experimental file viewer setting"
      />

      <ExperimentalToggleCard
        title="目标侧边栏入口"
        description="在目标功能仍处于评估阶段时，恢复主侧边栏中的“目标”入口。"
        checked={enableGoalsSidebarLink}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableGoalsSidebarLink: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableGoalsSidebarLink"
        managed={managedKeys.enableGoalsSidebarLink}
        ariaLabel="Toggle goals sidebar link experimental setting"
      />

      <ExperimentalToggleCard
        title="仅使用托管环境"
        description="隐藏本地环境，并让所有智能体在平台托管环境中运行。"
        checked={enableManagedSandboxOnly}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableManagedSandboxOnly: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableManagedSandboxOnly"
        managed={managedKeys.enableManagedSandboxOnly}
        ariaLabel="Toggle managed environment only experimental setting"
      />

      {inWorktree ? (
        <Card className="block p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">在此工作树中运行任务</h2>
                  {worktreeRunExecutionManaged ? <ManagedByCloudBadge /> : null}
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  这是一个隔离的 Git 工作树预览实例。启用后，调度器会在这里执行任务。仅启用后创建的任务会自动运行，复制或已有任务会保持暂停；关闭再开启会重置起始时间。
                </p>
              </div>
              <ToggleSwitch
                checked={enableWorktreeRunExecution}
                onCheckedChange={(checked) => {
                  if (worktreeRunExecutionManaged) return;
                  toggleMutation.mutate({ enableWorktreeRunExecution: checked });
                }}
                disabled={toggleMutation.isPending || worktreeRunExecutionManaged}
                aria-label="Toggle worktree run execution setting"
              />
            </div>

            {worktreeRunExecutionState.kind === "armed" ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-foreground">
                <Play className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  正在运行创建于
                  <span className="font-medium">
                    {formatActivationTimestamp(worktreeRunExecutionState.activatedAt)}
                  </span>
                  之后的任务。
                </span>
              </div>
            ) : null}

            {worktreeRunExecutionState.kind === "fail_closed" ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">执行已被抑制，当前等同于关闭。</p>
                  <p className="text-muted-foreground">
                    {worktreeRunExecutionState.reason === "instance_mismatch"
                      ? "此设置在其他实例中启用后被复制到这里，因此不会自动运行任务。"
                      : "此设置缺少启用起始时间，因此不会自动运行任务。"}{" "}
                    请先关闭再开启，为在此创建的任务启用执行。
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <ExperimentalToggleCard
        title="Server Info Debug View"
        description='在账户菜单中显示“服务器”区域，包括当前服务器重启时间和运行中的提交版本。'
        checked={enableServerInfoDebugView}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableServerInfoDebugView: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableServerInfoDebugView"
        managed={managedKeys.enableServerInfoDebugView}
        ariaLabel="Toggle server info debug view experimental setting"
      />

      <ExperimentalToggleCard
        title="Simplified English Interactions"
        description="要求智能体使用 ASD-STE100 简化技术英语记录用户交互（计划确认、问题、建议任务和复选框提示），并简要说明决策所需信息以及各选项的结果。"
        checked={enableSimplifiedEnglishInteractions}
        onCheckedChange={(checked) =>
          toggleMutation.mutate({ enableSimplifiedEnglishInteractions: checked })
        }
        disabled={toggleMutation.isPending}
        settingKey="enableSimplifiedEnglishInteractions"
        managed={managedKeys.enableSimplifiedEnglishInteractions}
        ariaLabel="Toggle simplified english interactions experimental setting"
      />

      <ExperimentalToggleCard
        title="Smoke Lab"
        description='Add a "Smoke Lab" tab under Apps → Developer and an "Integration smoke" card on the dashboard for exercising every integration path against deterministic local fixtures (fake OAuth provider + loopback MCP servers). Private (non-public) deployments only.'
        checked={enableSmokeLab}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableSmokeLab: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableSmokeLab"
        managed={managedKeys.enableSmokeLab}
        ariaLabel="Toggle smoke lab experimental setting"
      />

      <ExperimentalToggleCard
        title={t("experimental.statusCards", { defaultValue: "状态卡" })}
        description={t("experimental.statusCardsDescription", { defaultValue: "启用实验性的共享状态卡面板及其受控 API。停用后仍会保留现有卡片数据。" })}
        footnote={t("experimental.statusCardsFootnote", { defaultValue: "启用状态卡也会启用摘要。" })}
        checked={enableStatusCards}
        onCheckedChange={(checked) =>
          toggleMutation.mutate(
            checked
              ? { enableSummaries: true, enableStatusCards: true }
              : { enableStatusCards: false },
          )
        }
        disabled={toggleMutation.isPending || statusCardsBlockedByManagedSummaries}
        settingKey="enableStatusCards"
        managed={managedKeys.enableStatusCards}
        ariaLabel="Toggle status cards experimental setting"
      />

      <ExperimentalToggleCard
        title={t("experimental.summaries", { defaultValue: "摘要" })}
        description={t("experimental.summariesDescription", { defaultValue: "在项目和工作区页面显示由摘要器生成的状态卡位，支持按需刷新和修订历史。停用后仍会保留现有摘要数据。" })}
        footnote={t("experimental.summariesFootnote", { defaultValue: "状态卡需要摘要。停用摘要也会停用状态卡。" })}
        checked={enableSummaries}
        onCheckedChange={(checked) =>
          toggleMutation.mutate(
            checked || !enableStatusCards
              ? { enableSummaries: checked }
              : { enableSummaries: false, enableStatusCards: false },
          )
        }
        disabled={toggleMutation.isPending || summariesRequiredByManagedStatusCards}
        settingKey="enableSummaries"
        managed={managedKeys.enableSummaries}
        ariaLabel={t("experimental.toggleSummaries", { defaultValue: "切换摘要实验性设置" })}
      />

      <ExperimentalToggleCard
        title="任务计划拆分面板"
        description="在任务详情页显示已接受计划的拆分历史。用于在界面仍持续优化时调试和验证子任务创建行为。"
        checked={enableIssuePlanDecompositions}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableIssuePlanDecompositions: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableIssuePlanDecompositions"
        managed={managedKeys.enableIssuePlanDecompositions}
        ariaLabel="Toggle task plan decomposition panel experimental setting"
      />

      <ExperimentalToggleCard
        title="任务看护智能体"
        description="在任务详情中显示看护智能体配置，用于检查已停止的任务子树，并在工作应继续时恢复执行路径。"
        checked={enableTaskWatchdogs}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableTaskWatchdogs: checked })}
        disabled={toggleMutation.isPending}
        settingKey="enableTaskWatchdogs"
        managed={managedKeys.enableTaskWatchdogs}
        ariaLabel="Toggle task watchdogs experimental setting"
      />

      {previewDialogOpen && !autoRecoveryManaged ? (
        <RecoveryPreviewDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              closeRecoveryPreview();
            }
          }}
          preview={pendingPreview}
          onEnableOnly={enableOnly}
          onEnableAndRun={enableAndRun}
          isPending={recoveryActionPending}
        />
      ) : null}
    </div>
  );
}
