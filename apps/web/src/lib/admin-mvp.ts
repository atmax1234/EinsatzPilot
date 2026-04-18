import type { AuthenticatedSession, MembershipRole } from '@einsatzpilot/types';

type StatusTone = 'neutral' | 'warn' | 'accent';

export type StatCard = {
  label: string;
  value: string;
  note: string;
  tone?: StatusTone;
};

export type ActionCard = {
  title: string;
  description: string;
  status: string;
};

const adminLabels: Record<MembershipRole, string> = {
  OWNER: 'Inhaberzugang',
  OFFICE: 'Buero und Disposition',
  WORKER: 'Mitarbeiterzugang',
};

export function getMembershipRoleLabel(role: MembershipRole | undefined) {
  if (!role) {
    return 'Noch nicht zugeordnet';
  }

  return adminLabels[role];
}

export function getDashboardStats(session: AuthenticatedSession): StatCard[] {
  const companyLabel = session.activeCompany?.name ?? session.activeCompany?.slug ?? 'Ihre Firma';
  const hasCompany = Boolean(session.activeCompany?.slug);

  return [
    {
      label: 'Firmenkontext',
      value: hasCompany ? 'Bereit' : 'Offen',
      note: hasCompany
        ? `${companyLabel} wird tenant-sicher im Admin-Bereich aufgeloest.`
        : 'Die Session braucht noch einen aktiven Firmenkontext.',
      tone: hasCompany ? 'accent' : 'warn',
    },
    {
      label: 'Zugangsrolle',
      value: session.membershipRole ?? 'Unbekannt',
      note: `${getMembershipRoleLabel(session.membershipRole)} ist fuer die ersten Admin-Flows aktiv.`,
    },
    {
      label: 'Sessionquelle',
      value: session.source,
      note: 'Die Web-App arbeitet bereits ueber die echte API-Session statt ueber lokale Mock-Daten.',
    },
  ];
}

export function getDashboardActions(session: AuthenticatedSession): ActionCard[] {
  const companyLabel = session.activeCompany?.name ?? 'Ihre Firma';

  return [
    {
      title: 'Dashboard scharf stellen',
      description: `Naechster sinnvoller Schritt fuer ${companyLabel}: echte Kennzahlen fuer Jobs, Reviewbedarf und Aktivitaeten anbinden.`,
      status: 'Als naechster API-Vertrag vorbereiten',
    },
    {
      title: 'Auftragsbereich ausbauen',
      description: 'Die Route steht jetzt als echte Arbeitsflaeche mit leeren Zustanden und klarer Struktur fuer Listen, Filter und Detailansicht.',
      status: 'Bereit fuer Job-Modell',
    },
    {
      title: 'Teamsteuerung vorbereiten',
      description: 'Die Teamseite kann als naechstes Mitglieder, Rollen und Zuordnungen aus tenant-sicheren Endpunkten laden.',
      status: 'Bereit fuer Team-Modell',
    },
  ];
}

export function getJobsStats(): StatCard[] {
  return [
    {
      label: 'Listenstatus',
      value: '0 live',
      note: 'Noch keine Job-Daten angebunden. Die Route ist jetzt als echte Uebersichtsseite vorbereitet.',
      tone: 'warn',
    },
    {
      label: 'Disposition',
      value: 'Bereit',
      note: 'Filter, Kennzahlen und leere Zustande koennen auf das kommende Job-Modell aufgesetzt werden.',
      tone: 'accent',
    },
    {
      label: 'Review',
      value: 'Offen',
      note: 'Reports, Fotos und Statushistorie folgen, sobald die Kernentitaeten vorhanden sind.',
    },
  ];
}

export function getTeamsStats(role: MembershipRole | undefined): StatCard[] {
  return [
    {
      label: 'Teamverwaltung',
      value: 'Vorbereitet',
      note: 'Die Route ist als Admin-Arbeitsflaeche fuer Teams, Mitglieder und Verantwortlichkeiten angelegt.',
      tone: 'accent',
    },
    {
      label: 'Rollenblick',
      value: role ?? 'Unbekannt',
      note: `${getMembershipRoleLabel(role)} ist bereits Teil des tenant-sicheren Sessionmodells.`,
    },
    {
      label: 'Zuordnungen',
      value: 'Offen',
      note: 'Teamstruktur, Mitgliedschaften und Einsatzzuweisungen sind der naechste Datenvertrag.',
      tone: 'warn',
    },
  ];
}

export function getStatusTone(status: 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED') {
  if (status === 'DONE') {
    return 'done';
  }

  if (status === 'IN_PROGRESS') {
    return 'accent';
  }

  if (status === 'CANCELED') {
    return 'warn';
  }

  return 'neutral';
}
