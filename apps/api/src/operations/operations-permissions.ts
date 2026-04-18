import { ForbiddenException } from '@nestjs/common';

import type { MembershipRole, RequestAuthContext } from '@einsatzpilot/types';

const jobWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const teamWriteRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const jobReopenRoles: MembershipRole[] = ['OWNER', 'OFFICE'];
const reportCreateRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const attachmentCreateRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];
const companyReadRoles: MembershipRole[] = ['OWNER', 'OFFICE', 'WORKER'];

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
