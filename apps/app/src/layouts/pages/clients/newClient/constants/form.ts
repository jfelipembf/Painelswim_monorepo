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

const form = {
  formId: "new-user-form",
  formField: {
    firstName: {
      name: "firstName",
      label: "Nome",
      type: "text",
      errorMsg: "Nome é obrigatório.",
    },
    lastName: {
      name: "lastName",
      label: "Sobrenome",
      type: "text",
      errorMsg: "Sobrenome é obrigatório.",
    },
    gender: {
      name: "gender",
      label: "Sexo",
      type: "text",
      errorMsg: "Sexo é obrigatório.",
    },
    birthDate: {
      name: "birthDate",
      label: "Data de nascimento",
      type: "date",
      errorMsg: "Data de nascimento é obrigatória.",
    },
    photoUrl: {
      name: "photoUrl",
      label: "Foto",
      type: "text",
    },
    email: {
      name: "email",
      label: "Email",
      type: "email",
      invalidMsg: "Email inválido.",
      errorMsg: "Email é obrigatório.",
    },
    phone: {
      name: "phone",
      label: "Telefone",
      type: "text",
      errorMsg: "Telefone é obrigatório.",
    },
    whatsapp: {
      name: "whatsapp",
      label: "WhatsApp",
      type: "text",
      errorMsg: "WhatsApp é obrigatório.",
    },
    responsibleName: {
      name: "responsibleName",
      label: "Responsável",
      type: "text",
      errorMsg: "Responsável é obrigatório.",
    },
    responsiblePhone: {
      name: "responsiblePhone",
      label: "Telefone do responsável",
      type: "text",
      errorMsg: "Telefone do responsável é obrigatório.",
    },
    zipCode: {
      name: "zipCode",
      label: "CEP",
      type: "text",
      errorMsg: "CEP é obrigatório.",
    },
    state: {
      name: "state",
      label: "Estado",
      type: "text",
      errorMsg: "Estado é obrigatório.",
    },
    city: {
      name: "city",
      label: "Cidade",
      type: "text",
      errorMsg: "Cidade é obrigatória.",
    },
    neighborhood: {
      name: "neighborhood",
      label: "Bairro",
      type: "text",
      errorMsg: "Bairro é obrigatório.",
    },
    address: {
      name: "address",
      label: "Endereço",
      type: "text",
      errorMsg: "Endereço é obrigatório.",
    },
    number: {
      name: "number",
      label: "Número",
      type: "text",
      errorMsg: "Número é obrigatório.",
    },
    notes: {
      name: "notes",
      label: "Observações",
    },
  },
};

export default form;
