import { redirect } from 'next/navigation';

import { createDevelopmentSession, getServerSession } from '../../lib/server-auth';

export const dynamic = 'force-dynamic';

async function loginAction() {
  'use server';

  const result = await createDevelopmentSession();

  if (!result.ok) {
    redirect('/login?error=1');
  }

  redirect('/dashboard');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  const resolvedSearchParams = await searchParams;
  const hasError = resolvedSearchParams?.error === '1';

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Admin-Zugang</p>
        <h1>EinsatzPilot Web Admin</h1>
        <p className="lead">
          Diese Anmeldung verwendet aktuell noch die Entwicklungs-Basis aus Phase 1.
          Sie legt Benutzer, Firma und Mitgliedschaft bereits in der Datenbank an und
          baut darauf die reale Session-Struktur fuer die Admin-App auf.
        </p>
      </section>

      <section className="session-grid">
        <article className="panel">
          <h2>Was jetzt schon echt ist</h2>
          <ul>
            <li>API-Session mit Token und Prisma-gestuetzter Mitgliedschaft</li>
            <li>Firma- und Rollen-Kontext fuer Admin-Flows</li>
            <li>Geschuetzter Web-Bereich als Grundlage fuer Routing</li>
          </ul>
        </article>

        <article className="panel">
          <h2>Entwicklungs-Login</h2>
          {hasError ? (
            <p>
              Anmeldung fehlgeschlagen.
              <strong> Bitte API und Umgebungswerte pruefen.</strong>
            </p>
          ) : null}
          <form action={loginAction}>
            <button className="primary-button" type="submit">
              Mit Entwicklungs-Session anmelden
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
