import type { CardBrandKey } from "constants/cardBrands";

import visaLogo from "assets/images/logos/visa.png";
import masterCardLogo from "assets/images/logos/mastercard.png";

const BRAND_LOGOS: Partial<Record<CardBrandKey, string>> = {
  visa: visaLogo,
  mastercard: masterCardLogo,
};

export { BRAND_LOGOS };
