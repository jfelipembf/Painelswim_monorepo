import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export type MessageItem = {
  id?: string;
  title?: string;
  description?: string;
  text?: string;
  createdAt?: string;
  date?: string;
};

type Props = {
  items: MessageItem[];
};

function MessagesCard({ items }: Props): JSX.Element {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <MDBox p={2} display="flex" alignItems="center" gap={1}>
        <Icon color="action">forum</Icon>
        <MDTypography variant="h6">Mensagens</MDTypography>
      </MDBox>
      <List sx={{ flex: 1, overflow: "auto", py: 0 }}>
        {items.map((message: any) => (
          <ListItem key={message.id || message.title} alignItems="flex-start" divider>
            <ListItemIcon>
              <Icon color="info">notifications</Icon>
            </ListItemIcon>
            <ListItemText
              primary={
                <MDTypography variant="button" fontWeight="medium">
                  {message.title || "Aviso"}
                </MDTypography>
              }
              secondary={
                <>
                  <MDTypography variant="caption" color="text">
                    {message.description || message.text || "-"}
                  </MDTypography>
                  <MDTypography variant="caption" color="text" display="block" mt={0.5}>
                    {message.createdAt || message.date || new Date().toLocaleDateString("pt-BR")}
                  </MDTypography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
}

export default MessagesCard;
