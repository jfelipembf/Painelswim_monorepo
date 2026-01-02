import Icon from "@mui/material/Icon";

import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { SideListCard, SideListItem } from "components";

type Props = {
  contracts: any[];
  onSelectContract: (contract: any) => void;
  onNewContract: () => void;
  selectedId: string | null;
};

function ContractList({ contracts, onSelectContract, onNewContract, selectedId }: Props) {
  return (
    <SideListCard
      action={
        <MDButton variant="gradient" color="info" size="small" fullWidth onClick={onNewContract}>
          <Icon>add</Icon>&nbsp;Novo Contrato
        </MDButton>
      }
    >
      {contracts.map((contract) => (
        <SideListItem
          key={contract.id}
          active={selectedId === contract.id}
          onClick={() => onSelectContract(contract)}
        >
          <MDTypography variant="button" fontWeight="bold" textTransform="capitalize">
            {contract.name}
          </MDTypography>
          <MDTypography
            variant="caption"
            color="text"
            fontWeight="regular"
            display="block"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
              mt: 0.5,
            }}
          >
            {contract.description || "Sem descrição"}
          </MDTypography>
        </SideListItem>
      ))}
      {contracts.length === 0 && (
        <MDTypography variant="button" color="text" textAlign="center" display="block" py={4}>
          Nenhum contrato cadastrado
        </MDTypography>
      )}
    </SideListCard>
  );
}

export default ContractList;
