import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect, useMemo, useState } from "react";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import { ConfirmDialog } from "components";

import DataTable from "examples/Tables/DataTable";

import { useConfirmDialog } from "hooks/useConfirmDialog";

import { useAppSelector } from "../../../../../../redux/hooks";

import { useClasses, useCollaborators } from "hooks/clients";

import { useReferenceDataCache } from "context/ReferenceDataCacheContext";

import { WEEKDAY_LABELS } from "constants/weekdays";

import {
  deactivateEnrollmentFromDate,
  fetchClientEnrollments,
  isEnrollmentActiveOnDate,
} from "hooks/enrollments";

type Props = {
  open: boolean;
  onClose: () => void;
  clientId?: string | null;
};

function EnrollmentsModal({ open, onClose, clientId }: Props): JSX.Element {
  const [menu, setMenu] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<"ativo" | "inativo" | null>(null);

  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch } = useAppSelector((state) => state.branch);

  const classes = useClasses();
  const collaborators = useCollaborators();
  const { activitiesById } = useReferenceDataCache();

  const { confirm, dialogProps, handleCancel, handleConfirm } = useConfirmDialog();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const todayKey = String(new Date().toISOString()).slice(0, 10);

  const openMenu = (event: any) => setMenu(event.currentTarget);
  const closeMenu = () => setMenu(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!open) return;
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
  }, [clientId, idBranch, idTenant, open]);

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
    return list
      .map((e: any) => {
        const idClass = String(e?.idClass || "");
        const cls = classById[idClass];
        const weekday = typeof cls?.weekday === "number" ? cls.weekday : undefined;
        const dayLabel =
          typeof weekday === "number" ? WEEKDAY_LABELS[weekday] || String(weekday) : "—";
        const timeLabel = cls?.startTime ? String(cls.startTime) : "—";
        const prof = cls?.idEmployee ? instructorById[String(cls.idEmployee)]?.name : "—";
        const activity = cls?.idActivity
          ? String(activitiesById?.[String(cls.idActivity)]?.name || cls.idActivity)
          : "—";

        const isActive = isEnrollmentActiveOnDate(e, todayKey);
        const status = isActive ? "ativo" : "inativo";
        const date = String(e?.effectiveFrom || "").slice(0, 10);

        return {
          id: String(e?.id || ""),
          idClass,
          date,
          day: dayLabel,
          time: timeLabel,
          prof,
          activity,
          status,
        };
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "ativo" ? -1 : 1;
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
  }, [activitiesById, classById, enrollments, instructorById, todayKey]);

  const filteredEnrollments = useMemo(() => {
    if (!statusFilter) return normalizedEnrollments;
    return normalizedEnrollments.filter((e: any) => e.status === statusFilter);
  }, [normalizedEnrollments, statusFilter]);

  const handleDeactivate = async (enrollmentId: string) => {
    if (!idTenant || !idBranch || !clientId) return;
    const ok = await confirm({
      title: "Excluir matrícula",
      description: "Deseja remover esta matrícula a partir de hoje?",
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      confirmColor: "error",
    });
    if (!ok) return;
    setLoading(true);
    try {
      await deactivateEnrollmentFromDate(idTenant, idBranch, clientId, enrollmentId, todayKey);
      const list = await fetchClientEnrollments(idTenant, idBranch, clientId);
      setEnrollments(list);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { Header: "#", accessor: "index", width: "8%" },
      { Header: "data", accessor: "date", width: "18%" },
      { Header: "horário", accessor: "schedule", width: "26%" },
      { Header: "prof", accessor: "prof", width: "22%" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "ações", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      filteredEnrollments.map((e: any, idx: number) => {
        const isActive = e.status === "ativo";

        return {
          index: (
            <MDTypography variant="button" fontWeight="medium">
              {idx + 1}
            </MDTypography>
          ),
          date: (
            <MDTypography variant="button" fontWeight="regular" color="text">
              {e.date}
            </MDTypography>
          ),
          schedule: (
            <MDTypography variant="button" fontWeight="medium">
              {e.day} {e.time}
            </MDTypography>
          ),
          prof: (
            <MDTypography variant="button" fontWeight="regular" color="text">
              {e.prof}
            </MDTypography>
          ),
          status: (
            <MDBadge
              badgeContent={e.status}
              color={isActive ? "success" : "secondary"}
              variant="contained"
              container
              size="xs"
            />
          ),
          actions: isActive ? (
            <MDBox display="flex" justifyContent="center" gap={1}>
              <MDButton variant="outlined" color="dark" size="small" iconOnly circular title="Ver">
                <Icon fontSize="small">visibility</Icon>
              </MDButton>
              <MDButton
                variant="outlined"
                color="error"
                size="small"
                iconOnly
                circular
                title="Excluir"
                disabled={loading}
                onClick={() => handleDeactivate(String(e.id))}
              >
                <Icon fontSize="small">delete</Icon>
              </MDButton>
            </MDBox>
          ) : (
            <MDTypography variant="button" color="text">
              —
            </MDTypography>
          ),
        };
      }),
    [filteredEnrollments, loading]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle>Matrículas</DialogTitle>
      <DialogContent>
        <MDBox pt={1}>
          <MDBox display="flex" justifyContent="flex-end" mb={2}>
            <MDButton variant={menu ? "contained" : "outlined"} color="dark" onClick={openMenu}>
              filtros&nbsp;
              <Icon>keyboard_arrow_down</Icon>
            </MDButton>
            <Menu
              anchorEl={menu}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              open={Boolean(menu)}
              onClose={closeMenu}
              keepMounted
            >
              <MenuItem
                onClick={() => {
                  setStatusFilter("ativo");
                  closeMenu();
                }}
              >
                Status: Ativo
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setStatusFilter("inativo");
                  closeMenu();
                }}
              >
                Status: Inativo
              </MenuItem>
              <Divider sx={{ margin: "0.5rem 0" }} />
              <MenuItem
                onClick={() => {
                  setStatusFilter(null);
                  closeMenu();
                }}
              >
                <MDTypography variant="button" color="error" fontWeight="regular">
                  Remover Filtro
                </MDTypography>
              </MenuItem>
            </Menu>
          </MDBox>

          <DataTable
            table={{ columns, rows }}
            entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
            showTotalEntries
            canSearch
            labels={{
              entriesPerPage: "registros por página",
              searchPlaceholder: "Pesquisar...",
              totalEntries: (start, end, total) =>
                `Mostrando ${start} até ${end} de ${total} registros`,
            }}
            isSorted
            noEndBorder
          />
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose}>
          Fechar
        </MDButton>
      </DialogActions>

      <ConfirmDialog
        open={dialogProps.open}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmLabel={dialogProps.confirmLabel}
        cancelLabel={dialogProps.cancelLabel}
        confirmColor={dialogProps.confirmColor}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </Dialog>
  );
}

export default EnrollmentsModal;
