export type PremiumStatusToneR545 = 'danger' | 'warning' | 'success' | 'neutral';

export function classifyPremiumStatusR545(message: string): PremiumStatusToneR545 {
  const normalized = message.trim().toLocaleLowerCase('pt-BR');
  if (!normalized) return 'neutral';

  if (/\berros?\b|\bfalha(?:s|ram|r|ou)?\b|não foi possível|inválid|corrompid/.test(normalized)) {
    return 'danger';
  }

  if (/\batenção\b|\baviso\b|\bpendente\b|\brevise\b|\bconfirme\b/.test(normalized)) {
    return 'warning';
  }

  if (/\bsalv|\bconclu|\baplicad|\brestaurad|\bimportad|\bexportad|\bcriad|\batualizad|\bsincronizad/.test(normalized)) {
    return 'success';
  }

  return 'neutral';
}
