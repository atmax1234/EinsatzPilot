import { ForbiddenException } from '@nestjs/common';

import type { MembershipRole, RequestAuthContext } from '@einsatzpilot/types';

const jobWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const teamWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const jobReopenRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const reportCreateRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const reportReviewRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const attachmentCreateRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const companyReadRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const masterDataWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const masterDataReadRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const itemWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const itemReadRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const assignmentWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const assignmentReadRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const jobCostWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const jobCostReadRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];

function assertAuthenticatedContext(
  authContext: RequestAuthContext,
): asserts authContext is Extract<RequestAuthContext, { isAuthenticated: true }> {
  if (!authContext.isAuthenticated) {
    throw new ForbiddenException('Authentifizierter Firmenkontext erforderlich.');
  }
}

function assertRoleAllowed(
  authContext: RequestAuthContext,
  allowedRoles: MembershipRole[],
  message: string,
) {
  assertAuthenticatedContext(authContext);

  if (!authContext.membershipRole || !allowedRoles.includes(authContext.membershipRole)) {
    throw new ForbiddenException(message);
  }
}

export function assertCanWriteJobs(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    jobWriteRoles,
    'Nur OWNER oder OFFICE duerfen Auftraege im Admin-Bereich aendern.',
  );
}

export function assertCanWriteTeams(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    teamWriteRoles,
    'Nur OWNER oder OFFICE duerfen Teams im Admin-Bereich aendern.',
  );
}

export function assertCanReopenJobs(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    jobReopenRoles,
    'Nur OWNER oder OFFICE duerfen abgeschlossene Auftraege erneut oeffnen.',
  );
}

export function assertCanCreateJobReports(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    reportCreateRoles,
    'Nur angemeldete Firmenmitglieder duerfen Berichte fuer Auftraege erfassen.',
  );
}

export function assertCanReviewJobReports(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    reportReviewRoles,
    'Nur OWNER oder OFFICE duerfen Berichte pruefen.',
  );
}

export function assertCanUploadJobAttachments(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    attachmentCreateRoles,
    'Nur angemeldete Firmenmitglieder duerfen Dateien oder Fotos zu Auftraegen hochladen.',
  );
}

export function assertCanReadCompanyArtifacts(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    companyReadRoles,
    'Nur angemeldete Firmenmitglieder duerfen Berichte und Dateien der aktiven Firma sehen.',
  );
}

export function assertCanWriteMasterData(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    masterDataWriteRoles,
    'Nur OWNER oder OFFICE duerfen Kunden, Adressen, Objekte und Objektbereiche aendern.',
  );
}

export function assertCanReadMasterData(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    masterDataReadRoles,
    'Nur aktive Firmenmitglieder duerfen Kunden, Adressen und Objekte lesen.',
  );
}

export function assertCanWriteItems(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    itemWriteRoles,
    'Nur OWNER oder OFFICE duerfen Kategorien und Artikel aendern.',
  );
}

export function assertCanReadItems(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    itemReadRoles,
    'Nur aktive Firmenmitglieder duerfen Kategorien und Artikel lesen.',
  );
}

export function assertCanWriteAssignments(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    assignmentWriteRoles,
    'Nur OWNER oder OFFICE duerfen Zuweisungen aendern.',
  );
}

export function assertCanReadAssignments(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    assignmentReadRoles,
    'Nur aktive Firmenmitglieder duerfen Zuweisungen lesen.',
  );
}

export function assertCanWriteJobCosts(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    jobCostWriteRoles,
    'Nur OWNER oder OFFICE duerfen Auftragskosten aendern.',
  );
}

export function assertCanReadJobCosts(authContext: RequestAuthContext) {
  assertRoleAllowed(
    authContext,
    jobCostReadRoles,
    'Nur aktive Firmenmitglieder duerfen Auftragskosten lesen.',
  );
}
