import {
  addTeamMemberAction,
  createTeamAction,
  removeTeamMemberAction,
  updateTeamAction,
} from '../../../lib/admin-actions';
import { getMembershipRoleLabel, getTeamsStats } from '../../../lib/admin-mvp';
import {
  getCompanyMembersData,
  getTeamsData,
  getTeamStatusLabel,
} from '../../../lib/operations';
import { requireServerSession } from '../../../lib/server-auth';

const teamNoticeLabels: Record<string, string> = {
  'team-created': 'Das Team wurde angelegt.',
  'team-updated': 'Die Teamdaten wurden aktualisiert.',
  'team-member-added': 'Das Teammitglied wurde zugeordnet.',
  'team-member-removed': 'Das Teammitglied wurde entfernt.',
};

export default async function TeamsPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const [session, teamsResult, companyMembersResult, resolvedSearchParams] = await Promise.all([
    requireServerSession(),
    getTeamsData(),
    getCompanyMembersData(),
    searchParams,
  ]);
  const stats = getTeamsStats(session.membershipRole);
  const companyMembers = companyMembersResult.ok && companyMembersResult.data
    ? companyMembersResult.data.members
    : [];
  const flashMessage = resolvedSearchParams?.error
    ? {
        tone: 'error' as const,
        text: resolvedSearchParams.error,
      }
    : resolvedSearchParams?.notice && teamNoticeLabels[resolvedSearchParams.notice]
      ? {
          tone: 'success' as const,
          text: teamNoticeLabels[resolvedSearchParams.notice],
        }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Teams</p>
        <h1>Verantwortung und Besetzung steuerbar machen</h1>
        <p>
          Die Teamseite ist jetzt nicht mehr nur Uebersicht. Teamstammdaten und
          Mitglieder koennen direkt im Admin gepflegt werden, solange der Firmenkontext
          und die Rollenrechte gueltig sind.
        </p>
      </section>

      {flashMessage ? (
        <section className={`panel flash-banner ${flashMessage.tone}`}>
          <strong>{flashMessage.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flashMessage.text}</p>
        </section>
      ) : null}

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className={`panel stat-card ${stat.tone ?? 'neutral'}`} key={stat.label}>
            <p className="eyebrow">{stat.label}</p>
            <h2>{stat.value}</h2>
            <p>{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Aktuelle Rolle</p>
          <h2>{getMembershipRoleLabel(session.membershipRole)}</h2>
          <p>
            Diese Sicht bleibt bewusst office-orientiert. Teamverwaltung ist an den
            aktiven Firmenkontext gekoppelt und laesst keine writes ausserhalb der
            aktuellen Mitgliedschaft zu.
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Neues Team</p>
          <h2>Team fuer die Disposition anlegen</h2>
          <form action={createTeamAction} className="form-stack">
            <div className="form-grid">
              <label className="form-field">
                <span>Name</span>
                <input name="name" placeholder="Zum Beispiel Montage Nord" required />
              </label>

              <label className="form-field">
                <span>Code</span>
                <input name="code" placeholder="Optionaler Kurzcode" />
              </label>

              <label className="form-field">
                <span>Spezialisierung</span>
                <input name="specialty" placeholder="Fenster, Service, Wartung ..." />
              </label>

              <label className="form-field">
                <span>Status</span>
                <select defaultValue="ACTIVE" name="status">
                  <option value="ACTIVE">Aktiv</option>
                  <option value="INACTIVE">Inaktiv</option>
                </select>
              </label>

              <label className="form-field full-span">
                <span>Aktuelle Zuweisung</span>
                <input
                  name="currentAssignment"
                  placeholder="Optionaler Hinweis, woran das Team gerade arbeitet"
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                Team anlegen
              </button>
            </div>
          </form>
        </article>
      </section>

      {!companyMembersResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Firmenmitglieder fehlen</strong>
          <p>
            Die Liste der aktiven Firmenmitglieder konnte nicht geladen werden.
            Teamstammdaten bleiben bearbeitbar, aber neue Mitglieder koennen gerade
            nicht zugewiesen werden.
          </p>
        </section>
      ) : null}

      <section className="team-grid">
        {teamsResult.ok && teamsResult.data ? (
          teamsResult.data.teams.map((team) => {
            const availableMembers = companyMembers.filter(
              (member) => !team.members.some((existingMember) => existingMember.id === member.id),
            );

            return (
              <article className="panel team-panel" id={`team-${team.id}`} key={team.id}>
                <div className="row-spread">
                  <div>
                    <p className="eyebrow">Team</p>
                    <h2>{team.name}</h2>
                  </div>
                  <span className="inline-chip">{getTeamStatusLabel(team.status)}</span>
                </div>

                <form action={updateTeamAction.bind(null, team.id)} className="form-stack">
                  <div className="form-grid">
                    <label className="form-field">
                      <span>Name</span>
                      <input defaultValue={team.name} name="name" required />
                    </label>

                    <label className="form-field">
                      <span>Code</span>
                      <input defaultValue={team.code ?? ''} name="code" />
                    </label>

                    <label className="form-field">
                      <span>Spezialisierung</span>
                      <input defaultValue={team.specialty ?? ''} name="specialty" />
                    </label>

                    <label className="form-field">
                      <span>Status</span>
                      <select defaultValue={team.status} name="status">
                        <option value="ACTIVE">Aktiv</option>
                        <option value="INACTIVE">Inaktiv</option>
                      </select>
                    </label>

                    <label className="form-field full-span">
                      <span>Aktuelle Zuweisung</span>
                      <input defaultValue={team.currentAssignment ?? ''} name="currentAssignment" />
                    </label>
                  </div>

                  <div className="form-actions">
                    <button className="secondary-button" type="submit">
                      Team speichern
                    </button>
                  </div>
                </form>

                <div className="team-member-shell">
                  <div>
                    <p className="eyebrow">Mitglieder</p>
                    <h2>Besetzung</h2>
                  </div>

                  {team.members.length > 0 ? (
                    <div className="stack-list">
                      {team.members.map((member) => (
                        <div className="member-row" key={member.id}>
                          <div className="member-meta">
                            <strong>{member.name}</strong>
                            <span>{member.email}</span>
                            <span>{member.roleLabel ?? 'Ohne Rollenlabel im Team'}</span>
                          </div>
                          <form action={removeTeamMemberAction.bind(null, team.id, member.id)}>
                            <button className="danger-button" type="submit">
                              Entfernen
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Diesem Team ist aktuell noch niemand zugeordnet.</p>
                  )}
                </div>

                <div className="team-member-shell">
                  <div>
                    <p className="eyebrow">Mitglied hinzufuegen</p>
                    <h2>Aktive Firmenmitglieder zuweisen</h2>
                  </div>

                  {availableMembers.length > 0 ? (
                    <form action={addTeamMemberAction.bind(null, team.id)} className="form-stack">
                      <div className="form-grid">
                        <label className="form-field">
                          <span>Benutzer</span>
                          <select defaultValue={availableMembers[0]?.id ?? ''} name="userId">
                            {availableMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name} · {getMembershipRoleLabel(member.membershipRole)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="form-field">
                          <span>Rollenlabel im Team</span>
                          <input name="roleLabel" placeholder="Zum Beispiel Vorarbeiter" />
                        </label>
                      </div>

                      <div className="form-actions">
                        <button className="secondary-button" type="submit">
                          Mitglied hinzufuegen
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p>Alle aktiven Firmenmitglieder sind diesem Team bereits zugewiesen.</p>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel">
            <p>
              Die Teamuebersicht konnte nicht geladen werden.
              <strong> {teamsResult.error ?? 'Kein API-Ergebnis vorhanden.'}</strong>
            </p>
          </article>
        )}
      </section>
    </main>
  );
}
