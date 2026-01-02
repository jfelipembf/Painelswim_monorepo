import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../redux/hooks";

type RequireAuthProps = {
  children: JSX.Element;
  redirectTo?: string;
};

const RequireAuth = ({ children, redirectTo = "/login" }: RequireAuthProps) => {
  const { status } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return null;
  }

  if (status !== "authenticated") {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;
