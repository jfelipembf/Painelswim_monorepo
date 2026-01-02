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

import { useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

import type { Objective, Topic } from "hooks/activities";

interface Props {
  objectives: Objective[];
  onObjectivesChange: (objectives: Objective[]) => void;
}

function TopicsManager({ objectives, onObjectivesChange }: Props): JSX.Element {
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [newTopicDescription, setNewTopicDescription] = useState("");

  const selectedObjective = objectives.find((obj) => obj.id === selectedObjectiveId);

  const addTopic = () => {
    if (!selectedObjectiveId || !newTopicDescription.trim()) return;

    const updatedObjectives = objectives.map((objective) => {
      if (objective.id === selectedObjectiveId) {
        const newTopic: Topic = {
          id: `topic_${Date.now()}`,
          description: newTopicDescription,
        };
        return {
          ...objective,
          topics: [...objective.topics, newTopic],
        };
      }
      return objective;
    });

    onObjectivesChange(updatedObjectives);
    setNewTopicDescription("");
  };

  const removeTopic = (objectiveId: string, topicId: string) => {
    const updatedObjectives = objectives.map((objective) => {
      if (objective.id === objectiveId) {
        return {
          ...objective,
          topics: objective.topics.filter((topic) => topic.id !== topicId),
        };
      }
      return objective;
    });
    onObjectivesChange(updatedObjectives);
  };

  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h5">Tópicos por Objetivo</MDTypography>
      </MDBox>
      <MDBox p={3} pt={0}>
        {objectives.length === 0 ? (
          <MDTypography variant="body2" color="text">
            Primeiro crie alguns objetivos na aba &quot;Objetivos&quot;.
          </MDTypography>
        ) : (
          <>
            <MDBox mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <MDInput
                    select
                    label="Selecionar objetivo"
                    value={selectedObjectiveId || ""}
                    onChange={(e: any) => setSelectedObjectiveId(e.target.value)}
                    fullWidth
                  >
                    {objectives.map((objective) => (
                      <option key={objective.id} value={objective.id}>
                        {objective.title}
                      </option>
                    ))}
                  </MDInput>
                </Grid>
                {selectedObjectiveId && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <MDInput
                        label="Novo tópico"
                        value={newTopicDescription}
                        onChange={(e: any) => setNewTopicDescription(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <MDButton
                        variant="gradient"
                        color="warning"
                        onClick={addTopic}
                        disabled={!newTopicDescription.trim()}
                        fullWidth
                      >
                        <Icon>add</Icon>
                      </MDButton>
                    </Grid>
                  </>
                )}
              </Grid>
            </MDBox>

            {objectives.map((objective) => (
              <Accordion key={objective.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                  <MDTypography variant="subtitle1">
                    {objective.title} ({objective.topics.length} tópicos)
                  </MDTypography>
                </AccordionSummary>
                <AccordionDetails>
                  {objective.topics.length === 0 ? (
                    <MDTypography variant="body2" color="text">
                      Nenhum tópico cadastrado para este objetivo.
                    </MDTypography>
                  ) : (
                    <Grid container spacing={1}>
                      {objective.topics.map((topic) => (
                        <Grid item xs={12} key={topic.id}>
                          <MDBox
                            border="1px solid"
                            borderColor="grey.300"
                            borderRadius="md"
                            p={1}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <MDTypography variant="body2">{topic.description}</MDTypography>
                            <MDButton
                              variant="text"
                              color="error"
                              size="small"
                              onClick={() => removeTopic(objective.id, topic.id)}
                            >
                              <Icon fontSize="small">delete</Icon>
                            </MDButton>
                          </MDBox>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </>
        )}
      </MDBox>
    </Card>
  );
}

export default TopicsManager;
