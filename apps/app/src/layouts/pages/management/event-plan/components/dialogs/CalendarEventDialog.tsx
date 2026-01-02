import { useMemo } from "react";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { FormField } from "components";

type Props = {
  open: boolean;
  loading?: boolean;
  calendarEvent?: any;
};

function CalendarEventDialog({ open, loading = false, calendarEvent }: Props): JSX.Element {
  const startLabel = useMemo(() => {
    const d = calendarEvent?.start;
    if (!d) return "";
    try {
      return new Date(d).toLocaleString("pt-BR");
    } catch (e) {
      return String(d);
    }
  }, [calendarEvent]);

  const endLabel = useMemo(() => {
    const d = calendarEvent?.end;
    if (!d) return "";
    try {
      return new Date(d).toLocaleString("pt-BR");
    } catch (e) {
      return String(d);
    }
  }, [calendarEvent]);

  const titleLabel = useMemo(() => String(calendarEvent?.title || ""), [calendarEvent]);

  return (
    <>
      <Dialog open={open} onClose={undefined} fullWidth maxWidth="sm">
        <DialogTitle>Detalhes do evento</DialogTitle>

        <DialogContent>
          <MDBox pt={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormField label="Nome do evento" name="title" value={titleLabel} disabled />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormField label="Início" name="start" value={startLabel} disabled />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormField label="Fim" name="end" value={endLabel} disabled />
              </Grid>

              {calendarEvent?.extendedProps?.raw?.description ? (
                <Grid item xs={12}>
                  <MDTypography variant="button" color="text">
                    {String(calendarEvent.extendedProps.raw.description)}
                  </MDTypography>
                </Grid>
              ) : null}
            </Grid>
          </MDBox>
        </DialogContent>

        <DialogActions>
          {/* UI-only: sem onClick */}
          <MDButton variant="outlined" color="secondary" disabled={loading}>
            Fechar
          </MDButton>

          {/* UI-only: sem onClick */}
          <MDButton variant="outlined" color="error" disabled={loading}>
            Excluir
          </MDButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CalendarEventDialog;
