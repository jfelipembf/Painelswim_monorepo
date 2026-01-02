import { useRef } from "react";

import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDAvatar from "components/MDAvatar";

type Props = {
  photoUrl?: string;
  fallbackImage: string;
  uploading: boolean;
  onSelectFile: (file: File | null) => void;
};

function ActivityPhotoUploader({
  photoUrl,
  fallbackImage,
  uploading,
  onSelectFile,
}: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const preview = photoUrl || fallbackImage;

  return (
    <MDBox mt={2} position="relative" width="max-content">
      <MDAvatar src={preview} alt="profile picture" size="xxl" variant="rounded" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
      />
      <MDBox alt="edit" position="absolute" right={0} bottom={0} mr={-1} mb={-1}>
        <Tooltip title="Editar foto" placement="top">
          <MDButton
            variant="gradient"
            color="info"
            size="small"
            iconOnly
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Icon>edit</Icon>
          </MDButton>
        </Tooltip>
      </MDBox>
    </MDBox>
  );
}

export default ActivityPhotoUploader;
