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
