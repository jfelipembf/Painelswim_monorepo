import { useMemo, useState } from "react";

import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import EventCalendar from "examples/Calendar";

import MDBox from "components/MDBox";

import ManagerialNextEvents from "layouts/pages/management/event-plan/components/panels/ManagerialNextEvents";

import EventPlanSidePanel from "layouts/pages/management/event-plan/components/panels/EventPlanSidePanel";
import EventTypesDialog from "layouts/pages/management/event-plan/components/dialogs/EventTypesDialog";

import { useEventPlan } from "hooks/eventPlan";

import { addDaysIsoDateKey } from "services/helpers/salesHelpers";
import { useToast } from "context/ToastContext";

function ManagerialCalendarPage(): JSX.Element {
  const {
    eventPlans,
    eventTypes,
    loading,
    createType,
    updateType,
    removeType,
    createPlan,
    updatePlan,
    removePlan,
  } = useEventPlan();

  const { showError, showSuccess } = useToast();

  const [typesDialogOpen, setTypesDialogOpen] = useState(false);

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return null;
    return eventPlans.find((p) => p.id === selectedPlanId) || null;
  }, [eventPlans, selectedPlanId]);

  const events = useMemo(() => {
    return eventPlans.map((p) => ({
      id: p.id,
      title: p.eventTypeName,
      start: p.startAt,
      end: p.endAt ? addDaysIsoDateKey(String(p.endAt).slice(0, 10), 1) : undefined,
      allDay: Boolean(p.allDay),
      className: p.className,
      extendedProps: { raw: p },
    }));
  }, [eventPlans]);

  const applyCalendarDatesToPlan = async (arg: {
    event: { id: string; startStr: string; endStr?: string | null; allDay?: boolean };
  }) => {
    const planId = String(arg?.event?.id || "");
    if (!planId) return;

    const startKey = String(arg?.event?.startStr || "").slice(0, 10);
    const exclusiveEndKey = String(arg?.event?.endStr || "").slice(0, 10);

    const endAt = exclusiveEndKey ? addDaysIsoDateKey(exclusiveEndKey, -1) : undefined;

    try {
      await updatePlan(planId, {
        startAt: startKey,
        endAt,
        allDay: true,
      });
    } catch (error: any) {
      showError(error?.message || "Não foi possível atualizar o evento.");
    }
  };

  const clearSelection = () => {
    setSelectedDateKey(null);
    setSelectedPlanId(null);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <MDBox pt={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} xl={9} sx={{ height: "max-content" }}>
            <EventCalendar
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth",
              }}
              events={events}
              editable
              droppable={false}
              eventStartEditable
              eventDurationEditable
              eventResizableFromStart
              selectable={false}
              dateClick={(arg: { dateStr: string }) => {
                const start = arg?.dateStr;
                if (start) {
                  setSelectedPlanId(null);
                  setSelectedDateKey(start);
                }
              }}
              eventClick={(arg: { event: { id: string } }) => {
                const planId = String(arg?.event?.id || "");
                if (planId) {
                  setSelectedPlanId(planId);
                  setSelectedDateKey(null);
                }
              }}
              eventDrop={applyCalendarDatesToPlan as any}
              eventResize={applyCalendarDatesToPlan as any}
            />
          </Grid>

          <Grid item xs={12} xl={3}>
            <MDBox mb={3}>
              <EventPlanSidePanel
                loading={loading}
                eventTypes={eventTypes}
                selectedPlan={selectedPlan}
                selectedDateKey={selectedDateKey}
                onCreatePlan={createPlan}
                onUpdatePlan={updatePlan}
                onDeletePlan={removePlan}
                onClearSelection={clearSelection}
                onManageTypes={() => setTypesDialogOpen(true)}
                onSuccess={(message) => showSuccess(message)}
                onError={(message) => showError(message)}
              />
            </MDBox>

            <MDBox mb={3}>
              <ManagerialNextEvents events={events} />
            </MDBox>
          </Grid>
        </Grid>

        <EventTypesDialog
          open={typesDialogOpen}
          loading={loading}
          eventTypes={eventTypes}
          onClose={() => setTypesDialogOpen(false)}
          onCreateType={createType}
          onUpdateType={updateType}
          onDeleteType={removeType}
        />
      </MDBox>
    </DashboardLayout>
  );
}

export default ManagerialCalendarPage;
