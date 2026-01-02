export const NEW_USER_PERSONAL_FIELDS = [
  { name: "firstName", label: "Nome", col: 6, type: "text" },
  { name: "lastName", label: "Sobrenome", col: 6, type: "text" },
  { name: "gender", label: "Sexo", col: 4, type: "select", optionsKey: "gender" },
  { name: "birthDate", label: "Data de Nascimento", col: 4, type: "date" },
  { name: "status", label: "Status", col: 4, type: "select", optionsKey: "status" },
];

export const NEW_USER_CONTACT_FIELDS = [
  { name: "email", label: "Email", col: 6, type: "email" },
  { name: "phone", label: "Telefone", col: 6, type: "text" },
  { name: "role", label: "Cargo", col: 6, type: "select", optionsKey: "role" },
];

export const NEW_USER_ADDRESS_FIELDS = [
  { name: "cep", label: "CEP", col: 3, type: "text" },
  { name: "estado", label: "Estado", col: 3, type: "text" },
  { name: "cidade", label: "Cidade", col: 3, type: "text" },
  { name: "bairro", label: "Bairro", col: 3, type: "text" },
  { name: "numero", label: "Número", col: 3, type: "text" },
];
