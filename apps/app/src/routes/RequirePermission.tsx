import { useAppSelector } from "../redux/hooks";
import AccessDenied from "layouts/pages/errors/accessDenied";

type RequirePermissionProps = {
  children: JSX.Element;
  permission?: string | string[];
};

const RequirePermission = ({ children, permission }: RequirePermissionProps) => {
  const { permissions, allowAll, status } = useAppSelector((state) => state.permissions);

  if (!permission || allowAll) {
    return children;
  }

  if (status === "idle" || status === "loading") {
    return null;
  }

  const required = Array.isArray(permission) ? permission : [permission];
  const hasPermission = required.some((key) => permissions[key]);

  if (!hasPermission) {
    return <AccessDenied />;
  }

  return children;
};

export default RequirePermission;
