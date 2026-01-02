// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import PersonAvatar from "components/PersonAvatar";

interface Props {
  image?: string;
  name: string;
  email: string;
}

function NameCell({ image, name, email }: Props): JSX.Element {
  return (
    <MDBox display="flex" alignItems="center">
      <MDBox mr={1}>
        <PersonAvatar src={image} alt={name} size="sm" shadow="sm" />
      </MDBox>
      <MDBox display="flex" flexDirection="column">
        <MDTypography variant="caption" fontWeight="medium" color="text">
          {name}
        </MDTypography>
        <MDTypography variant="caption" color="secondary">
          {email}
        </MDTypography>
      </MDBox>
    </MDBox>
  );
}

export default NameCell;
