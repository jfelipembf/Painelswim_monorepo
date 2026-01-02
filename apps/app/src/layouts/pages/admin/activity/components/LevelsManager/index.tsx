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

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

import type { Objective } from "hooks/activities";

interface Level {
  id: string;
  title: string;
  description: string;
  objectives: Objective[];
}

interface Props {
  levels: Level[];
  onLevelsChange: (levels: Level[]) => void;
}

function LevelsManager({ levels, onLevelsChange }: Props): JSX.Element {
  const [newLevelTitle, setNewLevelTitle] = useState("");
  const [newLevelDescription, setNewLevelDescription] = useState("");

  const addLevel = () => {
    if (!newLevelTitle.trim()) return;

    const newLevel: Level = {
      id: `level_${Date.now()}`,
      title: newLevelTitle,
      description: newLevelDescription,
      objectives: [],
    };

    onLevelsChange([...levels, newLevel]);
    setNewLevelTitle("");
    setNewLevelDescription("");
  };

  const removeLevel = (levelId: string) => {
    onLevelsChange(levels.filter((level) => level.id !== levelId));
  };

  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h5">Níveis da Atividade</MDTypography>
      </MDBox>
      <MDBox p={3} pt={0}>
        {/* Add new level */}
        <MDBox mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <MDInput
                label="Título do nível"
                value={newLevelTitle}
                onChange={(e: any) => setNewLevelTitle(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MDInput
                label="Descrição"
                value={newLevelDescription}
                onChange={(e: any) => setNewLevelDescription(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <MDButton
                variant="gradient"
                color="info"
                onClick={addLevel}
                disabled={!newLevelTitle.trim()}
                fullWidth
              >
                <Icon>add</Icon>
                Adicionar
              </MDButton>
            </Grid>
          </Grid>
        </MDBox>

        {/* Existing levels */}
        <Grid container spacing={3}>
          {levels.map((level) => (
            <Grid item xs={12} key={level.id}>
              <MDBox border="1px solid" borderColor="grey.300" borderRadius="lg" p={2}>
                <MDBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <MDBox>
                    <MDTypography variant="h6" fontWeight="medium">
                      {level.title}
                    </MDTypography>
                    {level.description && (
                      <MDTypography variant="body2" color="text">
                        {level.description}
                      </MDTypography>
                    )}
                  </MDBox>
                  <MDButton
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => removeLevel(level.id)}
                  >
                    <Icon>delete</Icon>
                  </MDButton>
                </MDBox>
                <MDTypography variant="caption" color="text">
                  {level.objectives.length} objetivos
                </MDTypography>
              </MDBox>
            </Grid>
          ))}
        </Grid>
      </MDBox>
    </Card>
  );
}

export default LevelsManager;
