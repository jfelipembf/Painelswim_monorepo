import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import { SideListCard, SideListItem } from "components";
import { CARD_BRANDS, CARD_BRAND_LABELS } from "constants/cardBrands";
import type { Acquirer as DbAcquirer } from "hooks/acquirers";

import { BRAND_LOGOS } from "../constants";

type AcquirerListProps = {
  acquirers: DbAcquirer[];
  selectedId: string;
  error?: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
};

function AcquirerList({
  acquirers,
  selectedId,
  error,
  onSelect,
  onDelete,
  onNew,
}: AcquirerListProps): JSX.Element {
  return (
    <SideListCard
      action={
        <MDButton variant="gradient" color="info" size="small" fullWidth onClick={onNew}>
          <Icon>add</Icon>&nbsp;Nova adquirinte
        </MDButton>
      }
    >
      {error ? (
        <MDTypography variant="caption" color="error" textAlign="center" display="block" py={1}>
          {error}
        </MDTypography>
      ) : null}

      {acquirers.map((acquirer) => {
        const isActive = selectedId === acquirer.id;

        return (
          <SideListItem
            key={acquirer.id}
            active={isActive}
            onClick={() => onSelect(acquirer.id)}
            right={
              <MDBox display="flex" alignItems="center" gap={1} flexShrink={0}>
                <MDTypography
                  variant="caption"
                  fontWeight="bold"
                  color={acquirer.inactive ? "secondary" : "success"}
                >
                  {acquirer.inactive ? "Inativo" : "Ativo"}
                </MDTypography>

                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  iconOnly
                  circular
                  title="Editar"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onSelect(acquirer.id);
                  }}
                >
                  <Icon fontSize="small">edit</Icon>
                </MDButton>
                <MDButton
                  variant="outlined"
                  color="error"
                  size="small"
                  iconOnly
                  circular
                  title="Excluir"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onDelete(acquirer.id);
                  }}
                >
                  <Icon fontSize="small">delete</Icon>
                </MDButton>
              </MDBox>
            }
          >
            <MDTypography
              variant="button"
              fontWeight="bold"
              textTransform="capitalize"
              sx={{ wordBreak: "break-word" }}
            >
              {acquirer.name || "—"}
            </MDTypography>

            <MDBox mt={0.75} display="flex" alignItems="center" gap={1} flexWrap="wrap">
              {CARD_BRANDS.filter((brand) => Boolean(acquirer.brands?.[brand])).map((brand) => {
                const logo = BRAND_LOGOS[brand];
                const label =
                  brand === "other"
                    ? String(acquirer.otherBrandName || CARD_BRAND_LABELS.other)
                    : CARD_BRAND_LABELS[brand];

                if (logo) {
                  return <MDBox key={brand} component="img" src={logo} alt={label} width="26px" />;
                }

                return (
                  <MDTypography key={brand} variant="caption" fontWeight="bold" color="text">
                    {label}
                  </MDTypography>
                );
              })}
            </MDBox>
          </SideListItem>
        );
      })}

      {acquirers.length === 0 && (
        <MDTypography variant="button" color="text" textAlign="center" display="block" py={4}>
          Nenhuma adquirinte cadastrada
        </MDTypography>
      )}
    </SideListCard>
  );
}

export default AcquirerList;
