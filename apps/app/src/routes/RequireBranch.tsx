import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../redux/hooks";

type RequireBranchProps = {
  children: JSX.Element;
  redirectTo?: string;
};

const RequireBranch = ({ children, redirectTo = "/login" }: RequireBranchProps) => {
  const { idBranch, status } = useAppSelector((state) => state.branch);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return null;
  }

  if (!idBranch) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};

export default RequireBranch;
