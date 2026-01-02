import React from "react";

export const TENANTS_TABLE_COLUMNS = [
  {
    key: "logoUrl",
    label: "Logo",
    render: (item) => {
      const fallback =
        "https://ui-avatars.com/api/?background=556ee6&color=fff&name=" +
        encodeURIComponent(item.name || "Academia");
      const src = item.logoUrl || item.branding?.logoUrl || fallback;
      
      return (
        <img
          src={src}
          alt={item.name || "Academia"}
          style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }}
        />
      );
    },
  },
  {
    key: "name",
    label: "Nome",
  },
  {
    key: "slug",
    label: "Slug",
  },
  {
    key: "status",
    label: "Status",
    render: (item) => {
      const statusLabels = {
        active: "Ativo",
        inactive: "Inativo",
        trial: "Trial",
        suspended: "Suspenso",
      };
      return statusLabels[item.status] || item.status || "—";
    },
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
