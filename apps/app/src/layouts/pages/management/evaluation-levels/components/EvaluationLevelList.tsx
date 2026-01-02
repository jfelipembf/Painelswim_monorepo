import { type CSSProperties } from "react";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

import type { EvaluationLevelItem } from "../types";

type EvaluationLevelRowProps = {
  level: EvaluationLevelItem;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
  dragAttributes?: any;
  dragListeners?: any;
  dragging?: boolean;
};

function EvaluationLevelRow({
  level,
  index,
  onEdit,
  onDelete,
  dragAttributes,
  dragListeners,
  dragging,
}: EvaluationLevelRowProps): JSX.Element {
  const numericValue =
    typeof level?.value === "number" ? level.value : (level as any)?.numericValue ?? "—";

  const inactive = Boolean(level?.inactive);

  return (
    <MDBox
      px={2}
      py={1.5}
      borderRadius="lg"
      sx={{
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "white",
        opacity: dragging ? 0.7 : 1,
      }}
    >
      <MDBox display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <MDBox display="flex" alignItems="center" gap={1} minWidth={0} flex={1}>
          {/* UI-only: ícone visual, sem drag */}
          <MDBox
            display="flex"
            alignItems="center"
            sx={{ userSelect: "none", flexShrink: 0, cursor: "grab" }}
            {...dragAttributes}
            {...dragListeners}
          >
            <Icon fontSize="small">drag_indicator</Icon>
          </MDBox>

          <MDBox minWidth={0}>
            <MDTypography variant="button" fontWeight="medium" sx={{ wordBreak: "break-word" }}>
              {`${index + 1}. `} {level?.name || "—"}
            </MDTypography>

            <MDTypography
              variant="caption"
              color="text"
              sx={{ mt: 0.5, display: "flex", gap: 2, flexWrap: "wrap" }}
            >
              <span>{`Valor: ${numericValue}`}</span>
              <span>{inactive ? "Inativo" : "Ativo"}</span>
            </MDTypography>
          </MDBox>
        </MDBox>

        {/* ações */}
        <MDBox display="flex" gap={1} flexShrink={0}>
          <MDButton
            variant="outlined"
            color="info"
            size="small"
            iconOnly
            circular
            title="Editar"
            onClick={onEdit}
          >
            <Icon fontSize="small">edit</Icon>
          </MDButton>
          <MDButton
            variant="outlined"
            color="error"
            size="small"
            iconOnly
            circular
            title="Excluir"
            onClick={onDelete}
          >
            <Icon fontSize="small">delete</Icon>
          </MDButton>
        </MDBox>
      </MDBox>
    </MDBox>
  );
}

function SortableEvaluationLevelRow({
  level,
  index,
  onEdit,
  onDelete,
}: {
  level: EvaluationLevelItem;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { attributes, listeners, isDragging, setNodeRef, transform, transition } = useSortable({
    id: level.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <EvaluationLevelRow
        level={level}
        index={index}
        onEdit={onEdit}
        onDelete={onDelete}
        dragAttributes={attributes}
        dragListeners={listeners}
        dragging={isDragging}
      />
    </div>
  );
}

type EvaluationLevelListProps = {
  loading: boolean;
  error?: string | null;
  sharedLevels: EvaluationLevelItem[];
  branchLevels: EvaluationLevelItem[];
  onEdit: (level: EvaluationLevelItem) => void;
  onDelete: (level: EvaluationLevelItem) => void;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onReorderSuccess?: (message: string) => void;
  onReorderError?: (message: string) => void;
};

function EvaluationLevelList({
  loading,
  error,
  sharedLevels,
  branchLevels,
  onEdit,
  onDelete,
  onReorder,
  onReorderSuccess,
  onReorderError,
}: EvaluationLevelListProps): JSX.Element {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const hasItems = Boolean(sharedLevels.length || branchLevels.length);

  const handleDragEndForScope = async (scope: "shared" | "branch", event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const scopeLevels = scope === "shared" ? sharedLevels : branchLevels;
    const oldIndex = scopeLevels.findIndex((lvl) => lvl.id === active.id);
    const newIndex = scopeLevels.findIndex((lvl) => lvl.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const moved = arrayMove(scopeLevels, oldIndex, newIndex);
    const orderedIds = moved.map((lvl) => lvl.id);

    try {
      await onReorder(orderedIds);
      onReorderSuccess?.("Ordem atualizada.");
    } catch (err: any) {
      onReorderError?.(err?.message || "Erro ao reordenar níveis.");
    }
  };

  return (
    <Card sx={{ overflow: "visible" }}>
      <MDBox p={2} pb={1}>
        <MDTypography variant="h6">Lista de níveis</MDTypography>
      </MDBox>

      <MDBox pb={2} px={2}>
        {loading ? (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress color="info" />
          </MDBox>
        ) : error ? (
          <MDBox py={2}>
            <MDTypography variant="button" color="error" fontWeight="medium">
              {error}
            </MDTypography>
          </MDBox>
        ) : hasItems ? (
          <MDBox sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {sharedLevels.length ? (
              <MDBox>
                <MDTypography variant="caption" color="text" sx={{ mb: 1, display: "block" }}>
                  Compartilhados
                </MDTypography>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => {
                    void handleDragEndForScope("shared", e);
                  }}
                >
                  <SortableContext
                    items={sharedLevels.map((lvl) => lvl.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <MDBox sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {sharedLevels.map((level, index) => (
                        <SortableEvaluationLevelRow
                          key={level.id}
                          level={level}
                          index={index}
                          onEdit={() => onEdit(level)}
                          onDelete={() => onDelete(level)}
                        />
                      ))}
                    </MDBox>
                  </SortableContext>
                </DndContext>
              </MDBox>
            ) : null}

            {branchLevels.length ? (
              <MDBox mt={sharedLevels.length ? 2 : 0}>
                <MDTypography variant="caption" color="text" sx={{ mb: 1, display: "block" }}>
                  Da unidade
                </MDTypography>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => {
                    void handleDragEndForScope("branch", e);
                  }}
                >
                  <SortableContext
                    items={branchLevels.map((lvl) => lvl.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <MDBox sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {branchLevels.map((level, index) => (
                        <SortableEvaluationLevelRow
                          key={level.id}
                          level={level}
                          index={index}
                          onEdit={() => onEdit(level)}
                          onDelete={() => onDelete(level)}
                        />
                      ))}
                    </MDBox>
                  </SortableContext>
                </DndContext>
              </MDBox>
            ) : null}
          </MDBox>
        ) : (
          <MDBox py={2}>
            <MDTypography variant="button" color="text">
              Nenhum nível cadastrado.
            </MDTypography>
          </MDBox>
        )}
      </MDBox>
    </Card>
  );
}

export default EvaluationLevelList;
