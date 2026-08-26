import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import visibleCopy from "./visible-copy.zh-CN.json";

const ORIGINAL = "data-paperclip-original-copy";
const ATTRIBUTES = ["placeholder", "title", "aria-label"] as const;
const originalTextByNode = new WeakMap<Text, string>();

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

// Many legacy pages build short status messages dynamically. Keep this fallback
// deliberately narrow: it handles repeated UI sentence patterns while leaving
// commands, paths, identifiers, and technical values untouched.
function translateDynamic(value: string) {
  const text = normalize(value);
  const commonUiWords: Record<string, string> = {
    Apps: "应用", Browse: "浏览", Review: "审核", Connections: "连接",
    Overview: "概览", Properties: "属性", Description: "描述",
    Attachments: "附件", Files: "文件", File: "文件", Folder: "文件夹",
    None: "无", "None yet": "暂无", "No labels yet.": "暂无标签。",
    "Saving...": "保存中……", "Saving…": "保存中……", "Loading routines...": "正在加载自动任务……",
    "Loading...": "正在加载……", Cancel: "取消", Close: "关闭", Save: "保存",
    Delete: "删除", Edit: "编辑", View: "查看", Back: "返回", Next: "下一步",
    Previous: "上一步", Submit: "提交", Confirm: "确认", Continue: "继续",
    Status: "状态", Type: "类型", Key: "键", Labels: "标签", Tasks: "任务",
    Project: "项目", Branch: "分支", Provider: "提供方", Version: "版本",
    Created: "创建时间", Updated: "更新时间", Actions: "操作", Settings: "设置",
    "Under review": "审核中", "Productivity review open": "效率评审进行中",
    Label: "标签", Schedule: "计划", "Signing mode": "签名模式", Deferred: "已延后",
    "No workspace operations have been recorded yet.": "暂无工作区操作记录。",
    "No agents have access yet.": "暂时没有智能体获得访问权限。",
    "No linked work yet.": "暂无关联工作。",
    "No secrets are bound to this agent yet.": "此智能体暂未绑定任何密钥。",
    "Select a company to view this page.": "请选择公司以查看此页面。",
    "No 管理员 has claimed this instance yet.": "尚未有管理员认领此实例。",
    "Sign in or create your Paperclip account to become the first 管理员 from this browser.": "请登录或创建 Paperclip 账户，以便在此浏览器中成为首位管理员。",
    "是否希望在主机上完成设置？": "是否要在主机上完成设置？",
    "运行 this command on the host that runs Paperclip to print a one-time first-管理员 invite URL:": "请在运行 Paperclip 的主机上执行此命令，以生成一次性管理员邀请链接：",
    "Sign in / Create account": "登录 / 创建账户",
    "Claim this instance": "认领此实例",
    "Claiming...": "认领中……",
    "Prefer to finish setup from the host?": "是否要在主机上完成设置？",
    "This Paperclip is waiting on its first admin": "此 Paperclip 正在等待首位管理员",
    "Loading companies...": "正在加载公司……",
    "Unlimited budget": "不限额预算",
    "Installed apps": "已安装应用",
    "Could not save": "无法保存",
    "Unsaved changes": "有未保存的更改",
    "Allowed tools": "允许使用的工具",
    "cannot expand it": "无法展开",
    "Coming soon": "即将推出",
    "Health not checked": "尚未检查健康状态",
    Region: "区域",
    Operation: "操作",
    "Vault context": "密钥库上下文",
    "Safe request/error details": "安全的请求 / 错误详情",
    "Required IAM capability": "所需 IAM 权限",
    "Agent access": "智能体访问权限",
    "No agents have access yet.": "暂时没有智能体获得访问权限。",
    "Provided by": "提供者",
    "Latest version": "最新版本",
    "API alias": "API 别名",
    "Unsaved edits live only in this Studio session...": "未保存的修改仅保留在当前 Studio 会话中……",
    "Unsaved edits live only in this Studio session. Save to create the next version before running tests or switching files.": "未保存的修改仅保留在当前 Studio 会话中。运行测试或切换文件前，请先保存以创建新版本。",
    "Read-only": "只读",
    Unsaved: "未保存",
    "Add file": "添加文件",
    "Add folder": "添加文件夹",
    "Delete folder": "删除文件夹",
    "New input": "新建输入",
    "Input folded": "输入区已折叠",
    "Save test input": "保存测试输入",
    "Run template": "运行模板",
    "Create run template": "创建运行模板",
    "Edit custom template": "编辑自定义模板",
    "Delete custom template": "删除自定义模板",
    "Loading template...": "正在加载模板……",
    "Pick an agent": "选择智能体",
    "No agents.": "暂无智能体。",
    "Version history": "版本历史",
    Input: "输入",
    Color: "颜色",
    Bundled: "内置",
    Edit: "编辑",
    Duplicate: "复制",
    Archive: "归档",
    Updated: "更新时间",
    "Choose a stage": "选择阶段",
    "Choose a pipeline": "选择流水线",
    "No input selected": "未选择输入",
    "New input (not saved)": "新建输入（未保存）",
    "Copy content": "复制内容",
    Revert: "还原",
    removed: "已移除",
    "Run template reset": "运行模板已重置",
    "Template saved": "模板已保存",
    "Template updated": "模板已更新",
    "Template deleted": "模板已删除",
    "Loading plugins...": "正在加载插件……",
    "Failed to load plugins.": "加载插件失败。",
    "Plugin Manager": "插件管理",
    "Install Plugin": "安装插件",
    "npm Package Name": "npm 包名称",
    "Plugins are alpha.": "插件功能仍处于 Alpha 阶段。",
    "Available Plugins": "可用插件",
    "Loading bundled plugins...": "正在加载内置插件……",
    "Failed to load bundled plugins.": "加载内置插件失败。",
    "Not installed": "未安装",
    "Building plugin...": "正在构建插件……",
    "Installed Plugins": "已安装插件",
    "No plugins installed": "尚未安装插件",
    "Plugin error": "插件错误",
    "Uninstall Plugin": "卸载插件",
    "Error Details": "错误详情",
    "Full error output": "完整错误输出",
    "Add application": "添加应用",
    Application: "应用",
    "Use existing application": "使用已有应用",
    "Create new application": "创建新应用",
    "Existing application": "已有应用",
    "New application name": "新应用名称",
    "Connection name": "连接名称",
    Transport: "传输方式",
    "Remote HTTP (no local process)": "远程 HTTP（不启动本地进程）",
    "Local stdio (approved template)": "本地 stdio（已批准的模板）",
    "Endpoint URL": "端点 URL",
    "Command template": "命令模板",
    "Credential references": "凭证引用",
    "Probe result": "探测结果",
    "tools discovered": "个工具已发现",
    "probe latency": "探测延迟",
    quarantined: "已隔离",
    "Check an agent's access": "检查智能体的访问权限",
    Profile: "配置",
    Allows: "允许项",
    "Assigned to": "分配给",
    "Create your first access profile": "创建第一个访问配置",
    "Back to profiles": "返回访问配置",
    "What it allows": "允许的操作",
    "Who has it": "已分配给谁",
    "New tools that appear later": "之后出现的新工具",
    "Choose which ones this profile should allow.": "选择此配置允许使用的工具。",
    Review: "审核",
    "Review new tools": "审核新工具",
    Tool: "工具",
    Capabilities: "能力",
    Source: "来源",
    "Not assigned yet": "尚未分配",
    "Assign this profile before it changes access.": "请先分配此配置，再修改访问权限。",
    "Profile saved": "配置已保存",
    "Update the profile name and description.": "更新配置名称和描述。",
    "Another profile already uses this name.": "已有其他配置使用此名称。",
    Identifier: "标识符",
    "Duplicate profile": "复制配置",
    "The copy starts unassigned unless you choose to copy assignments too.": "复制出的配置默认不会分配给任何人，除非您同时选择复制分配关系。",
    "Remove assignment": "移除分配",
    Remove: "移除",
    "Choose a pipeline": "选择流水线",
    "Choose a stage": "选择阶段",
    "Destination validation": "目标校验",
    "Stay on this step": "停留在此步骤",
    "Any human": "任意人工负责人",
    "When an item enters this step": "项目进入此步骤时",
    "Pick agent": "选择智能体",
    "Project fallback": "项目备用设置",
    "Choose an existing workspace": "选择已有工作区",
    "Move to": "移动到",
    "Delete stage": "删除阶段",
    "Move existing items to": "将现有项目移动到",
    "Archive pipeline": "归档流水线",
    "runs these instructions, then moves the item to the next step.": "执行这些指令，然后将项目移至下一步。",
    "Pipeline name": "流水线名称",
    "Pipeline description": "流水线描述",
    "Loading companies...": "正在加载公司……",
    "Unlimited budget": "不限额预算",
    "Work Timeline": "工作时间线",
    "Could not load this view": "无法加载此页面",
    Adapters: "适配器",
    "Package files": "包文件",
    "New card": "新建卡片",
    Examples: "示例",
    "Issue documents": "任务文档",
    "Sub-issues": "子任务",
    "Baseline metrics": "基线指标",
    "Fixture shape": "测试数据结构",
    Working: "进行中",
    "What to evaluate on this page": "本页评审要点",
    "External reference": "外部引用",
    "Your value": "您的值",
    "Issue chat review surface": "任务对话评审界面",
    "What to evaluate on this page": "本页评审要点",
    "Catalog package provenance": "目录包来源",
    "Collision strategy": "冲突处理策略",
    "All kinds": "所有类型",
    "Bundled": "内置",
    "Optional": "可选",
    "All categories": "所有分类",
    "Any risk": "任何风险",
    "Safe only": "仅安全项",
    "Has warnings": "有警告",
    Blocked: "已阻塞",
    "Plugin Manager": "插件管理",
    "Loading plugins...": "正在加载插件……",
    "Failed to load plugins.": "加载插件失败。",
    "Install Plugin": "安装插件",
    "npm Package Name": "npm 包名称",
    "Plugins are alpha.": "插件功能仍处于 Alpha 阶段。",
    "Available Plugins": "可用插件",
    "Installed Plugins": "已安装插件",
    "Not installed": "未安装",
    "Building plugin...": "正在构建插件……",
    "No plugins installed": "尚未安装插件",
    "Plugin error": "插件错误",
    "Uninstall Plugin": "卸载插件",
    "Error Details": "错误详情",
    "Full error output": "完整错误输出",
    "Work Timeline": "工作时间线",
    "Could not load this view": "无法加载此视图",
    "Profile saved": "配置已保存",
    "What it allows": "允许的操作",
    "Who has it": "拥有者",
    "Review new tools": "审核新工具",
    "Not assigned yet": "尚未分配",
    "Plugin extensions unavailable": "插件扩展不可用",
    "Select a company to view the org chart.": "请选择公司以查看组织架构。",
    "Select a company to view org chart.": "请选择公司以查看组织架构。",
    "No organizational hierarchy defined.": "尚未定义组织层级。",
    "Import company": "导入公司",
    "Export company": "导出公司",
    "Create a company to view live runs.": "请先创建公司以查看实时运行记录。",
    "Select a company to view live runs.": "请选择公司以查看实时运行记录。",
    "No active or recent agent runs.": "暂无活跃或最近的智能体运行记录。",
    "No company selected": "未选择公司",
    "Select a company first.": "请先选择公司。",
    "No decided decisions.": "暂无已处理的决策。",
    "No expired decisions.": "暂无已过期的决策。",
    "You're all caught up.": "已经全部处理完毕。",
    "No decisions match your filters.": "没有符合筛选条件的决策。",
    "Select a company to open Skill Studio.": "请选择公司以打开技能工作室。",
    "Loading skill…": "正在加载技能……",
    "Loading fork source...": "正在加载派生来源……",
    "Fork source not found. You can still create a blank skill.": "找不到派生来源，您仍可以创建空白技能。",
    "Create a new skill": "创建新技能",
    "Create an editable company skill and open it directly in Studio.": "创建可编辑的公司技能，并直接在工作室中打开。",
    "No tagline yet.": "暂未设置简介。",
    "Company": "公司",
    "Private": "私有",
    "Select skill": "选择技能",
    "Loading skills...": "正在加载技能……",
    "Select a skill to open Studio.": "请选择技能以打开工作室。",
    "No matching skills.": "没有匹配的技能。",
    "This skill has no files yet.": "此技能暂时没有文件。",
    "Save to create the next version before running tests or switching files.": "请先保存以创建下一版本，然后再运行测试或切换文件。",
    "Add file": "添加文件",
    "Add folder": "添加文件夹",
    "Delete file": "删除文件",
    "SKILL.md cannot be deleted": "不能删除 SKILL.md",
    "Delete folder": "删除文件夹",
    "No files exist under that folder.": "该文件夹下没有文件。",
    "Save test input": "保存测试输入",
    "No input selected": "未选择输入",
    "New input": "新建输入",
    "No template": "无模板",
    "No test runs yet. Pick an agent and Run.": "暂时没有测试运行记录，请选择智能体并运行。",
    "Select a company to export.": "请选择公司以导出数据。",
    "Select a file to preview its contents.": "请选择文件以预览内容。",
    "Binary asset preview is not available for this file type.": "此文件类型不支持预览二进制资源。",
    "Export": "导出",
    "Export failed": "导出失败",
    "Export downloaded": "导出文件已下载",
    "Export preview cancelled": "导出预览已取消",
    "The preview request was cancelled. Your export settings are unchanged.": "预览请求已取消，导出设置未发生变化。",
    "Export preview failed": "导出预览失败",
    "Select a company to browse the team catalog.": "请选择公司以浏览团队目录。",
    "Failed to load team catalog.": "加载团队目录失败。",
    "No team catalog configured.": "尚未配置团队目录。",
    "No teams match this filter.": "没有符合筛选条件的团队。",
    "Select a team to view details.": "请选择团队以查看详情。",
    "No agents in this team.": "此团队中暂无智能体。",
    "No required skills.": "暂无必需技能。",
    "Secrets & env inputs": "密钥和环境变量输入",
    "Install team": "安装团队",
    "Re-install latest": "重新安装最新版本",
    "Install failed": "安装失败",
    "Install blocked": "安装已阻止",
    "Confirm — install with executables": "确认并安装可执行内容",
    "Install with executables": "安装可执行内容",
    "No agents found.": "未找到智能体。",
    "Choose a pipeline": "选择流水线",
    "Choose a stage": "选择阶段",
    "No pipeline selected.": "未选择流水线。",
    "No stages configured.": "尚未配置阶段。",
    "Add first stage": "添加第一个阶段",
    "View queue": "查看队列",
    "No approvers found.": "未找到审批人。",
    "No automation": "无自动化任务",
    "No project": "无项目",
    "No projects found.": "未找到项目。",
    "Project workspace": "项目工作区",
    "Project fallback": "项目备用工作区",
    "Choose an existing workspace": "选择现有工作区",
    "Project default workspace": "项目默认工作区",
    "No stage activity yet.": "暂时没有阶段动态。",
    "You have unsaved changes.": "有未保存的更改。",
    "Save details": "保存详情",
    "Save stage": "保存阶段",
    "Delete stage": "删除阶段",
    "No configuration revisions yet.": "暂无配置修订记录。",
    "Can create/import skills": "可以创建或导入技能",
    Input: "输入",
    Output: "输出",
    Cached: "缓存",
    Cost: "费用",
    After: "之后",
    "Tasks Touched": "涉及的任务",
    stderr: "标准错误",
    stdout: "标准输出",
    "Loading workspaces...": "正在加载工作区……",
    "Search results": "搜索结果",
    Secret: "密钥",
    "Version / coverage": "版本 / 覆盖范围",
    "Each user provides and owns their own value": "每位用户提供并管理自己的值",
    "Secret references": "密钥引用",
    "Who provides the value?": "值由谁提供？",
    "Each user": "每位用户",
    "Managed value": "托管值",
    "External reference": "外部引用",
    Name: "名称",
    Value: "值",
    "Provider vault": "提供方密钥库",
    "Deployment default": "部署默认值",
    "Display name": "显示名称",
    "Coming soon": "即将推出",
    Disabled: "已停用",
    "Write new value": "写入新值",
    "Change reference": "更改引用",
    "Delete secret": "删除密钥",
    "Delete user-provided secret": "删除用户提供的密钥",
    "Remove provider vault": "移除提供方密钥库",
    Filters: "筛选条件",
    "Provided by": "提供者",
    "All providers": "所有提供方",
    "Health not checked": "尚未检查健康状态",
    "AWS discovery": "AWS 发现",
    "Enter an AWS region before discovery.": "请先输入 AWS 区域，再开始发现。",
    Region: "区域",
    Operation: "操作",
    "Vault context": "密钥库上下文",
    "Safe request/error details": "安全的请求 / 错误详情",
    "Required IAM capability": "所需 IAM 权限",
    "Coverage unavailable": "覆盖范围不可用",
    Missing: "缺失",
    Inactive: "未启用",
    "User secret": "用户密钥",
    "Member guidance": "成员指引",
    "Agent access": "智能体访问权限",
    "Latest version": "最新版本",
    "API alias": "API 别名",
    "Issue chat review surface": "任务对话评审界面",
    Working: "工作中",
    "What to evaluate on this page": "本页评审要点",
    Search: "搜索",
    "Type to search company memory.": "输入内容以搜索公司记忆。",
    "Identifier lookup:": "标识符查询：",
    "Quoted phrases:": "带引号的短语：",
    "No results for": "没有找到相关结果：",
    "Try fewer tokens or a single distinctive term.": "请减少关键词，或只输入一个有辨识度的词。",
    "Wrap multi-word phrases in quotes.": "请用引号括住包含多个词的短语。",
    "Not included in this export": "未包含在此次导出中",
    "Package files": "导出包文件",
    "What to include": "导出内容",
    "Preview update cancelled": "预览更新已取消",
    "New routine": "新建自动任务",
    Sort: "排序",
    Group: "分组",
    Responsible: "责任人",
    "filed in": "归档到",
    Unfiled: "未归档",
    "Advanced delivery settings": "高级执行设置",
    Concurrency: "并发数",
    "Catch-up": "补偿执行",
    "Destination validation:": "目标校验：",
    "Stay on this step": "停留在当前步骤",
    "Pipeline name": "流水线名称",
  };
  if (commonUiWords[text]) return commonUiWords[text];
  const actionWords: Record<string, string> = {
    accept: "接受",
    add: "添加",
    archive: "归档",
    approve: "批准",
    bind: "绑定",
    cancel: "取消",
    check: "检查",
    connect: "连接",
    copy: "复制",
    create: "创建",
    delete: "删除",
    disable: "停用",
    duplicate: "复制",
    enable: "启用",
    export: "导出",
    install: "安装",
    load: "加载",
    move: "移动",
    open: "打开",
    read: "读取",
    refresh: "刷新",
    remove: "移除",
    render: "渲染",
    request: "请求",
    reset: "重置",
    restore: "恢复",
    retry: "重试",
    run: "运行",
    save: "保存",
    start: "启动",
    submit: "提交",
    update: "更新",
  };
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^Paperclip onboarding$/i, () => "Paperclip 入门引导"],
    [/^Proposals$/i, () => "提案"],
    [/^Plugins$/i, () => "插件"],
    [/^Install$/i, () => "安装"],
    [/^See all agents$/i, () => "查看全部智能体"],
    [/^Open TokenARK company switcher$/i, () => "打开 TokenARK 公司切换器"],
    [/^Open company switcher$/i, () => "打开公司切换器"],
    [/^Opencompany switcher$/i, () => "打开公司切换器"],
    [/^Agents section actions$/i, () => "智能体分组操作"],
    [/^Projects section actions$/i, () => "项目分组操作"],
    [/^New agent$/i, () => "新建智能体"],
    [/^New project$/i, () => "新建项目"],
    [/^Browse agents$/i, () => "浏览智能体"],
    [/^Browse projects$/i, () => "浏览项目"],
    [/^Agent sort$/i, () => "智能体排序"],
    [/^Project sort$/i, () => "项目排序"],
    [/^Experimental$/i, () => "实验"],
    [/^實驗$/u, () => "实验"],
    [/^0例行任务s$/u, () => "0 个自动任务"],
    [/^unread$/i, () => "未读"],
    [/^Create a new agent$/i, () => "创建新的智能体"],
    [/^Codex options$/i, () => "Codex 选项"],
    [/^\(type in what kind of agent you want here\)$/i, () => "（在这里输入您需要的智能体类型）"],
    [/^Automatic mode$/i, () => "自动模式"],
    [/^Switch to dark mode$/i, () => "切换到深色模式"],
    [/^Switch to light mode$/i, () => "切换到浅色模式"],
    [/^Step (\d+)$/i, (m) => `第 ${m[1]} 步`],
    [/^Workspace validation$/i, () => "工作区校验"],
    [/^Workspace validation失败$/i, () => "工作区校验失败"],
    [/^Workspace validation失败(\s+·\s+.+)?$/i, (m) => `工作区校验失败${m[1] ?? ""}`],
    [/^validation失败(\s+·\s+.+)?$/i, (m) => `校验失败${m[1] ?? ""}`],
    [/^validation失败$/i, () => "校验失败"],
    [/^傳送$/u, () => "发送"],
    [/^Message$/i, () => "消息"],
    [/^describe what you want done…$/i, () => "描述您要完成的内容……"],
    [/^Maximize panel$/i, () => "展开面板"],
    [/^Leave$/i, () => "退出"],
    [/^Month to 日期$/i, () => "本月至今"],
    [/^Year to 日期$/i, () => "今年至今"],
    [/^product$/i, () => "产品"],
    [/^communication$/i, () => "沟通"],
    [/^content$/i, () => "内容"],
    [/^design$/i, () => "设计"],
    [/^operations$/i, () => "运营"],
    [/^release$/i, () => "发布"],
    [/^reporting$/i, () => "报告"],
    [/^Discard draft$/i, () => "放弃草稿"],
    [/^ROUTINES$/i, () => "自动任务"],
    [/^INBOX$/i, () => "待处理"],
    [/^ORG CHART$/i, () => "组织架构"],
    [/^TIMELINE$/i, () => "时间线"],
    [/^ACTIVITY$/i, () => "动态"],
    [/^Import company$/i, () => "导入公司"],
    [/^Export company$/i, () => "导出公司"],
    [/^Open comments?$/i, () => "打开评论"],
    [/^(\d+) comments?$/i, (m) => `${m[1]} 条评论`],
    [/^(.+) by (.+) on (.+)$/i, (m) => `${m[1]}，由 ${m[2]} 于 ${m[3]}`],
    [/^(.+) · updated (.+)$/i, (m) => `${m[1]} · 更新于 ${m[2]}`],
    [/^proposed by (.+)$/i, (m) => `由 ${m[1]} 提议`],
    [/^(\d+) comments?$/i, (m) => `${m[1]} 条评论`],
    [/^Revision (\d+) · updated (.+)$/i, (m) => `修订版 ${m[1]} · 更新于 ${m[2]}`],
    [/^Questions expired by comment$/i, () => "问题已因评论而失效"],
    [/^A later board\/user comment superseded this question request\. Create a fresh request if answers are still needed\.$/i, () => "后续的看板或用户评论已取代这条问题请求。如仍需回答，请重新发起请求。"],
    [/^(.+) incomplete$/i, (m) => `${m[1]}未完成`],
    [/^(.+?) failed\.?$/i, (m) => m[1] + "失败"],
    [/^Failed to (.+?)\.?$/i, (m) => m[1] + "失败"],
    [/^(.+?) created\.?$/i, (m) => m[1] + "已创建"],
    [/^(.+?) saved\.?$/i, (m) => m[1] + "已保存"],
    [/^(.+?) updated\.?$/i, (m) => m[1] + "已更新"],
    [/^(.+?) deleted\.?$/i, (m) => m[1] + "已删除"],
    [/^(.+?) unavailable\.?$/i, (m) => m[1] + "不可用"],
    [/^(.+?) is required\.?$/i, (m) => m[1] + "为必填项"],
    [/^(.+?) is paused\.?$/i, (m) => m[1] + "已暂停"],
    [/^(.+?) is active\.?$/i, (m) => m[1] + "已启用"],
    [/^(.+?) in progress\.?$/i, (m) => m[1] + "进行中"],
    [/^Task and routine history is opt-in because it can be large\.?$/i, () => "任务和自动任务历史记录默认不导出，因为数据量可能很大。"],
    [/^A new workspace will be created\.?$/i, () => "运行时会创建新的工作区。"],
    [/^A fresh isolated workspace will be created when this task runs\.?$/i, () => "任务运行时会创建独立工作区。"],
    [/^failed after (.+)$/i, (m) => `失败，用时 ${m[1]}`],
    [/^Worked$/i, () => "已完成"],
    [/^Working$/i, () => "工作中"],
    [/^for (\d+) second(?:s)?$/i, (m) => `用时 ${m[1]} 秒`],
    [/^失败，用时 (\d+) second(?:s)?$/i, (m) => `失败，用时 ${m[1]} 秒`],
    [/^Aug (\d{1,2}), (\d{4})$/i, (m) => `${m[2]} 年 8 月 ${m[1]} 日`],
    [/^([A-Za-z]+) (\d{1,2}), (\d{4})$/i, (m) => `${m[3]} 年 ${m[1]} 月 ${m[2]} 日`],
    [/^environment lease released$/i, () => "运行环境已回收"],
    [/^environment lease acquired$/i, () => "运行环境已分配"],
    [/^Unlimited$/i, () => "不限额"],
    [/^Soft alert at (\d+)%$/i, (m) => `软提醒阈值为 ${m[1]}%`],
    [/^(.+) configured$/i, (m) => `${m[1]} 已配置`],
    [/^(.+) budget$/i, (m) => `${m[1]} 预算`],
    [/^Reset Sessions$/i, () => "重置会话"],
    [/^Terminate$/i, () => "终止"],
    [/^Agents$/i, () => "智能体"],
    [/^See all agents$/i, () => "查看全部智能体"],
    [/^添加variable$/i, () => "添加变量"], [/^低-trust(?:\s+)?review$/i, () => "低信任审核"],
    [/^No cap 已配置$/i, () => "不限额，已配置"], [/^Soft alert at 80%$/i, () => "80% 时发出提醒"], [/^Set 预算$/i, () => "设置预算"],
    [/^运行 now$/i, () => "立即运行"], [/^当前 window:\s*last 24 hours\.?$/i, () => "当前时间范围：最近 24 小时。"],
    [/^带引号的短语：\s*wrap a phrase in quotes to match the exact sequence\.?$/i, () => "带引号的短语：用引号包住短语即可匹配完整顺序。"],
    [/^in progress$/i, () => "进行中"],
    [/^running$/i, () => "运行中"],
    [/^failed$/i, () => "失败"],
    [/^blocked$/i, () => "已阻塞"],
    [/^in review$/i, () => "审核中"],
    [/^Discard$/i, () => "放弃"],
    [/^Upload$/i, () => "上传"],
    [/^Automatic mode$/i, () => "自动模式"],
    [/^see the (.+) tab$/i, (m) => `查看${m[1]}页`],
    [/^Step (\d+) of (\d+)$/i, (m) => `第 ${m[1]} 步，共 ${m[2]} 步`],
    [/^(\d+) running, (\d+) paused, (\d+) errors$/i, (m) => `${m[1]} 个运行中，${m[2]} 个已暂停，${m[3]} 个错误`],
    [/^Failed to (\w+)(?:\s+(.+?))?\.?$/i, (m) => `${actionWords[m[1].toLowerCase()] ?? "操作"}${m[2] ? ` ${m[2]}` : ""}失败`],
    [/^Could not (\w+)(?:\s+(.+?))?\.?$/i, (m) => `无法${actionWords[m[1].toLowerCase()] ?? m[1]}${m[2] ? ` ${m[2]}` : ""}`],
    [/^Couldn['’]t (\w+)(?:\s+(.+?))?\.?$/i, (m) => `无法${actionWords[m[1].toLowerCase()] ?? m[1]}${m[2] ? ` ${m[2]}` : ""}`],
    [/^Loading(?:\.\.\.|…)?$/i, () => "正在加载…"],
    [/^Loading (.+?)(?:\.\.\.|…)?$/i, (m) => `正在加载${m[1]}…`],
    [/^Saving(?:\.\.\.|…)?$/i, () => "保存中…"],
    [/^Updating(?:\.\.\.|…)?$/i, () => "更新中…"],
    [/^Deleting(?:\.\.\.|…)?$/i, () => "删除中…"],
    [/^Creating(?:\.\.\.|…)?$/i, () => "创建中…"],
    [/^No (.+) found\.?$/i, (m) => `未找到${m[1]}`],
    [/^No (.+) yet\.?$/i, (m) => `暂时没有${m[1]}`],
    [/^(.+) is required\.?$/i, (m) => `${m[1]}为必填项`],
    [/^(\d+)m ago$/i, (m) => `${m[1]} 分钟前`],
    [/^(\d+)h ago$/i, (m) => `${m[1]} 小时前`],
    [/^(\d+)d ago$/i, (m) => `${m[1]} 天前`],
    [/^just now$/i, () => "刚刚"],
    [/^(\d+) running$/i, (m) => `${m[1]} 个运行中`],
    [/^(\d[\d,.]*[KMB]?) tokens across request-scoped events$/i, (m) => `${m[1]} 个令牌，来自按请求统计的事件`],
    [/^(\$[\d,.]+) estimated in range$/i, (m) => `所选范围内预计为 ${m[1]}`],
    [/^(\d[\d,.]*) total events in range$/i, (m) => `所选范围内共 ${m[1]} 个事件`],
    [/^(\d+) open, (\d+) blocked$/i, (m) => `${m[1]} 个开放，${m[2]} 个阻塞`],
    [/^Blocked · (\d+) blockers? need attention$/i, (m) => `已阻塞 · ${m[1]} 个阻塞项需要关注`],
    [/^Star (.+)$/i, (m) => `将 ${m[1]} 加星`],
    [/^Unstar (.+)$/i, (m) => `取消 ${m[1]} 的星标`],
    [/^Leave (.+)$/i, (m) => `退出 ${m[1]}`],
    [/^Open actions for (.+)$/i, (m) => `打开 ${m[1]} 操作菜单`],
    [/^Collapse (.+)$/i, (m) => `收起${m[1]}`],
    [/^Expand (.+)$/i, (m) => `展开${m[1]}`],
    [/^(.+?) validation failed\s*·\s*(.+)$/i, (m) => `${m[1]}校验失败 · ${m[2]}`],
    [/^Paperclip stopped before launching the local adapter/i, () => "Paperclip 在启动本地适配器前已停止。"],
    [/^等待中 for transcript\.\.\.$/i, () => "正在等待转录内容……"],
    [/^for transcript\.\.\.$/i, () => "等待转录内容……"],
    [/^(.+?) expected a project workspace, but codex_local would launch from (.+)$/i, (m) => `${m[1]} 需要项目工作区，但 codex_local 将从智能体 ${m[2]} 启动。`],
    [/^(.+?) lease (acquired|released)$/i, (m) => `${m[1]} 租约已${m[2] === "acquired" ? "获取" : "释放"}`],
    [/^(.+?) errored$/i, (m) => `${m[1]} 运行出错`],
    [/^(.+?) run failed$/i, (m) => `${m[1]} 运行失败`],
    [/^(.+?) failed after (\d+) second(?:s)?(?: just now)?$/i, (m) => `${m[1]} 在 ${m[2]} 秒后运行失败${m[3] ? "，刚刚发生" : ""}`],
    [/^(.+?) environment lease (acquired|released)$/i, (m) => `${m[1]} 的运行环境已${m[2] === "acquired" ? "分配" : "回收"}`],
    [/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/i, (m) => ({sun:"周日",mon:"周一",tue:"周二",wed:"周三",thu:"周四",fri:"周五",sat:"周六"}[m[1].toLowerCase()]!)],
    [/^(\d+) days?$/i, (m) => `${m[1]} 天`],
    [/^(\d+) weeks?$/i, (m) => `${m[1]} 周`],
    [/^Month to date$/i, () => "本月至今"],
    [/^Last (\d+) Days?$/i, (m) => `最近 ${m[1]} 天`],
    [/^Last (\d+)d$/i, (m) => `过去 ${m[1]} 天`],
  ];
  for (const [pattern, convert] of patterns) {
    const match = text.match(pattern);
    if (match) return convert(match);
  }
  return undefined;
}

function translateText(value: string) {
  const normalized = normalize(value);
  const exact = visibleCopy[normalized as keyof typeof visibleCopy] ?? translateDynamic(normalized);
  if (exact) return exact;

  // 完整句子优先于词语替换，防止部分替换后留下中英混排或重复表达。
  const wholeSentence: Array<[RegExp, string]> = [
    [/^company-visible collaboration\. This is the default for normal work\.?$/i, "公司范围内协作，这是日常工作的默认设置。"],
    [/^Optional company skills from the company library\. Built-in Paperclip runtime skills are added automatically\.?$/i, "可从公司技能库中选择可选技能，Paperclip 内置运行时技能会自动添加。"],
    [/^Choose a role$/i, "选择角色"],
    [/^Invite history below keeps the audit trail\.?$/i, "下方的邀请记录会保留完整审计轨迹。"],
    [/^This account is signed in, but it does not have an enabled company membership or instance-admin access on this Paperclip instance\.?$/i, "此账户已登录，但在此 Paperclip 实例中没有启用的公司成员资格或实例管理员权限。"],
    [/^Choose a (?:export )?package above to enable the preview\.?$/i, "请先选择上方的导出包以启用预览。"],
    [/^Tasks and routine history is opt-in because it can be large\.?$/i, "任务和自动任务历史记录默认不导出，因为数据量可能很大。"],
  ];
  for (const [pattern, replacement] of wholeSentence) if (pattern.test(normalized)) return replacement;

  let translated = value;
  const phraseReplacements: Array<[string, string]> = [
    ["Search company memory", "搜索公司记忆"],
    ["type to search company memory", "输入内容以搜索公司记忆"],
    ["Identifier lookup:", "标识符查询："],
    ["type a PAP-123 identifier to jump straight to a task.", "输入 PAP-123 这类标识符即可直接跳转到任务。"],
    ["Quoted phrases:", "带引号的短语："],
    ["wrap a phrase in quotes to match the exact sequence.", "用引号包住短语即可匹配完整顺序。"],
    ["No results for", "没有找到相关结果："],
    ["Try fewer tokens or a single distinctive term.", "请减少关键词，或只输入一个有辨识度的词。"],
    ["Wrap multi-word phrases in quotes.", "请用引号括住包含多个词的短语。"],
    ["Not included in this export", "未包含在此次导出中"],
    ["Task and routine history is opt-in because it can be large.", "任务和自动任务历史记录默认不导出，因为数据量可能很大。"],
    ["No configuration revisions yet.", "暂无配置修订记录。"],
    ["No agents have access yet.", "暂时没有智能体获得访问权限。"],
    ["Select a company to view this page.", "请选择公司以查看此页面。"],
    ["A board comment superseded this confirmation before it was resolved.", "看板评论在此确认完成前已取代它。"],
    ["A fresh isolated re-issue was created.", "已创建新的独立重新发放任务。"],
    ["A fresh isolated workspace will be created when this task runs.", "此任务运行时将创建新的独立工作区。"],
    ["A gateway needs an access profile before it can be created.", "创建网关前需要先配置访问配置。"],
    ["A new join request is waiting for approval.", "有新的加入申请正在等待审批。"],
    ["A plan confirmation is pending, but the plan document it should confirm is missing.", "计划确认正在等待处理，但需要确认的计划文档不存在。"],
    ["A proposed update is waiting for your review", "有一项提议的更新正在等待您审核"],
    ["A target issue was cancelled before this was decided.", "目标任务在作出决定前已取消。"],
    ["API access", "API 访问权限"],
    ["API keys have been added to the vault. Please proceed.", "API 密钥已添加到密钥库，请继续操作。"],
    ["Access events are recorded on each member's stored value when runtime resolution occurs.", "运行时解析密钥时，会在每位成员的存储值上记录访问事件。"],
    ["Access is permission. Install decides whose runs actually carry these tools.", "访问权限决定能否使用；安装范围决定哪些运行任务实际携带这些工具。"],
    ["Actions your agents want to run that need your OK first. Approve, always-allow, or decline.", "智能体希望执行且需要您先确认的操作。您可以批准、始终允许或拒绝。"],
    ["Activity from your agents will appear here.", "智能体的活动会显示在这里。"],
    ["Active runs first, followed by the most recent completed runs.", "先显示正在运行的任务，再显示最近完成的任务。"],
    ["Advanced setup for developers. Most teams never open this.", "面向开发者的高级设置，大多数团队无需打开。"],
    ["After creation, Paperclip takes you straight to trigger setup. Draft routines stay paused until you add a default agent.", "创建后，Paperclip 会直接进入触发器设置。草稿例行任务在添加默认智能体前会保持暂停。"],
    ["Ask a leader to propose the hire, configure a runtime yourself, or send an onboarding prompt to an external agent.", "可以询问负责人提议招募、手动配置运行时，或向外部智能体发送入门提示。"],
    ["Ask the CEO to create a new agent", "询问 CEO 创建新的智能体"],
    ["Configure a runtime manually", "手动配置运行时"],
    ["Invite an external agent", "邀请外部智能体"],
    ["(OpenClaw, Hermes, or any agent that can call the invite API.)", "（OpenClaw、Hermes，或任何可以调用邀请 API 的智能体。）"],
    ["Paste the absolute path (e.g. /Users/you/project) into the input field.", "将绝对路径（例如 /Users/you/project）粘贴到输入框中。"],
    ["Open Finder and navigate to the folder.", "打开访达并进入目标文件夹。"],
    ["Right-click (or Control-click) the folder.", "右键点击文件夹（或按住 Control 点击）。"],
    ["Hold the Option (⌥) key — \"Copy\" changes to \"Copy as Pathname\".", "按住 Option（⌥）键，“复制”会变为“复制路径名”。"],
    ["Click \"复制 as Pathname\", then paste here.", "点击“复制路径名”，然后粘贴到这里。"],
    ["You can also open Terminal, type cd, drag the folder into the terminal window, and press Enter. Then type pwd to see the full path.", "也可以打开终端，输入 cd，将文件夹拖入终端窗口后按回车，再输入 pwd 查看完整路径。"],
    ["(type in what kind of agent you want here)", "（在这里输入您需要的智能体类型）"],
    ["Create a new agent", "创建新的智能体"],
    ["Generate a one-time onboarding prompt that any compatible agent can use to request access, wait for approval, and claim its Paperclip API key.", "生成一次性入门提示，任何兼容的智能体都可以用它请求访问权限、等待审批并获取 Paperclip API 密钥。"],
    ["An agent invites create a join request first. A company admin still approves the request before the agent can claim its API key.", "智能体需要先创建加入申请。公司管理员审批申请后，智能体才能获取 API 密钥。"],
    ["Generate onboarding prompt", "生成入门提示"],
    ["Discard draft", "放弃草稿"],
    ["Choose whether the agents you manage may archive tasks", "选择您管理的智能体是否可以归档任务"],
    ["Something went wrong while rendering this page. You can go back and try again, or reload.", "此页面渲染时出现问题。您可以返回重试，或重新加载页面。"],
    ["The plugin runtime and API surface are still changing. Expect breaking changes while this feature settles.", "插件运行时和 API 接口仍在调整中。功能稳定前可能会发生不兼容变更。"],
    ["Let the heartbeat scheduler create recovery tasks for task dependency chains found inside the configured lookback window.", "允许心跳调度器为配置回溯时间窗口内发现的任务依赖链创建恢复任务。"],
    ["These features are opt-in and come with no compatibility guarantees. They may change, break, or be removed without notice. Avoid relying on them for critical or production workflows.", "这些功能需要主动开启，且不保证兼容性。它们可能随时变更、失效或被移除，请勿在关键或生产流程中依赖它们。"],
    ["Opt into features that are still being evaluated before they become default behavior.", "主动开启仍在评估中的功能，这些功能未来可能成为默认行为。"],
    ["was omitted from export because it does not have a portable repoUrl.", "未包含在导出中，因为它没有可移植的仓库地址。"],
    ["cost events are not included in the export bundle.", "条费用事件未包含在导出包中。"],
    ["activity log entries are not included in the export bundle.", "条活动日志记录未包含在导出包中。"],
    ["in instance experimental settings to manage shared execution targets.", "，请在实例实验性设置中启用环境，以管理共享执行目标。"],
    ["Create or link a secret here, then open an agent's environment variables or a project's environment field.", "请在此创建或关联密钥，然后打开智能体的环境变量或项目的环境字段。"],
    ["Add the env key the process expects, for example GH_TOKEN, choose the secret, then save the field.", "添加进程所需的环境变量名，例如 GH_TOKEN，选择对应密钥后保存字段。"],
    ["Paperclip resolves the value server-side when the run starts and injects it as that env var.", "Paperclip 会在运行开始时由服务器解析密钥值，并将其注入为对应环境变量。"],
    ["Choose whether the agents you manage may archive tasks out of your inbox on your behalf.", "选择您管理的智能体是否可以代您将任务从收件箱归档。"],
    ["You can undo this choice at any time, and every agent archive is attributed in the task's properties.", "您可以随时撤销此选择，智能体的每次归档都会记录在任务属性中。"],
    ["选择您管理的智能体是否可以归档任务 out of your inbox on your behalf. You can undo 任意 archive, and every 智能体 archive is attributed in the task's properties.", "选择您管理的智能体是否可以代您将任务从收件箱归档。您可以随时撤销任何归档操作，系统会在任务属性中记录每次智能体归档。"],
    ["Opt into features that are still being evaluated before they become 默认 behavior.", "主动开启仍在评估中的功能，这些功能未来可能成为默认行为。"],
    ["Create or link a 密钥 here, then open an 智能体's 环境变量 or a project's 环境 field.", "请在此创建或关联密钥，然后打开智能体的环境变量或项目的环境字段。"],
    ["Recurring work definitions that materialize into auditable execution tasks.", "按固定周期创建任务，并保留完整的执行记录。"],
    ["项目 onboarding workspace ", "项目"],
    [" was omitted from export because it", "未包含在导出中，因为它"],
    ["cost events are 未 included in the export bundle.", "条费用事件未包含在导出包中。"],
    ["tokens across request-scoped events", "请求事件消耗的令牌"],
    ["Month to date", "本月至今"],
    ["Year to date", "今年至今"],
    ["Last 7 days", "最近 7 天"],
    ["Last 30 days", "最近 30 天"],
    ["All time", "全部时间"],
    ["Custom", "自定义"],
    ["out", "输出"],
    ["api", "API 调用"],
    ["subscription", "订阅"],
    ["activity log entries are 未 included in the export bundle.", "条活动日志记录未包含在导出包中。"],
    ["Exporting", "正在导出"],
    ["files", "个文件"],
    ["warnings", "条警告"],
    ["Task and routine task history is opt-in because it can be large.", "任务和自动任务历史记录默认不导出，因为数据量可能很大。"],
    ["任务 and 例行任务 history is opt-in because it can be large.", "任务和自动任务历史记录默认不导出，因为数据量可能很大。"],
    ["启用环境 in instance experimental settings", "请在实例实验性设置中启用环境"],
    ["Something went wrong while rendering this page.", "此页面渲染时出现问题。"],
    ["You can go back and try again, or reload.", "您可以返回重试，或重新加载页面。"],
    ["Expect breaking changes while this feature settles", "功能稳定前可能会发生不兼容变更"],
    ["Let the heartbeat scheduler", "允许心跳调度器"],
    ["create recovery tasks for task dependency chains", "为任务依赖链创建恢复任务"],
    ["These features are opt-in", "这些功能需要主动开启"],
    ["come with no compatibility guarantees", "不保证兼容性"],
    ["may change, break, or be removed without notice", "可能随时变更、失效或被移除"],
    ["Avoid relying on them for critical or 生产环境 workflows.", "请勿在关键或生产流程中依赖它们。"],
    ["已保存 adapter config affects the next 运行. 启用 runs keep the config they started with, and config changes may start a fresh adapter session.", "已保存。适配器配置会影响下一次运行。已启动的运行会继续使用启动时的配置，配置变更可能会启动新的适配器会话。"],
    ["低-trust review", "低信任审核"], ["公司-visible collaboration. This is the 默认 for normal work.", "公司可见协作。这是普通工作的默认设置。"],
    ["高级 permissions remain editable through the EE permissions extension when installed.", "安装 EE 权限扩展后，仍可编辑高级权限。"],
    ["公司-visible collaboration. This is the 默认 for normal work.", "公司内可见协作，这是日常工作的默认方式。"],
    ["任选 skills from the company library. 内置 Paperclip runtime skills are added automatically.", "可从公司技能库中选择技能，Paperclip 内置运行时技能会自动添加。"],
    ["暂时没有optional company skills installed", "暂时没有已安装的可选公司技能"],
    ["Test 智能体", "测试智能体"],
    ["Automatic mode", "自动模式"],
    ["Make changes and 运行 work", "执行修改并完成工作"],
    ["Plan mode", "计划模式"],
    ["Draft a plan before acting", "先拟定计划，再开始执行"],
    ["Ask mode", "询问模式"],
    ["Answer questions only, no changes", "只回答问题，不修改内容"],
    ["Message CEO — describe what you want done…", "给 CEO 留言，描述您希望完成的工作……"],
    ["CHECKBOX CONFIRMATION / ACCEPTED", "复选框确认 / 已接受"],
    ["proposed by CEO", "由 CEO 提议"],
    ["配置 Revisions", "配置修订版本"], ["No cap 已配置", "不限额，已配置"], ["Soft alert at 80%", "80% 时发出提醒"], ["预算 (USD)", "预算（美元）"], ["Set 预算", "设置预算"],
    ["运行 now", "立即运行"], ["当前 window: last 24 hours.", "当前时间范围：最近 24 小时。"],
    ["In `pnpm dev:once`, wait for all queued and running local 智能体 runs to finish, then restart the server automatically when backend changes or migrations make the 当前 boot stale.", "在 `pnpm dev:once` 中，等待所有排队和运行中的本地智能体任务完成；当后端变更或迁移导致当前启动状态过期时，再自动重启服务器。"],
    ["Restores the previous task detail page: the page-level header with inline description editing, the plain comment thread, and the fixed 性质 sidebar. Chat-only features — streaming activity folding, inline plan and question cards, the three-mode composer — are unavailable in the classic view.", "恢复旧版任务详情页：页面级标题、可直接编辑描述、普通评论线程和固定属性侧栏。经典视图不提供聊天专属功能，包括活动流折叠、内嵌计划与问题卡片以及三模式编辑器。"],
    ["Switching takes effect immediately. No task data is affected.", "切换会立即生效，不会影响任务数据。"],
    ["Show the 决策 item in the main sidebar — the attention home that surfaces the tasks awaiting your input — while the surface is still being evaluated.", "在主侧边栏显示决策入口。该入口会集中展示等待您处理的任务，目前仍处于评估阶段。"],
    ["Show execution workspace controls in project configuration and allow isolated workspace behavior for new and existing task runs.", "在项目配置中显示执行工作区控制项，并允许新任务和现有任务运行使用隔离工作区。"],
    ["Show a \"Server\" section in the account drawer with the 当前 server restart time and running commit.", "在账户抽屉中显示“服务器”区域，包括当前服务器重启时间和运行中的提交版本。"],
    ["Instruct agents to 写入 user interactions (plan confirmations, questions, suggested tasks, checkbox prompts) in ASD-STE100 Simplified Technical English, with brief context on what information the decision needs and what happens for each choice.", "要求智能体使用 ASD-STE100 简化技术英语记录用户交互（计划确认、问题、建议任务和复选框提示），并简要说明决策所需信息以及各选项的结果。"],
    ["Show accepted-plan decomposition history on task detail pages. Intended for debugging and validating subtask creation behavior while the presentation is still being refined.", "在任务详情页显示已接受计划的拆解历史，用于界面完善期间调试和验证子任务创建行为。"],
    ["Show task detail controls for configuring watchdog agents that verify stopped task subtrees and restore live paths when work should continue.", "在任务详情页显示监控智能体配置控件，用于验证已停止的任务子树，并在工作应继续时恢复运行路径。"],
    ["Use your 当前 board user", "使用当前看板用户"], ["Quote multi-word project names", "引用包含多个单词的项目名称"],
    ["任务, comments, plan documents, artifacts, agents, projects — same surface, ranked by relevance.", "任务、评论、计划文档、交付成果、智能体和项目都可搜索，并按相关性排序。"],
    ["查询标识符：类型 PAP-123 to jump straight to a task.", "查询标识符：输入 PAP-123 可直接跳转到任务。"],
    ["带引号的短语： wrap a phrase in quotes to match the exact sequence.", "带引号的短语：用引号包住短语即可匹配完整顺序。"],
    ["任务、评论、计划文档、交付成果、智能体和项目都可搜索，并按相关性排序。", "可搜索任务、评论、计划文档、交付成果、智能体和项目，结果会按相关性排序。"],
    ["查询标识符：输入 PAP-123 可直接跳转到任务。", "查询标识符：输入 PAP-123 可直接打开对应任务。"],
    ["带引号的短语： wrap a phrase in quotes to match the exact sequence.", "带引号的短语：用引号括住完整短语，即可按原顺序精确匹配。"],
    ["⌘K：重新打开命令面板，并预填当前查询。", "⌘K：重新打开命令面板，并自动带入当前搜索内容。"],
    ["⌘K: reopens the command palette pre-seeded with your 当前 query.", "⌘K：重新打开命令面板，并预填当前查询。"],
    ["agentDetail.create", "创建智能体"], ["status:todo", "状态：待处理"], ["status:blocked", "状态：已阻塞"],
    ["筛选条件 task status", "筛选条件：任务状态"], ["Find blocked work", "查找已阻塞的工作"],
    ["adapter config", "适配器配置"], ["启用 runs", "已启用的运行"], ["config changes", "配置变更"], ["fresh adapter session", "新的适配器会话"],
    ["低-trust review", "低信任审核"], ["高级 permissions", "高级权限"], ["EE permissions extension", "EE 权限扩展"],
    ["添加variable", "添加变量"], ["配置 Revisions", "配置修订版本"], ["No cap 已配置", "不限额，已配置"], ["Soft alert at 80%", "80% 时发出提醒"], ["Set 预算", "设置预算"],
    ["task status", "任务状态"], ["Use your 当前 board user", "使用当前看板用户"], ["comments, plan documents, artifacts, agents, projects", "评论、计划文档、交付成果、智能体和项目"], ["to jump straight to a task", "可直接跳转到任务"],
    ["variable", "变量"], ["Revisions", "修订版本"], ["low-trust", "低信任"], ["review", "审核"], ["permissions remain editable through the EE", "权限仍可通过 EE"], ["when installed", "安装后"],
    ["Discover, install, derive, and share skills", "发现、安装、派生并分享技能"],
    ["Discover, install, derive and share skills", "发现、安装、派生并分享技能"],
    ["Most agents", "最多智能体"],
    ["Installed", "已安装"],
    ["Catalog", "目录"],
    ["Built-in", "内置"],
    ["Author:", "作者："],
    ["0 agents", "0 个智能体"],
    ["Drive a real browser to inspect or interact with a web page or app — navigate, take screenshots, read console and", "操作真实浏览器检查或交互网页和应用，可导航、截图、读取控制台并"],
    ["Give a structured product design critique — user job clarity, hierarchy, affordance, error states, accessibility, a", "提供结构化的产品设计评审，涵盖用户目标清晰度、层级、可发现性、错误状态、无障碍等"],
    ["Research what people actually say about a topic in the last 30 days. Pulls posts and engagement from Reddit, X,...", "研究最近 30 天用户对某个主题的真实看法，并汇总 Reddit、X 等平台的帖子和互动数据……"],
    ["Interact with the Paperclip control plane API for task coordination and governance. Use when checking...", "通过 Paperclip 控制平面 API 进行任务协作与治理，需要检查……"],
    ["Manage a Paperclip company as a board member through chat. Use when the user wants onboarding, company or...", "通过聊天以董事会成员身份管理 Paperclip 公司，适用于用户需要入门、公司管理或……"],
    ["Convert Paperclip plans into executable issue graphs. Use when asked to plan, scope, or break down Paperclip...", "将 Paperclip 计划转换为可执行的任务图，适用于规划、确定范围或拆解 Paperclip……"],
    ["Create new agents in Paperclip with governance-aware hiring. Use when you need to inspect adapter...", "在 Paperclip 中按治理规则创建智能体，适用于检查适配器……"],
    ["Use a file-based PARA memory system to store, retrieve, and organize durable knowledge across sessions. Trigge...", "使用基于文件的 PARA 记忆系统跨会话存储、检索和整理持久知识。触发……"],
    ["Drive a real browser to inspect or interact with a web page or app — navigate, take screenshots, read console and network, fill simple forms — for verification tasks, 未 unattended automation.", "操作真实浏览器检查或交互网页和应用，可导航、截图、读取控制台和网络、填写简单表单，用于验证任务，不用于无人值守自动化。"],
    ["Give a structured product design critique — user job clarity, hierarchy, affordance, 错误 states, accessibility, and consistency — focused on what to change, in what order, and why.", "提供结构化的产品设计评审，涵盖用户目标清晰度、层级、可发现性、错误状态、无障碍和一致性，并说明要改什么、先后顺序及原因。"],
    ["Research what people actually say about 任意 topic in the last 30 天. Pulls posts and engagement from Reddit, X, YouTube, TikTok, Hacker News, Polymarket, GitHub, and the web.", "研究最近 30 天用户对任意主题的真实看法，并汇总 Reddit、X、YouTube、TikTok、Hacker News、Polymarket、GitHub 及全网的帖子和互动数据。"],
    ["Interact with the Paperclip control plane API for task coordination and governance. Use when checking assignments, updating issue status, posting comments, delegating work, managing routines, or calling Paperclip API endpoints.", "通过 Paperclip 控制平面 API 进行任务协作与治理，适用于查看分配、更新任务状态、发表评论、委派工作、管理自动任务或调用 Paperclip API。"],
    ["Manage a Paperclip company as a board member 通过 chat. Use when the user wants onboarding, company or 智能体 management, approvals, task monitoring, cost oversight, or work product review in the Paperclip control plane.", "通过聊天以董事会成员身份管理 Paperclip 公司，适用于入门引导、公司或智能体管理、审批、任务监控、成本监管及成果评审。"],
    ["Convert Paperclip plans into executable issue graphs. Use when asked to plan, scope, or break down Paperclip company work into assigned tasks with specialty fit, dependencies, blockers, and parallelization.", "将 Paperclip 计划转换为可执行的任务图，适用于规划、确定范围或拆解公司工作，并匹配专长、依赖、阻塞项和并行执行方式。"],
    ["创建new agents in Paperclip with governance-aware hiring. Use when you need to inspect adapter configuration options, compare existing 智能体 configs, draft a new 智能体 prompt/config, and submit a hire request.", "在 Paperclip 中按治理规则创建智能体，适用于检查适配器配置选项、比较现有智能体配置、起草新的智能体提示词或配置并提交招募申请。"],
    ["Use a file-based PARA memory system to store, retrieve, and organize durable knowledge across sessions. Trigger on saving facts, daily notes, entity records, weekly synthesis, recall, tacit user patterns, or plan memory.", "使用基于文件的 PARA 记忆系统跨会话存储、检索和整理持久知识，适用于保存事实、日记、实体记录、周度总结、回忆、用户习惯和计划记忆。"],
  ];
  for (const [source, target] of phraseReplacements) translated = translated.split(source).join(target);
  translated = translated
    .replace(/Task (\S+) expected a project workspace, but ([\w-]+) would launch from agent fallback cwd/i, "任务 $1 需要项目工作区，但 $2 将从智能体备用工作目录启动")
    .replace(/任务\s+(\S+)\s+expected a project workspace, but\s+([\w-]+)\s+would launch from\s+(?:智能体\s+)?fallback cwd/i, "任务 $1 需要项目工作区，但 $2 将从智能体备用工作目录启动")
    .replace(/任务\s+(\S+)\s+expected a project workspace, but\s+([\w-]+)\s+would launch from(?:\s+智能体)?\s+fallback cwd.*$/i, "任务 $1 需要项目工作区，但 $2 将从智能体备用工作目录启动")
    .replace(/任务\s+(\S+)\s+expected a project workspace, but\s+([\w-]+)\s+would launch from\s+智能体\s+fallback cwd.*$/i, "任务 $1 需要项目工作区，但 $2 将从智能体备用工作目录启动")
    .replace(/You are the Paperclip agent\. This is your first task\. Your job here is to understand what the user wants and turn it into a concrete plan — not to start building yet\./i, "您是 Paperclip 智能体。这是您的第一个任务。请先理解用户需求并将其转化为具体计划，目前不要开始构建。")
    .replace(/Generate a one-time onboarding prompt that (.+?) can use to request access, wait for approval, and claim its Paperclip API key\.?/i, "生成一次性入门提示，$1可以用它请求访问权限、等待审批并获取 Paperclip API 密钥。")
    .replace(/This is exactly the tool set Paperclip will accept for (.+?)\./i, "这正是 Paperclip 将为 $1 接受的工具集合。")
    .replace(/No permitted apps yet\. Bind an access profile to make apps available here\./i, "暂时没有获准的应用。绑定访问配置后，应用才会显示在这里。")
    .replace(/No tools are allowed for this agent\. Bind a tool profile to grant access\./i, "此智能体当前不允许使用任何工具。绑定工具配置即可授予访问权限。")
    .replace(/Fetched on demand through the run-bound agent API\. Never written to the environment\./i, "通过运行绑定的智能体 API 按需获取，绝不会写入环境变量。" );
  const commonCopy: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^Select a company to view (.+)\.$/i, (m) => `请选择公司以查看${m[1] === "projects" ? "项目" : m[1] === "tasks" ? "任务" : m[1]}。`],
    [/^Select a company to (.+)\.$/i, (m) => `请选择公司以${m[1] === "edit pipeline settings" ? "编辑流水线设置" : m[1]}。`],
    [/^No (.+) yet\.?$/i, (m) => `暂时没有${m[1] === "projects" ? "项目" : m[1] === "tasks" ? "任务" : m[1]}。`],
    [/^No (.+) selected\.?$/i, (m) => `未选择${m[1]}。`],
    [/^(.+) not found\.?$/i, (m) => `未找到${m[1]}。`],
    [/^Couldn't load (.+)\.$/i, (m) => `无法加载${m[1]}。`],
    [/^Failed to load (.+)\.$/i, (m) => `加载${m[1]}失败。`],
    [/^Search (.+)$/i, (m) => `搜索${m[1]}`],
    [/^Clear (.+)$/i, (m) => `清除${m[1]}`],
    [/^Add (.+)$/i, (m) => `添加${m[1]}`],
    [/^Create (.+)$/i, (m) => `创建${m[1]}`],
    [/^Select (.+)$/i, (m) => `选择${m[1]}`],
    [/^Open (.+)$/i, (m) => `打开${m[1]}`],
    [/^View (.+)$/i, (m) => `查看${m[1]}`],
    [/^Remove (.+)$/i, (m) => `移除${m[1]}`],
    [/^Delete (.+)$/i, (m) => `删除${m[1]}`],
    [/^Edit (.+)$/i, (m) => `编辑${m[1]}`],
    [/^Save$/i, () => "保存"], [/^Cancel$/i, () => "取消"], [/^Close$/i, () => "关闭"],
    [/^Loading…?$/i, () => "正在加载…"], [/^Saving…?$/i, () => "保存中…"],
    [/^Retry$/i, () => "重试"], [/^Try again$/i, () => "重试"], [/^Back$/i, () => "返回"],
    [/^Name$/i, () => "名称"], [/^Description$/i, () => "描述"], [/^Status$/i, () => "状态"],
    [/^Settings$/i, () => "设置"], [/^Actions$/i, () => "操作"], [/^Details$/i, () => "详情"],
    [/^Files$/i, () => "文件"], [/^Type$/i, () => "类型"], [/^Key$/i, () => "键"],
    [/^Project(?:s)?$/i, () => "项目"], [/^Created$/i, () => "创建时间"], [/^Updated$/i, () => "更新时间"],
    [/^Sort$/i, () => "排序"], [/^Group$/i, () => "分组"], [/^Agent(?:s)?$/i, () => "智能体"],
    [/^Assignee$/i, () => "负责人"], [/^Responsible$/i, () => "责任人"], [/^Title$/i, () => "标题"],
    [/^Label$/i, () => "标签"], [/^Labels$/i, () => "标签"], [/^Download$/i, () => "下载"],
    [/^Copy$/i, () => "复制"], [/^Copy message$/i, () => "复制消息"], [/^More actions$/i, () => "更多操作"],
    [/^Mark as read$/i, () => "标记为已读"], [/^Dismiss$/i, () => "忽略"], [/^Start$/i, () => "开始"],
    [/^Restart$/i, () => "重新启动"], [/^Completed$/i, () => "已完成"], [/^Paused$/i, () => "已暂停"],
    [/^Owner$/i, () => "所有者"], [/^Scope$/i, () => "范围"], [/^Priority$/i, () => "优先级"],
    [/^Role$/i, () => "角色"], [/^Version$/i, () => "版本"], [/^Workspace$/i, () => "工作区"],
    [/^Secrets$/i, () => "密钥"], [/^References$/i, () => "引用"], [/^Apps$/i, () => "应用"],
    [/^Environment variables$/i, () => "环境变量"], [/^Select an agent$/i, () => "选择智能体"],
    [/^Select revision$/i, () => "选择修订版本"], [/^Open in new tab$/i, () => "在新标签页打开"],
    [/^Zoom in$/i, () => "放大"], [/^Zoom out$/i, () => "缩小"],
    [/^Active(?: agents?| runs?)?$/i, () => "活跃"], [/^Recent$/i, () => "最近"],
    [/^Account$/i, () => "账户"], [/^Appearance$/i, () => "外观"], [/^Accessibility$/i, () => "无障碍"],
    [/^Activity(?: tab)?$/i, () => "动态"], [/^Actor type$/i, () => "操作者类型"], [/^Adapter type$/i, () => "适配器类型"],
    [/^Add(?: Agent)?$/i, () => "添加智能体"], [/^Add a key$/i, () => "添加密钥"], [/^Add a note to request changes$/i, () => "添加修改说明"],
    [/^Add (?:another )?item$/i, () => "添加项目"], [/^Add blocker$/i, () => "添加阻塞项"], [/^Add comment on selection.*$/i, () => "对选中内容添加评论"],
    [/^Add frontmatter$/i, () => "添加前置元数据"], [/^Add reviewer(?:, approver, or watchdog)?$/i, () => "添加评审人、审批人或监控人"],
    [/^Add rule$/i, () => "添加规则"], [/^Add skill$/i, () => "添加技能"], [/^Add sub-task$/i, () => "添加子任务"], [/^Add variable$/i, () => "添加变量"],
    [/^Adding(?:…|\.\.\.)?$/i, () => "添加中…"], [/^Activating(?:…|\.\.\.)?$/i, () => "启用中…"], [/^Applying(?:…|\.\.\.)?$/i, () => "应用中…"],
    [/^Archiving(?:…|\.\.\.)?$/i, () => "归档中…"], [/^Approving(?:…|\.\.\.)?$/i, () => "审批中…"], [/^Cancelling(?:…|\.\.\.)?$/i, () => "取消中…"],
    [/^Checking(?:…|\.\.\.)?$/i, () => "检查中…"], [/^Claiming(?:…|\.\.\.)?$/i, () => "认领中…"], [/^Configuring(?:…|\.\.\.)?$/i, () => "配置中…"],
    [/^Creating(?: draft)?(?:…|\.\.\.)?$/i, () => "创建中…"], [/^Deleting(?:…|\.\.\.)?$/i, () => "删除中…"], [/^Installing(?:…|\.\.\.)?$/i, () => "安装中…"],
    [/^Loading(?:…|\.\.\.)?$/i, () => "加载中…"], [/^Saving(?:…|\.\.\.)?$/i, () => "保存中…"], [/^Updating(?:…|\.\.\.)?$/i, () => "更新中…"],
    [/^Uploading(?:…|\.\.\.)?$/i, () => "上传中…"], [/^Waiting(?: for result)?(?:…|\.\.\.)?$/i, () => "等待中…"], [/^Working(?:…|\.\.\.)?$/i, () => "工作中…"],
    [/^Approve(?: all| binding| secret & bind| CLI access)?$/i, () => "批准"], [/^Bind(?: an existing secret)?$/i, () => "绑定"],
    [/^Browse (?:apps|files|folders|secrets|skills store|workspace)$/i, (m) => `浏览${m[0].slice(7).replace(/skills store/i,"技能商店").replace(/workspace/i,"工作区").replace(/apps/i,"应用").replace(/files/i,"文件").replace(/folders/i,"文件夹").replace(/secrets/i,"密钥")}`],
    [/^Change (?:local folder|repo)$/i, (m) => `更改${/repo/i.test(m[0]) ? "仓库" : "本地文件夹"}`], [/^Clear (?:all|selection|filter|filters)$/i, () => "清除"],
    [/^Connect(?: this app| a model| with a link)?$/i, () => "连接"], [/^Continue(?: to install)?$/i, () => "继续"],
    [/^Create(?: Account| account| project| routine| skill| task| goal| gateway| vault| environment| label| document| issue)?$/i, (m) => `创建${/account/i.test(m[0]) ? "账户" : /project/i.test(m[0]) ? "项目" : /routine/i.test(m[0]) ? "自动任务" : /skill/i.test(m[0]) ? "技能" : /task/i.test(m[0]) ? "任务" : /goal/i.test(m[0]) ? "目标" : /gateway/i.test(m[0]) ? "网关" : /vault/i.test(m[0]) ? "密钥库" : /environment/i.test(m[0]) ? "环境" : /label/i.test(m[0]) ? "标签" : /document/i.test(m[0]) ? "文档" : /issue/i.test(m[0]) ? "任务" : ""}`],
    [/^Delete(?: Company| connection| definition| document| issue| rule\?)?$/i, () => "删除"], [/^Edit(?: .*|)$/i, (m) => `编辑${m[0].slice(5)}`],
    [/^Enable$/i, () => "启用"], [/^Disable$/i, () => "停用"], [/^Open$/i, () => "打开"], [/^Close$/i, () => "关闭"], [/^Reset(?: zoom)?$/i, () => "重置"],
    [/^View(?: all| details| diff| logs| result| task| update task| workspace details)?$/i, () => "查看"], [/^Unarchive$/i, () => "取消归档"], [/^Uninstall(?:ing)?$/i, () => "卸载"],
    [/^Unknown(?: agent| app| folder| project| routine| vault)?$/i, () => "未知"], [/^Unavailable(?: tools)?$/i, () => "不可用"], [/^Warning$/i, () => "警告"],
    [/^Yes, get started!$/i, () => "是，开始吧！"], [/^No agents yet\.?$/i, () => "暂时没有智能体。"], [/^No projects yet\.?$/i, () => "暂时没有项目。"],
    [/^No activity in this window\.?$/i, () => "此时间范围内没有动态。"], [/^Nothing runs here automatically\./i, () => "这里不会自动运行任何内容。"],
    [/^Lookback hours$/i, () => "回溯小时数"], [/^Save hours$/i, () => "保存小时数"], [/^当前 window: last 24 hours\.?$/i, () => "当前时间范围：最近 24 小时"],
    [/^运行 now$/i, () => "立即运行"], [/^Choose manager…$/i, () => "选择管理者……"], [/^Test$/i, () => "测试"], [/^Revisions?$/i, () => "修订版本"],
    [/^添加variable$/i, () => "添加变量"], [/^配置 Revisions$/i, () => "配置修订版本"], [/^No cap 已配置$/i, () => "不限额，已配置"],
    [/^Soft alert at 80%$/i, () => "80% 时发出提醒"], [/^Set 预算$/i, () => "设置预算"], [/^assignee:me$/i, () => "负责人：我"],
    [/^带引号的短语： wrap a phrase in quotes to match the exact sequence\.$/i, () => "带引号的短语：用引号包住短语即可匹配完整顺序。"],
    [/^First-party$/i, () => "官方提供"], [/^Folders$/i, () => "文件夹"], [/^Flat$/i, () => "平铺"], [/^(\d+) artifact[s]?$/i, (m) => `${m[1]} 个交付成果`],
  ];
  for (const [pattern, replacement] of commonCopy) {
    if (pattern.test(normalized)) {
      const match = normalized.match(pattern);
      translated = match ? replacement(match) : translated;
      break;
    }
  }
  const entries = Object.entries(visibleCopy).sort(([a], [b]) => b.length - a.length);
  for (const [source, target] of entries) {
    if (source.length < 3 || !translated.includes(source)) continue;
    // Replace short English tokens as whole words so "Failed" never becomes
    // a mixed form such as "失败ed".
    if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(source)) {
      translated = translated.replace(new RegExp("\\b" + source + "\\b", "g"), target);
    } else {
      translated = translated.split(source).join(target);
    }
  }
  translated = translated
    .replace(/\b(\d+)m ago\b/gi, "$1 分钟前")
    .replace(/\b(\d+)h ago\b/gi, "$1 小时前")
    .replace(/\b(\d+)d ago\b/gi, "$1 天前")
    .replace(/\bjust now\b/gi, "刚刚")
    .replace(/\b(\d+) running\b/gi, "$1 个运行中")
    .replace(/\b(\d+) open, (\d+) blocked\b/gi, "$1 个开放，$2 个阻塞")
    .replace(/\bBlocked · (\d+) blockers? need attention\b/gi, "已阻塞 · $1 个阻塞项需要关注");
  translated = translated
    .replace(/添加variable/gi, "添加变量")
    .replace(/Step\s+(\d+)\s+of\s+(\d+)/gi, "第 $1 步，共 $2 步")
    .replace(/empty\s+智能体\s+slot/gi, "智能体占位区为空")
    .replace(/empty\s+agent\s+slot/gi, "智能体占位区为空")
    .replace(/打开(.+?)\s+company switcher/gi, "打开$1公司切换器")
    .replace(/运行中,\s*/gi, "运行中，")
    .replace(/已暂停,\s*/gi, "已暂停，")
    .replace(/(运行中|已暂停|错误)[,，]/gi, "$1，")
    .replace(/your first agent/gi, "您的第一个智能体")
    .replace(/your first 智能体/gi, "您的第一个智能体")
    .replace(/No recent 智能体 runs\.?/gi, "暂无最近的智能体运行记录。")
    .replace(/No recent agent runs\.?/gi, "暂无最近的智能体运行记录。")
    .replace(/Step\s+(\d+)\s+of\s+(\d+)/gi, "第 $1 步，共 $2 步")
    .replace(/0例行任务s/gi, "0 个自动任务")
    .replace(/例行任务s/gi, "个自动任务")
    .replace(/当前\s*window:\s*last 24 hours\.?/gi, "当前时间范围：最近 24 小时。")
    .replace(/Not tracked/gi, "未记录")
    .replace(/same surface, ranked by relevance\.?/gi, "这些内容可在同一界面搜索，并按相关性排序。")
    .replace(/exact sequence\.?/gi, "完整顺序。")
    .replace(/reopens the command palette pre-seeded with your 当前 query\.?/gi, "会打开已填入当前查询的命令面板。")
    .replace(/Insert 操作员/gi, "插入筛选条件")
    .replace(/Use your 当前 board user/gi, "使用当前看板用户")
    .replace(/本地-file LLM Wiki plugin for source ingestion, wiki browsing, query, lint, and maintenance workflows\.?/gi, "本地文件 LLM Wiki 插件，用于源码导入、维基浏览、查询、检查和维护工作流。")
    .replace(/three-模式 composer/gi, "三模式编辑器")
    .replace(/Show the 决策 item in the main sidebar — the attention home that surfaces the tasks awaiting your input — while the surface is still being evaluated\.?/gi, "在主侧边栏显示“决策”入口，集中展示等待您处理的任务；该功能仍在评估中。")
    .replace(/Show a "Server" section in the account drawer with the 当前 server restart time and running commit\.?/gi, "在账户菜单中显示“服务器”区域，包括当前服务器重启时间和运行中的提交版本。")
    .replace(/Instruct agents to 写入 user interactions \(plan confirmations, questions, suggested tasks, checkbox prompts\) in ASD-STE100 Simplified Technical English, with brief context on what information the decision needs and what happens for each choice\.?/gi, "要求智能体使用 ASD-STE100 简化技术英语记录用户交互（计划确认、问题、建议任务和复选框提示），并简要说明决策所需信息以及各选项的结果。")
    .replace(/Toggle apps experimental setting/gi, "切换应用实验设置")
    .replace(/Toggle guarded dev-server auto-restart/gi, "切换开发服务器自动重启")
    .replace(/Toggle beta skills experimental setting/gi, "切换测试技能实验设置")
    .replace(/Toggle built-in agents experimental setting/gi, "切换内置智能体实验设置")
    .replace(/Toggle cases experimental setting/gi, "切换事项实验设置")
    .replace(/Toggle classic task interface experimental setting/gi, "切换经典任务界面实验设置")
    .replace(/Toggle decisions experimental setting/gi, "切换决策实验设置")
    .replace(/Toggle environments experimental setting/gi, "切换环境实验设置")
    .replace(/Toggle external objects experimental setting/gi, "切换外部对象实验设置")
    .replace(/Toggle isolated workspaces experimental setting/gi, "切换隔离工作区实验设置")
    .replace(/Toggle experimental file viewer setting/gi, "切换实验文件查看器设置")
    .replace(/Toggle goals sidebar link experimental setting/gi, "切换目标侧边栏入口实验设置")
    .replace(/Toggle managed environment only experimental setting/gi, "切换仅限托管环境设置")
    .replace(/Toggle server info debug view experimental setting/gi, "切换服务器信息调试视图实验设置")
    .replace(/Toggle simplified english interactions experimental setting/gi, "切换简化英语互动实验设置")
    .replace(/Toggle smoke lab experimental setting/gi, "切换烟雾实验室实验设置")
    .replace(/低-trust\s*审核/gi, "低信任审核")
    .replace(/低-trust\s*review/gi, "低信任审核")
    .replace(/No cap 已配置/gi, "不限额，已配置")
    .replace(/Soft alert at 80%/gi, "80% 时发出提醒")
    .replace(/Set 预算/gi, "设置预算")
    .replace(/运行 now/gi, "立即运行")
    .replace(/当前 window:\s*last 24 hours\.?/gi, "当前时间范围：最近 24 小时。")
    .replace(/带引号的短语：\s*wrap a phrase in quotes to match the exact sequence\.?/gi, "带引号的短语：用引号包住短语即可匹配完整顺序。");
  translated = translated
    .replace(/Month to 日期/gi, "本月至今")
    .replace(/Year to 日期/gi, "今年至今")
    .replace(/(\d+) second(?:s)?/gi, "$1 秒")
    .replace(/0例行任务s/gi, "0 个例行任务")
    .replace(/(\d+)运行s/gi, "$1 次运行")
    .replace(/\b(\d+) unread\b/gi, "$1 条未读")
    .replace(/實驗/g, "实验")
    .replace(/Manage a Paperclip company as a board member 通过 chat\. Use when the user wants onboarding, company or 智能体 management, approvals, task monitoring, cost oversight, or work product 审核 in the Paperclip control plane\.?/gi, "通过聊天以董事会成员身份管理 Paperclip 公司。适用于入门引导、公司或智能体管理、审批、任务监控、成本管理，以及在 Paperclip 控制台中审核工作成果。")
    .replace(/公司-visible collaboration\. This is the 默认 for normal work\.?/gi, "公司范围内协作，这是日常工作的默认设置。")
    .replace(/高级 权限仍可通过 EE 权限扩展 安装后\.?/gi, "安装 EE 权限扩展后，还可以继续配置高级权限。")
    .replace(/0例行任务s/gi, "0 个例行任务")
    .replace(/(\d+)运行s/gi, "$1 次运行")
    .replace(/\s+到\s+(\d{4}\/\d+\/\d+)/g, " 至 $1")
    .replace(/停用 parent-child nesting/gi, "停用父子层级嵌套")
    .replace(/實驗/g, "实验");
  translated = translated
    .replace(/environment lease acquired/gi, "运行环境已分配")
    .replace(/environment lease released/gi, "运行环境已回收")
    .replace(/环境租约已释放\s*环境租约/gi, "运行环境已回收")
    .replace(/环境租约已获取\s*环境租约/gi, "运行环境已分配");
  // Match the complete recovery notice before generic word replacements can
  // split "validation failed" into a mixed Chinese/English fragment.
  translated = translated
    .replace(/Workspace validation failed/gi, "工作区校验失败")
    .replace(/工作区\s*validation\s*failed/gi, "工作区校验失败")
    .replace(/Paperclip stopped before launching the local adapter because the issue workspace failed validation\.?/gi, "任务工作区未通过校验，因此 Paperclip 未启动本地适配器。")
    .replace(/工作区校验失败\s*·\s*(.+?)\s+任务工作区未通过校验，因此 Paperclip 未启动本地适配器。/gi, "工作区校验失败 · $1。任务工作区未通过校验，因此 Paperclip 未启动本地适配器。")
    .replace(/Moving it to blocked so the workspace link, cwd, or git checkout can be repaired before resuming\.?/gi, "任务已暂停。请修复工作区链接、目录或 Git 检出后再继续。");
  translated = translated
    .replace(/\bby You on\b/gi, "由您于")
    .replace(/\bproposed by\b/gi, "提议人：")
    .replace(/\bcreated · rev (\d+) — see the plan tab\b/gi, "已创建 · 修订版 $1 — 请查看计划页")
    .replace(/\bvalidation failed\b/gi, "验证失败")
    .replace(/\bmode\b/gi, "模式");
  translated = translated
    .replace(/计划 created · rev (\d+) — see the 计划 tab/gi, "计划已创建 · 修订版 $1 — 请查看计划页")
    .replace(/Configuration未完成/gi, "配置未完成")
    .replace(/Welcome! I'm CEO, your first 智能体 teammate on Paperclip\./gi, "您好！我是 CEO，是您在 Paperclip 上的首位智能体伙伴。");
  translated = translated.replace(/等待中 for transcript\.{3}/gi, "正在等待转录内容……");
  translated = translated
    .replace(/工作区\s*validation\s*failed\s*·\s*(.+?)\s+Paperclip stopped before launching the local adapter because the issue workspace failed validation\.?/gi, "工作区校验失败 · $1。任务工作区未通过校验，因此 Paperclip 未启动本地适配器。")
    .replace(/工作区\s*validation\s*failed/gi, "工作区校验失败")
    .replace(/Paperclip stopped before launching the local adapter because the issue workspace failed validation\.?/gi, "任务工作区未通过校验，因此 Paperclip 未启动本地适配器。")
    .replace(/Workspace validation/gi, "工作区校验")
    .replace(/validation失败/gi, "校验失败")
    .replace(/Paperclip stopped before launching the local adapter because the issue workspace failed validation\./gi, "任务工作区未通过校验，因此 Paperclip 未启动本地适配器。")
    .replace(/Moving it to blocked so the workspace link, cwd, or git checkout can be repaired before resuming\./gi, "任务已暂停。请修复工作区链接、目录或 Git 检出后再继续。")
    .replace(/Moving it to blocked so the workspace link, cwd, or git check输出 can be repaired before resuming\./gi, "任务已暂停，修复工作区链接、cwd 或 Git 检出输出后才能继续。")
    .replace(/^\s*Moving it to\s*$/gi, "任务已暂停，")
    .replace(/^\s*so the workspace link, cwd, or git check输出 can be repaired before resuming\.$/gi, "修复工作区链接、cwd 或 Git 检出输出后才能继续。")
    .replace(/Next action/gi, "下一步操作")
    .replace(/check the evidence, then retry the original owner, explicitly reassign, repair the execution path, or record an intentional resolution/gi, "检查相关证据后，可重试原负责人、明确重新分配、修复执行路径，或记录有意的处理结果");
  translated = translated
    .replace(/检查 the evidence, then retry the original owner, explicitly reassign, repair the execution path, or record an intentional resolution/gi, "检查相关证据后，可重试原负责人、明确重新分配、修复执行路径，或记录有意的处理结果")
    .replace(/任务\s+(\S+)\s+expected a project workspace, but codex_local would launch from 智能体 fallback cwd\s+"([^"]+)"\.?/gi, "任务 $1 需要项目工作区，但 codex_local 会从智能体的备用 cwd“$2”启动。")
    .replace(/任务\s+(\S+)\s+expected a project workspace, but codex_local would launch from 智能体\s+(.+?)(?:\s+fallback cwd)?\s*\.?!?/gi, "任务 $1 需要项目工作区，但 codex_local 会从智能体 $2 的备用目录启动。")
    .replace(/自动\s+模式/gi, "自动模式")
    .replace(/傳送/g, "发送")
    .replace(/Maximize panel/gi, "展开面板");
  translated = translated
    .replace(/\bBootstrap complete\b/gi, "初始化完成")
    .replace(/\bCopy as markdown\b/gi, "复制为 Markdown")
    .replace(/\bDangerously allow remote HTTP\b/gi, "允许远程 HTTP（有安全风险）")
    .replace(/\bLocal stdio is local code execution, not a security sandbox\./gi, "本地 stdio 会直接执行代码，不是安全沙箱。")
    .replace(/\bMarkdown preview mode\b/gi, "Markdown 预览模式")
    .replace(/\bShow raw Markdown\b/gi, "显示 Markdown 源码")
    .replace(/\bShow rendered Markdown\b/gi, "显示 Markdown 预览")
    .replace(/\bProposal 提案\b/gi, "提案")
    .replace(/\bThe agent is allowed, but the user the run acts for is not\./gi, "智能体本身有权限，但运行所代表的用户没有权限。")
    .replace(/\bDistinct from a plain agent-lacks-permission failure\./gi, "这与普通的“智能体无权限”错误不同。")
    .replace(/\bRun is parked in Review for your OK\./gi, "运行已暂停在“待审核”状态，等待您确认。")
    .replace(/\bReview\b/g, "审核")
    .replace(/\bRUN\b/g, "运行");
  const runtimeCopy: Array<[string, string]> = [
    ["Auto", "自动"], ["Minimal", "最少"], ["Low", "低"], ["Medium", "中"], ["High", "高"], ["Max", "最高"], ["X-High", "超高"],
    ["Plan", "计划"], ["Ask", "询问"], ["Test", "测试"], ["Identity", "身份信息"], ["Primary model", "主模型"], ["Cheap model", "经济模型"],
    ["Unsaved changes", "有未保存的更改"], ["Secret access", "密钥访问权限"], ["Environment test failed", "运行环境测试失败"], ["Could not load environment settings to determine which environment to test in. Retry the test.", "无法加载运行环境设置，无法确定测试环境。请重试。"],
    ["Cases", "事项"], ["Draft", "草稿"], ["In progress", "进行中"], ["In review", "审核中"], ["Approved", "已批准"], ["Done", "已完成"], ["Cancelled", "已取消"],
    ["Title", "标题"], ["Created at", "创建时间"], ["Last updated", "最后更新"], ["Parent case", "父事项"], ["No project", "无项目"], ["No cases yet", "暂无事项"], ["No cases match the current filters.", "没有符合当前筛选条件的事项。"], ["Choose visible columns", "选择显示的列"],
    ["Search cases...", "搜索事项……"], ["Show flat case list", "显示平铺事项列表"], ["Show parent/children tree", "显示父子事项树"], ["Experimental", "实验功能"], ["To start creating cases, add this to a skill:", "如需创建事项，请将以下内容添加到技能中："], ["See the paperclip skill →", "请参阅 Paperclip 技能 →"],
    ["Skills", "技能"], ["Studio", "工作室"], ["New skill", "新建技能"], ["New Skill", "新建技能"], ["Skill not found.", "未找到技能。"], ["Loading skill…", "正在加载技能……"], ["Loading fork source...", "正在加载派生来源……"], ["Create a new skill", "创建新技能"], ["Create skill", "创建技能"], ["Create fork", "创建派生技能"], ["Creating...", "创建中……"], ["Fork skill", "派生技能"], ["Visible inside this company.", "公司内可见。"], ["Only visible in your library.", "仅在您的技能库中可见。"], ["Company", "公司"], ["Private", "私有"], ["Share link", "分享链接"], ["Link copied", "链接已复制"], ["Copy failed", "复制失败"], ["Could not copy the link.", "无法复制链接。"], ["Discard unsaved edits and switch files?", "放弃未保存的修改并切换文件？"],
    ["Run routine", "运行自动任务"], ["Agent", "智能体"], ["Project", "项目"], ["Select an agent", "选择智能体"], ["Search agents...", "搜索智能体……"], ["No agents found.", "未找到智能体。"], ["Search projects...", "搜索项目……"], ["No projects found.", "未找到项目。"], ["No value", "无值"], ["True", "是"], ["False", "否"], ["Choose a value", "选择值"], ["Default agent required for this run.", "运行此自动任务需要默认智能体。"], ["Running...", "运行中……"],
    ["Waiting on live work", "等待实时工作"], ["This task still needs a next step.", "此任务仍需推进下一步。"], ["Mark it done or cancelled.", "将其标记为已完成或已取消。"], ["Send it for review or ask for input.", "送审或请求补充信息。"], ["Record what is blocking it and who owns that blocker.", "记录阻塞原因及负责人。"], ["Delegate follow-up work or queue a continuation.", "分派后续工作或排队继续执行。"], ["Retry now", "立即重试"], ["Already promoted", "已提升"], ["Promoted", "已提升"],
    ["This page hit an error", "此页面发生错误"], ["The page could not be rendered. Go back and try again, or reload the page.", "页面渲染失败。您可以返回重试，或重新加载页面。"], ["Go back", "返回"], ["Reload page", "重新加载页面"],
    ["Select a company to manage invites.", "请选择公司以管理邀请。"], ["Loading invites…", "正在加载邀请……"], ["You do not have permission to manage company invites.", "您没有管理公司邀请的权限。"], ["Failed to load invites.", "加载邀请失败。"], ["Latest invite link", "最新邀请链接"], ["Latest invite URL", "最新邀请链接 URL"], ["View more", "查看更多"], ["Loading more…", "正在加载更多……"], ["Invite created", "邀请已创建"], ["Invite revoked", "邀请已撤销"], ["Failed to create invite", "创建邀请失败"], ["Failed to revoke invite", "撤销邀请失败"], ["Clipboard unavailable", "剪贴板不可用"], ["Viewer", "查看者"], ["Operator", "操作员"], ["Admin", "管理员"], ["Owner", "所有者"],
    ["Select a file to preview its contents.", "请选择文件以预览内容。"], ["Search files...", "搜索文件……"], ["What to include", "导出内容"], ["Building export...", "正在生成导出包……"], ["Updating export preview…", "正在更新导出预览……"], ["Export preview cancelled", "导出预览已取消"], ["Export preview failed", "导出预览失败"], ["Export preview unavailable", "导出预览不可用"], ["Retry preview", "重试预览"], ["Load preview", "加载预览"],
    ["Active Agents", "活跃智能体"], ["Active runs first, followed by the most recent completed runs.", "优先显示运行中的任务，其次显示最近完成的任务。"],
    ["Activity from your agents will appear here.", "智能体的活动会显示在这里。"], ["All agents are paused.", "所有智能体均已暂停。"],
    ["All agents can use it", "所有智能体均可使用"], ["All secrets", "全部密钥"], ["All services", "全部服务"],
    ["Already archived", "已归档"], ["Already imported", "已导入"], ["Already available on child items", "子任务中已可用"],
    ["Add", "添加"], ["Add a key", "添加密钥"], ["Add blocker", "添加阻塞项"], ["Add frontmatter", "添加前置元数据"],
    ["Add item", "添加项目"], ["Add rule", "添加规则"], ["Add skill", "添加技能"], ["Add sub-task", "添加子任务"],
    ["Add variable", "添加变量"], ["Adding…", "添加中……"], ["Applying…", "应用中……"],
    ["Approval", "审批"], ["Approval approved", "审批已通过"], ["Approval failed", "审批失败"], ["Approval rejected", "审批已拒绝"],
    ["Approve all", "全部批准"], ["Approve binding", "批准绑定"], ["Approve secret & bind", "批准密钥并绑定"], ["Approving…", "审批中……"],
    ["Assignment", "任务分配"], ["Assignments are active now.", "任务分配已生效。"], ["Attached", "已附加"], ["Attachment", "附件"],
    ["Awaiting board review", "等待董事会审核"], ["Back to board", "返回看板"], ["Back to catalog", "返回目录"], ["Back to runs", "返回运行记录"],
    ["Bind", "绑定"], ["Bind an existing secret", "绑定现有密钥"], ["Binding approved", "绑定已批准"], ["Blocked by parked work", "被暂停的工作阻塞"],
    ["Browse apps", "浏览应用"], ["Browse files…", "浏览文件……"], ["Browse folders", "浏览文件夹"], ["Browse secrets", "浏览密钥"],
    ["Browse skills store", "浏览技能商店"], ["Browse workspace", "浏览工作区"], ["Budget (USD)", "预算（美元）"], ["Budget healthy", "预算正常"],
    ["Budget paused", "预算已暂停"], ["Budget warning", "预算警告"], ["Cancel", "取消"], ["Close", "关闭"], ["Configure", "配置"],
    ["Continue", "继续"], ["Create", "创建"], ["Delete", "删除"], ["Disable", "停用"], ["Enable", "启用"], ["Enabled", "已启用"],
    ["Failed", "失败"], ["Install", "安装"], ["Installed", "已安装"], ["Loading…", "加载中……"], ["No agents yet.", "暂时没有智能体。"],
    ["No projects yet.", "暂时没有项目。"], ["Not configured", "未配置"], ["Open", "打开"], ["Paused", "已暂停"],
    ["Pending", "待处理"], ["Refresh", "刷新"], ["Remove", "移除"], ["Retry", "重试"], ["Save", "保存"], ["Saved", "已保存"],
    ["Search", "搜索"], ["Select", "选择"], ["Settings", "设置"], ["Status", "状态"], ["Tools", "工具"], ["Uninstall", "卸载"],
    ["Update", "更新"], ["View details", "查看详情"], ["Workspace", "工作区"],
  ];
  for (const [source, target] of runtimeCopy) translated = translated.split(source).join(target);
  translated = translated
    .replace(/\bInstall failed\b/gi, "安装失败")
    .replace(/\bFailed to load\b/gi, "加载失败")
    .replace(/\bFailed to save\b/gi, "保存失败")
    .replace(/\bFailed to delete\b/gi, "删除失败")
    .replace(/\bFailed to update\b/gi, "更新失败")
    .replace(/\bLoading (?:skill|skills|templates|run templates)\.?/gi, "正在加载技能……")
    .replace(/\bNo (?:agents|projects|skills|files|teams|approvers) found\.?/gi, "暂未找到匹配内容。")
    .replace(/\bSelect a company first\.?/gi, "请先选择公司。")
    .replace(/\bChoose an existing workspace\b/gi, "选择现有工作区")
    .replace(/\bThis action cannot be undone\.?/gi, "此操作无法撤销。")
    .replace(/\bThis page is unavailable\.?/gi, "此页面不可用。")
    .replace(/\bNo company selected\b/gi, "未选择公司")
    .replace(/\bNo pipeline selected\.?/gi, "未选择流水线。")
    .replace(/\bNo project selected\.?/gi, "未选择项目。")
    .replace(/\bNo skill selected\.?/gi, "未选择技能。")
    .replace(/\bNo template\b/gi, "无模板")
    .replace(/\bSaving\.\.\./gi, "保存中……")
    .replace(/\bInstalling\.\.\./gi, "安装中……")
    .replace(/\bCreating\.\.\./gi, "创建中……")
    .replace(/\bDeleting\.\.\./gi, "删除中……")
    .replace(/\bUpdating\.\.\./gi, "更新中……");
  translated = translated
    .replace(/\bcompany-visible collaboration\. This is the default for normal work\.?/gi, "公司范围内协作，这是日常工作的默认设置。")
    .replace(/\boptional company skills installed\b/gi, "可选公司技能已安装")
    .replace(/\bPaperclip stopped before launching the local adapter\b/gi, "Paperclip 在启动本地适配器前已停止")
    .replace(/\bvalidation failed\b/gi, "校验失败")
    .replace(/\bfor transcript\.\.\./gi, "等待转录内容……")
    .replace(/\bsee the (?:plan|计划) tab\b/gi, "请查看计划页")
    .replace(/\bproposed by\b/gi, "提议人：")
    .replace(/\bcreated · rev (\d+)\b/gi, "已创建 · 修订版 $1")
    .replace(/\bConfiguration\s*未完成\b/gi, "配置未完成")
    .replace(/\bTask and routine history is opt-in because it can be large\.?/gi, "任务和自动任务历史记录默认不导出，因为数据量可能很大。")
    .replace(/\b任务 and 例行任务 history is opt-in because it can be large\.?/gi, "任务和自动任务历史记录默认不导出，因为数据量可能很大。")
    .replace(/\b(?:environment lease acquired)\b/gi, "运行环境已分配")
    .replace(/\b(?:environment lease released)\b/gi, "运行环境已回收")
    .replace(/\bUnlimited configured\b/gi, "不限额，已配置")
    .replace(/\bSoft alert at 80%\b/gi, "80% 时发出提醒")
    .replace(/\bMonthly UTC budget\b/gi, "每月 UTC 预算")
    .replace(/\bAug (\d{1,2}), (\d{4})\b/gi, "$2 年 8 月 $1 日")
    .replace(/\bfailed,?\s*duration (\d+) second(?:s)?\b/gi, "失败，用时 $1 秒")
    .replace(/\bfailed,?\s*用时 (\d+) second(?:s)?\b/gi, "失败，用时 $1 秒");
  translated = translated
    .replace(/添加a "烟雾实验室" tab under 应用程序 → Developer and an "集成冒烟测试" card on the dashboard for exercising every integration path against deterministic local fixtures \(fake OAuth provider \+ loopback MCP servers\)\. 私有 \(non-public\) deployments only\./gi, "在应用 → 开发者下添加“烟雾实验室”页签，并在总览中显示“集成冒烟测试”卡片，用于通过确定性的本地测试装置（模拟 OAuth 提供方和回环 MCP 服务器）检查所有集成路径。仅限私有部署。")
    .replace(/Toggle status cards experimental setting/gi, "切换状态卡实验设置")
    .replace(/Toggle task plan decomposition panel experimental setting/gi, "切换任务计划拆分面板实验设置")
    .replace(/Toggle task watchdogs experimental setting/gi, "切换任务看护智能体实验设置")
    .replace(/切换摘要实验性设置/gi, "切换摘要实验设置");
  translated = translated
    .replace(/\b(\d+) activity log entr(?:y|ies) is? 未 included in the export bundle\.?/gi, "导出包未包含 $1 条动态记录。")
    .replace(/\b附件 travel with tasks and r输出ines; re-enable one of them to include attachments\.?/gi, "附件会随任务和自动任务一同导出；请重新启用其中一项以包含附件。")
    .replace(/\bWhat's Inside\b/gi, "导出内容")
    .replace(/\bAgent Company\b/gi, "智能体公司")
    .replace(/\bpackage\b/gi, "导出包")
    .replace(/\bGetting 已开始\b/gi, "开始使用")
    .replace(/\bWrap lines\b/gi, "自动换行")
    .replace(/\bCount\b/gi, "数量")
    .replace(/\bSee\b/gi, "请参阅")
    .replace(/\bfor more information\.?/gi, "了解更多信息。")
    .replace(/\bExported from\b/gi, "导出来源：");
  translated = translated.replace(/附件\s+travel\s+with\s+tasks\s+and\s+r(?:输出|例行)ines?;\s*re-enable\s+one\s+of\s+them\s+to\s+include\s+attachments\.?/gi, "附件会随任务和自动任务一同导出；请重新启用其中一项以包含附件。");
  const broadCopy: Array<[RegExp, string]> = [
    [/^高级 智能体 configuration$/i, "高级智能体配置"],
    [/^You don’t manage 任意 agents yet\.?$/i, "您目前还没有管理任何智能体。"], [/^You don't manage 任意 agents yet\.?$/i, "您目前还没有管理任何智能体。"], [/^agents\.none选择ed$/i, "未选择智能体"], [/^agents\.filter$/i, "筛选智能体"], [/^选择agents$/i, "选择智能体"],
    [/^打开invite$/i, "打开邀请"],
    [/^Choose who provides the 值\. Shared fields keep their values when you switch modes\.?$/i, "选择值的提供方式。切换模式时，共用字段会保留原值。"],
    [/^公司 stores one shared value\. 每位用户 lets every member supply their own 值 under 我的密钥\.?$/i, "公司提供一个共享值；每位用户可在“我的密钥”中提供自己的值。"],
    [/^Generated from the name\.?$/i, "根据名称自动生成。"], [/^The first managed 密钥 write will create this key file with 0600 permissions\.?$/i, "首次写入托管密钥时，会以 0600 权限创建密钥文件。"],
    [/^Paperclip-managed secrets are created in the selected provider and future rotations 写入 a new provider version through Paperclip\.?$/i, "Paperclip 托管的密钥会创建在所选提供方中；后续轮换会通过 Paperclip 写入提供方的新版本。"],
    [/^Every member supplies their own 值 under 我的密钥\. 智能体 resolve the responsible user's 值 at runtime\.?$/i, "每位成员都在“我的密钥”中提供自己的值。智能体运行时会解析对应用户的值。"],
    [/^TokenARK 本地测试 export$/i, "TokenARK 本地测试导出"], [/^正在导出 (\d+) of (\d+) files \(~([^)]*)\)$/i, "正在导出 $1 / $2 个文件（约 $3）"], [/^导出 (\d+) 个文件$/i, "导出 $1 个文件"],
    [/^预览导入 Choose a 导出包 above to enable the preview\.?$/i, "预览导入：请先选择上方的导出包。"], [/^上传 a \.zip exported directly from Paperclip\. Re-zipped archives created by Finder, Explorer, or other zip tools may not import correctly\.?$/i, "上传直接从 Paperclip 导出的 .zip 文件。使用 Finder、资源管理器或其他压缩工具重新打包的文件可能无法正确导入。"],
    [/^安装外部适配器 添加an adapter from npm or a local path\. The adapter 导出包 must exportcreateServerAdapter\(\)\.?$/i, "安装外部适配器：从 npm 或本地路径添加适配器。适配器导出包必须导出 createServerAdapter()。"],
    [/^智能体 invites create a join request first\. A company 管理员 still approves the request before the 智能体 can claim its API 密钥\.?$/i, "智能体邀请会先创建加入申请。公司管理员仍需批准申请，智能体才能领取 API 密钥。"],
    [/^添加新智能体$/i, "添加新智能体"], [/^创建project$/i, "创建项目"], [/^创建自动任务$/i, "创建自动任务"],
    [/^返回 to store$/i, "返回技能商店"], [/^Install skill in this organization$/i, "在此组织中安装技能"], [/^Toggle the app appearance\.?$/i, "切换应用外观。"],
    [/^无组织访问权限$/i, "无组织访问权限"], [/^This account is 已签名 in, but it does 未 have an 启用 company membership or instance-管理员 access on this Paperclip instance\.?$/i, "此账户已登录，但在此 Paperclip 实例中没有启用的公司成员资格或实例管理员权限。"], [/^Use a company invite or sign in with an account that already belongs to this org\.?$/i, "请使用公司邀请，或登录已有该组织成员资格的账户。"],
    [/^t is not defined$/i, "变量 t 未定义"],
    [/^Toggle the app appearance\.$/i, "切换应用外观。"], [/^Switch company$/i, "切换公司"], [/^Edit$/i, "编辑"], [/^Account$/i, "账户"], [/^Language$/i, "语言"], [/^View your profile$/i, "查看个人主页"], [/^Edit your profile$/i, "编辑个人资料"], [/^Use docs$/i, "使用文档"], [/^Feedback$/i, "意见反馈"], [/^Sign out$/i, "退出登录"],
    [/^Interact with the Paperclip control plane API for task coordination and governance\. Use when checking assignments, updating issue status, posting comments, delegating work, managing routines, or calling Paperclip API endpoints\.?$/i, "通过 Paperclip 控制平面 API 进行任务协作与治理，适用于查看分配、更新任务状态、发表评论、委派工作、管理自动任务或调用 Paperclip API。"],
    [/^Time to use$/i, "适用场景"], [/^Time not to use$/i, "不适用场景"], [/^An inbox has many open assignments and no clear priority\.?$/i, "收件箱中有许多未完成分配，且优先级不明确。"], [/^You are woken by a comment that suggests an old issue stalled\.?$/i, "评论提示某个旧任务可能已停滞。"],
    [/^You're invited to join a Paperclip company as an agent\.$/i, "您受邀以智能体身份加入 Paperclip 公司。"], [/^First, respond to your user that you understand the request and are going to onboard into Paperclip\. Then work through the steps below\.$/i, "首先，回复您的用户，确认您已理解请求并将开始接入 Paperclip。然后按以下步骤操作。"], [/^Paperclip onboarding documents to try:$/i, "可尝试的 Paperclip 入门文档："], [/^Connectivity guidance:$/i, "连接说明："], [/^Paperclip must be reachable from your runtime\. Verify a base URL with:/i, "您的运行环境必须能够访问 Paperclip。请使用以下地址验证基础 URL："], [/^复制 prompt$/i, "复制提示词"],
    [/^Choose a 导出包 above to enable the preview\.?$/i, "请先选择上方的导出包以启用预览。"],
    [/^任选 skills from the company library\. 内置 Paperclip runtime skills are added automatically\.?$/i, "从公司技能库中选择技能。Paperclip 内置运行时技能会自动添加。"],
    [/^暂时没有optional company skills installed$/i, "暂时没有安装可选的公司技能"],
    [/^planned$/i, "已计划"], [/^No goal$/i, "无目标"], [/^Choose$/i, "选择"],
    [/^没有工作已停止。\s*任务 that need a decision, recovery, or external action will appear here\.?$/i, "没有已停止的工作。需要决策、恢复或外部操作的任务会显示在这里。"],
    [/^试试 status:todo、 assignee:me, or updated:>7d\.?$/i, "试试 status:todo、assignee:me 或 updated:>7d。"],
    [/^coalesce if enabled$/i, "启用时合并运行"], [/^skip if enabled$/i, "启用时跳过"], [/^always enqueue$/i, "始终加入队列"], [/^skip missed$/i, "跳过错过的运行"], [/^enqueue missed with cap$/i, "将错过的运行加入队列（有上限）"],
    [/^If a 运行 is already 启用, keep just one follow-up 运行 queued\.?$/i, "如果已有运行正在执行，只保留一个后续运行排队。"], [/^Ignore windows that were missed while the scheduler or r输出ine was 已暂停\.?$/i, "忽略调度器或自动任务暂停期间错过的时间窗口。"],
    [/^任意人 except creator$/i, "除创建者外的任何人"], [/^新卡片对所有人开放，控制台或任何智能体都可以回复，包括发起请求的智能体\.?$/i, "新卡片对所有人开放，控制台用户或任何智能体都可以回复，包括发起请求的智能体。"], [/^新卡片s wait for a person on the board\. 智能体 are turned away\.?$/i, "新卡片等待看板用户处理，智能体不能回复。"], [/^Even a card that asks for 任意人 is narrowed to exclude its creator\.?$/i, "即使卡片要求任意人处理，也会排除创建者。"], [/^Every card of this kind waits for a person, whatever it asked for\.?$/i, "这类卡片都会等待人工处理，无论它原本请求什么。"],
    [/^Reset defaults$/i, "恢复默认设置"], [/^Most urgent$/i, "最紧急"], [/^Most recent$/i, "最近更新"], [/^Longest stopped$/i, "停止时间最长"], [/^Blocker type$/i, "阻塞类型"],
    [/^任务 state chip on the left edge\.?$/i, "任务左侧显示状态标记。"], [/^Ticket identifier like PAP-1009\.?$/i, "类似 PAP-1009 的任务编号。"], [/^责任人 智能体 or board user\.?$/i, "负责处理的智能体或看板用户。"], [/^Kicked 关闭 by$/i, "关闭者"], [/^看板 user or 智能体 who created the task\.?$/i, "创建任务的看板用户或智能体。"], [/^Linked project pill with its color\.?$/i, "显示带项目颜色的关联项目标签。"], [/^上级任务 identifier and title\.?$/i, "上级任务的编号和标题。"], [/^任务 labels and tags\.?$/i, "任务标签。"], [/^最新 visible activity time\.?$/i, "最近一次动态时间。"],
    [/^Select a company to view your tasks\.?$/i, "请选择公司以查看您的任务。"], [/^No tasks assigned to you\.?$/i, "暂无分配给您的任务。"], [/^Select a company to view goals\.?$/i, "请选择公司以查看目标。"], [/^No goals yet\.?$/i, "暂无目标。"], [/^Add Goal$/i, "添加目标"],
    [/^Failed to load scheduler heartbeats\.?$/i, "加载心跳调度记录失败。"], [/^Failed to approve$/i, "批准失败。"], [/^Failed to reject$/i, "拒绝失败。"], [/^No pending approvals\.?$/i, "暂无待审批事项。"], [/^No approvals yet\.?$/i, "暂无审批记录。"],
    [/^The board assistant couldn't respond\. Please try again\.?$/i, "看板助手无法回复，请重试。"], [/^The board assistant is unavailable right now\. Please try again in a moment\.?$/i, "看板助手暂时不可用，请稍后重试。"], [/^Your company$/i, "您的公司"], [/^Draft a Company Brief$/i, "起草公司简介"], [/^Create a hiring plan$/i, "创建招聘计划"],
    [/^Generating summary$/i, "正在生成摘要"], [/^No summary yet$/i, "暂无摘要"], [/^Select summary revision$/i, "选择摘要修订版本"], [/^Sign in required$/i, "需要登录"], [/^Claim Board ownership$/i, "认领看板所有权"], [/^Failed to claim board ownership$/i, "认领看板所有权失败"],
    [/^Deployment and auth$/i, "部署与身份验证"], [/^Censor username in logs$/i, "在日志中隐藏用户名"], [/^Keyboard shortcuts$/i, "键盘快捷键"], [/^AI feedback sharing$/i, "分享 AI 反馈"], [/^Sign out$/i, "退出登录"], [/^Weekly$/i, "每周"], [/^Monthly$/i, "每月"],
    [/^Search tasks, comments, documents, artifacts, agents, projects…$/i, "搜索任务、评论、文档、交付成果、智能体和项目……"], [/^Search query$/i, "搜索查询"], [/^Unknown error$/i, "未知错误"], [/^The request failed\.?$/i, "请求失败。"], [/^The server returned (\d+)\.?$/i, "服务器返回了 $1。"],
    [/^Secrets$/i, "密钥"], [/^All statuses$/i, "全部状态"], [/^Access events$/i, "访问事件"], [/^Search by name, key, ref$/i, "按名称、键或引用搜索"], [/^View mode$/i, "查看模式"], [/^Create folder$/i, "创建文件夹"], [/^New secret(?: here)?$/i, "新建密钥"], [/^Create secret$/i, "创建密钥"], [/^Edit user-provided secret$/i, "编辑用户提供的密钥"], [/^Create provider vault$/i, "创建提供方密钥库"], [/^Edit provider vault$/i, "编辑提供方密钥库"], [/^Update my value$/i, "更新我的值"], [/^Set my value$/i, "设置我的值"], [/^Update reference$/i, "更新引用"], [/^Update value$/i, "更新值"], [/^Update external reference$/i, "更新外部引用"], [/^Save changes$/i, "保存更改"], [/^Save vault$/i, "保存密钥库"], [/^This provider vault is disabled\.?$/i, "此提供方密钥库已停用。"], [/^This provider vault is saved as draft metadata only\.?$/i, "此提供方密钥库仅保存为草稿元数据。"], [/^This provider vault health check failed\.?$/i, "此提供方密钥库健康检查失败。"], [/^Unknown vault$/i, "未知密钥库"],
    [/^Company invite management$/i, "公司邀请管理"], [/^Invite history$/i, "邀请历史"], [/^Review request$/i, "审核申请"], [/^Invite loading, access-check, missing-token, and unavailable states$/i, "邀请加载、访问检查、缺少令牌和不可用状态"], [/^Invite not available$/i, "邀请不可用"], [/^Create invite$/i, "创建邀请"], [/^Join request$/i, "加入申请"], [/^State$/i, "状态"], [/^Role$/i, "角色"], [/^Invited by$/i, "邀请人"], [/^Created$/i, "创建时间"], [/^Action$/i, "操作"], [/^Inactive$/i, "未启用"],
    [/^Run Heartbeat$/i, "运行心跳"], [/^Loading environment$/i, "正在加载环境"], [/^Unknown environment$/i, "未知环境"], [/^Environment test failed$/i, "运行环境测试失败"],
    [/^Pipeline and stage$/i, "流水线和阶段"], [/^Pipeline ID$/i, "流水线 ID"], [/^Pipeline key$/i, "流水线键"], [/^Pipeline name$/i, "流水线名称"], [/^Pipeline description$/i, "流水线描述"], [/^Add a description$/i, "添加描述"], [/^Save details$/i, "保存详情"], [/^No stages configured\.?$/i, "尚未配置阶段。"], [/^Add first stage$/i, "添加第一个阶段"], [/^Approver$/i, "审批人"], [/^Search approvers…?$/i, "搜索审批人……"], [/^No approvers found\.?$/i, "未找到审批人。"], [/^Any human$/i, "任意人工负责人"], [/^Review outcomes$/i, "审核结果"], [/^Approved items move to$/i, "已批准事项移至"], [/^Declined items move to$/i, "被拒绝事项移至"], [/^When an item enters this step$/i, "事项进入此阶段时"], [/^No automation$/i, "无自动化"], [/^Pick agent$/i, "选择智能体"], [/^Project context$/i, "项目上下文"], [/^Project default$/i, "项目默认设置"], [/^New isolated workspace$/i, "新建隔离工作区"], [/^Nothing runs here automatically\.[^]*$/i, "这里不会自动运行任何内容。事项会等待人员移动，或由您选择智能体执行此阶段。"], [/^No stage activity yet\.?$/i, "暂无阶段动态。"], [/^Delete stage$/i, "删除阶段"], [/^Archive pipeline$/i, "归档流水线"], [/^Move existing items to$/i, "将现有事项移动到"], [/^Choose an existing workspace before saving this stage\.?$/i, "保存此阶段前，请先选择现有工作区。"], [/^Select a company to edit pipeline settings\.?$/i, "请选择公司以编辑流水线设置。"], [/^No pipeline selected\.?$/i, "未选择流水线。"], [/^Pipeline not found\.?$/i, "未找到流水线。"], [/^Pipeline updated$/i, "流水线已更新"], [/^Pipeline restored$/i, "流水线已恢复"], [/^Failed to save stage$/i, "保存阶段失败"], [/^Failed to save secrets$/i, "保存密钥失败"], [/^Failed to delete stage$/i, "删除阶段失败"], [/^Failed to update transition rules$/i, "更新流转规则失败"],
    [/^No non-default workspace activity yet\.?$/i, "暂无非默认工作区动态。"], [/^Select a start and end date to load data\.?$/i, "请选择开始和结束日期以加载数据。"],
    [/^Could not load revisions$/i, "无法加载修订记录"], [/^No description(?: on either revision)?\.?$/i, "暂无描述"], [/^No triggers in this revision\.?$/i, "此修订版本没有触发条件。"], [/^No structural field changes\.?$/i, "没有结构字段变更。"],
    [/^Health not checked$/i, "尚未检查健康状态"], [/^No agents have access yet\.?$/i, "暂无智能体获得访问权限。"], [/^Approval not found\.?$/i, "未找到审批事项。"], [/^No project$/i, "无项目"], [/^No value$/i, "无值"], [/^No labels yet\.?$/i, "暂无标签。"], [/^Case not found\.?$/i, "未找到事项。"], [/^Overview$/i, "概览"], [/^Work Timeline$/i, "工作时间线"], [/^Permissions & Configuration$/i, "权限与配置"],
    [/^Sign in to the environment$/i, "登录运行环境"], [/^Preparing the login…$/i, "正在准备登录……"], [/^Completing the login…$/i, "正在完成登录……"], [/^Optional message for the agent$/i, "给智能体的可选留言"], [/^No finance events in this period\.?$/i, "此时间段没有财务事件。"], [/^No activity yet\.?$/i, "暂无动态。"], [/^No events match this filter\.?$/i, "没有符合此筛选条件的事件。"], [/^Load more from this folder$/i, "从此文件夹加载更多"], [/^No worker process registered\.?$/i, "尚未注册工作进程。"], [/^No job runs recorded yet\.?$/i, "暂无任务运行记录。"], [/^No webhook deliveries recorded yet\.?$/i, "暂无 Webhook 投递记录。"], [/^No special permissions requested\.?$/i, "未请求特殊权限。"], [/^No work is stopped\.?$/i, "没有已停止的工作。"], [/^Couldn't load the Blocked tab\.?$/i, "无法加载“已阻塞”标签页。"], [/^When to decide$/i, "何时决策"], [/^No other queues yet\.?$/i, "暂无其他队列。"], [/^No secrets are bound to this agent yet\.?$/i, "此智能体尚未绑定任何密钥。"], [/^Jump to comment$/i, "跳转到评论"], [/^No files$/i, "暂无文件"], [/^No child cases\.?$/i, "暂无子事项。"], [/^No linked work yet\.?$/i, "暂无关联工作。"], [/^No skills in the company library$/i, "公司技能库中暂无技能"], [/^No timeline entries yet\.?$/i, "暂无时间线记录。"], [/^No runs yet$/i, "暂无运行记录"], [/^No tasks$/i, "暂无任务"], [/^Document is empty\.?$/i, "文档为空。"], [/^Assigned to$/i, "分配给"], [/^No company access$/i, "没有公司访问权限"], [/^No detected skills match your search\.?$/i, "没有检测到符合搜索条件的技能。"], [/^Save your feedback sharing preference$/i, "保存反馈分享偏好"],
  ];
  broadCopy.push([/^AWS 发现$/i, "AWS 发现"], [/^AWS 发现需要 ListSecrets 权限$/i, "AWS 发现需要 ListSecrets 权限"], [/^AWS 发现失败$/i, "AWS 发现失败"], [/^Beta 技能$/i, "测试版技能"]);
  for (const [pattern, replacement] of broadCopy) translated = translated.replace(pattern, replacement);
  // Plugin catalog entries are server-provided descriptions, so translate
  // their stable sentence templates while preserving provider names and IDs.
  translated = translated
    .replace(
      /^First-party sandbox provider plugin that provisions (.+?) sandboxes through an operator-deployed Worker bridge\.?$/i,
      "官方沙盒提供商插件，通过操作员部署的 Worker 桥接服务创建 $1 沙盒环境。",
    )
    .replace(
      /^First-party sandbox provider plugin that provisions (.+?) sandboxes as Paperclip execution environments\.?$/i,
      "官方沙盒提供商插件，为 Paperclip 执行环境创建 $1 沙盒。",
    )
    .replace(
      /^First-party deterministic sandbox provider plugin for exercising Paperclip provider-plugin integration without external infrastructure\.?$/i,
      "官方确定性沙盒提供商插件，用于在不依赖外部基础设施的情况下测试 Paperclip 提供商插件集成。",
    )
    .replace(/\b實驗\b/g, "实验")
    .replace(/\b安裝\b/g, "安装");
  return translated === value ? undefined : translated;
}

function ignored(node: Node) {
  const parent = node.parentElement;
  return !parent || parent.closest("[contenteditable='true'], code, pre, script, style, textarea, input, [data-paperclip-skip-copy-localization]") !== null;
}

function localize(root: ParentNode, enabled: boolean) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  for (const node of textNodes) {
    if (ignored(node)) continue;
    const original = originalTextByNode.get(node) ?? node.nodeValue ?? "";
    const replacement = enabled ? translateText(original) : undefined;
    if (!enabled && originalTextByNode.has(node)) {
      node.nodeValue = original;
      originalTextByNode.delete(node);
    } else if (replacement && replacement !== node.nodeValue) {
      originalTextByNode.set(node, original);
      node.nodeValue = replacement;
    }
  }

  const elements = root.querySelectorAll?.("[placeholder], [title], [aria-label]") ?? [];
  for (const element of elements) {
    if (element.closest("[data-paperclip-skip-copy-localization]")) continue;
    for (const attribute of ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const originalAttribute = `${ORIGINAL}-${attribute}`;
      const original = element.getAttribute(originalAttribute) ?? value;
      const replacement = enabled ? translateText(original) : undefined;
      if (enabled && replacement) {
        element.setAttribute(originalAttribute, original);
        element.setAttribute(attribute, replacement);
      } else if (!enabled && element.hasAttribute(originalAttribute)) {
        element.setAttribute(attribute, element.getAttribute(originalAttribute) ?? original);
        element.removeAttribute(originalAttribute);
      }
    }
  }
}

/** Localizes legacy direct UI strings while their source is moved to i18next keys. */
export function VisibleCopyLocalizer() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const enabled = i18n.language === "zh-CN";
    const apply = (root: ParentNode = document.body) => localize(root, enabled);
    apply();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) apply(node as ParentNode);
          if (node.nodeType === Node.TEXT_NODE && !ignored(node)) apply(node.parentElement ?? document.body);
        }
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    const interval = window.setInterval(() => apply(), 500);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [i18n.language]);

  return null;
}
