export function extrairIdDaUrl(hash) {
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  return params.get('id');
}

export function obterImagemEvento(url) {
  return url && url.trim() !== '' ? url : 'src/assets/evento-default.jpg';
}

export function formatarDataEvento(dataISO) {
  if (!dataISO) return 'Data a definir';
  return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}