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

import { useCallback, useMemo, useState } from "react";

// @mui material components
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";

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

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

import { useToast } from "context/ToastContext";

import { useConfirmDialog } from "hooks/useConfirmDialog";

import type { Objective, Topic } from "hooks/activities";
import { ConfirmDialog } from "components";

interface Props {
  objectives: Objective[];
  onObjectivesChange: (objectives: Objective[]) => void;
  onSave?: (objectives: Objective[]) => Promise<void>;
}

function ObjectivesTopicsManager({ objectives, onObjectivesChange, onSave }: Props): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newObjectiveTitle, setNewObjectiveTitle] = useState("");
  const [newTopicTexts, setNewTopicTexts] = useState<Record<string, string>>({});
  const [expandedObjectiveId, setExpandedObjectiveId] = useState<string | null>(null);

  const toast = useToast();
  const confirmDialog = useConfirmDialog();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const normalizeOrders = useCallback((list: Objective[]): Objective[] => {
    return list.map((o, index) => ({
      ...o,
      order: index,
      topics: (Array.isArray(o.topics) ? o.topics : []).map((t, tIndex) => ({
        ...t,
        order: tIndex,
      })),
    }));
  }, []);

  const orderedObjectives = useMemo(() => {
    const list = Array.isArray(objectives) ? objectives : [];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [objectives]);

  const handleTopicTextChange = (objectiveId: string, text: string) => {
    setNewTopicTexts((prev) => ({
      ...prev,
      [objectiveId]: text,
    }));
  };

  const addObjective = () => {
    if (!newObjectiveTitle.trim()) return;
    const newObjective: Objective = {
      id: `objective_${Date.now()}`,
      title: newObjectiveTitle,
      topics: [],
    };
    onObjectivesChange(normalizeOrders([...orderedObjectives, newObjective]));
    setNewObjectiveTitle("");
  };

  const deleteObjective = (id: string) => {
    const next = orderedObjectives.filter((o) => o.id !== id);
    onObjectivesChange(normalizeOrders(next));
    setExpandedObjectiveId((prev) => (prev === id ? null : prev));
  };

  const handleDeleteObjective = useCallback(
    async (id: string) => {
      const ok = await confirmDialog.confirm({
        title: "Excluir objetivo?",
        description: "Os tópicos dentro deste objetivo também serão removidos.",
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });
      if (!ok) return;
      deleteObjective(id);
    },
    [confirmDialog, deleteObjective]
  );

  const updateObjectiveTitle = (id: string, newTitle: string) => {
    const newObjectives = orderedObjectives.map((o) =>
      o.id === id ? { ...o, title: newTitle } : o
    );
    onObjectivesChange(normalizeOrders(newObjectives));
  };

  const addTopic = (objectiveId: string) => {
    const text = newTopicTexts[objectiveId];
    if (!text?.trim()) return;

    const newTopic: Topic = {
      id: `topic_${Date.now()}`,
      description: text,
    };

    const newObjectives = objectives.map((obj) => {
      if (obj.id === objectiveId) {
        return { ...obj, topics: [...obj.topics, newTopic] };
      }
      return obj;
    });

    onObjectivesChange(normalizeOrders(newObjectives));
    handleTopicTextChange(objectiveId, "");
  };

  const updateTopicDescription = (objId: string, topicId: string, newDesc: string) => {
    const newObjectives = objectives.map((o) => {
      if (o.id === objId) {
        return {
          ...o,
          topics: o.topics.map((t) => (t.id === topicId ? { ...t, description: newDesc } : t)),
        };
      }
      return o;
    });
    onObjectivesChange(normalizeOrders(newObjectives));
  };

  const deleteTopic = (objectiveId: string, topicId: string) => {
    const newObjectives = objectives.map((obj) => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          topics: obj.topics.filter((t) => t.id !== topicId),
        };
      }
      return obj;
    });
    onObjectivesChange(normalizeOrders(newObjectives));
  };

  const handleDeleteTopic = useCallback(
    async (objectiveId: string, topicId: string) => {
      const ok = await confirmDialog.confirm({
        title: "Excluir tópico?",
        description: "Esta ação não pode ser desfeita.",
        confirmLabel: "Excluir",
        cancelLabel: "Cancelar",
        confirmColor: "error",
      });
      if (!ok) return;
      deleteTopic(objectiveId, topicId);
    },
    [confirmDialog, deleteTopic]
  );

  const handleSave = useCallback(async () => {
    if (!onSave) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(normalizeOrders(orderedObjectives));
      toast.showSuccess("Objetivos e tópicos salvos.");
      setIsEditing(false);
    } catch (e: any) {
      toast.showError(e?.message || "Erro ao salvar objetivos e tópicos.");
    } finally {
      setSaving(false);
    }
  }, [normalizeOrders, onSave, orderedObjectives, toast]);

  const handleToggleObjective = useCallback((objectiveId: string) => {
    setExpandedObjectiveId((prev) => (prev === objectiveId ? null : objectiveId));
  }, []);

  const SortableObjectiveWrapper = ({
    objective,
    children,
  }: {
    objective: Objective;
    children: (args: {
      setNodeRef: (node: HTMLElement | null) => void;
      attributes: any;
      listeners: any;
      style: any;
      isDragging: boolean;
    }) => JSX.Element;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: objective.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.85 : 1,
    };

    return children({ setNodeRef, attributes, listeners, style, isDragging });
  };

  const SortableTopicRow = ({
    topic,
    objectiveId,
    index,
    objectiveIndex,
  }: {
    topic: Topic;
    objectiveId: string;
    index: number;
    objectiveIndex: number;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: topic.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
    };

    return (
      <MDBox
        ref={setNodeRef}
        style={style}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <MDBox display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
          <MDBox
            display="flex"
            alignItems="center"
            sx={{ userSelect: "none", cursor: "grab", flexShrink: 0 }}
            {...attributes}
            {...listeners}
          >
            <Icon fontSize="small">drag_indicator</Icon>
          </MDBox>

          <MDTypography
            variant="button"
            fontWeight="medium"
            color="text"
            sx={{ flexShrink: 0, minWidth: 44 }}
          >
            {`${objectiveIndex + 1}.${index + 1}`}
          </MDTypography>

          <MDInput
            value={topic.description}
            onChange={(e: any) => updateTopicDescription(objectiveId, topic.id, e.target.value)}
            fullWidth
            size="small"
            sx={{ mr: 2 }}
            placeholder="Descrição do tópico"
          />
        </MDBox>

        <IconButton
          onClick={() => void handleDeleteTopic(objectiveId, topic.id)}
          size="small"
          color="error"
        >
          <Icon fontSize="small">close</Icon>
        </IconButton>
      </MDBox>
    );
  };

  return (
    <Card>
      <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
        <MDTypography variant="h5">Objetivos e Tópicos</MDTypography>
        <MDBox>
          {isEditing ? (
            <MDBox display="flex" gap={1}>
              <MDButton
                variant="outlined"
                color="dark"
                disabled={saving}
                onClick={() => setIsEditing(false)}
              >
                cancelar
              </MDButton>
              <MDButton
                variant="gradient"
                color="info"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                salvar
              </MDButton>
            </MDBox>
          ) : (
            <MDButton variant="outlined" color="info" onClick={() => setIsEditing(true)}>
              editar
            </MDButton>
          )}
        </MDBox>
      </MDBox>
      <MDBox p={3} pt={0}>
        {!isEditing ? (
          orderedObjectives.length === 0 ? (
            <MDTypography variant="body2" color="text">
              Nenhum objetivo cadastrado. Clique no botão de editar para adicionar.
            </MDTypography>
          ) : (
            <MDBox>
              {orderedObjectives.map((objective, index) => {
                const topics = [...(objective.topics || [])].sort(
                  (a, b) => (a.order ?? 0) - (b.order ?? 0)
                );

                return (
                  <MDBox key={objective.id} mb={3}>
                    <MDTypography variant="h6" sx={{ wordBreak: "break-word" }}>
                      {index + 1}. {objective.title}
                    </MDTypography>
                    <MDBox ml={2} mt={1} pl={2} borderLeft="2px solid #f0f2f5">
                      {topics.map((topic, topicIndex) => (
                        <MDBox key={topic.id} mb={1}>
                          <MDTypography variant="body2" color="text">
                            {`${index + 1}.${topicIndex + 1}`} {topic.description}
                          </MDTypography>
                        </MDBox>
                      ))}
                    </MDBox>
                  </MDBox>
                );
              })}
            </MDBox>
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const oldIndex = orderedObjectives.findIndex((o) => o.id === active.id);
              const newIndex = orderedObjectives.findIndex((o) => o.id === over.id);
              if (oldIndex < 0 || newIndex < 0) return;
              const moved = arrayMove(orderedObjectives, oldIndex, newIndex);
              onObjectivesChange(normalizeOrders(moved));
            }}
          >
            <SortableContext
              items={orderedObjectives.map((o) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedObjectives.map((objective, index) => {
                const expanded = expandedObjectiveId === objective.id;
                const topics = [...(objective.topics || [])].sort(
                  (a, b) => (a.order ?? 0) - (b.order ?? 0)
                );

                const onDragEndTopics = (event: DragEndEvent) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const oldIndex = topics.findIndex((t) => t.id === active.id);
                  const newIndex = topics.findIndex((t) => t.id === over.id);
                  if (oldIndex < 0 || newIndex < 0) return;
                  const moved = arrayMove(topics, oldIndex, newIndex);
                  const nextObjectives = orderedObjectives.map((o) => {
                    if (o.id !== objective.id) return o;
                    return { ...o, topics: moved };
                  });
                  onObjectivesChange(normalizeOrders(nextObjectives));
                };

                return (
                  <SortableObjectiveWrapper key={objective.id} objective={objective}>
                    {({ setNodeRef, attributes, listeners, style }) => (
                      <MDBox ref={setNodeRef} style={style} mb={2}>
                        <Accordion
                          expanded={expanded}
                          onChange={() => handleToggleObjective(objective.id)}
                          sx={{ boxShadow: "none", border: "1px solid rgba(0,0,0,0.08)" }}
                        >
                          <AccordionSummary
                            expandIcon={<Icon>expand_more</Icon>}
                            sx={{ minHeight: 56, "& .MuiAccordionSummary-content": { my: 1 } }}
                          >
                            <MDBox
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              width="100%"
                              gap={2}
                            >
                              <MDBox
                                display="flex"
                                alignItems="center"
                                gap={1}
                                flex={1}
                                minWidth={0}
                              >
                                <MDBox
                                  display="flex"
                                  alignItems="center"
                                  sx={{
                                    userSelect: "none",
                                    cursor: "grab",
                                    flexShrink: 0,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  {...attributes}
                                  {...listeners}
                                >
                                  <Icon fontSize="small">drag_indicator</Icon>
                                </MDBox>

                                <MDBox flex={1} minWidth={0}>
                                  <MDBox display="flex" alignItems="center" gap={1}>
                                    <MDTypography
                                      variant="button"
                                      fontWeight="medium"
                                      color="text"
                                      sx={{ flexShrink: 0, minWidth: 28 }}
                                    >
                                      {`${index + 1}.`}
                                    </MDTypography>
                                    <MDInput
                                      value={objective.title}
                                      onChange={(e: any) =>
                                        updateObjectiveTitle(objective.id, e.target.value)
                                      }
                                      fullWidth
                                      placeholder="Título do objetivo"
                                    />
                                  </MDBox>
                                </MDBox>
                              </MDBox>

                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeleteObjective(objective.id);
                                }}
                                color="error"
                              >
                                <Icon>delete</Icon>
                              </IconButton>
                            </MDBox>
                          </AccordionSummary>

                          <AccordionDetails>
                            <MDBox>
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={onDragEndTopics}
                              >
                                <SortableContext
                                  items={topics.map((t) => t.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {topics.map((topic, topicIndex) => (
                                    <SortableTopicRow
                                      key={topic.id}
                                      topic={topic}
                                      objectiveId={objective.id}
                                      index={topicIndex}
                                      objectiveIndex={index}
                                    />
                                  ))}
                                </SortableContext>
                              </DndContext>

                              <MDBox mt={2} display="flex" alignItems="center">
                                <MDInput
                                  placeholder="Novo tópico..."
                                  value={newTopicTexts[objective.id] || ""}
                                  onChange={(e: any) =>
                                    handleTopicTextChange(objective.id, e.target.value)
                                  }
                                  size="small"
                                  sx={{ mr: 1, flexGrow: 1 }}
                                />
                                <MDButton
                                  size="small"
                                  color="info"
                                  iconOnly
                                  onClick={() => addTopic(objective.id)}
                                >
                                  <Icon>add</Icon>
                                </MDButton>
                              </MDBox>
                            </MDBox>
                          </AccordionDetails>
                        </Accordion>

                        {index < orderedObjectives.length - 1 && <Divider sx={{ my: 2 }} />}
                      </MDBox>
                    )}
                  </SortableObjectiveWrapper>
                );
              })}
            </SortableContext>
          </DndContext>
        )}

        {isEditing ? (
          <MDBox mt={3} pt={2} borderTop="1px dashed #ccc">
            <MDTypography variant="button" fontWeight="bold" color="text">
              Adicionar Novo Objetivo
            </MDTypography>
            <MDBox mt={1} display="flex">
              <MDInput
                label="Título do Objetivo"
                value={newObjectiveTitle}
                onChange={(e: any) => setNewObjectiveTitle(e.target.value)}
                fullWidth
                sx={{ mr: 2 }}
              />
              <MDButton variant="gradient" color="info" onClick={addObjective}>
                Adicionar
              </MDButton>
            </MDBox>
          </MDBox>
        ) : null}
      </MDBox>

      <ConfirmDialog
        {...confirmDialog.dialogProps}
        onCancel={confirmDialog.handleCancel}
        onConfirm={confirmDialog.handleConfirm}
      />
    </Card>
  );
}

export default ObjectivesTopicsManager;
