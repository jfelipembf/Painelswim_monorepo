import React from "react";
import { ROLE_LABELS, STATUS_LABELS } from "../../../constants";

const renderName = (user) => `${user.firstName || ""} ${user.lastName || ""}`.trim();

export const USERS_TABLE_COLUMNS = [
  {
    key: "photoUrl",
    label: "Foto",
    render: (item) => (
      item.photoUrl ? (
        <img
          src={item.photoUrl}
          alt=""
          style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: "#e9ecef",
          }}
        />
      )
    ),
  },
  {
    key: "fullName",
    label: "Nome",
    render: (item) => renderName(item) || "—",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "phone",
    label: "Telefone",
  },
  {
    key: "role",
    label: "Cargo",
    render: (item) => ROLE_LABELS[item.role] || item.role || "—",
  },
  {
    key: "status",
    label: "Status",
    render: (item) => STATUS_LABELS[item.status] || item.status || "—",
  },
  {
    key: "actions",
    label: "",
    render: (item, _index, onAction) => (
      <div className="text-end">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onAction?.("view", item)}
        >
          Ver
        </button>
      </div>
    ),
  },
];
