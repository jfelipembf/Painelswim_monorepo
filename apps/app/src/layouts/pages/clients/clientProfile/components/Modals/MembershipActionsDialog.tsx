import { useEffect, useMemo, useState, type ReactNode } from "react";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";
import MDDatePicker from "components/MDDatePicker";
import MDTypography from "components/MDTypography";
import { ConfirmDialog, FormField } from "components";

import { Portuguese } from "flatpickr/dist/l10n/pt";

import { useToast } from "context/ToastContext";
import { useAppSelector } from "../../../../../../redux/hooks";
import { useConfirmDialog } from "hooks/useConfirmDialog";

import { fetchContractById, type Contract } from "hooks/contracts";
import { useClientSales } from "hooks/sales";
import {
  adjustMembershipDays,
  cancelMembership,
  fetchMembershipAdjustments,
  fetchMembershipSuspensions,
  suspendMembership,
  type Membership,
  type MembershipAdjustment,
  type MembershipSuspension,
} from "hooks/memberships";
import type { Client } from "hooks/clients";

import { addDaysDateKey, formatDateBr, formatDateFromUnknown, toDateKey } from "../../utils";

// Função auxiliar para construir período a partir das datas selecionadas
const buildSuspensionPeriod = (
  dates: [Date, Date] | null
): { start: string; end: string } | null => {
  if (!dates) return null;
  const [startDate, endDate] = dates;
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return null;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;

  let startKey = toDateKey(startDate.toISOString());
  let endKey = toDateKey(endDate.toISOString());

  if (!startKey || !endKey) return null;

  if (startKey > endKey) {
    [startKey, endKey] = [endKey, startKey];
  }

  return { start: startKey, end: endKey };
};

type TabKey = "info" | "suspend" | "adjust" | "cancel";
const TAB_KEYS: TabKey[] = ["info", "suspend", "adjust", "cancel"];

type Props = {
  open: boolean;
  membership: Membership | null;
  client: Client | null;
  onClose: () => void;
  onUpdated?: () => Promise<void>;
};

const statusLabel = (
  status?: string
): { label: string; color: "success" | "warning" | "error" | "info" } => {
  const s = String(status || "").toLowerCase();
  if (s === "active") return { label: "Ativo", color: "success" };
  if (s === "paused") return { label: "Suspenso", color: "warning" };
  if (s === "pending") return { label: "Pendente", color: "info" };
  if (s === "expired") return { label: "Expirado", color: "error" };
  return { label: "Cancelado", color: "error" };
};

const parseDays = (value: string): number => Math.floor(Number(value || 0));

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}): JSX.Element {
  return (
    <MDBox
      p={2}
      borderRadius="md"
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      })}
    >
      <MDBox>
        <MDTypography variant="caption" color="text" sx={{ display: "block" }}>
          {label}
        </MDTypography>
        <MDTypography variant="h6" fontWeight="medium">
          {value}
        </MDTypography>
      </MDBox>

      <MDTypography
        variant="caption"
        color="text"
        sx={{ mt: 1, opacity: helper ? 1 : 0, minHeight: "1rem" }}
      >
        {helper || "—"}
      </MDTypography>
    </MDBox>
  );
}

function ContentCard({
  title,
  right,
  children,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <MDBox
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius * 1.25,
        overflow: "hidden",
      })}
    >
      {title ? (
        <>
          <MDBox
            px={2}
            py={1.25}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={(theme) => ({ backgroundColor: theme.palette.grey[50] })}
          >
            <MDTypography variant="button" fontWeight="medium">
              {title}
            </MDTypography>
            {right ? <MDBox>{right}</MDBox> : <MDBox />}
          </MDBox>
          <Divider />
        </>
      ) : null}

      <MDBox p={2}>{children}</MDBox>
    </MDBox>
  );
}

function MembershipActionsDialog({
  open,
  membership,
  client,
  onClose,
  onUpdated,
}: Props): JSX.Element {
  const { idTenant } = useAppSelector((state) => state.tenant);
  const { idBranch, branches } = useAppSelector((state) => state.branch);
  const toast = useToast();

  const {
    confirm,
    dialogProps,
    handleCancel: handleDialogCancel,
    handleConfirm,
  } = useConfirmDialog();

  const [tab, setTab] = useState<TabKey>("info");

  const [contract, setContract] = useState<Contract | null>(null);
  const [contractLoading, setContractLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendStartDate, setSuspendStartDate] = useState<Date | null>(null);
  const [suspendEndDate, setSuspendEndDate] = useState<Date | null>(null);

  const [adjustDays, setAdjustDays] = useState("");
  const [adjustMode, setAdjustMode] = useState<"add" | "debit">("add");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const [cancelReason, setCancelReason] = useState("");

  const [suspensions, setSuspensions] = useState<MembershipSuspension[]>([]);
  const [adjustments, setAdjustments] = useState<MembershipAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const clientId = String(client?.id || "");

  const { data: sales } = useClientSales(clientId, {
    enabled: open && Boolean(membership?.saleId),
  });

  const sale = useMemo(() => {
    if (!membership?.saleId) return null;
    return (sales || []).find((item: any) => item?.id === membership.saleId) || null;
  }, [membership?.saleId, sales]);

  const statusMeta = statusLabel(membership?.status);

  const purchaseDateLabel = useMemo(() => {
    return formatDateFromUnknown(sale?.dateKey || sale?.createdAt || membership?.createdAt);
  }, [membership?.createdAt, sale?.createdAt, sale?.dateKey]);

  const consultantLabel = String(sale?.consultantName || sale?.consultantId || "").trim();

  const durationLabel = useMemo(() => {
    const duration = Number(membership?.duration || 0);
    const type = String(membership?.durationType || "");
    if (!Number.isFinite(duration) || duration <= 0 || !type) return "";

    const unit =
      type === "day"
        ? "dia"
        : type === "week"
        ? "semana"
        : type === "month"
        ? "mês"
        : type === "year"
        ? "ano"
        : "";

    if (!unit) return "";
    const label = duration === 1 ? unit : type === "month" ? "meses" : `${unit}s`;
    return `${duration} ${label}`;
  }, [membership?.duration, membership?.durationType]);

  const branchLabel = useMemo(() => {
    const branchId = String(sale?.idBranch || membership?.idBranch || "").trim();
    if (!branchId) return "";
    const match = (branches || []).find(
      (item: any) => String(item?.idBranch || item?.id || "") === branchId
    );
    return String(match?.name || branchId);
  }, [branches, membership?.idBranch, sale?.idBranch]);

  const maxTimes = Number(contract?.maxSuspensionTimes || 0);
  const usedTimes = Number(membership?.suspensionCount || 0);
  const remainingTimes = maxTimes > 0 ? Math.max(0, maxTimes - usedTimes) : null;

  const canSuspend =
    Boolean(contract?.allowFreeze) &&
    membership?.status === "active" &&
    (remainingTimes === null || remainingTimes > 0);

  const canCancel =
    Boolean(membership) && membership.status !== "canceled" && membership.status !== "expired";

  const canAdjust = canCancel;

  const daysRemaining = useMemo(() => {
    const endKey = toDateKey(membership?.endAt);
    if (!endKey) return null;

    const todayKey = toDateKey(new Date().toISOString());
    if (!todayKey) return null;

    // meio-dia UTC evita "pulos" por DST
    const end = new Date(`${endKey}T12:00:00.000Z`).getTime();
    const today = new Date(`${todayKey}T12:00:00.000Z`).getTime();

    return Math.max(0, Math.ceil((end - today) / 86400000));
  }, [membership?.endAt]);

  const previewEndAt = useMemo(() => {
    const endKey = toDateKey(membership?.endAt);
    const parsed = parseDays(adjustDays);
    if (!endKey || !Number.isFinite(parsed) || parsed <= 0) return "";
    const signed = adjustMode === "add" ? parsed : -parsed;
    return addDaysDateKey(endKey, signed);
  }, [adjustDays, adjustMode, membership?.endAt]);

  const suspensionPeriod = useMemo(() => {
    if (!suspendStartDate || !suspendEndDate) return null;
    return buildSuspensionPeriod([suspendStartDate, suspendEndDate]);
  }, [suspendStartDate, suspendEndDate]);
  const hasSuspensionPeriod = Boolean(suspensionPeriod);

  // Reset UI ao abrir / trocar membership
  useEffect(() => {
    if (!open) return;
    setTab("info");

    setSuspendError(null);
    setSuspendReason("");
    setSuspendStartDate(null);
    setSuspendEndDate(null);

    setAdjustDays("");
    setAdjustMode("add");
    setAdjustReason("");
    setAdjustError(null);

    setCancelReason("");
  }, [open, membership?.id]);

  // Load history
  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!open || !idTenant || !idBranch || !clientId || !membership?.id) {
        if (!active) return;
        setSuspensions([]);
        setAdjustments([]);
        return;
      }

      setHistoryLoading(true);
      try {
        const [nextSuspensions, nextAdjustments] = await Promise.all([
          fetchMembershipSuspensions(idTenant, idBranch, clientId, membership.id),
          fetchMembershipAdjustments(idTenant, idBranch, clientId, membership.id),
        ]);
        if (!active) return;
        setSuspensions(Array.isArray(nextSuspensions) ? nextSuspensions : []);
        setAdjustments(Array.isArray(nextAdjustments) ? nextAdjustments : []);
      } catch {
        if (!active) return;
        setSuspensions([]);
        setAdjustments([]);
      } finally {
        if (!active) return;
        setHistoryLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [clientId, idBranch, idTenant, membership?.id, open]);

  // Load contract
  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!open || !idTenant || !idBranch || !membership?.planId) {
        if (!active) return;
        setContract(null);
        return;
      }

      setContractLoading(true);
      try {
        const result = await fetchContractById(idTenant, idBranch, String(membership.planId));
        if (!active) return;
        setContract(result || null);
      } finally {
        if (!active) return;
        setContractLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [idBranch, idTenant, membership?.planId, open]);

  const handleSuspend = async () => {
    if (!idTenant || !idBranch || !clientId || !membership) return;

    if (!hasSuspensionPeriod || !suspensionPeriod) {
      setSuspendError("Selecione um período de suspensão.");
      return;
    }

    // meio-dia UTC evita DST/off-by-one
    const start = new Date(`${suspensionPeriod.start}T12:00:00.000Z`);
    const end = new Date(`${suspensionPeriod.end}T12:00:00.000Z`);
    const calculatedDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    );

    if (contract?.minimumSuspensionDays && calculatedDays < contract.minimumSuspensionDays) {
      setSuspendError(`O período deve ter no mínimo ${contract.minimumSuspensionDays} dias.`);
      return;
    }
    if (contract?.maxSuspensionDays && calculatedDays > contract.maxSuspensionDays) {
      setSuspendError(`O período deve ter no máximo ${contract.maxSuspensionDays} dias.`);
      return;
    }
    if (remainingTimes !== null && remainingTimes <= 0) {
      setSuspendError("Limite de suspensões atingido.");
      return;
    }

    setSuspendError(null);
    setSaving(true);
    try {
      await suspendMembership({
        idTenant,
        idBranch,
        clientId,
        membershipId: membership.id,
        days: calculatedDays,
        reason: suspendReason.trim() || undefined,
      });

      toast.showSuccess("Contrato suspenso.");
      if (onUpdated) await onUpdated();
      onClose();
    } catch (e: any) {
      toast.showError(e?.message || "Não foi possível suspender o contrato.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelMembership = async () => {
    if (!idTenant || !idBranch || !clientId || !membership) return;

    const ok = await confirm({
      title: "Cancelar contrato",
      description: "Esta ação não gera reembolso. Deseja continuar?",
      confirmLabel: "Cancelar contrato",
      cancelLabel: "Voltar",
      confirmColor: "error",
    });

    if (!ok) return;

    setSaving(true);
    try {
      await cancelMembership({
        idTenant,
        idBranch,
        clientId,
        membershipId: membership.id,
        reason: cancelReason.trim() || undefined,
      });

      toast.showSuccess("Contrato cancelado.");
      if (onUpdated) await onUpdated();
      onClose();
    } catch (e: any) {
      toast.showError(e?.message || "Não foi possível cancelar o contrato.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustDays = async () => {
    if (!idTenant || !idBranch || !clientId || !membership) return;

    const parsed = parseDays(adjustDays);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setAdjustError("Informe a quantidade de dias.");
      return;
    }

    setAdjustError(null);
    setSaving(true);
    try {
      const signed = adjustMode === "add" ? parsed : -parsed;

      await adjustMembershipDays({
        idTenant,
        idBranch,
        clientId,
        membershipId: membership.id,
        days: signed,
        reason: adjustReason.trim() || undefined,
      });

      toast.showSuccess("Contrato ajustado.");
      if (onUpdated) await onUpdated();
      onClose();
    } catch (e: any) {
      toast.showError(e?.message || "Não foi possível ajustar o contrato.");
    } finally {
      setSaving(false);
    }
  };

  const paperHeight = { xs: "90vh", md: "85vh" };

  return (
    <>
      <Dialog
        open={open}
        onClose={saving ? undefined : onClose}
        fullWidth
        maxWidth="xl"
        scroll="paper"
        PaperProps={{
          sx: {
            width: "95vw",
            maxWidth: "1600px",
            height: paperHeight,
            maxHeight: paperHeight,
            minHeight: paperHeight,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.5 }}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
            <MDBox>
              <MDTypography variant="h5" fontWeight="medium">
                {membership?.planName || "Contrato"}
              </MDTypography>
              <MDTypography variant="caption" color="text">
                {client ? `${client.firstName} ${client.lastName}`.trim() : " "}
              </MDTypography>
            </MDBox>

            <MDBox display="flex" alignItems="center" gap={1.25}>
              {membership ? (
                <MDBadge
                  badgeContent={statusMeta.label}
                  color={statusMeta.color}
                  variant="contained"
                />
              ) : null}

              <IconButton onClick={onClose} size="small" disabled={saving}>
                <Icon>close</Icon>
              </IconButton>
            </MDBox>
          </MDBox>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            flex: 1,
            overflowY: "auto",
            scrollbarGutter: "stable",
          }}
        >
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Dias restantes"
                value={daysRemaining !== null ? `${daysRemaining} dias` : "—"}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Suspensões usadas"
                value={String(Number(membership?.suspensionCount || 0))}
                helper={
                  remainingTimes !== null
                    ? `Restantes: ${Math.max(0, remainingTimes)}`
                    : contractLoading
                    ? "Carregando limites..."
                    : "—"
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Dias suspensos"
                value={String(Number(membership?.suspensionDaysUsed || 0))}
                helper={
                  contract?.maxSuspensionDays
                    ? `Máx. por suspensão: ${contract.maxSuspensionDays} dias`
                    : contractLoading
                    ? "Carregando regras..."
                    : "—"
                }
              />
            </Grid>
          </Grid>

          <MDBox
            mt={2}
            px={2}
            py={1.25}
            borderRadius="md"
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.default,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            })}
          >
            <MDTypography variant="button" color="text">
              Início: {formatDateBr(membership?.startAt) || "—"}
            </MDTypography>
            <MDTypography variant="button" color="text">
              Fim: {formatDateBr(membership?.endAt) || "—"}
            </MDTypography>
            {membership?.status === "paused" ? (
              <MDTypography variant="button" color="text">
                Suspenso até: {formatDateBr(membership?.pauseUntil) || "—"}
              </MDTypography>
            ) : null}
          </MDBox>

          <MDBox mt={2}>
            <Tabs
              value={Math.max(0, TAB_KEYS.indexOf(tab))}
              onChange={(_, value: number) => setTab(TAB_KEYS[value] ?? "info")}
              textColor="primary"
              indicatorColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 36,
                width: "fit-content",
                "& .MuiTabs-flexContainer": {
                  justifyContent: "flex-start",
                  gap: 0.5,
                },
                "& .MuiTab-root": {
                  fontSize: "0.8rem",
                  minHeight: 36,
                  minWidth: "auto",
                  px: 1.75,
                  py: 0.75,
                  textTransform: "none",
                  alignItems: "flex-start",
                },
              }}
            >
              <Tab label="Informações" />
              <Tab label="Suspensão" disabled={!canSuspend} />
              <Tab label="Adicionar/Debitar dias" disabled={!canAdjust} />
              <Tab label="Cancelamento" disabled={!canCancel} />
            </Tabs>
            <Divider sx={{ mt: 1 }} />
          </MDBox>

          <MDBox mt={2}>
            {tab === "info" ? (
              <ContentCard title="Detalhes do contrato">
                {[
                  { label: "Data da compra", value: purchaseDateLabel || "—" },
                  { label: "Responsável pela venda", value: consultantLabel || "—" },
                  { label: "Duração do contrato", value: durationLabel || "—" },
                  { label: "Unidade", value: branchLabel ? `Unidade "${branchLabel}"` : "—" },
                  {
                    label: "Suspensão permitida",
                    value: contractLoading
                      ? "Carregando..."
                      : contract?.allowFreeze
                      ? "Sim"
                      : "Não",
                  },
                ].map((item, idx, list) => (
                  <MDBox key={item.label}>
                    <MDBox
                      display="flex"
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      flexDirection={{ xs: "column", sm: "row" }}
                      gap={1}
                      py={1.25}
                    >
                      <MDTypography variant="button" color="text">
                        {item.label}
                      </MDTypography>
                      <MDTypography variant="button" fontWeight="medium">
                        {item.value}
                      </MDTypography>
                    </MDBox>
                    {idx < list.length - 1 ? <Divider /> : null}
                  </MDBox>
                ))}
              </ContentCard>
            ) : null}

            {tab === "suspend" ? (
              <MDBox display="flex" flexDirection="column" gap={2}>
                <ContentCard
                  title="Suspender contrato"
                  right={
                    remainingTimes !== null ? (
                      <MDTypography variant="caption" color="text">
                        Restantes: {Math.max(0, remainingTimes)}
                      </MDTypography>
                    ) : null
                  }
                >
                  <MDTypography variant="button" color="text">
                    Selecione as datas para suspender o contrato.
                  </MDTypography>

                  <MDBox mt={1.5} display="flex" flexDirection="column" gap={1.5}>
                    <MDBox
                      display="flex"
                      flexWrap="wrap"
                      columnGap={1}
                      rowGap={1}
                      alignItems="flex-end"
                    >
                      <MDBox sx={{ maxWidth: 260, flex: "1 1 220px" }}>
                        <MDDatePicker
                          key={suspendStartDate ? suspendStartDate.getTime() : "start-empty"}
                          value={suspendStartDate ? [suspendStartDate] : []}
                          options={{
                            dateFormat: "d/m/Y",
                            locale: Portuguese,
                            minDate: "today",
                            disableMobile: true,
                          }}
                          onChange={(dates: Date[]) => {
                            const nextDate = dates?.[0] || null;
                            setSuspendStartDate(nextDate);
                            setSuspendError(null);
                            if (nextDate && suspendEndDate && suspendEndDate < nextDate) {
                              setSuspendEndDate(null);
                            }
                          }}
                          input={{
                            label: "Data inicial",
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
                          }}
                        />
                      </MDBox>
                      <MDBox sx={{ maxWidth: 260, flex: "1 1 220px" }}>
                        <MDDatePicker
                          key={
                            suspendEndDate
                              ? `${suspendEndDate.getTime()}-${
                                  suspendStartDate?.getTime() || "no-start"
                                }`
                              : "end-empty"
                          }
                          value={suspendEndDate ? [suspendEndDate] : []}
                          options={{
                            dateFormat: "d/m/Y",
                            locale: Portuguese,
                            minDate: suspendStartDate || "today",
                            disableMobile: true,
                          }}
                          onChange={(dates: Date[]) => {
                            const nextDate = dates?.[0] || null;
                            setSuspendEndDate(nextDate);
                            setSuspendError(null);
                          }}
                          input={{
                            label: "Data final",
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
                          }}
                        />
                      </MDBox>
                    </MDBox>

                    <FormField
                      label="Motivo da suspensão (opcional)"
                      value={suspendReason}
                      onChange={(e: any) => setSuspendReason(e.target.value)}
                      disabled={!canSuspend || saving}
                    />

                    {contract?.minimumSuspensionDays ? (
                      <MDTypography variant="caption" color="text">
                        Mínimo: {contract.minimumSuspensionDays} dias
                      </MDTypography>
                    ) : null}

                    {contract?.maxSuspensionDays ? (
                      <MDTypography variant="caption" color="text">
                        Máximo: {contract.maxSuspensionDays} dias
                      </MDTypography>
                    ) : null}

                    {contractLoading ? (
                      <MDTypography variant="caption" color="text">
                        Carregando regras do contrato...
                      </MDTypography>
                    ) : null}

                    {suspendError ? (
                      <MDTypography variant="caption" color="error">
                        {suspendError}
                      </MDTypography>
                    ) : null}

                    {hasSuspensionPeriod && suspensionPeriod ? (
                      <MDTypography
                        variant="caption"
                        color="info"
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Icon fontSize="small">info</Icon>
                        Período selecionado: {formatDateBr(suspensionPeriod.start)} até{" "}
                        {formatDateBr(suspensionPeriod.end)}
                      </MDTypography>
                    ) : null}
                  </MDBox>
                </ContentCard>

                <ContentCard title="Histórico de suspensões">
                  {historyLoading ? (
                    <MDTypography variant="caption" color="text">
                      Carregando suspensões...
                    </MDTypography>
                  ) : suspensions.length ? (
                    <MDBox
                      sx={{
                        maxHeight: 260,
                        overflow: "auto",
                        pr: 1,
                        scrollbarGutter: "stable",
                      }}
                      display="flex"
                      flexDirection="column"
                      gap={1.25}
                    >
                      {suspensions.map((item, index) => (
                        <MDBox
                          key={item.id}
                          sx={(theme) => ({
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: theme.shape.borderRadius,
                            p: 1.5,
                          })}
                        >
                          <MDTypography variant="caption" color="text">
                            #{index + 1}
                          </MDTypography>
                          <MDBox mt={0.5} display="flex" flexWrap="wrap" gap={2}>
                            <MDTypography variant="button" color="text">
                              Início: {formatDateBr(item.startAt) || "—"}
                            </MDTypography>
                            <MDTypography variant="button" color="text">
                              Fim: {formatDateBr(item.endAt) || "—"}
                            </MDTypography>
                          </MDBox>
                        </MDBox>
                      ))}
                    </MDBox>
                  ) : (
                    <MDTypography variant="caption" color="text">
                      Nenhuma suspensão registrada.
                    </MDTypography>
                  )}
                </ContentCard>
              </MDBox>
            ) : null}

            {tab === "adjust" ? (
              <MDBox display="flex" flexDirection="column" gap={2}>
                <ContentCard title="Ajustar dias do contrato">
                  <MDBox display="flex" gap={1} flexWrap="wrap">
                    <MDButton
                      variant={adjustMode === "add" ? "gradient" : "outlined"}
                      color="info"
                      onClick={() => setAdjustMode("add")}
                      disabled={saving || !canAdjust}
                    >
                      Adicionar dias
                    </MDButton>

                    <MDButton
                      variant={adjustMode === "debit" ? "gradient" : "outlined"}
                      color="warning"
                      onClick={() => setAdjustMode("debit")}
                      disabled={saving || !canAdjust}
                    >
                      Debitar dias
                    </MDButton>
                  </MDBox>

                  <MDBox mt={1.5} display="flex" flexDirection="column" gap={1.5}>
                    <FormField
                      label="Quantidade de dias"
                      type="number"
                      value={adjustDays}
                      onChange={(e: any) => setAdjustDays(e.target.value)}
                      inputProps={{ min: 1 }}
                      disabled={!canAdjust || saving}
                    />

                    <FormField
                      label="Motivo (opcional)"
                      value={adjustReason}
                      onChange={(e: any) => setAdjustReason(e.target.value)}
                      disabled={!canAdjust || saving}
                    />

                    <MDBox display="flex" flexWrap="wrap" gap={2}>
                      <MDTypography variant="caption" color="text">
                        Fim atual: {formatDateBr(membership?.endAt) || "—"}
                      </MDTypography>
                      <MDTypography
                        variant="caption"
                        color="text"
                        sx={{ opacity: previewEndAt ? 1 : 0, minHeight: "1rem" }}
                      >
                        Novo fim: {previewEndAt ? formatDateBr(previewEndAt) : "—"}
                      </MDTypography>
                    </MDBox>

                    {adjustError ? (
                      <MDTypography variant="caption" color="error">
                        {adjustError}
                      </MDTypography>
                    ) : null}
                  </MDBox>
                </ContentCard>

                <ContentCard title="Histórico de ajustes">
                  {historyLoading ? (
                    <MDTypography variant="caption" color="text">
                      Carregando ajustes...
                    </MDTypography>
                  ) : adjustments.length ? (
                    <MDBox
                      sx={{
                        maxHeight: 260,
                        overflow: "auto",
                        pr: 1,
                        scrollbarGutter: "stable",
                      }}
                      display="flex"
                      flexDirection="column"
                      gap={1.25}
                    >
                      {adjustments.map((item, index) => (
                        <MDBox
                          key={item.id}
                          sx={(theme) => ({
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: theme.shape.borderRadius,
                            p: 1.5,
                          })}
                        >
                          <MDTypography variant="caption" color="text">
                            #{index + 1}
                          </MDTypography>
                          <MDBox mt={0.5} display="flex" flexWrap="wrap" gap={2}>
                            <MDTypography variant="button" color="text">
                              Antes: {formatDateBr(item.previousEndAt) || "—"}
                            </MDTypography>
                            <MDTypography variant="button" color="text">
                              Depois: {formatDateBr(item.nextEndAt) || "—"}
                            </MDTypography>
                          </MDBox>
                        </MDBox>
                      ))}
                    </MDBox>
                  ) : (
                    <MDTypography variant="caption" color="text">
                      Nenhum ajuste registrado.
                    </MDTypography>
                  )}
                </ContentCard>
              </MDBox>
            ) : null}

            {tab === "cancel" ? (
              <ContentCard title="Cancelar contrato">
                <MDTypography variant="button" color="text">
                  Cancelar contrato sem reembolso.
                </MDTypography>

                <MDTypography variant="caption" color="text" sx={{ mt: 0.5, display: "block" }}>
                  Esta ação cancela recebíveis em aberto e remove o contrato do aluno.
                </MDTypography>

                <MDBox mt={1.5}>
                  <FormField
                    label="Motivo do cancelamento (opcional)"
                    value={cancelReason}
                    onChange={(e: any) => setCancelReason(e.target.value)}
                    disabled={!canCancel || saving}
                  />
                </MDBox>
              </ContentCard>
            ) : null}
          </MDBox>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <MDButton variant="outlined" color="dark" onClick={onClose} disabled={saving}>
            Fechar
          </MDButton>

          {tab === "suspend" ? (
            <MDButton
              variant="gradient"
              color="info"
              onClick={handleSuspend}
              disabled={!canSuspend || saving}
            >
              Suspender
            </MDButton>
          ) : null}

          {tab === "adjust" ? (
            <MDButton
              variant="gradient"
              color="info"
              onClick={handleAdjustDays}
              disabled={!canAdjust || saving}
            >
              Confirmar ajuste
            </MDButton>
          ) : null}

          {tab === "cancel" ? (
            <MDButton
              variant="gradient"
              color="error"
              onClick={handleCancelMembership}
              disabled={!canCancel || saving}
            >
              Cancelar contrato
            </MDButton>
          ) : null}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={dialogProps.open}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmLabel={dialogProps.confirmLabel}
        cancelLabel={dialogProps.cancelLabel}
        confirmColor={dialogProps.confirmColor}
        onCancel={handleDialogCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default MembershipActionsDialog;
