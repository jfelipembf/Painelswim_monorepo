import { useMemo } from "react";

import DataTable from "examples/Tables/DataTable";

import PhotoCell from "layouts/pages/admin/activity/components/PhotoCell";
import ColorCell from "layouts/pages/admin/activity/components/ColorCell";
import StatusCell from "layouts/pages/admin/activity/components/StatusCell";
import ActionCell from "layouts/pages/admin/activity/components/ActionCell";

import type { Activity } from "hooks/activities";

import { ACTIVITY_TABLE_ENTRIES, ACTIVITY_TABLE_LABELS } from "../../constants";

type Props = {
  activities: Activity[];
  onDelete: (activity: Activity) => void;
};

function ActivityTable({ activities, onDelete }: Props): JSX.Element {
  const columns = useMemo(
    () => [
      {
        Header: "foto",
        accessor: "photo",
        width: "10%",
        Cell: ({ value }: any) => <PhotoCell image={value.image} alt={value.alt} />,
      },
      {
        Header: "nome",
        accessor: "name",
      },
      {
        Header: "cor",
        accessor: "color",
        Cell: ({ value }: any) => <ColorCell color={value} />,
      },
      {
        Header: "status",
        accessor: "status",
        Cell: ({ value }: any) => <StatusCell status={value} />,
      },
      {
        Header: "ações",
        accessor: "actions",
        width: "10%",
        Cell: ({ row }: any) => <ActionCell activity={row.original.raw} onDelete={onDelete} />,
      },
    ],
    [onDelete]
  );

  const rows = useMemo(
    () =>
      activities.map((activity) => ({
        photo: {
          image: activity.photoUrl,
          alt: activity.name,
        },
        name: activity.name,
        color: activity.color,
        status: activity.status,
        actions: "ver",
        raw: activity,
      })),
    [activities]
  );

  return (
    <DataTable
      table={{ columns, rows }}
      entriesPerPage={{ defaultValue: 10, entries: ACTIVITY_TABLE_ENTRIES }}
      showTotalEntries
      canSearch
      labels={ACTIVITY_TABLE_LABELS}
    />
  );
}

export default ActivityTable;
