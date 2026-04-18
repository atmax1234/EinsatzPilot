export type MembershipRole = 'OWNER' | 'OFFICE' | 'WORKER';

export type AuthSource = 'anonymous' | 'access-token' | 'dev-headers';

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName?: string;
};

export type ActiveCompanyContext = {
  id: string;
  slug: string;
  name?: string;
};

export type RequestAuthContext =
  | {
      isAuthenticated: false;
      source: 'anonymous';
    }
  | {
      isAuthenticated: true;
      source: 'access-token' | 'dev-headers';
      user: AuthenticatedUser;
      company?: ActiveCompanyContext;
      membershipRole?: MembershipRole;
    };

export type AuthenticatedSession = {
  authenticated: true;
  user: AuthenticatedUser;
  membershipRole?: MembershipRole;
  activeCompany?: ActiveCompanyContext;
  source: 'access-token' | 'dev-headers';
};

export type AnonymousSession = {
  authenticated: false;
  source: 'anonymous';
};

export type SessionResponse = AuthenticatedSession | AnonymousSession;

export type DevelopmentLoginRequest = {
  email?: string;
  displayName?: string;
  companySlug?: string;
  companyName?: string;
  membershipRole?: MembershipRole;
};

export type DevelopmentLoginResponse = {
  token: string;
  session: AuthenticatedSession;
};

export type TeamStatus = 'ACTIVE' | 'INACTIVE';

export type JobStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type JobEditableStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
export type AttachmentKind = 'PHOTO' | 'FILE';
export type ReportReviewStatus = 'SUBMITTED';

export type TeamMemberSummary = {
  id: string;
  name: string;
  email: string;
  roleLabel?: string;
};

export type TeamListItem = {
  id: string;
  name: string;
  code?: string;
  specialty?: string;
  status: TeamStatus;
  currentAssignment?: string;
  memberCount: number;
  members: TeamMemberSummary[];
};

export type TeamListResponse = {
  teams: TeamListItem[];
};

export type CompanyMemberItem = {
  id: string;
  name: string;
  email: string;
  membershipRole: MembershipRole;
};

export type CompanyMemberListResponse = {
  members: CompanyMemberItem[];
};

export type JobListItem = {
  id: string;
  reference: string;
  title: string;
  customerName: string;
  location: string;
  scheduledStart: string;
  scheduledEnd?: string;
  status: JobStatus;
  priority: JobPriority;
  assignedTeam?: {
    id: string;
    name: string;
  };
};

export type JobListResponse = {
  jobs: JobListItem[];
};

export type JobActivityItem = {
  id: string;
  kind: 'STATUS' | 'NOTE' | 'REPORT';
  title: string;
  content?: string;
  createdAt: string;
  authorName?: string;
};

export type JobReportItem = {
  id: string;
  summary: string;
  details?: string;
  reviewStatus: ReportReviewStatus;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type JobAttachmentItem = {
  id: string;
  kind: AttachmentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  storagePath: string;
  fileUrl: string;
  caption?: string;
  job: {
    id: string;
    reference: string;
    title: string;
  };
  report?: {
    id: string;
    summary: string;
  };
  team?: {
    id: string;
    name: string;
  };
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type JobDetailResponse = {
  job: JobListItem & {
    description?: string;
    assignedTeamMembers: TeamMemberSummary[];
    activity: JobActivityItem[];
    reports?: JobReportItem[];
    attachments?: JobAttachmentItem[];
  };
};

export type DashboardResponse = {
  summary: {
    totalJobs: number;
    scheduledJobs: number;
    inProgressJobs: number;
    completedJobs: number;
    activeTeams: number;
  };
  highlightedJobs: JobListItem[];
  teams: TeamListItem[];
};

export type JobCreateInput = {
  title: string;
  description?: string;
  customerName: string;
  location: string;
  scheduledStart: string;
  scheduledEnd?: string;
  priority: JobPriority;
  teamId?: string;
};

export type JobUpdateInput = {
  title?: string;
  description?: string;
  customerName?: string;
  location?: string;
  scheduledStart?: string;
  scheduledEnd?: string | null;
  priority?: JobPriority;
  teamId?: string | null;
};

export type JobStatusTransitionInput = {
  status: JobEditableStatus;
};

export type JobReportCreateInput = {
  summary: string;
  details?: string;
  teamId?: string;
};

export type JobReportListResponse = {
  reports: JobReportItem[];
};

export type JobAttachmentListResponse = {
  attachments: JobAttachmentItem[];
};

export type PhotoLibraryResponse = {
  attachments: JobAttachmentItem[];
};

export type TeamCreateInput = {
  name: string;
  code?: string;
  specialty?: string;
  status?: TeamStatus;
  currentAssignment?: string;
};

export type TeamUpdateInput = {
  name?: string;
  code?: string | null;
  specialty?: string | null;
  status?: TeamStatus;
  currentAssignment?: string | null;
};

export type TeamMemberAddInput = {
  userId: string;
  roleLabel?: string;
};

export type TeamMemberRemoveInput = {
  userId: string;
};
