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

import React, { useState } from "react";

// @asseinfo/react-kanban components
import Board from "@asseinfo/react-kanban";

// html-react-parser
import parse from "html-react-parser";

// uuid is a library for generating unique id
import { v4 as uuidv4 } from "uuid";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { Theme } from "@mui/material/styles";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

// Kanban components
// import Header from "layouts/dashboards/commercial/components/kanban/components/Header";
import AddLeadModal, {
  LeadData,
} from "layouts/dashboards/commercial/components/kanban/components/AddLeadModal";
import LeadCard from "layouts/dashboards/commercial/components/kanban/components/LeadCard";
import LeadDetailsModal, {
  LeadDetails,
  LeadChecklistState,
} from "layouts/dashboards/commercial/components/kanban/components/LeadDetailsModal";

// Data
import boards, { birthdaysToday } from "layouts/dashboards/commercial/components/kanban/data";

// Material Dashboard 2 PRO React context
import { useMaterialUIController } from "context";

function KanbanBoard(): JSX.Element {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  const [modalOpen, setModalOpen] = useState(false);
  const [newCardForm, setNewCardForm] = useState<string | number | boolean>(false);
  const [formValue, setFormValue] = useState<string>("");
  const [leads, setLeads] = useState<LeadDetails[]>([
    {
      id: uuidv4(),
      name: "Maria Fernandes",
      interest: "Plano Premium",
      origin: "whatsapp",
      phone: "(11) 98765-4321",
      email: "maria.fernandes@email.com",
      contract: "Mensal",
      consultantName: "João Silva",
      createdAt: "Hoje 14:30",
      checklist: {
        scheduledTrial: false,
        confirmed: false,
        attended: false,
      },
      scheduledTrialDate: null,
      confirmedDate: null,
      attendedDate: null,
      timeline: [],
      notes: [],
      attachments: [],
    },
  ]);

  const [leadDetailsOpen, setLeadDetailsOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  const openNewCardForm = (event: HTMLButtonElement | any, id: string | number) =>
    setNewCardForm(id);
  const closeNewCardForm = () => setNewCardForm(false);
  const handeSetFormValue = ({ currentTarget }: any) => setFormValue(currentTarget.value);

  const handleAddLead = (leadData: LeadData) => {
    const newLead: LeadDetails = {
      id: uuidv4(),
      ...leadData,
      consultantName: "João Silva",
      createdAt: "Agora",
      checklist: {
        scheduledTrial: false,
        confirmed: false,
        attended: false,
      },
      scheduledTrialDate: null,
      confirmedDate: null,
      attendedDate: null,
      timeline: [],
      notes: [],
      attachments: [],
    };

    setLeads((prev) => [...prev, newLead]);
  };

  const openLeadDetails = (leadId: string) => {
    setSelectedLeadId(leadId);
    setLeadDetailsOpen(true);
  };

  const closeLeadDetails = () => {
    setLeadDetailsOpen(false);
    setSelectedLeadId(null);
  };

  const selectedLead = React.useMemo(
    () => (selectedLeadId ? leads.find((l) => l.id === selectedLeadId) || null : null),
    [leads, selectedLeadId]
  );

  const updateLead = (
    leadId: string,
    patch: Omit<Partial<LeadDetails>, "checklist"> & { checklist?: Partial<LeadChecklistState> }
  ) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;

        const nextChecklist: LeadChecklistState | undefined = patch.checklist
          ? { ...lead.checklist, ...patch.checklist }
          : undefined;

        return {
          ...lead,
          ...patch,
          checklist: nextChecklist ?? lead.checklist,
        };
      })
    );
  };

  // Create dynamic board data that includes added leads
  const dynamicBoards = React.useMemo(() => {
    const boardsCopy = { ...boards };
    const leadCards = leads.map((lead) => ({
      id: lead.id,
      template: (
        <LeadCard
          lead={lead}
          badge={{ color: "info", label: "novo" }}
          createdAt={lead.createdAt}
          checklist={lead.checklist}
          onOpen={() => openLeadDetails(lead.id)}
        />
      ),
    }));

    return {
      ...boardsCopy,
      columns: boardsCopy.columns.map((col: any) => ({
        ...col,
        cards: col.title === "Novo contato" ? leadCards : [],
      })),
    };
  }, [leads]);

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox
        p={3}
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={2}
        flexWrap={{ xs: "wrap", md: "nowrap" }}
      >
        <MDBox>
          <MDTypography variant="h6">Kanban comercial</MDTypography>
          <MDTypography variant="button" color="text" fontWeight="light">
            Funil de vendas e movimentação de leads por etapa.
          </MDTypography>
        </MDBox>
        <MDButton
          variant="gradient"
          color="info"
          iconOnly
          onClick={openModal}
          aria-label="Adicionar lead"
          title="Adicionar lead"
        >
          <Icon sx={{ fontWeight: "bold" }}>add</Icon>
        </MDButton>
      </MDBox>

      <MDBox px={2} pb={3} sx={{ overflowX: "auto" }}>
        <MDBox
          position="relative"
          sx={({
            palette: { light, background },
            functions: { pxToRem },
            borders: { borderRadius },
            breakpoints,
          }: Theme | any) => ({
            "& .react-kanban-column": {
              backgroundColor: darkMode ? background.card : light.main,
              width: pxToRem(450),
              minWidth: pxToRem(450),
              flex: "0 0 auto",
              margin: `0 ${pxToRem(10)}`,
              padding: pxToRem(20),
              borderRadius: borderRadius.lg,
            },
            [breakpoints.down("md")]: {
              "& .react-kanban-column": {
                width: pxToRem(360),
                minWidth: pxToRem(360),
              },
            },
            [breakpoints.down("sm")]: {
              "& .react-kanban-column": {
                width: "85vw",
                minWidth: "85vw",
                margin: `0 ${pxToRem(6)}`,
                padding: pxToRem(16),
              },
            },
          })}
        >
          <Board
            initialBoard={dynamicBoards}
            allowAddCard
            disableColumnDrag
            renderColumnHeader={({ id, title }: any, { addCard }: any) => (
              <>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <MDTypography variant="h6">{title}</MDTypography>
                </MDBox>
              </>
            )}
            renderCard={({ id, template }: any, { dragging }: any) => (
              <MDBox
                key={id}
                dragging={dragging.toString() || undefined}
                display="block"
                width="calc(450px - 40px)"
                onMouseDownCapture={(e: any) => {
                  const target = e.target as HTMLElement;
                  if (target?.closest?.("input, label, button, textarea, a, [role='button']")) {
                    e.stopPropagation();
                  }
                }}
                onPointerDownCapture={(e: any) => {
                  const target = e.target as HTMLElement;
                  if (target?.closest?.("input, label, button, textarea, a, [role='button']")) {
                    e.stopPropagation();
                  }
                }}
                bgColor={darkMode ? "transparent" : "white"}
                color="text"
                borderRadius="xl"
                mt={2.5}
                py={1.875}
                px={1.875}
                lineHeight={1.5}
                sx={{
                  boxSizing: "border-box",
                  border: ({ borders: { borderWidth }, palette: { white } }: any) =>
                    darkMode ? `${borderWidth[1]} solid ${white.main}` : 0,
                  fontSize: ({ typography: { size } }: any) => size.md,
                }}
              >
                {typeof template === "string" ? parse(template) : template}
              </MDBox>
            )}
            onCardNew={(): any => null}
          />
        </MDBox>
      </MDBox>

      <AddLeadModal open={modalOpen} onClose={closeModal} onSubmit={handleAddLead} />

      <LeadDetailsModal
        open={leadDetailsOpen}
        lead={selectedLead}
        onClose={closeLeadDetails}
        onUpdate={updateLead}
      />
    </Card>
  );
}

export default KanbanBoard;
