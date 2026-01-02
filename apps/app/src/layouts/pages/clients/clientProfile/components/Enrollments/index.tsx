import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import DataTable from "examples/Tables/DataTable";

import EnrollmentsModal from "layouts/pages/clients/clientProfile/components/Modals/EnrollmentsModal";

import { useAppSelector } from "../../../../../../redux/hooks";

import { useClasses, useCollaborators } from "hooks/clients";

import { useReferenceDataCache } from "context/ReferenceDataCacheContext";

import { WEEKDAY_LABELS } from "constants/weekdays";

import { fetchClientEnrollments, isEnrollmentActiveOnDate } from "hooks/enrollments";

type Props = {
  clientId?: string | null;
};

function Enrollments({ clientId }: Props): JSX.Element {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const navigate = useNavigate();

  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const { activitiesById } = useReferenceDataCache();
  const classes = useClasses();
  const collaborators = useCollaborators();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const todayKey = String(new Date().toISOString()).slice(0, 10);

  const openDetails = () => setDetailsOpen(true);
  const closeDetails = () => setDetailsOpen(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!idTenant || !idBranch || !clientId) {
        if (!active) return;
        setEnrollments([]);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchClientEnrollments(idTenant, idBranch, clientId);
        if (!active) return;
        setEnrollments(list);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [clientId, idBranch, idTenant]);

  const classById = useMemo(() => {
    const map: Record<string, any> = {};
    (Array.isArray(classes.classes) ? classes.classes : []).forEach((c: any) => {
      const id = String(c?.id || "");
      if (id) map[id] = c;
    });
    return map;
  }, [classes.classes]);

  const instructorById = useMemo(() => {
    const map: Record<string, any> = {};
    (Array.isArray(collaborators.collaborators) ? collaborators.collaborators : []).forEach(
      (c: any) => {
        const id = String(c?.id || "");
        if (id) map[id] = c;
      }
    );
    return map;
  }, [collaborators.collaborators]);

  const normalizedEnrollments = useMemo(() => {
    const list = Array.isArray(enrollments) ? enrollments : [];
    return [...list]
      .sort((a, b) => {
        const aActive = isEnrollmentActiveOnDate(a, todayKey);
        const bActive = isEnrollmentActiveOnDate(b, todayKey);
        if (aActive !== bActive) return aActive ? -1 : 1;
        return String(b?.effectiveFrom || "").localeCompare(String(a?.effectiveFrom || ""));
      })
      .slice(0, 5)
      .map((e) => {
        const idClass = String(e?.idClass || "");
        const cls = classById[idClass];
        const weekday = typeof cls?.weekday === "number" ? cls.weekday : undefined;
        const dayLabel =
          typeof weekday === "number" ? WEEKDAY_LABELS[weekday] || String(weekday) : "—";
        const timeLabel = cls?.startTime ? String(cls.startTime) : "—";
        const prof = cls?.idEmployee ? instructorById[String(cls.idEmployee)]?.name : "";
        const isActive = isEnrollmentActiveOnDate(e, todayKey);
        return {
          id: String(e?.id || ""),
          idClass,
          label:
            `${dayLabel} ${timeLabel}.` +
            (prof
              ? ` prof: ${String(prof)}.`
              : cls?.idActivity
              ? ` atividade: ${String(
                  activitiesById?.[String(cls.idActivity)]?.name || cls.idActivity
                )}.`
              : ""),
          status: isActive ? "ativo" : "inativo",
        };
      });
  }, [activitiesById, classById, enrollments, instructorById, todayKey]);

  const table = useMemo(() => {
    const columns = [
      {
        Header: "matrícula",
        accessor: "label",
        width: "60%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" color="text" fontWeight="regular">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "status",
        accessor: "status",
        width: "40%",
        Cell: ({ value }: any) => (
          <MDBox sx={{ display: "flex", justifyContent: "flex-end", pr: 1 }}>
            <MDBadge
              badgeContent={value}
              color={value === "ativo" ? "success" : "secondary"}
              variant="contained"
              container
              size="xs"
            />
          </MDBox>
        ),
      },
    ];

    const rows = normalizedEnrollments.map((enrollment, index) => ({
      label: enrollment.label,
      status: enrollment.status,
    }));

    return { columns, rows };
  }, [normalizedEnrollments]);

  const activeEnrollments = useMemo(
    () => normalizedEnrollments.filter((e) => e.status === "ativo"),
    [normalizedEnrollments]
  );
  const historyEnrollments = useMemo(
    () => normalizedEnrollments.filter((e) => e.status !== "ativo"),
    [normalizedEnrollments]
  );

  const activeTable = useMemo(() => {
    const columns = [
      {
        Header: "matrícula",
        accessor: "label",
        width: "60%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" color="text" fontWeight="regular">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "status",
        accessor: "status",
        width: "40%",
        Cell: ({ value }: any) => (
          <MDBox sx={{ display: "flex", justifyContent: "flex-end", pr: 1 }}>
            <MDBadge
              badgeContent={value}
              color={value === "ativo" ? "success" : "secondary"}
              variant="contained"
              container
              size="xs"
            />
          </MDBox>
        ),
      },
    ];

    const rows = activeEnrollments.map((enrollment) => ({
      label: enrollment.label,
      status: enrollment.status,
    }));

    return { columns, rows };
  }, [activeEnrollments]);

  const historyTable = useMemo(() => {
    const columns = [
      {
        Header: "matrícula",
        accessor: "label",
        width: "60%",
        Cell: ({ value }: any) => (
          <MDTypography variant="button" color="text" fontWeight="regular">
            {value}
          </MDTypography>
        ),
      },
      {
        Header: "status",
        accessor: "status",
        width: "40%",
        Cell: ({ value }: any) => (
          <MDBox sx={{ display: "flex", justifyContent: "flex-end", pr: 1 }}>
            <MDBadge
              badgeContent={value}
              color="secondary"
              variant="contained"
              container
              size="xs"
            />
          </MDBox>
        ),
      },
    ];

    const rows = historyEnrollments.map((enrollment) => ({
      label: enrollment.label,
      status: enrollment.status,
    }));

    return { columns, rows };
  }, [historyEnrollments]);

  return (
    <>
      <Card
        id="enrollments"
        sx={{ display: "flex", flexDirection: "column", maxHeight: 420, overflow: "hidden", mb: 3 }}
      >
        <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">Matrículas</MDTypography>
          <MDBox display="flex" gap={2}>
            <MDButton variant="outlined" color="info" size="small" onClick={openDetails}>
              Ver Todas
            </MDButton>
            <MDButton
              variant="gradient"
              color="dark"
              size="small"
              disabled={!clientId}
              onClick={() => {
                if (!clientId) return;
                navigate(`/grade?mode=enroll&clientId=${encodeURIComponent(String(clientId))}`);
              }}
            >
              <Icon sx={{ fontWeight: "bold" }}>add</Icon>
              &nbsp;Matricular
            </MDButton>
          </MDBox>
        </MDBox>
        <MDBox sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 3 }}>
          {loading ? (
            <MDBox p={3}>
              <MDTypography variant="button" color="text" fontWeight="regular">
                Carregando...
              </MDTypography>
            </MDBox>
          ) : activeEnrollments.length > 0 || historyEnrollments.length > 0 ? (
            <MDBox display="flex" flexDirection="column" gap={3}>
              {/* Matrículas Ativas */}
              {activeEnrollments.length > 0 && (
                <MDBox display="flex" flexDirection="column" gap={1.5}>
                  <MDTypography variant="button" fontWeight="medium" px={3}>
                    Matrículas ativas
                  </MDTypography>
                  <DataTable
                    table={activeTable}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    canSearch={false}
                  />
                </MDBox>
              )}

              {/* Histórico de Matrículas */}
              {historyEnrollments.length > 0 && (
                <MDBox display="flex" flexDirection="column" gap={1.5}>
                  <MDTypography variant="button" fontWeight="medium" px={3}>
                    Histórico de matrículas
                  </MDTypography>
                  <DataTable
                    table={historyTable}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    canSearch={false}
                  />
                </MDBox>
              )}

              {!loading && activeEnrollments.length === 0 && historyEnrollments.length === 0 && (
                <MDBox p={3}>
                  <MDTypography variant="button" color="text" fontWeight="regular">
                    Nenhuma matrícula encontrada.
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          ) : (
            <MDBox p={3}>
              <MDTypography variant="button" color="text" fontWeight="regular">
                Nenhuma matrícula encontrada.
              </MDTypography>
            </MDBox>
          )}
        </MDBox>
      </Card>

      <EnrollmentsModal open={detailsOpen} onClose={closeDetails} clientId={clientId || null} />
    </>
  );
}

export default Enrollments;
