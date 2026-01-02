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

import * as Yup from "yup";
import checkout from "../constants/form";

const phoneRegex = /^(\(?\d{2}\)?\s?)?(\d{4,5})-?(\d{4})$/;

const {
  formField: {
    firstName,
    lastName,
    gender,
    birthDate,
    email,
    phone,
    whatsapp,
    responsibleName,
    responsiblePhone,
    zipCode,
    state,
    city,
    neighborhood,
    address,
    number,
    notes,
  },
} = checkout;

const validations = [
  Yup.object().shape({
    [firstName.name]: Yup.string().required(firstName.errorMsg),
    [lastName.name]: Yup.string().required(lastName.errorMsg),
    [gender.name]: Yup.string().required(gender.errorMsg),
    [birthDate.name]: Yup.string().required(birthDate.errorMsg),
  }),
  Yup.object().shape({
    [email.name]: Yup.string().required(email.errorMsg).email(email.invalidMsg),
    [responsibleName.name]: Yup.string()
      .optional()
      .min(3, "Nome do responsavel deve ter no mínimo 3 caracteres")
      .max(100, "Nome do responsavel deve ter no máximo 100 caracteres"),
    [responsiblePhone.name]: Yup.string()
      .optional()
      .matches(phoneRegex, "Telefone do responsavel inválido"),
    [phone.name]: Yup.string().optional().matches(phoneRegex, "Telefone inválido"),
    [whatsapp.name]: Yup.string().optional().matches(phoneRegex, "WhatsApp inválido"),
  }),
  Yup.object().shape({
    [zipCode.name]: Yup.string().required(zipCode.errorMsg),
    [state.name]: Yup.string().required(state.errorMsg),
    [city.name]: Yup.string().required(city.errorMsg),
    [neighborhood.name]: Yup.string().required(neighborhood.errorMsg),
    [address.name]: Yup.string().required(address.errorMsg),
    [number.name]: Yup.string().required(number.errorMsg),
  }),
  Yup.object().shape({
    [notes.name]: Yup.string(),
  }),
];

export default validations;
