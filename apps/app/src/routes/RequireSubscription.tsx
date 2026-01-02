import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../redux/hooks";

type RequireSubscriptionProps = {
  children: JSX.Element;
  redirectTo?: string;
};

const RequireSubscription = ({ children, redirectTo = "/login" }: RequireSubscriptionProps) => {
  const { billingStatus, status } = useAppSelector((state) => state.branch);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return null;
  }

  if (billingStatus === "unknown") {
    return null;
  }

  if (billingStatus !== "active") {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};

export default RequireSubscription;
