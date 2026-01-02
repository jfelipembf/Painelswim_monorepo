export type StudentRow = {
  id: string;
  name: string;
  photoUrl?: string | null;
  isSuspended?: boolean;
  membershipStatus?: string;
};

export type AttendanceDraft = {
  present: boolean;
  justification: string;
};

export type ScheduleEnrollmentsDialogProps = {
  open: boolean;
  onClose: () => void;
  schedule: any;
  initialStudents?: any[];
};
