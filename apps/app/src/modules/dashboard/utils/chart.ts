import type { DashboardChartData } from "../dashboard.types";

type DistributionItem = { label: string; count: number };

const pickBackgroundColors = (count: number): string[] => {
  const palette = ["info", "primary", "dark", "success", "warning", "error", "secondary"];
  return Array.from({ length: count }, (_, idx) => palette[idx % palette.length]);
};

const buildDistributionChart = (
  label: string,
  items: DistributionItem[]
): DashboardChartData["contractsDistribution"] => ({
  labels: items.map((item) => item.label),
  datasets: {
    label,
    data: items.map((item) => item.count),
    backgroundColors: pickBackgroundColors(items.length),
  },
});

export { pickBackgroundColors, buildDistributionChart };
