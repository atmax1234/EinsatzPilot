'use client';

export function CustomerReportPrintButton() {
  return (
    <button className="primary-button" onClick={() => window.print()} type="button">
      Browserdruck oeffnen
    </button>
  );
}
