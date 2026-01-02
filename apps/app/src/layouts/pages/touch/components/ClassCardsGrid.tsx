import Card from "@mui/material/Card";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

type ClassCard = {
  id: string;
  title: string;
  subtitle?: string;
};

type Props = {
  classes: ClassCard[];
  onSelect: (c: ClassCard) => void;
};

function ClassCardsGrid({ classes, onSelect }: Props): JSX.Element {
  if (classes.length === 0) {
    return (
      <Card
        sx={({ palette }) => ({
          p: 3,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.75)",
          border: `1px dashed ${palette.info.main}`,
          backdropFilter: "blur(10px)",
        })}
      >
        <MDTypography variant="h6" fontWeight="bold">
          Sem turmas para exibir
        </MDTypography>
        <MDTypography variant="button" color="text" display="block" mt={1}>
          Assim que conectarmos a Grade, as turmas do horário selecionado aparecerão aqui.
        </MDTypography>
      </Card>
    );
  }

  return (
    <MDBox
      display="grid"
      gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }}
      gap={2}
    >
      {classes.map((c) => (
        <Card
          key={c.id}
          onClick={() => onSelect(c)}
          sx={({ palette }) => ({
            p: 2.5,
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.92)",
            border: `1px solid ${palette.divider}`,
            cursor: "pointer",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            transition: "transform 140ms ease, box-shadow 140ms ease",
            "&:hover": {
              boxShadow: "0 10px 30px rgba(2, 132, 199, 0.18)",
            },
            "&:active": {
              transform: "scale(0.985)",
            },
          })}
        >
          <MDTypography variant="h5" fontWeight="bold">
            {c.title}
          </MDTypography>
          {c.subtitle ? (
            <MDTypography variant="button" color="text" display="block" mt={0.5}>
              {c.subtitle}
            </MDTypography>
          ) : null}
          <MDTypography variant="caption" color="text" display="block" mt={1.5}>
            Toque para escolher uma ação
          </MDTypography>
        </Card>
      ))}
    </MDBox>
  );
}

export default ClassCardsGrid;
