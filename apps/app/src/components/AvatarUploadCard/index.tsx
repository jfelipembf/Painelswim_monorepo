import { useId, useRef } from "react";

import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";

import MDBox from "components/MDBox";
import MDAvatar from "components/MDAvatar";
import MDButton from "components/MDButton";

type Props = {
  imageUrl?: string | null;
  defaultImage?: string;
  accept?: string;
  disabled?: boolean;
  loading?: boolean;
  mt?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  variant?: "circular" | "rounded" | "square";
  onSelectFile: (file: File | null) => void | Promise<void>;
};

function AvatarUploadCard({
  imageUrl,
  defaultImage,
  accept = "image/*",
  disabled,
  loading,
  mt = 2,
  size = "xxl",
  variant = "rounded",
  onSelectFile,
}: Props): JSX.Element {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleTriggerInput = () => {
    if (disabled || loading) return;
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    void onSelectFile(file);
    event.target.value = "";
  };

  return (
    <MDBox mt={mt} position="relative" width="max-content">
      <MDAvatar src={imageUrl || defaultImage} alt="preview" size={size} variant={variant} />
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <MDBox position="absolute" right={0} bottom={0} mr={-1} mb={-1}>
        <Tooltip title="Editar foto" placement="top">
          <span>
            <MDButton
              variant="gradient"
              color="info"
              size="small"
              iconOnly
              disabled={disabled || loading}
              onClick={handleTriggerInput}
            >
              {loading ? <CircularProgress size={16} color="inherit" /> : <Icon>edit</Icon>}
            </MDButton>
          </span>
        </Tooltip>
      </MDBox>
    </MDBox>
  );
}

export default AvatarUploadCard;
