export type DashboardMetrics = {
  activeStudents: number;
  newClients: number;
  totalSalesCents: number;
  totalExpensesCents: number;
};

export type DashboardChartData = {
  activeStudentsHistory: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "light" | "dark";
    }[];
  };
  contractsDistribution: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColors: string[];
    };
  };
};

export type DashboardData = {
  metrics: DashboardMetrics;
  charts: DashboardChartData;
  monthKey: string;
};

export type ManagementDashboardSummaryMetrics = {
  activeStudents: number;
  newStudents: number;
  suspendedStudents: number;
  cancellations: number;
  churnPercent: number;
  renewals: number;
};

export type ManagementDashboardMetrics = ManagementDashboardSummaryMetrics & {
  accessCount: number;
  accessLastHourCount: number;
};

export type ManagementDashboardData = {
  dateKey: string;
  monthKey: string;
  metrics: ManagementDashboardMetrics;
  previousMetrics: ManagementDashboardSummaryMetrics;
  charts: {
    activeByPlan: DashboardChartData["contractsDistribution"];
    cancellationsHistory: DashboardChartData["activeStudentsHistory"];
    accessByDay: DashboardChartData["activeStudentsHistory"];
  };
};

export type FinancialDashboardMetrics = {
  salesMonthToDateCents: number;
  expensesMonthToDateCents: number;
  salesTodayCents: number;
  salesPreviousMonthToDateCents: number;
};

export type FinancialDashboardData = {
  dateKey: string;
  monthKey: string;
  metrics: FinancialDashboardMetrics;
  charts: {
    incomeExpenseHistory: DashboardChartData["activeStudentsHistory"];
    salesGrossMonthOverMonth: DashboardChartData["activeStudentsHistory"];
  };
};
