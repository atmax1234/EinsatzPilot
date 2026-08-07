import Link from 'next/link';

import {
  getCustomerReportsData,
  getCustomerReportStatusLabel,
  getCustomerReportStatusTone,
  getCustomerReportTypeLabel,
} from '../../../lib/customer-reports';
import { formatDateTime, getJobsData } from '../../../lib/operations';
import { requireServerSession } from '../../../lib/server-auth';

export default async function CustomerReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ jobId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedJobId = resolvedSearchParams?.jobId;
  const [session, customerReportsResult, jobsResult] = await Promise.all([
    requireServerSession(),
    getCustomerReportsData(selectedJobId),
    getJobsData(),
  ]);
  const canCreate =
    session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const customerReports = customerReportsResult.data?.customerReports ?? [];

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Kundenberichte</p>
        <h1>Freigabefaehige Auftragsnachweise</h1>
        <p>
          Kundenberichte kopieren bewusst ausgewaehlte Auftrags-, Berichts-, Nachweis-
          und Kostendaten in einen stabilen Stand. Die Detailansicht ist fuer den sauberen
          Browserdruck vorbereitet; PDF-Export, Versand und Rechnungen sind nicht Teil
          dieses Bereichs.
        </p>
      </section>

      {!customerReportsResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Kundenberichte konnten nicht geladen werden.</strong>
          <p>{customerReportsResult.error ?? 'Die API hat keine gueltige Antwort geliefert.'}</p>
        </section>
      ) : null}

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Filter</p>
          <h2>Berichte nach Auftrag eingrenzen</h2>
          <form className="form-stack" method="get">
            <label className="form-field">
              <span>Auftrag</span>
              <select defaultValue={selectedJobId ?? ''} name="jobId">
                <option value="">Alle Auftraege</option>
                {jobsResult.data?.jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.reference} · {job.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <button className="secondary-button" type="submit">
                Filter anwenden
              </button>
              {selectedJobId ? (
                <Link className="secondary-link" href="/customer-reports">
                  Filter zuruecksetzen
                </Link>
              ) : null}
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Neuer Entwurf</p>
          <h2>Aus einem Auftrag erstellen</h2>
          {canCreate ? (
            selectedJobId ? (
              <>
                <p>
                  Der ausgewaehlte Auftrag liefert die realen, tenant-sicheren Quelldaten
                  fuer den neuen Snapshot.
                </p>
                <div className="action-row">
                  <Link href={`/customer-reports/new?jobId=${selectedJobId}`}>
                    Kundenbericht anlegen
                  </Link>
                  <Link href={`/jobs/${selectedJobId}`}>Auftrag oeffnen</Link>
                </div>
              </>
            ) : (
              <p>Waehle zuerst einen Auftrag im Filter oder starte im jeweiligen Auftragsdetail.</p>
            )
          ) : (
            <p>Nur Owner und Office duerfen Kundenberichte anlegen.</p>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Snapshots</p>
        <h2>{customerReports.length} Kundenbericht(e)</h2>
        {customerReportsResult.ok && customerReports.length > 0 ? (
          <div className="table-shell">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Bericht</th>
                  <th>Art / Status</th>
                  <th>Empfaenger / Kunde</th>
                  <th>Objekt / Adresse</th>
                  <th>Auftrag</th>
                  <th>Erstellt / Freigabe</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {customerReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <Link href={`/customer-reports/${report.id}`}>{report.reportNumber}</Link>
                      <strong>{report.title}</strong>
                    </td>
                    <td>
                      <strong>{getCustomerReportTypeLabel(report.type)}</strong>
                      <span className={`status-pill ${getCustomerReportStatusTone(report.status)}`}>
                        {getCustomerReportStatusLabel(report.status)}
                      </span>
                    </td>
                    <td>
                      <strong>{report.recipientName}</strong>
                      <span>{report.snapshotCustomerName}</span>
                    </td>
                    <td>
                      <strong>{report.snapshotObjectName ?? 'Ohne Objektbezug'}</strong>
                      {report.snapshotObjectAreaName ? (
                        <span>{report.snapshotObjectAreaName}</span>
                      ) : null}
                      <span>
                        {report.snapshotAddressLabel ? `${report.snapshotAddressLabel}: ` : ''}
                        {report.snapshotAddressText}
                      </span>
                    </td>
                    <td>
                      {report.jobId ? (
                        <Link href={`/jobs/${report.jobId}`}>{report.snapshotJobTitle}</Link>
                      ) : (
                        <strong>{report.snapshotJobTitle}</strong>
                      )}
                      <span>{report.snapshotJobReference}</span>
                    </td>
                    <td>
                      <strong>{formatDateTime(report.createdAt)}</strong>
                      <span>
                        {report.approvedAt
                          ? `Freigegeben ${formatDateTime(report.approvedAt)}`
                          : 'Noch nicht freigegeben'}
                      </span>
                    </td>
                    <td>
                      <Link className="table-action" href={`/customer-reports/${report.id}`}>
                        Oeffnen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : customerReportsResult.ok ? (
          <p>
            {selectedJobId
              ? 'Fuer diesen Auftrag gibt es noch keinen Kundenbericht.'
              : 'Es wurden noch keine Kundenberichte angelegt.'}
          </p>
        ) : null}
      </section>
    </main>
  );
}
