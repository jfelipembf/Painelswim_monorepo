import * as Yup from "yup";

export const newUserSchema = Yup.object({
  firstName: Yup.string().required("Informe o nome"),
  lastName: Yup.string().required("Informe o sobrenome"),
  email: Yup.string().email("Email inválido").required("Informe o email"),
  phone: Yup.string().required("Informe o telefone"),
  role: Yup.string().required("Informe o cargo"),
});
