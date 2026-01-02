import * as Yup from "yup";

export const activityValidationSchema = Yup.object().shape({
  name: Yup.string().required("Nome da atividade é obrigatório."),
  description: Yup.string(),
  color: Yup.string().required("Cor da atividade é obrigatória."),
  status: Yup.string().oneOf(["active", "inactive"]).required("Status é obrigatório."),
  shareWithOtherUnits: Yup.boolean(),
});
