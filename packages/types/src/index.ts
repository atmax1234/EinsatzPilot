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
export type JobReportType =
  | 'GENERAL'
  | 'WORKER_FINDING'
  | 'WORK_COMPLETION'
  | 'INCIDENT_REPORT'
  | 'FOLLOW_UP_REQUEST';
export type ReportReviewStatus =
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'NEEDS_REVISION'
  | 'REJECTED';
export type ReportReviewDecisionStatus = 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';
export type CustomerType = 'PRIVATE' | 'BUSINESS' | 'PROPERTY_MANAGEMENT' | 'OTHER';
export type ObjectType =
  | 'BUILDING'
  | 'GARDEN'
  | 'WAREHOUSE'
  | 'CONSTRUCTION_SITE'
  | 'OFFICE'
  | 'FACILITY'
  | 'OTHER';
export type ObjectStatus = 'ACTIVE' | 'INACTIVE';
export type ObjectAreaType =
  | 'STAIRCASE'
  | 'BASEMENT'
  | 'ENTRANCE'
  | 'PARKING'
  | 'GARDEN_AREA'
  | 'ROOM'
  | 'STORAGE_AREA'
  | 'OTHER';
export type ItemKind =
  | 'MATERIAL'
  | 'TOOL'
  | 'ASSET'
  | 'CONSUMABLE'
  | 'PACKAGE'
  | 'OTHER';
export type ItemUnit =
  | 'PIECE'
  | 'KG'
  | 'LITER'
  | 'METER'
  | 'SQUARE_METER'
  | 'CUBIC_METER'
  | 'PALLET'
  | 'BOX'
  | 'BAG'
  | 'OTHER';
export type ItemTrackingMode = 'QUANTITY' | 'SERIALIZED';
export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'DAMAGED' | 'LOST' | 'ARCHIVED';
export type JobCostKind =
  | 'MATERIAL_PURCHASE'
  | 'MATERIAL_USED'
  | 'LABOR'
  | 'TRAVEL'
  | 'EXTERNAL_SERVICE'
  | 'FEE'
  | 'OTHER';
export type JobCostUnit =
  | 'PIECE'
  | 'HOUR'
  | 'KILOMETER'
  | 'KG'
  | 'LITER'
  | 'METER'
  | 'SQUARE_METER'
  | 'CUBIC_METER'
  | 'FLAT_RATE'
  | 'OTHER';
export type AssignmentEntityType =
  | 'USER'
  | 'TEAM'
  | 'JOB'
  | 'CUSTOMER'
  | 'ADDRESS'
  | 'OBJECT'
  | 'OBJECT_AREA'
  | 'ITEM';
export type AssignmentKind =
  | 'RESPONSIBLE'
  | 'SCHEDULED'
  | 'ALLOCATED'
  | 'RESERVED'
  | 'SUPPORTING'
  | 'OTHER';
export type AssignmentStatus = 'ACTIVE' | 'PLANNED' | 'ENDED' | 'CANCELED';
export type CustomerReportType =
  | 'JOB_COMPLETION'
  | 'INCIDENT'
  | 'DAMAGE_REPORT'
  | 'MAINTENANCE'
  | 'OBJECT_STATUS'
  | 'COST_OVERVIEW'
  | 'OTHER';
export type CustomerReportStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'ARCHIVED';
export type WorkdaySheetStatus = 'DRAFT' | 'SENT' | 'SUBMITTED' | 'REVIEWED' | 'ARCHIVED';
export type ServiceAgreementStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type RecurringDutyCadenceUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

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

export type JobCustomerRelation = {
  id: string;
  name: string;
};

export type JobAddressRelation = {
  id: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

export type JobObjectRelation = {
  id: string;
  name: string;
};

export type JobObjectAreaRelation = {
  id: string;
  objectId: string;
  name: string;
};

export type JobRelationOptionsResponse = {
  customers: JobCustomerRelation[];
  addresses: JobAddressRelation[];
  objects: JobObjectRelation[];
  objectAreas: JobObjectAreaRelation[];
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
  customerId?: string;
  addressId?: string;
  objectId?: string;
  objectAreaId?: string;
  customer?: JobCustomerRelation;
  address?: JobAddressRelation;
  object?: JobObjectRelation;
  objectArea?: JobObjectAreaRelation;
  assignedTeam?: {
    id: string;
    name: string;
  };
};

export type JobListResponse = {
  jobs: JobListItem[];
};

export type WorkdaySheetActorSummary = {
  id: string;
  name: string;
  email: string;
};

export type WorkdaySheetTeamSummary = {
  id: string;
  name: string;
};

export type WorkdaySheetJobRelation = {
  id: string;
  reference: string;
  title: string;
};

export type WorksheetReviewActionType =
  | 'CREATE_FOLLOW_UP_JOB'
  | 'CREATE_JOB_COST_LINE'
  | 'CREATE_JOB_REPORT';

export type WorksheetReviewActionStatus = 'COMPLETED';

export type WorksheetReviewActionSourceSnapshotV1 = {
  schemaVersion: 1;
  capturedAt: string;
  sheet: {
    id: string;
    date: string;
    title?: string;
    status: 'REVIEWED';
    team?: WorkdaySheetTeamSummary;
    worker?: WorkdaySheetActorSummary;
  };
  row: {
    id: string;
    position: number;
    startTime?: string;
    endTime?: string;
    plannedText: string;
    actualText?: string;
    notes?: string;
    customer?: JobCustomerRelation;
    address?: JobAddressRelation;
    object?: JobObjectRelation;
    objectArea?: JobObjectAreaRelation;
    job?: WorkdaySheetJobRelation;
  };
};

export type WorksheetReviewActionItem = {
  id: string;
  sourceSheetId: string;
  sourceRowId: string;
  type: WorksheetReviewActionType;
  status: WorksheetReviewActionStatus;
  sourceSnapshot: WorksheetReviewActionSourceSnapshotV1;
  destinationJob: WorkdaySheetJobRelation;
  destinationCostLine?: JobCostLineItem;
  destinationReport?: JobReportItem;
  createdBy: WorkdaySheetActorSummary;
  completedAt: string;
  createdAt: string;
};

export type WorkdaySheetRowItem = {
  id: string;
  position: number;
  startTime?: string;
  endTime?: string;
  plannedText: string;
  actualText?: string;
  notes?: string;
  customerId?: string;
  addressId?: string;
  objectId?: string;
  objectAreaId?: string;
  jobId?: string;
  customer?: JobCustomerRelation;
  address?: JobAddressRelation;
  object?: JobObjectRelation;
  objectArea?: JobObjectAreaRelation;
  job?: WorkdaySheetJobRelation;
  reviewActions: WorksheetReviewActionItem[];
  createdAt: string;
  updatedAt: string;
};

export type WorkdaySheetListItem = {
  id: string;
  date: string;
  title?: string;
  status: WorkdaySheetStatus;
  teamId?: string;
  workerUserId?: string;
  team?: WorkdaySheetTeamSummary;
  worker?: WorkdaySheetActorSummary;
  rowCount: number;
  completedRowCount: number;
  createdBy: WorkdaySheetActorSummary;
  sentBy?: WorkdaySheetActorSummary;
  submittedBy?: WorkdaySheetActorSummary;
  reviewedBy?: WorkdaySheetActorSummary;
  archivedBy?: WorkdaySheetActorSummary;
  sentAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkdaySheetDetail = WorkdaySheetListItem & {
  internalNotes?: string;
  reviewNotes?: string;
  rows: WorkdaySheetRowItem[];
};

export type WorkdaySheetListResponse = {
  workdaySheets: WorkdaySheetListItem[];
};

export type WorkdaySheetListFilters = {
  date?: string;
  status?: WorkdaySheetStatus;
  teamId?: string;
  workerUserId?: string;
};

export type WorkdaySheetDetailResponse = {
  workdaySheet: WorkdaySheetDetail;
};

export type WorkdaySheetTodayResponse = {
  date: string;
  workdaySheets: WorkdaySheetDetail[];
};

export type WorkdaySheetRowCreateInput = {
  startTime?: string;
  endTime?: string;
  plannedText: string;
  notes?: string;
  customerId?: string;
  addressId?: string;
  objectId?: string;
  objectAreaId?: string;
  jobId?: string;
};

export type WorkdaySheetCreateInput = {
  date: string;
  title?: string;
  teamId?: string;
  workerUserId?: string;
  internalNotes?: string;
  rows: WorkdaySheetRowCreateInput[];
};

export type WorkdaySheetUpdateInput = {
  date?: string;
  title?: string | null;
  teamId?: string | null;
  workerUserId?: string | null;
  internalNotes?: string | null;
};

export type WorkdaySheetRowPlannedUpdateInput = {
  startTime?: string | null;
  endTime?: string | null;
  plannedText?: string;
  notes?: string | null;
  customerId?: string | null;
  addressId?: string | null;
  objectId?: string | null;
  objectAreaId?: string | null;
  jobId?: string | null;
};

export type WorkdaySheetRowActualUpdateInput = {
  actualText: string | null;
};

export type WorkdaySheetRowUpdateInput =
  | WorkdaySheetRowPlannedUpdateInput
  | WorkdaySheetRowActualUpdateInput;

export type WorkdaySheetStatusUpdateInput = {
  status: Exclude<WorkdaySheetStatus, 'DRAFT'>;
  reviewNotes?: string;
};

export type WorkdaySheetOptionsResponse = {
  teams: Array<WorkdaySheetTeamSummary & { memberCount: number }>;
  workers: WorkdaySheetActorSummary[];
  customers: JobCustomerRelation[];
  addresses: JobAddressRelation[];
  objects: JobObjectRelation[];
  objectAreas: JobObjectAreaRelation[];
  jobs: WorkdaySheetJobRelation[];
  items: Array<{
    id: string;
    customId: string;
    name: string;
  }>;
};

export type WorksheetFollowUpJobCreateInput = {
  title: string;
  description?: string;
  customerName: string;
  location: string;
  scheduledStart: string;
  scheduledEnd?: string;
  priority: JobPriority;
  teamId?: string | null;
  customerId?: string | null;
  addressId?: string | null;
  objectId?: string | null;
  objectAreaId?: string | null;
};

export type WorksheetFollowUpJobCreateResponse = {
  reviewAction: WorksheetReviewActionItem;
  job: JobListItem;
  replayed: boolean;
};

export type WorksheetJobCostLineCreateInput = {
  targetJobId: string;
  costLine: JobCostCreateInput;
};

export type WorksheetJobCostLineCreateResponse = {
  reviewAction: WorksheetReviewActionItem;
  costLine: JobCostLineItem;
  replayed: boolean;
};

export type WorksheetStructuredJobReportType = Exclude<JobReportType, 'GENERAL'>;

export type WorksheetJobReportCreateInput = {
  targetJobId: string;
  report: Omit<JobReportCreateInput, 'type'> & {
    type: WorksheetStructuredJobReportType;
  };
};

export type WorksheetJobReportCreateResponse = {
  reviewAction: WorksheetReviewActionItem;
  report: JobReportItem;
  replayed: boolean;
};

export type RecurringObjectDutyCreateInput = {
  plannedText: string;
  notes?: string;
  cadenceUnit: RecurringDutyCadenceUnit;
  cadenceInterval: number;
  firstDueDate: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
};

export type RecurringObjectDutyUpdateInput = {
  plannedText?: string;
  notes?: string | null;
  cadenceUnit?: RecurringDutyCadenceUnit;
  cadenceInterval?: number;
  firstDueDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  isActive?: boolean;
};

export type ServiceAgreementCreateInput = {
  title: string;
  description?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  timezone: string;
  customerId?: string;
  addressId?: string;
  objectId?: string;
  objectAreaId?: string;
  internalNotes?: string;
  duties: RecurringObjectDutyCreateInput[];
};

export type ServiceAgreementUpdateInput = {
  title?: string;
  description?: string | null;
  effectiveFrom?: string;
  effectiveUntil?: string | null;
  timezone?: string;
  customerId?: string | null;
  addressId?: string | null;
  objectId?: string | null;
  objectAreaId?: string | null;
  internalNotes?: string | null;
};

export type ServiceAgreementStatusUpdateInput = {
  status: Exclude<ServiceAgreementStatus, 'DRAFT'>;
};

export type ServiceAgreementListFilters = {
  status?: ServiceAgreementStatus;
  customerId?: string;
  objectId?: string;
};

export type RecurringObjectDutyItem = {
  id: string;
  position: number;
  plannedText: string;
  notes?: string;
  cadenceUnit: RecurringDutyCadenceUnit;
  cadenceInterval: number;
  firstDueDate: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdBy: WorkdaySheetActorSummary;
  updatedBy: WorkdaySheetActorSummary;
  createdAt: string;
  updatedAt: string;
};

export type ServiceAgreementListItem = {
  id: string;
  title: string;
  status: ServiceAgreementStatus;
  effectiveFrom: string;
  effectiveUntil?: string;
  timezone: string;
  customerId?: string;
  addressId?: string;
  objectId?: string;
  objectAreaId?: string;
  customer?: JobCustomerRelation;
  address?: JobAddressRelation;
  object?: JobObjectRelation;
  objectArea?: JobObjectAreaRelation;
  dutyCount: number;
  activeDutyCount: number;
  createdBy: WorkdaySheetActorSummary;
  updatedBy: WorkdaySheetActorSummary;
  activatedBy?: WorkdaySheetActorSummary;
  deactivatedBy?: WorkdaySheetActorSummary;
  archivedBy?: WorkdaySheetActorSummary;
  activatedAt?: string;
  deactivatedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceAgreementDetail = ServiceAgreementListItem & {
  description?: string;
  internalNotes?: string;
  duties: RecurringObjectDutyItem[];
};

export type ServiceAgreementListResponse = {
  serviceAgreements: ServiceAgreementListItem[];
};

export type ServiceAgreementDetailResponse = {
  serviceAgreement: ServiceAgreementDetail;
};

export type ServiceAgreementOptionsResponse = JobRelationOptionsResponse;

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
  type: JobReportType;
  summary: string;
  details?: string;
  findingSummary?: string;
  workPerformed?: string;
  workStillNeeded?: string;
  followUpRequired: boolean;
  followUpNotes?: string;
  reviewStatus: ReportReviewStatus;
  reviewNotes?: string;
  reviewedAt?: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  attachments: Array<{
    id: string;
    kind: AttachmentKind;
    fileName: string;
    caption?: string;
    uploadedAt: string;
  }>;
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

export type DashboardAudience = 'OFFICE' | 'WORKER';
export type DashboardDataScope = 'COMPANY' | 'ASSIGNED_TO_ME';

export type DashboardJobStatusCounts = {
  total: number;
  planned: number;
  inProgress: number;
  done: number;
  canceled: number;
};

export type DashboardWorkdaySheetStatusCounts = {
  total: number;
  draft: number;
  sent: number;
  submitted: number;
  reviewed: number;
  archived: number;
};

export type DashboardCurrencyTotal = {
  currency: string;
  amount: number;
};

export type DashboardFollowUpActivityItem = {
  id: string;
  type: WorksheetReviewActionType;
  completedAt: string;
  sourceSheet: {
    id: string;
    date: string;
    title?: string;
  };
  sourceRow: {
    id: string;
    position: number;
    plannedText: string;
    actualText?: string;
  };
  destinationJob: WorkdaySheetJobRelation;
  createdBy: WorkdaySheetActorSummary;
};

export type DashboardOfficeOverview = {
  reviewQueue: {
    jobReportsAwaitingReview: number;
    submittedWorkdaySheetsAwaitingReview: number;
  };
  workforce: {
    activeTeams: number;
    activeAssignments: number;
  };
  activeServiceAgreementDefinitions: number;
  currentMonthCosts: {
    periodStart: string;
    periodEndExclusive: string;
    timeZone: 'UTC';
    totals: DashboardCurrencyTotal[];
  };
  recentFollowUpActivity: DashboardFollowUpActivityItem[];
};

export type DashboardResponse = {
  generatedAt: string;
  audience: DashboardAudience;
  today: {
    date: string;
    scope: DashboardDataScope;
    counts: DashboardWorkdaySheetStatusCounts;
    totalRows: number;
    completedRows: number;
    workdaySheets: WorkdaySheetListItem[];
  };
  jobs: {
    scope: DashboardDataScope;
    counts: DashboardJobStatusCounts;
    actionableJobs: JobListItem[];
  };
  office?: DashboardOfficeOverview;
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
  customerId?: string;
  addressId?: string;
  objectId?: string;
  objectAreaId?: string;
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
  customerId?: string | null;
  addressId?: string | null;
  objectId?: string | null;
  objectAreaId?: string | null;
};

export type JobStatusTransitionInput = {
  status: JobEditableStatus;
};

export type JobReportCreateInput = {
  summary: string;
  details?: string;
  teamId?: string;
  type?: JobReportType;
  findingSummary?: string;
  workPerformed?: string;
  workStillNeeded?: string;
  followUpRequired?: boolean;
  followUpNotes?: string;
};

export type JobReportListResponse = {
  reports: JobReportItem[];
  createdReport?: JobReportItem;
};

export type JobReportReviewInput = {
  reviewStatus: ReportReviewDecisionStatus;
  reviewNotes?: string;
};

export type JobCostLineItem = {
  id: string;
  kind: JobCostKind;
  description: string;
  quantity: number;
  unit: JobCostUnit;
  unitCost?: number;
  totalCost: number;
  currency: string;
  taxRate?: number;
  costDate: string;
  vendorName?: string;
  receiptReference?: string;
  notes?: string;
  item?: {
    id: string;
    customId: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type JobCostSummary = {
  materialTotal: number;
  laborTotal: number;
  travelTotal: number;
  externalServiceTotal: number;
  otherTotal: number;
  grandTotal: number;
  currency: string;
  lineCount: number;
};

export type JobCostListResponse = {
  costLines: JobCostLineItem[];
  summary: JobCostSummary;
};

export type JobCostCreateInput = {
  itemId?: string;
  kind: JobCostKind;
  description: string;
  quantity: number;
  unit: JobCostUnit;
  unitCost?: number;
  totalCost?: number;
  currency?: string;
  taxRate?: number;
  costDate?: string;
  vendorName?: string;
  receiptReference?: string;
  notes?: string;
};

export type JobCostUpdateInput = {
  itemId?: string | null;
  kind?: JobCostKind;
  description?: string;
  quantity?: number;
  unit?: JobCostUnit;
  unitCost?: number | null;
  totalCost?: number;
  currency?: string;
  taxRate?: number | null;
  costDate?: string;
  vendorName?: string | null;
  receiptReference?: string | null;
  notes?: string | null;
};

export type CustomerReportActorSummary = {
  id: string;
  name: string;
  email: string;
};

export type CustomerReportJobSourceSnapshot = {
  id: string;
  reference: string;
  title: string;
  description?: string;
  customerName: string;
  location: string;
  scheduledStart: string;
  scheduledEnd?: string;
  status: JobStatus;
  priority: JobPriority;
  updatedAt: string;
};

export type CustomerReportCustomerSourceSnapshot = {
  id: string;
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  updatedAt: string;
};

export type CustomerReportAddressSourceSnapshot = {
  id: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  updatedAt: string;
};

export type CustomerReportObjectSourceSnapshot = {
  id: string;
  name: string;
  type: ObjectType;
  status: ObjectStatus;
  updatedAt: string;
};

export type CustomerReportObjectAreaSourceSnapshot = {
  id: string;
  objectId: string;
  name: string;
  type: ObjectAreaType;
  updatedAt: string;
};

export type CustomerReportJobReportSourceSnapshot = {
  id: string;
  position: number;
  type: JobReportType;
  summary: string;
  details?: string;
  findingSummary?: string;
  workPerformed?: string;
  workStillNeeded?: string;
  followUpRequired: boolean;
  followUpNotes?: string;
  reviewStatus: ReportReviewStatus;
  reviewedAt?: string;
  author?: CustomerReportActorSummary;
  reviewedBy?: CustomerReportActorSummary;
  team?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CustomerReportAttachmentSourceSnapshot = {
  id: string;
  position: number;
  reportId?: string;
  kind: AttachmentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  caption?: string;
  uploadedAt: string;
  updatedAt: string;
};

export type CustomerReportSourceDataV1 = {
  schemaVersion: 1;
  capturedAt: string;
  job: CustomerReportJobSourceSnapshot;
  customer?: CustomerReportCustomerSourceSnapshot;
  address?: CustomerReportAddressSourceSnapshot;
  object?: CustomerReportObjectSourceSnapshot;
  objectArea?: CustomerReportObjectAreaSourceSnapshot;
  selectedJobReportIds: string[];
  selectedAttachmentIds: string[];
  selectedCostLineIds: string[];
  includeFullCostSummary: boolean;
  jobReports: CustomerReportJobReportSourceSnapshot[];
  attachments: CustomerReportAttachmentSourceSnapshot[];
};

export type CustomerReportSourceData = CustomerReportSourceDataV1;

export type CustomerReportCostLineSnapshot = {
  sourceCostLineId: string;
  position: number;
  kind: JobCostKind;
  description: string;
  quantity: number;
  unit: JobCostUnit;
  unitCost?: number;
  totalCost: number;
  currency: string;
  taxRate?: number;
  costDate: string;
  vendorName?: string;
  receiptReference?: string;
  notes?: string;
  item?: {
    id: string;
    customId: string;
    name: string;
  };
  sourceUpdatedAt: string;
};

export type CustomerReportCostBreakdownV1 = {
  schemaVersion: 1;
  capturedAt: string;
  includeFullCostSummary: boolean;
  selectedLineSummary: JobCostSummary;
  selectedLines: CustomerReportCostLineSnapshot[];
  fullJobSummary?: JobCostSummary;
};

export type CustomerReportCostBreakdown = CustomerReportCostBreakdownV1;

export type CustomerReportCreateInput = {
  jobId: string;
  type: CustomerReportType;
  title: string;
  recipientName: string;
  periodStart?: string;
  periodEnd?: string;
  issueSummary?: string;
  findingSummary?: string;
  workPerformedSummary?: string;
  workStillNeededSummary?: string;
  followUpSummary?: string;
  costSummaryText?: string;
  internalNotes?: string;
  selectedJobReportIds?: string[];
  selectedAttachmentIds?: string[];
  selectedCostLineIds?: string[];
  includeFullCostSummary?: boolean;
};

export type CustomerReportUpdateInput = {
  type?: CustomerReportType;
  title?: string;
  recipientName?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  issueSummary?: string | null;
  findingSummary?: string | null;
  workPerformedSummary?: string | null;
  workStillNeededSummary?: string | null;
  followUpSummary?: string | null;
  costSummaryText?: string | null;
  internalNotes?: string | null;
};

export type CustomerReportStatusUpdateInput = {
  status: CustomerReportStatus;
};

export type CustomerReportSnapshotListItem = {
  id: string;
  reportNumber: string;
  jobId?: string;
  customerId?: string;
  addressId?: string;
  objectId?: string;
  objectAreaId?: string;
  type: CustomerReportType;
  status: CustomerReportStatus;
  title: string;
  recipientName: string;
  periodStart?: string;
  periodEnd?: string;
  snapshotCustomerName: string;
  snapshotAddressLabel?: string;
  snapshotAddressText: string;
  snapshotObjectName?: string;
  snapshotObjectAreaName?: string;
  snapshotJobReference: string;
  snapshotJobTitle: string;
  snapshotCostGrandTotal?: number;
  snapshotCostCurrency?: string;
  createdBy: CustomerReportActorSummary;
  approvedBy?: CustomerReportActorSummary;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerReportSnapshotItem = CustomerReportSnapshotListItem & {
  issueSummary?: string;
  findingSummary?: string;
  workPerformedSummary?: string;
  workStillNeededSummary?: string;
  followUpSummary?: string;
  costSummaryText?: string;
  internalNotes?: string;
  snapshotCostBreakdown?: CustomerReportCostBreakdown;
  snapshotSourceData: CustomerReportSourceData;
};

export type CustomerReportListResponse = {
  customerReports: CustomerReportSnapshotListItem[];
};

export type CustomerReportDetailResponse = {
  customerReport: CustomerReportSnapshotItem;
};

export type CustomerReportSourceJobReportOption = JobReportItem & {
  selectable: boolean;
};

export type CustomerReportSourceAttachmentOption = {
  id: string;
  reportId?: string;
  kind: AttachmentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  caption?: string;
  uploadedAt: string;
  selectable: boolean;
};

export type CustomerReportSourceDataResponse = {
  job: CustomerReportJobSourceSnapshot;
  customer?: CustomerReportCustomerSourceSnapshot;
  address?: CustomerReportAddressSourceSnapshot;
  object?: CustomerReportObjectSourceSnapshot;
  objectArea?: CustomerReportObjectAreaSourceSnapshot;
  jobReports: CustomerReportSourceJobReportOption[];
  attachments: CustomerReportSourceAttachmentOption[];
  costLines: JobCostLineItem[];
  costSummary: JobCostSummary;
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

export type CustomerListItem = {
  id: string;
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
  addressCount: number;
  objectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListResponse = {
  customers: CustomerListItem[];
};

export type CustomerCreateInput = {
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
};

export type CustomerUpdateInput = {
  name?: string;
  type?: CustomerType;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type AddressListItem = {
  id: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  notes?: string;
  customer?: {
    id: string;
    name: string;
  };
  objectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AddressListResponse = {
  addresses: AddressListItem[];
};

export type AddressCreateInput = {
  customerId?: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  notes?: string;
};

export type AddressUpdateInput = {
  customerId?: string | null;
  label?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string | null;
};

export type ObjectAreaItem = {
  id: string;
  objectId: string;
  name: string;
  type: ObjectAreaType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ObjectAreaListResponse = {
  areas: ObjectAreaItem[];
};

export type ObjectListItem = {
  id: string;
  name: string;
  type: ObjectType;
  status: ObjectStatus;
  notes?: string;
  customer?: {
    id: string;
    name: string;
  };
  address?: AddressListItem;
  areaCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ObjectListResponse = {
  objects: ObjectListItem[];
};

export type ObjectDetailResponse = {
  object: ObjectListItem & {
    areas: ObjectAreaItem[];
  };
};

export type ObjectCreateInput = {
  customerId?: string;
  addressId?: string;
  name: string;
  type: ObjectType;
  status?: ObjectStatus;
  notes?: string;
};

export type ObjectUpdateInput = {
  customerId?: string | null;
  addressId?: string | null;
  name?: string;
  type?: ObjectType;
  status?: ObjectStatus;
  notes?: string | null;
};

export type ObjectAreaCreateInput = {
  name: string;
  type: ObjectAreaType;
  notes?: string;
};

export type ObjectAreaUpdateInput = {
  name?: string;
  type?: ObjectAreaType;
  notes?: string | null;
};

export type ItemCategoryListItem = {
  id: string;
  name: string;
  description?: string;
  kind: ItemKind;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ItemCategoryListResponse = {
  categories: ItemCategoryListItem[];
};

export type ItemCategoryCreateInput = {
  name: string;
  description?: string;
  kind: ItemKind;
  isActive?: boolean;
};

export type ItemCategoryUpdateInput = {
  name?: string;
  description?: string | null;
  kind?: ItemKind;
  isActive?: boolean;
};

export type ItemCategorySummary = {
  id: string;
  name: string;
  kind: ItemKind;
  isActive: boolean;
};

export type ItemListItem = {
  id: string;
  customId: string;
  name: string;
  description?: string;
  kind: ItemKind;
  unit: ItemUnit;
  trackingMode: ItemTrackingMode;
  quantity: number;
  status: ItemStatus;
  notes?: string;
  category?: ItemCategorySummary;
  createdAt: string;
  updatedAt: string;
};

export type ItemListResponse = {
  items: ItemListItem[];
};

export type ItemDetailResponse = {
  item: ItemListItem;
};

export type ItemCreateInput = {
  categoryId?: string;
  customId?: string;
  name: string;
  description?: string;
  kind: ItemKind;
  unit: ItemUnit;
  trackingMode: ItemTrackingMode;
  quantity?: number;
  status?: ItemStatus;
  notes?: string;
};

export type ItemUpdateInput = {
  categoryId?: string | null;
  customId?: string;
  name?: string;
  description?: string | null;
  kind?: ItemKind;
  unit?: ItemUnit;
  trackingMode?: ItemTrackingMode;
  quantity?: number;
  status?: ItemStatus;
  notes?: string | null;
};

export type AssignmentEntityOption = {
  type: AssignmentEntityType;
  id: string;
  label: string;
  detail?: string;
};

export type AssignmentEntityOptionsResponse = {
  entities: Record<AssignmentEntityType, AssignmentEntityOption[]>;
};

export type AssignmentListItem = {
  id: string;
  sourceType: AssignmentEntityType;
  sourceId: string;
  source: AssignmentEntityOption;
  targetType: AssignmentEntityType;
  targetId: string;
  target: AssignmentEntityOption;
  kind: AssignmentKind;
  status: AssignmentStatus;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type AssignmentListResponse = {
  assignments: AssignmentListItem[];
};

export type AssignmentDetailResponse = {
  assignment: AssignmentListItem;
};

export type AssignmentCreateInput = {
  sourceType: AssignmentEntityType;
  sourceId: string;
  targetType: AssignmentEntityType;
  targetId: string;
  kind: AssignmentKind;
  status?: AssignmentStatus;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
};

export type AssignmentUpdateInput = {
  status?: AssignmentStatus;
  startsAt?: string | null;
  endsAt?: string | null;
  notes?: string | null;
};
