
import { supabase } from '../supabase.js';

const BUCKET = 'avatars';
const AVATAR_PADRAO = 'src/assets/evento-default.jpg';

export async function obterUrlAvatar(avatarUrl, userId) {
  const valor = (avatarUrl || '').trim();

  if (valor.startsWith('data:')) return valor;

  const marcador = `/storage/v1/object/public/${BUCKET}/`;

  if (valor.startsWith('http://') || valor.startsWith('https://')) {
    const posicao = valor.indexOf(marcador);

    if (posicao === -1) return valor;

    const caminho = valor.substring(posicao + marcador.length).split('?')[0];

    if (caminho && !caminho.endsWith('/')) return valor;
  } else if (valor && !valor.endsWith('/')) {
    const caminho = valor.startsWith(`${BUCKET}/`)
      ? valor.substring(BUCKET.length + 1)
      : valor;

    return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
  }

  if (userId) {
    const { data: arquivos, error } = await supabase.storage
      .from(BUCKET)
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (!error && arquivos?.length) {
      const arquivo = arquivos.find(item =>
        /^avatar(_\d+)?\.(jpg|jpeg|png|webp)$/i.test(item.name)
      );

      if (arquivo) {
        const caminho = `${userId}/${arquivo.name}`;

        return supabase.storage
          .from(BUCKET)
          .getPublicUrl(caminho).data.publicUrl;
      }
    }
  }

  return AVATAR_PADRAO;
}
