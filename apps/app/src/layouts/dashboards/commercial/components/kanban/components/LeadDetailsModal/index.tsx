/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import React from "react";
import Flatpickr from "react-flatpickr";

// @mui material components
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Checkbox from "@mui/material/Checkbox";

import { Portuguese } from "flatpickr/dist/l10n/pt";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

import MDDatePicker from "components/MDDatePicker";

import TimelineList from "examples/Timeline/TimelineList";
import TimelineItem from "examples/Timeline/TimelineItem";
import { FormField } from "components";

export type LeadChecklistState = {
  scheduledTrial: boolean;
  confirmed: boolean;
  attended: boolean;
};

export type LeadDetails = {
  id: string;
  name: string;
  interest: string;
  origin: string;
  phone: string;
  email: string;
  contract: string;
  consultantName: string;
  consultantAvatar?: string;
  createdAt: string;
  checklist: LeadChecklistState;
  scheduledTrialDate?: string | null;
  confirmedDate?: string | null;
  attendedDate?: string | null;
  timeline: Array<{
    id: string;
    type: "scheduled_trial" | "confirmed" | "attended" | "note" | "attachment" | "generic";
    title: string;
    dateTime: string;
    description?: string;
    color?: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark" | "light";
    icon: string;
  }>;
  notes: Array<{
    id: string;
    text: string;
    createdAt: string;
  }>;
  attachments: Array<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
    createdAt: string;
  }>;
};

interface Props {
  open: boolean;
  lead: LeadDetails | null;
  onClose: () => void;
  onUpdate: (
    leadId: string,
    patch: Omit<Partial<LeadDetails>, "checklist"> & { checklist?: Partial<LeadChecklistState> }
  ) => void;
}

function LeadDetailsModal({ open, lead, onClose, onUpdate }: Props): JSX.Element {
  const [noteDraft, setNoteDraft] = React.useState("");
  const [noteDate, setNoteDate] = React.useState<string | null>(() =>
    new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  );
  const [noteFile, setNoteFile] = React.useState<File | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState(() => ({
    name: lead?.name ?? "",
    interest: lead?.interest ?? "",
    origin: lead?.origin ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    contract: lead?.contract ?? "",
  }));
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const noteDatePickerInstanceRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!open || !lead) return;
    setIsEditing(false);
    setEditDraft({
      name: lead.name,
      interest: lead.interest,
      origin: lead.origin,
      phone: lead.phone,
      email: lead.email,
      contract: lead.contract,
    });
    setNoteDraft("");
    setNoteDate(
      new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    );
    setNoteFile(null);
  }, [open, lead?.id]);

  if (!lead) return <></>;

  const openNoteDatePicker = () => {
    window.setTimeout(() => {
      noteDatePickerInstanceRef.current?.open?.();
    }, 0);
  };

  const updateChecklist = (patch: Partial<LeadChecklistState>) => {
    onUpdate(lead.id, { checklist: patch });
  };

  const setScheduledTrial = (next: boolean) => {
    updateChecklist({ scheduledTrial: next });
    if (!next) {
      onUpdate(lead.id, {
        scheduledTrialDate: null,
        timeline: lead.timeline.filter((t) => t.type !== "scheduled_trial"),
      });
    }
  };

  const setConfirmed = (next: boolean) => {
    updateChecklist({ confirmed: next });
    if (!next) {
      onUpdate(lead.id, {
        confirmedDate: null,
        timeline: lead.timeline.filter((t) => t.type !== "confirmed"),
      });
    }
  };

  const setAttended = (next: boolean) => {
    updateChecklist({ attended: next });
    if (!next) {
      onUpdate(lead.id, {
        attendedDate: null,
        timeline: lead.timeline.filter((t) => t.type !== "attended"),
      });
    }
  };

  const upsertTimelineItem = (type: LeadDetails["timeline"][number]["type"], patch: any) => {
    const existing = lead.timeline.find((it) => it.type === type);
    const next = existing
      ? lead.timeline.map((it) => (it.type === type ? { ...it, ...patch } : it))
      : [
          ...lead.timeline,
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            type,
            ...patch,
          },
        ];
    onUpdate(lead.id, { timeline: next });
  };

  const handleScheduledTrialDateChange = (dates: any[]) => {
    const date: Date | null = dates?.[0] || null;
    const formatted = date
      ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : null;

    onUpdate(lead.id, { scheduledTrialDate: formatted });

    if (formatted) {
      upsertTimelineItem("scheduled_trial", {
        title: "Aula experimental agendada",
        dateTime: formatted,
        description: `Data marcada: ${formatted}`,
        color: "info",
        icon: "event",
      });
    }
  };

  const handleConfirmedDateChange = (dates: any[]) => {
    const date: Date | null = dates?.[0] || null;
    const formatted = date
      ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : null;

    onUpdate(lead.id, { confirmedDate: formatted });

    if (formatted) {
      upsertTimelineItem("confirmed", {
        title: "Aula experimental confirmada",
        dateTime: formatted,
        description: `Confirmação em: ${formatted}`,
        color: "warning",
        icon: "check_circle",
      });
    }
  };

  const handleAttendedDateChange = (dates: any[]) => {
    const date: Date | null = dates?.[0] || null;
    const formatted = date
      ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : null;

    onUpdate(lead.id, { attendedDate: formatted });

    if (formatted) {
      upsertTimelineItem("attended", {
        title: "Aula experimental realizada",
        dateTime: formatted,
        description: `Compareceu em: ${formatted}`,
        color: "success",
        icon: "done_all",
      });
    }
  };

  const handleStartEdit = () => setIsEditing(true);
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDraft({
      name: lead.name,
      interest: lead.interest,
      origin: lead.origin,
      phone: lead.phone,
      email: lead.email,
      contract: lead.contract,
    });
  };

  const handleSaveEdit = () => {
    onUpdate(lead.id, {
      name: editDraft.name,
      interest: editDraft.interest,
      origin: editDraft.origin,
      phone: editDraft.phone,
      email: editDraft.email,
      contract: editDraft.contract,
    });
    setIsEditing(false);
  };

  const handleAddNote = () => {
    const trimmed = noteDraft.trim();
    if (!trimmed && !noteFile) return;

    const createdAt =
      noteDate ??
      new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

    const nextNotes = trimmed
      ? [
          ...lead.notes,
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            text: trimmed,
            createdAt,
          },
        ]
      : lead.notes;

    const nextAttachments = noteFile
      ? [
          ...lead.attachments,
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: noteFile.name,
            mimeType: noteFile.type || "application/octet-stream",
            url: URL.createObjectURL(noteFile),
            createdAt,
          },
        ]
      : lead.attachments;

    onUpdate(lead.id, { notes: nextNotes, attachments: nextAttachments });
    setNoteDraft("");
    setNoteFile(null);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setNoteFile(file);

    // allow attaching same file again
    e.target.value = "";
  };

  const handleNoteDateChange = (dates: any[]) => {
    const date: Date | null = dates?.[0] || null;
    const formatted = date
      ? date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : null;
    setNoteDate(formatted);
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <Modal open={open} onClose={onClose}>
      <MDBox
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "95%", md: 980 },
          maxHeight: "90vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
        }}
      >
        <MDBox display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <MDBox>
            <MDTypography variant="h5" fontWeight="medium">
              {lead.name}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              Criado em {lead.createdAt}
            </MDTypography>
          </MDBox>

          <MDBox display="flex" alignItems="center" gap={1}>
            {!isEditing ? (
              <MDButton
                variant="text"
                color="info"
                iconOnly
                onClick={handleStartEdit}
                title="Editar"
              >
                <Icon>edit</Icon>
              </MDButton>
            ) : (
              <>
                <MDButton
                  variant="text"
                  color="success"
                  iconOnly
                  onClick={handleSaveEdit}
                  title="Salvar"
                >
                  <Icon>check</Icon>
                </MDButton>
                <MDButton
                  variant="text"
                  color="secondary"
                  iconOnly
                  onClick={handleCancelEdit}
                  title="Cancelar"
                >
                  <Icon>close</Icon>
                </MDButton>
              </>
            )}
            <MDButton variant="text" color="error" iconOnly title="Excluir">
              <Icon>delete</Icon>
            </MDButton>
            <MDButton variant="text" color="secondary" iconOnly onClick={onClose} title="Fechar">
              <Icon>close</Icon>
            </MDButton>
          </MDBox>
        </MDBox>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <MDBox mb={2}>
              <MDTypography variant="button" fontWeight="medium" color="text">
                Informações
              </MDTypography>

              {!isEditing ? (
                <MDBox mt={1.5}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text">
                        Telefone
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {lead.phone || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text">
                        Email
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {lead.email || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text">
                        Interesse
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {lead.interest || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text">
                        Origem
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {lead.origin || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text">
                        Contrato
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        {lead.contract || "-"}
                      </MDTypography>
                    </Grid>
                  </Grid>
                </MDBox>
              ) : (
                <Grid container spacing={2} mt={0.5}>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Nome"
                      value={editDraft.name}
                      onChange={(e: any) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Telefone"
                      value={editDraft.phone}
                      onChange={(e: any) => setEditDraft((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Email"
                      value={editDraft.email}
                      onChange={(e: any) => setEditDraft((p) => ({ ...p, email: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Interesse"
                      value={editDraft.interest}
                      onChange={(e: any) =>
                        setEditDraft((p) => ({ ...p, interest: e.target.value }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Origem"
                      value={editDraft.origin}
                      onChange={(e: any) => setEditDraft((p) => ({ ...p, origin: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormField
                      label="Contrato"
                      value={editDraft.contract}
                      onChange={(e: any) =>
                        setEditDraft((p) => ({ ...p, contract: e.target.value }))
                      }
                    />
                  </Grid>
                </Grid>
              )}
            </MDBox>

            <MDBox>
              <MDTypography variant="button" fontWeight="medium" color="text">
                Observações
              </MDTypography>
              <Card sx={{ overflow: "visible", mt: 1.5 }}>
                <MDBox p={2} position="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />

                  <Flatpickr
                    value={noteDate ? [new Date(noteDate.split("/").reverse().join("-"))] : []}
                    options={{
                      dateFormat: "d/m/Y",
                      locale: Portuguese,
                    }}
                    onChange={handleNoteDateChange}
                    onReady={(_, __, instance) => {
                      noteDatePickerInstanceRef.current = instance;
                    }}
                    render={({ defaultValue }: any, ref: any) => (
                      <input
                        ref={ref}
                        defaultValue={defaultValue}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 1,
                          height: 1,
                          opacity: 0,
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  />

                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <MDTypography variant="caption" color="text">
                      {noteDate ? `Data: ${noteDate}` : "Sem data"}
                    </MDTypography>

                    <MDBox display="flex" alignItems="center" gap={0.5}>
                      <MDButton
                        variant="text"
                        color="info"
                        iconOnly
                        size="small"
                        onMouseDown={(e: any) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openNoteDatePicker();
                        }}
                        title="Selecionar data"
                      >
                        <Icon>event</Icon>
                      </MDButton>
                      <MDButton
                        variant="text"
                        color="info"
                        iconOnly
                        size="small"
                        onClick={handlePickFile}
                        title="Anexar arquivo"
                      >
                        <Icon>attach_file</Icon>
                      </MDButton>
                    </MDBox>
                  </MDBox>

                  <FormField
                    label="Informações"
                    value={noteDraft}
                    multiline
                    rows={3}
                    onChange={(e: any) => setNoteDraft(e.target.value)}
                  />

                  {noteFile ? (
                    <MDBox
                      mt={1}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={1}
                    >
                      <MDBox
                        display="flex"
                        alignItems="center"
                        gap={0.75}
                        sx={{ minWidth: 0, overflow: "hidden" }}
                      >
                        <Icon fontSize="small">attach_file</Icon>
                        <MDTypography
                          variant="caption"
                          color="text"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {noteFile.name}
                        </MDTypography>
                      </MDBox>
                      <MDButton
                        variant="text"
                        color="secondary"
                        iconOnly
                        size="small"
                        onClick={() => setNoteFile(null)}
                        title="Remover anexo"
                      >
                        <Icon>close</Icon>
                      </MDButton>
                    </MDBox>
                  ) : null}

                  <MDBox display="flex" justifyContent="flex-end" mt={1.5}>
                    <MDButton variant="gradient" color="info" onClick={handleAddNote}>
                      Adicionar
                    </MDButton>
                  </MDBox>
                </MDBox>
              </Card>

              {lead.notes.length ? (
                <MDBox mt={2}>
                  {lead.notes
                    .slice()
                    .reverse()
                    .map((n) => (
                      <MDBox key={n.id} mb={1.5} p={1.5} borderRadius="lg" bgColor="grey-100">
                        <MDTypography variant="caption" color="text">
                          {n.createdAt}
                        </MDTypography>
                        <MDTypography variant="body2" color="text" sx={{ whiteSpace: "pre-wrap" }}>
                          {n.text}
                        </MDTypography>
                      </MDBox>
                    ))}
                </MDBox>
              ) : null}
            </MDBox>

            <MDBox mt={3}>
              <MDTypography variant="button" fontWeight="medium" color="text">
                Anexos
              </MDTypography>

              {lead.attachments.length ? (
                <MDBox mt={2} display="flex" flexDirection="column" gap={1.5}>
                  {lead.attachments
                    .slice()
                    .reverse()
                    .map((a) => (
                      <MDBox
                        key={a.id}
                        display="flex"
                        gap={1.5}
                        p={1.5}
                        borderRadius="lg"
                        bgColor="grey-100"
                        sx={{ cursor: "pointer" }}
                        onClick={() => window.open(a.url, "_blank")}
                      >
                        {isImage(a.mimeType) ? (
                          <MDBox
                            component="img"
                            src={a.url}
                            alt={a.name}
                            sx={{ width: 72, height: 54, objectFit: "cover", borderRadius: 1 }}
                          />
                        ) : (
                          <MDBox
                            width={72}
                            height={54}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="md"
                            bgColor="white"
                          >
                            <Icon>description</Icon>
                          </MDBox>
                        )}

                        <MDBox>
                          <MDTypography variant="body2" color="text" fontWeight="medium">
                            {a.name}
                          </MDTypography>
                          <MDTypography variant="caption" color="text">
                            {a.createdAt}
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                    ))}
                </MDBox>
              ) : null}
            </MDBox>
          </Grid>

          <Grid item xs={12} md={4}>
            <MDBox>
              <MDTypography variant="button" fontWeight="medium" color="text">
                Checklist
              </MDTypography>

              <MDBox mt={1.5} display="flex" flexDirection="column">
                <MDBox
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => {
                    setScheduledTrial(!lead.checklist.scheduledTrial);
                  }}
                >
                  <Checkbox
                    checked={lead.checklist.scheduledTrial}
                    color="info"
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(_, checked) => setScheduledTrial(checked)}
                  />
                  <MDTypography
                    variant="button"
                    fontWeight="regular"
                    color="text"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Agendou aula experimental
                  </MDTypography>
                </MDBox>

                {lead.checklist.scheduledTrial ? (
                  <MDBox mt={1} mb={1.5}>
                    <MDDatePicker
                      key={lead.scheduledTrialDate || "empty"}
                      value={
                        lead.scheduledTrialDate
                          ? [new Date(lead.scheduledTrialDate.split("/").reverse().join("-"))]
                          : []
                      }
                      options={{
                        dateFormat: "d/m/Y",
                        locale: Portuguese,
                      }}
                      onChange={handleScheduledTrialDateChange}
                      input={{
                        label: "Data da aula",
                        fullWidth: true,
                      }}
                    />
                  </MDBox>
                ) : null}

                <MDBox
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => {
                    setConfirmed(!lead.checklist.confirmed);
                  }}
                >
                  <Checkbox
                    checked={lead.checklist.confirmed}
                    color="warning"
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(_, checked) => setConfirmed(checked)}
                  />
                  <MDTypography
                    variant="button"
                    fontWeight="regular"
                    color="text"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Confirmou
                  </MDTypography>
                </MDBox>

                {lead.checklist.confirmed ? (
                  <MDBox mt={1} mb={1.5}>
                    <MDDatePicker
                      key={lead.confirmedDate || "empty"}
                      value={
                        lead.confirmedDate
                          ? [new Date(lead.confirmedDate.split("/").reverse().join("-"))]
                          : []
                      }
                      options={{
                        dateFormat: "d/m/Y",
                        locale: Portuguese,
                      }}
                      onChange={handleConfirmedDateChange}
                      input={{
                        label: "Data da confirmação",
                        fullWidth: true,
                      }}
                    />
                  </MDBox>
                ) : null}

                <MDBox
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => {
                    setAttended(!lead.checklist.attended);
                  }}
                >
                  <Checkbox
                    checked={lead.checklist.attended}
                    color="success"
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(_, checked) => setAttended(checked)}
                  />
                  <MDTypography
                    variant="button"
                    fontWeight="regular"
                    color="text"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Compareceu
                  </MDTypography>
                </MDBox>

                {lead.checklist.attended ? (
                  <MDBox mt={1} mb={1.5}>
                    <MDDatePicker
                      key={lead.attendedDate || "empty"}
                      value={
                        lead.attendedDate
                          ? [new Date(lead.attendedDate.split("/").reverse().join("-"))]
                          : []
                      }
                      options={{
                        dateFormat: "d/m/Y",
                        locale: Portuguese,
                      }}
                      onChange={handleAttendedDateChange}
                      input={{
                        label: "Data do comparecimento",
                        fullWidth: true,
                      }}
                    />
                  </MDBox>
                ) : null}
              </MDBox>

              {lead.timeline.length ? (
                <MDBox mt={2}>
                  <TimelineList title="Timeline" dark={false}>
                    {lead.timeline
                      .slice()
                      .sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1))
                      .map((item, idx, arr) => (
                        <TimelineItem
                          key={item.id}
                          color={item.color}
                          icon={item.icon}
                          title={item.title}
                          dateTime={item.dateTime}
                          description={item.description}
                          lastItem={idx === arr.length - 1}
                        />
                      ))}
                  </TimelineList>
                </MDBox>
              ) : null}

              <Divider sx={{ my: 2 }} />

              <MDTypography variant="button" fontWeight="medium" color="text">
                Consultor
              </MDTypography>
              <MDBox mt={1.5} display="flex" alignItems="center" gap={1}>
                <MDAvatar src={lead.consultantAvatar} alt={lead.consultantName} size="sm">
                  {lead.consultantAvatar ? null : lead.consultantName.slice(0, 1)}
                </MDAvatar>
                <MDBox>
                  <MDTypography variant="body2" color="text">
                    {lead.consultantName}
                  </MDTypography>
                </MDBox>
              </MDBox>
            </MDBox>
          </Grid>
        </Grid>

        <MDBox display="flex" justifyContent="flex-end" gap={1} mt={3} px={3} pb={2}>
          <MDButton variant="outlined" color="secondary" onClick={onClose}>
            Cancelar
          </MDButton>
          <MDButton variant="gradient" color="info" onClick={onClose}>
            Salvar
          </MDButton>
        </MDBox>
      </MDBox>
    </Modal>
  );
}

export default LeadDetailsModal;
