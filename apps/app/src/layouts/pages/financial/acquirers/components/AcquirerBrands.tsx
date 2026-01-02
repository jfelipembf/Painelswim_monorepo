import Checkbox from "@mui/material/Checkbox";
import Icon from "@mui/material/Icon";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { FormField } from "components";
import { CARD_BRANDS, CARD_BRAND_LABELS, type CardBrandKey } from "constants/cardBrands";

import { BRAND_LOGOS } from "../constants";

type AcquirerBrandsProps = {
  brands: Record<CardBrandKey, boolean>;
  otherBrandName: string;
  onToggle: (brand: CardBrandKey) => void;
  onChangeOtherBrandName: (value: string) => void;
};

function AcquirerBrands({
  brands,
  otherBrandName,
  onToggle,
  onChangeOtherBrandName,
}: AcquirerBrandsProps): JSX.Element {
  return (
    <MDBox>
      <MDBox display="flex" flexWrap="wrap" gap={2}>
        {CARD_BRANDS.map((brand) => {
          const logo = BRAND_LOGOS[brand];
          const label = brand === "other" ? CARD_BRAND_LABELS.other : CARD_BRAND_LABELS[brand];

          return (
            <MDBox
              key={brand}
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ cursor: "pointer", userSelect: "none" }}
              onClick={() => onToggle(brand)}
            >
              <Checkbox checked={Boolean(brands?.[brand])} />
              {logo ? (
                <MDBox component="img" src={logo} alt={label} width="34px" />
              ) : (
                <MDBox
                  width="34px"
                  height="22px"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{ border: "1px solid rgba(0,0,0,0.12)" }}
                >
                  <Icon fontSize="small">credit_card</Icon>
                </MDBox>
              )}
              <MDTypography variant="button" fontWeight="medium">
                {label}
              </MDTypography>
            </MDBox>
          );
        })}
      </MDBox>

      {brands.other ? (
        <MDBox mt={2}>
          <FormField
            label="Nome da bandeira"
            value={otherBrandName}
            onClick={(e: any) => e.stopPropagation()}
            onChange={(e: any) => onChangeOtherBrandName(e?.target?.value ?? "")}
          />
        </MDBox>
      ) : null}
    </MDBox>
  );
}

export default AcquirerBrands;
