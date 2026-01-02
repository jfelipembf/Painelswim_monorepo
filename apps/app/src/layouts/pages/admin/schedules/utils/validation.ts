import * as Yup from "yup";

export const scheduleValidationSchema = Yup.object().shape({
  idActivity: Yup.string().required("Atividade é obrigatória"),
  idEmployee: Yup.string().required("Instrutor é obrigatório"),
  idArea: Yup.string().required("Área é obrigatória"),
  startDate: Yup.string().required("Data início é obrigatória"),
  endDate: Yup.string(),
  weekDays: Yup.array().of(Yup.number()).min(1).required("Dias da semana é obrigatório"),
  startTime: Yup.string().required("Hora início é obrigatória"),
  durationMinutes: Yup.number().min(1).required("Duração é obrigatória"),
  maxCapacity: Yup.number().min(1).required("Capacidade é obrigatória"),
});
