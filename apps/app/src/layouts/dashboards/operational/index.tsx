import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { OperationalDashboard } from "components";

function Operational(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <OperationalDashboard />
    </DashboardLayout>
  );
}

export default Operational;
