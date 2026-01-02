const consultantPerformanceData = {
  labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  datasets: [
    {
      label: "Conversões",
      color: "secondary" as const,
      data: [12, 14, 11, 16, 19, 22, 20, 24, 21, 25, 27, 30],
    },
    {
      label: "Follow-ups",
      color: "info" as const,
      data: [42, 38, 45, 49, 52, 55, 59, 61, 63, 65, 67, 70],
    },
  ],
};

export default consultantPerformanceData;
