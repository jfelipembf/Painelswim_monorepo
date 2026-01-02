import { STATUSES } from "constants/status";

// Images
import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";

export type MemberStatus = (typeof STATUSES)[number];

export type ContractDueRow = {
  id: string;
  image?: string;
  name: string;
  contract: string;
  dueDate: string;
  status: MemberStatus;
};

export type BirthdayRow = {
  id: string;
  image?: string;
  name: string;
  birthDate: string;
  age: number;
  status: MemberStatus;
};

export type EvaluationStatus = "done" | "pending";

export type EvaluationRow = {
  id: string;
  image?: string;
  name: string;
  evaluationName: string;
  evaluationStatus: EvaluationStatus;
  memberStatus: MemberStatus;
};

export type TestStatus = "done" | "pending";

export type TestRow = {
  id: string;
  image?: string;
  name: string;
  testName: string;
  testStatus: TestStatus;
  memberStatus: MemberStatus;
};

export type ClientRow = {
  id: string;
  image?: string;
  name: string;
  city: string;
  neighborhood: string;
  gender: "masculino" | "feminino" | "outro";
  status: MemberStatus;
  consultant: string;
  instructor: string;
  activity: string;
};

export const CRM_CONTRACT_DUE_ROWS: ContractDueRow[] = [
  {
    id: "m-1",
    image: team1,
    name: "João Silva",
    contract: "Plano Mensal",
    dueDate: "25/12/2025",
    status: "active",
  },
  {
    id: "m-2",
    image: team2,
    name: "Maria Souza",
    contract: "Plano Trimestral",
    dueDate: "27/12/2025",
    status: "paused",
  },
  {
    id: "m-3",
    image: team3,
    name: "Pedro Lima",
    contract: "Plano Mensal",
    dueDate: "02/01/2026",
    status: "active",
  },
];

export const CRM_BIRTHDAY_ROWS: BirthdayRow[] = [
  { id: "m-1", image: team1, name: "João Silva", birthDate: "21/12", age: 14, status: "active" },
  { id: "m-2", image: team2, name: "Maria Souza", birthDate: "24/12", age: 19, status: "paused" },
  { id: "m-3", image: team3, name: "Pedro Lima", birthDate: "02/01", age: 10, status: "active" },
];

export const CRM_EVALUATION_ROWS: EvaluationRow[] = [
  {
    id: "m-1",
    image: team1,
    name: "João Silva",
    evaluationName: "Avaliação Inicial",
    evaluationStatus: "done",
    memberStatus: "active",
  },
  {
    id: "m-2",
    image: team2,
    name: "Maria Souza",
    evaluationName: "Avaliação Inicial",
    evaluationStatus: "pending",
    memberStatus: "paused",
  },
  {
    id: "m-3",
    image: team3,
    name: "Pedro Lima",
    evaluationName: "Avaliação Inicial",
    evaluationStatus: "pending",
    memberStatus: "active",
  },
];

export const CRM_TEST_ROWS: TestRow[] = [
  {
    id: "m-1",
    image: team1,
    name: "João Silva",
    testName: "Teste 50m Livre",
    testStatus: "done",
    memberStatus: "active",
  },
  {
    id: "m-2",
    image: team2,
    name: "Maria Souza",
    testName: "Teste 50m Livre",
    testStatus: "pending",
    memberStatus: "paused",
  },
  {
    id: "m-3",
    image: team3,
    name: "Pedro Lima",
    testName: "Teste 50m Livre",
    testStatus: "pending",
    memberStatus: "active",
  },
];

export const CRM_CLIENT_ROWS: ClientRow[] = [
  {
    id: "m-1",
    image: team1,
    name: "João Silva",
    city: "São Paulo",
    neighborhood: "Centro",
    gender: "masculino",
    status: "active",
    consultant: "Consultor A",
    instructor: "Professor 1",
    activity: "Natação",
  },
  {
    id: "m-2",
    image: team2,
    name: "Maria Souza",
    city: "São Paulo",
    neighborhood: "Moema",
    gender: "feminino",
    status: "paused",
    consultant: "Consultor B",
    instructor: "Professor 2",
    activity: "Hidro",
  },
  {
    id: "m-3",
    image: team3,
    name: "Pedro Lima",
    city: "Guarulhos",
    neighborhood: "Jardins",
    gender: "masculino",
    status: "inactive",
    consultant: "Consultor A",
    instructor: "Professor 1",
    activity: "Musculação",
  },
];
