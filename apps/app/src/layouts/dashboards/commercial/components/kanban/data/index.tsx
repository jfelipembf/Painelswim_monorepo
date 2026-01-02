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

// uuid is a library for generating unique id
import { v4 as uuidv4 } from "uuid";

// Kanban components
import Card from "layouts/dashboards/commercial/components/kanban/components/Card";

// Images
import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";
import team5 from "assets/images/team-5.jpg";

export interface BirthdayPerson {
  id: string;
  name: string;
  label?: string;
  avatar?: string;
}

export interface CommercialTask {
  id: string;
  title: string;
  dueLabel: string;
  priority: "alta" | "média" | "baixa";
  ownerAvatar?: string;
}

export const birthdaysToday: BirthdayPerson[] = [
  { id: "ana-souza", name: "Ana Souza", label: "Cliente • Plano anual", avatar: team2 },
  { id: "marcos-lima", name: "Marcos Lima", label: "Lead • Indicação", avatar: team4 },
];

export const tasksToday: CommercialTask[] = [
  {
    id: "task-1",
    title: "Ligar para Maria (lead quente) e confirmar horário de visita",
    dueLabel: "09:30",
    priority: "alta",
    ownerAvatar: team1,
  },
  {
    id: "task-2",
    title: "Enviar proposta para Clínica Horizonte (R$ 5.400/mês)",
    dueLabel: "11:00",
    priority: "alta",
    ownerAvatar: team3,
  },
  {
    id: "task-3",
    title: "Follow-up com João • aguardando retorno do financeiro",
    dueLabel: "14:00",
    priority: "média",
    ownerAvatar: team5,
  },
  {
    id: "task-4",
    title: "Atualizar CRM: registrar reuniões de ontem",
    dueLabel: "16:30",
    priority: "baixa",
    ownerAvatar: team2,
  },
];

const boards = {
  columns: [
    {
      id: uuidv4(),
      title: "Novo contato",
      cards: [
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "info", label: "novo" }}
              content="Maria Fernandes • Studio Fit | Quer conhecer planos corporativos"
              attachedFiles={2}
              members={[team1]}
            />
          ),
        },
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "info", label: "novo" }}
              content="Clínica Horizonte | Interessada em parceria e convênio"
              members={[team3]}
            />
          ),
        },
      ],
    },
    {
      id: uuidv4(),
      title: "Aula experimental",
      cards: [
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "warning", label: "experimental" }}
              content="João Pereira • Indicação | Agendar aula experimental"
              attachedFiles={1}
              members={[team2]}
            />
          ),
        },
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "warning", label: "experimental" }}
              content="Empresa Atlas | Solicitar aula experimental corporativa"
              attachedFiles={5}
              members={[team5]}
            />
          ),
        },
      ],
    },
    {
      id: uuidv4(),
      title: "Em espera",
      cards: [
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "warning", label: "follow-up" }}
              content="Pedro Almeida • Academia Up | Retornar com condições"
              attachedFiles={3}
              members={[team1, team3]}
            />
          ),
        },
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "warning", label: "agendado" }}
              content="Juliana Costa • CrossBox | Visita agendada (amanhã)"
              members={[team4]}
            />
          ),
        },
      ],
    },
    {
      id: uuidv4(),
      title: "Fim",
      cards: [
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "success", label: "ganho" }}
              content="Empresa Nativa | Contrato assinado • início imediato"
              members={[team2]}
            />
          ),
        },
        {
          id: uuidv4(),
          template: (
            <Card
              badge={{ color: "error", label: "perdido" }}
              content="Loja Central | Sem budget no momento (retomar em 60 dias)"
              members={[team5]}
            />
          ),
        },
      ],
    },
  ],
};

export default boards;
