import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus2 } from "lucide-react";
import { accessApi } from "@/api/access";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

export function JoinRequestQueue() {
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"pending_approval" | "approved" | "rejected">("pending_approval");
  const [requestType, setRequestType] = useState<"all" | "human" | "agent">("all");

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: "Inbox", href: "/inbox" },
      { label: "Join Requests" },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs]);

  const requestsQuery = useQuery({
    queryKey: queryKeys.access.joinRequests(selectedCompanyId ?? "", `${status}:${requestType}`),
    queryFn: () =>
      accessApi.listJoinRequests(
        selectedCompanyId!,
        status,
        requestType === "all" ? undefined : requestType,
      ),
    enabled: !!selectedCompanyId,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.approveJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!, `${status}:${requestType}`) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyMembers(selectedCompanyId!) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!) });
      pushToast({ title: "加入申请已批准", tone: "success" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => accessApi.rejectJoinRequest(selectedCompanyId!, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!, `${status}:${requestType}`) });
      pushToast({ title: "加入申请已拒绝", tone: "success" });
    },
  });

  if (!selectedCompanyId) {
    return <div className="text-sm text-muted-foreground">请选择公司以审核加入申请。</div>;
  }

  if (requestsQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">正在加载加入申请……</div>;
  }

  if (requestsQuery.error) {
    const message =
      requestsQuery.error instanceof ApiError && requestsQuery.error.status === 403
        ? "你没有审核此公司加入申请的权限。"
        : requestsQuery.error instanceof Error
          ? requestsQuery.error.message
          : "加载加入申请失败。";
    return <div className="text-sm text-destructive">{message}</div>;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">加入申请队列</h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          在混合待处理列表之外审核人工和智能体的加入申请。此队列使用与待处理卡片相同的审批操作。
        </p>
      </div>

      <Card className="flex-row flex-wrap gap-3 p-4">
        <label className="space-y-2 text-sm">
          <span className="font-medium">状态</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "pending_approval" | "approved" | "rejected")
            }
          >
            <option value="pending_approval">待审批</option>
            <option value="approved">已批准</option>
            <option value="rejected">已拒绝</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">申请类型</span>
          <select
            className="rounded-md border border-border bg-background px-3 py-2"
            value={requestType}
            onChange={(event) =>
              setRequestType(event.target.value as "all" | "human" | "agent")
            }
          >
            <option value="all">全部</option>
            <option value="human">人工</option>
            <option value="agent">智能体</option>
          </select>
        </label>
      </Card>

      <div className="space-y-4">
        {(requestsQuery.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
            没有符合当前筛选条件的加入申请。
          </div>
        ) : (
          requestsQuery.data!.map((request) => (
            <Card key={request.id} className="block p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={request.status === "pending_approval" ? "secondary" : request.status === "approved" ? "outline" : "destructive"}>
                      {request.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{request.requestType}</Badge>
                    {request.adapterType ? <Badge variant="outline">{request.adapterType}</Badge> : null}
                  </div>
                  <div>
                    <div className="text-base font-medium">
                      {request.requestType === "human"
                        ? request.requesterUser?.name || request.requestEmailSnapshot || request.requestingUserId || "Unknown human requester"
                          : request.agentName || "未知智能体申请人"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.requestType === "human"
                        ? request.requesterUser?.email || request.requestEmailSnapshot || request.requestingUserId
                        : request.capabilities || request.requestIp}
                    </div>
                  </div>
                </div>

                {request.status === "pending_approval" ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                    >
                      拒绝
                    </Button>
                    <Button
                      onClick={() => approveMutation.mutate(request.id)}
                      disabled={approveMutation.isPending}
                    >
                      批准
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide">邀请信息</div>
                  <div className="mt-2">
                    {request.invite
                      ? `${request.invite.allowedJoinTypes} join invite${request.invite.humanRole ? ` • default role ${request.invite.humanRole}` : ""}`
                      : "邀请元数据不可用"}
                  </div>
                  {request.invite?.inviteMessage ? (
                    <div className="mt-2 text-foreground">{request.invite.inviteMessage}</div>
                  ) : null}
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide">申请详情</div>
                  <div className="mt-2">提交时间：{new Date(request.createdAt).toLocaleString()}</div>
                  <div>来源 IP：{request.requestIp}</div>
                  {request.requestType === "agent" && request.capabilities ? <div>{request.capabilities}</div> : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
