import type { MembershipRole } from '@einsatzpilot/types';

type StatusTone = 'neutral' | 'warn' | 'accent';

export type StatCard = {
  label: string;
  value: string;
  note: string;
  tone?: StatusTone;
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
