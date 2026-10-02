'use client';

export function WorkdaySheetPrintButton() {
  return (
    <button className="secondary-button" onClick={() => window.print()} type="button">
      Browser-Druckansicht
    </button>
  );
}
