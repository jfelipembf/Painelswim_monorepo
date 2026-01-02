import { useMemo } from "react";

import Card from "@mui/material/Card";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import DefaultItem from "examples/Items/DefaultItem";

type Props = {
  events?: any[];
  limit?: number;
};

function ManagerialNextEvents({ events = [], limit = 6 }: Props): JSX.Element {
  // UI-only: ainda calcula "próximos", mas sem qualquer interação externa
  const nextEvents = useMemo(() => {
    const todayKey = String(new Date().toISOString()).slice(0, 10);

    const normalized = (Array.isArray(events) ? events : [])
      .map((e) => {
        const allDay = Boolean(e?.allDay);
        const startRaw = e?.start;
        const endRaw = e?.end;
        const startKey = typeof startRaw === "string" ? String(startRaw).slice(0, 10) : "";
        const endKey = typeof endRaw === "string" ? String(endRaw).slice(0, 10) : "";

        const start = startRaw
          ? new Date(
              typeof startRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startKey)
                ? `${startKey}T00:00:00`
                : startRaw
            )
          : null;
        const end = endRaw
          ? new Date(
              typeof endRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endKey)
                ? `${endKey}T00:00:00`
                : endRaw
            )
          : null;

        return { ...e, start, end, startKey, allDay };
      })
      .filter((e) => e?.start && !Number.isNaN(e.start.getTime()));

    return normalized
      .filter((e) => {
        if (e.allDay && /^\d{4}-\d{2}-\d{2}$/.test(String(e.startKey || ""))) {
          return String(e.startKey) >= todayKey;
        }
        return e.start.getTime() >= Date.now();
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, limit);
  }, [events, limit]);

  const formatDate = (d: Date, allDay: boolean) => {
    try {
      return allDay ? d.toLocaleDateString("pt-BR") : d.toLocaleString("pt-BR");
    } catch (e) {
      return String(d);
    }
  };

  const resolveColor = (e: any) => {
    const className = String(e?.className || "info").replace("event-", "");
    const allowed = ["primary", "secondary", "info", "success", "warning", "error", "dark"];
    return allowed.includes(className) ? className : "info";
  };

  const resolveIcon = (e: any) => {
    const raw = e?.extendedProps?.raw;
    const typeName = String(raw?.eventTypeName || e?.title || "").toLowerCase();
    const legacyType = String(e?.extendedProps?.type || raw?.type || "");
    if (legacyType === "evaluation" || typeName.includes("avalia")) return "assignment";
    if (legacyType === "test" || typeName.includes("test")) return "quiz";
    return "event";
  };

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={2} px={2}>
        <MDTypography variant="h6" fontWeight="medium">
          Próximos eventos
        </MDTypography>
      </MDBox>

      <MDBox p={2}>
        {nextEvents.length === 0 ? (
          <MDBox py={1}>
            <MDTypography variant="button" color="text">
              Nenhum evento futuro.
            </MDTypography>
          </MDBox>
        ) : null}

        {nextEvents.map((ev, idx) => {
          const title = String(ev?.title || "Evento");
          const start = ev?.start as Date | null;
          const end = ev?.end as Date | null;
          const allDay = Boolean(ev?.allDay);

          const description = start
            ? end
              ? `${formatDate(start, allDay)} - ${formatDate(end, allDay)}`
              : formatDate(start, allDay)
            : "";

          return (
            <MDBox key={String(ev?.id || idx)} mt={idx === 0 ? 0 : 3.5}>
              <DefaultItem
                color={resolveColor(ev) as any}
                icon={resolveIcon(ev)}
                title={title}
                description={description}
              />
            </MDBox>
          );
        })}
      </MDBox>
    </Card>
  );
}

export default ManagerialNextEvents;
