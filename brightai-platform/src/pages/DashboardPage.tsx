import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  ActivityFeed,
  AgentTable,
  AlertsList,
  ExecutionDetailsModal,
  ExecutionTable,
  PerformanceChartSection,
  QuickActionsPanel,
  SmartWelcomeBar,
  StatsCardsSection,
} from "../components/dashboard";
import { formatCompactNumber, toDisplayDateTime } from "../lib/dashboard.utils";
import useDashboard from "../hooks/useDashboard";

const DashboardPage = () => {
  const {
    loadingSections,
    userName,
    userAvatar,
    greeting,
    summaryText,
    smartBannerMessages,
    statsCards,
    chartPeriod,
    setChartPeriod,
    chartMetric,
    setChartMetric,
    chartData,
    agentSearch,
    setAgentSearch,
    agentStatusFilter,
    setAgentStatusFilter,
    filteredAgents,
    executionFilter,
    setExecutionFilter,
    visibleExecutions,
    selectedExecution,
    setSelectedExecution,
    agentNameMap,
    activities,
    alerts,
    dismissAlert,
    handleAgentEdit,
    handleAgentToggle,
    handleAgentClone,
    handleAgentDelete,
    deletingAgentIds,
  } = useDashboard();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-3 py-4 md:px-5 md:py-6">
      <SmartWelcomeBar
        loading={loadingSections.welcome}
        userName={userName}
        userAvatar={userAvatar}
        greeting={greeting}
        summaryText={summaryText}
        smartBannerMessages={smartBannerMessages}
      />

      <StatsCardsSection loading={loadingSections.stats} statsCards={statsCards} />

      <PerformanceChartSection
        loading={loadingSections.chart}
        chartPeriod={chartPeriod}
        onChartPeriodChange={setChartPeriod}
        chartMetric={chartMetric}
        onChartMetricChange={setChartMetric}
        chartData={chartData}
      />

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <AgentTable
          loading={loadingSections.agents}
          agents={filteredAgents}
          agentSearch={agentSearch}
          agentStatusFilter={agentStatusFilter}
          onAgentSearchChange={setAgentSearch}
          onAgentStatusFilterChange={setAgentStatusFilter}
          onAgentEdit={handleAgentEdit}
          onAgentToggle={handleAgentToggle}
          onAgentClone={handleAgentClone}
          onAgentDelete={handleAgentDelete}
          deletingAgentIds={deletingAgentIds}
          formatCompactNumber={formatCompactNumber}
          toDisplayDateTime={toDisplayDateTime}
        />

        <QuickActionsPanel />
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ExecutionTable
          loading={loadingSections.executions}
          executions={visibleExecutions}
          executionFilter={executionFilter}
          onExecutionFilterChange={setExecutionFilter}
          onSelectExecution={setSelectedExecution}
          agentNameMap={agentNameMap}
        />

        <div className="grid gap-4">
          <ActivityFeed loading={loadingSections.activity} activities={activities} />
          <AlertsList loading={loadingSections.alerts} alerts={alerts} onDismiss={dismissAlert} />
        </div>
      </section>

      <ExecutionDetailsModal
        execution={selectedExecution}
        agentNameMap={agentNameMap}
        onClose={() => setSelectedExecution(null)}
      />

      <Link
        to="/agents/new"
        className="fixed bottom-6 left-6 z-30 inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-900/30 transition hover:-translate-y-1 hover:bg-emerald-300"
      >
        <Plus className="h-4 w-4" />
        إنشاء وكيل
      </Link>
    </div>
  );
};

export default DashboardPage;
