import { useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import { SideListCard, SideListItem } from "components";

type ConversationStage =
  | "new_contact"
  | "qualifying"
  | "trial_offer"
  | "trial_scheduled"
  | "trial_attended"
  | "proposal_sent"
  | "won"
  | "lost"
  | "no_response"
  | "no_show";

type AutomationMode = "on" | "off";

type ConversationListItem = {
  id: string;
  name: string;
  phone: string;
  stage: ConversationStage;
  lastMessagePreview: string;
  lastMessageAtLabel: string;
  unreadCount: number;
  automationMode: AutomationMode;
  autoSendEnabled: boolean;
};

type Message = {
  id: string;
  sender: "contact" | "human" | "ai";
  text: string;
  timeLabel: string;
};

function CRMChatPage(): JSX.Element {
  document.title = "Chat CRM";

  const conversations = useMemo<ConversationListItem[]>(
    () => [
      {
        id: "c-1",
        name: "João Silva",
        phone: "+55 11 99999-9999",
        stage: "qualifying",
        lastMessagePreview: "Queria saber valores e horários...",
        lastMessageAtLabel: "Há 3 min",
        unreadCount: 2,
        automationMode: "on",
        autoSendEnabled: false,
      },
      {
        id: "c-2",
        name: "Maria Souza",
        phone: "+55 11 98888-8888",
        stage: "trial_scheduled",
        lastMessagePreview: "Pode agendar na terça às 19h?",
        lastMessageAtLabel: "Hoje",
        unreadCount: 0,
        automationMode: "off",
        autoSendEnabled: false,
      },
      {
        id: "c-3",
        name: "Pedro Lima",
        phone: "+55 11 97777-7777",
        stage: "no_response",
        lastMessagePreview: "Tudo bem, fico no aguardo.",
        lastMessageAtLabel: "Ontem",
        unreadCount: 0,
        automationMode: "on",
        autoSendEnabled: true,
      },
    ],
    []
  );

  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "");
  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0];

  const [automationMode, setAutomationMode] = useState<AutomationMode>(selected?.automationMode ?? "on");
  const [autoSendEnabled, setAutoSendEnabled] = useState<boolean>(selected?.autoSendEnabled ?? false);

  const [composerValue, setComposerValue] = useState("");

  const messages = useMemo<Message[]>(
    () => [
      { id: "m-1", sender: "contact", text: "Oi! Quero fazer natação.", timeLabel: "19:02" },
      {
        id: "m-2",
        sender: "ai",
        text: "Que legal! É para adulto ou infantil? E qual sua disponibilidade de horários?",
        timeLabel: "19:03",
      },
      {
        id: "m-3",
        sender: "contact",
        text: "Infantil, 7 anos. Pode ser à noite.",
        timeLabel: "19:05",
      },
    ],
    []
  );

  const stageLabel = (stage: ConversationStage) => {
    if (stage === "new_contact") return "Novo";
    if (stage === "qualifying") return "Qualificando";
    if (stage === "trial_offer") return "Oferta de experimental";
    if (stage === "trial_scheduled") return "Experimental agendada";
    if (stage === "trial_attended") return "Experimental feita";
    if (stage === "proposal_sent") return "Proposta enviada";
    if (stage === "won") return "Ganhou";
    if (stage === "lost") return "Perdeu";
    if (stage === "no_response") return "Sem resposta";
    return "No-show";
  };

  const renderConversationList = () => (
    <SideListCard header={<MDTypography variant="h6">Conversas</MDTypography>} height="calc(100vh - 280px)">
      {conversations.map((item) => {
        const active = item.id === selectedId;

        return (
          <SideListItem
            key={item.id}
            active={active}
            onClick={() => {
              setSelectedId(item.id);
              setAutomationMode(item.automationMode);
              setAutoSendEnabled(item.autoSendEnabled);
            }}
            right={
              <MDBox display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                <MDTypography variant="caption" color="text">
                  {item.lastMessageAtLabel}
                </MDTypography>
                {item.unreadCount ? (
                  <MDBox
                    px={1}
                    py={0.25}
                    borderRadius="md"
                    bgcolor="info"
                    color="white"
                    minWidth={26}
                    textAlign="center"
                  >
                    <MDTypography variant="caption" color="white" fontWeight="medium">
                      {item.unreadCount}
                    </MDTypography>
                  </MDBox>
                ) : null}
              </MDBox>
            }
          >
            <MDTypography variant="button" fontWeight="medium" sx={{ wordBreak: "break-word" }}>
              {item.name}
            </MDTypography>
            <MDTypography
              variant="caption"
              color="text"
              sx={{ display: "block", mt: 0.25, wordBreak: "break-word" }}
            >
              {item.phone}
            </MDTypography>
            <MDTypography
              variant="caption"
              color="text"
              sx={{ display: "block", mt: 0.75, wordBreak: "break-word" }}
            >
              {item.lastMessagePreview}
            </MDTypography>
          </SideListItem>
        );
      })}
    </SideListCard>
  );

  const renderChat = () => (
    <Card sx={{ height: "100%", overflow: "hidden" }}>
      <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
        <MDBox minWidth={0}>
          <MDTypography variant="h6" sx={{ wordBreak: "break-word" }}>
            {selected?.name ?? "Conversa"}
          </MDTypography>
          <MDTypography variant="caption" color="text" sx={{ display: "block" }}>
            {selected?.phone ?? ""} • {selected ? stageLabel(selected.stage) : ""}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" alignItems="center" gap={1.5}>
          <Icon fontSize="small">smart_toy</Icon>
          <MDTypography variant="caption" color="text">
            IA
          </MDTypography>
          <Switch checked={automationMode === "on"} onChange={(_, v) => setAutomationMode(v ? "on" : "off")} />
        </MDBox>
      </MDBox>

      <Divider sx={{ my: 0 }} />

      <MDBox p={2} sx={{ height: "calc(100vh - 420px)", overflowY: "auto" }}>
        {messages.map((msg) => {
          const isRight = msg.sender !== "contact";
          const bubbleBg = msg.sender === "ai" ? "info" : msg.sender === "human" ? "dark" : "light";
          const bubbleColor = msg.sender === "contact" ? "text" : "white";

          return (
            <MDBox key={msg.id} display="flex" justifyContent={isRight ? "flex-end" : "flex-start"} mb={1.5}>
              <MDBox
                px={1.5}
                py={1}
                borderRadius="lg"
                maxWidth="80%"
                bgcolor={bubbleBg}
                color={bubbleColor}
              >
                <MDTypography variant="button" color={bubbleColor} sx={{ whiteSpace: "pre-wrap" }}>
                  {msg.text}
                </MDTypography>
                <MDTypography
                  variant="caption"
                  color={bubbleColor}
                  sx={{ display: "block", textAlign: "right", opacity: 0.8, mt: 0.5 }}
                >
                  {msg.timeLabel}
                </MDTypography>
              </MDBox>
            </MDBox>
          );
        })}
      </MDBox>

      <Divider sx={{ my: 0 }} />

      <MDBox p={2} display="flex" gap={1.5} alignItems="flex-end">
        <MDInput
          value={composerValue}
          onChange={(e: any) => setComposerValue(e.target.value)}
          multiline
          minRows={2}
          maxRows={6}
          placeholder="Escreva uma mensagem..."
          fullWidth
        />
        <MDButton
          variant="gradient"
          color="info"
          onClick={() => setComposerValue("")}
          disabled={!composerValue.trim()}
        >
          Enviar
        </MDButton>
      </MDBox>
    </Card>
  );

  const renderCrmSidebar = () => (
    <Card sx={{ height: "100%", overflow: "hidden" }}>
      <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
        <MDBox display="flex" alignItems="center" gap={1.5}>
          <Icon fontSize="small">badge</Icon>
          <MDTypography variant="h6">Contato</MDTypography>
        </MDBox>
        <MDTypography variant="caption" color="text">
          {selected ? stageLabel(selected.stage) : ""}
        </MDTypography>
      </MDBox>

      <Divider sx={{ my: 0 }} />

      <MDBox p={2} sx={{ overflowY: "auto", height: "calc(100vh - 280px)" }}>
        <MDBox mb={2}>
          <MDTypography variant="button" fontWeight="medium" sx={{ display: "block" }}>
            {selected?.name ?? ""}
          </MDTypography>
          <MDTypography variant="caption" color="text" sx={{ display: "block" }}>
            {selected?.phone ?? ""}
          </MDTypography>
        </MDBox>

        <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <MDBox>
            <MDTypography variant="caption" color="text" sx={{ display: "block" }}>
              Automação
            </MDTypography>
            <MDTypography variant="button" fontWeight="medium">
              {automationMode === "on" ? "Ligada" : "Desligada"}
            </MDTypography>
          </MDBox>
          <Switch checked={automationMode === "on"} onChange={(_, v) => setAutomationMode(v ? "on" : "off")} />
        </MDBox>

        <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <MDBox>
            <MDTypography variant="caption" color="text" sx={{ display: "block" }}>
              Envio automático (quando IA ligada)
            </MDTypography>
            <MDTypography variant="button" fontWeight="medium">
              {autoSendEnabled ? "Ativo" : "Somente sugestão"}
            </MDTypography>
          </MDBox>
          <Switch checked={autoSendEnabled} onChange={(_, v) => setAutoSendEnabled(v)} />
        </MDBox>

        <Divider sx={{ my: 2 }} />

        <MDTypography variant="button" fontWeight="medium" sx={{ display: "block", mb: 1 }}>
          Ações
        </MDTypography>

        <MDBox display="flex" flexDirection="column" gap={1.5}>
          <MDButton variant="outlined" color="info" fullWidth>
            Criar/Atualizar Lead
          </MDButton>
          <MDButton variant="outlined" color="info" fullWidth>
            Agendar Experimental
          </MDButton>
          <MDButton variant="outlined" color="dark" fullWidth>
            Marcar como Sem resposta
          </MDButton>
          <MDButton variant="outlined" color="success" fullWidth>
            Marcar como Ganhou
          </MDButton>
          <MDButton variant="outlined" color="error" fullWidth>
            Marcar como Perdeu
          </MDButton>
        </MDBox>

        <Divider sx={{ my: 2 }} />

        <MDTypography variant="button" fontWeight="medium" sx={{ display: "block", mb: 1 }}>
          Sugestão IA
        </MDTypography>
        <MDBox p={1.5} borderRadius="lg" bgcolor="light" mb={1.5}>
          <MDTypography variant="caption" color="text" sx={{ display: "block", whiteSpace: "pre-wrap" }}>
            Próxima ação sugerida: perguntar faixa de horário e oferecer aula experimental.
          </MDTypography>
        </MDBox>
        <MDButton variant="gradient" color="info" fullWidth onClick={() => setComposerValue("Podemos agendar uma aula experimental? Qual melhor dia e horário para você?")}
        >
          Inserir sugestão no chat
        </MDButton>
      </MDBox>
    </Card>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox py={3} px={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={3}>
            {renderConversationList()}
          </Grid>

          <Grid item xs={12} lg={6}>
            {renderChat()}
          </Grid>

          <Grid item xs={12} lg={3}>
            {renderCrmSidebar()}
          </Grid>
        </Grid>
      </MDBox>

      <Footer />
    </DashboardLayout>
  );
}

export default CRMChatPage;
