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

import checkout from "./form";

const {
  formField: {
    firstName,
    lastName,
    gender,
    birthDate,
    photoUrl,
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

const initialValues = {
  [firstName.name]: "",
  [lastName.name]: "",
  [gender.name]: "",
  [birthDate.name]: "",
  [photoUrl.name]: "",
  [email.name]: "",
  [phone.name]: "",
  [whatsapp.name]: "",
  [responsibleName.name]: "",
  [responsiblePhone.name]: "",
  [zipCode.name]: "",
  [state.name]: "",
  [city.name]: "",
  [neighborhood.name]: "",
  [address.name]: "",
  [number.name]: "",
  [notes.name]: "",
};

export default initialValues;
