import type { ComponentProps } from "react";

import SummaryCard from "layouts/pages/sales/purchase/components/SummaryCard";

type SummaryCardProps = ComponentProps<typeof SummaryCard>;

type Props = {
  summaryProps: SummaryCardProps;
};

function SettleDebtSummaryCard({ summaryProps }: Props): JSX.Element {
  return <SummaryCard {...summaryProps} />;
}

export default SettleDebtSummaryCard;
