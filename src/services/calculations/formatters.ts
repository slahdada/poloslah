/**
 * Formatters pour Carnet Auto slah
 */

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'TND',
  decimals: number = 3
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0,${'0'.repeat(decimals)} ${currency}`;
  }

  const parts = amount.toFixed(decimals).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decPart = parts[1] || '';

  return `${intPart}${decPart ? ',' + decPart : ''} ${currency}`;
}

export function formatKm(km: number | null | undefined): string {
  if (km === null || km === undefined || isNaN(km)) {
    return '— km';
  }
  return `${Math.round(km).toLocaleString('fr-FR')} km`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('fr-FR');
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatQuantity(
  val: number | null | undefined,
  isEv: boolean = false
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return isEv ? '0 kWh' : '0 L';
  }
  return `${val.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ${isEv ? 'kWh' : 'L'}`;
}

export function formatConsumption(val: number | null | undefined, isEv: boolean = false): string {
  if (val === null || val === undefined || isNaN(val) || val <= 0) {
    return 'Données insuffisantes';
  }
  return `${val.toFixed(2)} ${isEv ? 'kWh/100km' : 'L/100km'}`;
}
