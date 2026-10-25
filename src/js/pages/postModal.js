// src/js/pages/postModal.js
import { supabase } from '../supabase.js';
import { postsCarregados } from './feed.js';

// Abre o modal de detalhes do post (clicado na vitrine)
export async function abrirModalDetalhes(postId) {
  const modal = document.getElementById('modal-post-detalhes');
  const conteudoDiv = document.getElementById('modal-post-conteudo');
  
  if (!modal || !conteudoDiv) return;

  conteudoDiv.innerHTML = `<p style="text-align: center; color: #888; padding: 30px;">Carregando detalhes...</p>`;
  modal.style.display = 'flex';

  // Procura o post na lista já carregada ou busca diretamente no Supabase
  let post = postsCarregados.find(p => p.id == postId);

  if (!post) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(nome, username, avatar_url), post_media(*)')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      post = data;
    } catch (err) {
      console.error("Erro ao carregar detalhes do post:", err);
      conteudoDiv.innerHTML = `<p style="text-align: center; color: #BA3F1D; padding: 30px;">Erro ao carregar publicação.</p>`;
      return;
    }
  }

  if (!post) {
    conteudoDiv.innerHTML = `<p style="text-align: center; color: #888; padding: 30px;">Publicação não encontrada.</p>`;
    return;
  }

  const media = (post.post_media && post.post_media.length > 0) ? post.post_media[0] : null;
  let mediaHtml = '<div style="padding: 40px; background: #111; text-align: center; color: #666; border-radius: 8px;">Sem Mídia</div>';

  if (media && media.midia_url) {
    if (media.tipo_midia === 'video') {
      mediaHtml = `<video src="${media.midia_url}" controls autoplay style="width: 100%; max-height: 400px; border-radius: 8px;"></video>`;
    } else if (media.tipo_midia === 'audio') {
      mediaHtml = `
        <div style="padding: 30px; background: #181B1F; border-radius: 8px; text-align: center;">
          <p style="margin-bottom: 15px; color: #279AF1; font-weight: bold;">🎵 Arquivo de Áudio / Trilha Sonora</p>
          <audio src="${media.midia_url}" controls style="width: 100%;"></audio>
        </div>`;
    } else {
      mediaHtml = `<img src="${media.midia_url}" alt="${post.titulo || 'Mídia'}" style="width: 100%; max-height: 450px; object-fit: contain; border-radius: 8px; background: #111;" />`;
    }
  }

  const autor = post.profiles || {};
  const autorNome = autor.nome || autor.username || 'Usuário FATEC';
  const autorUsername = autor.username ? `@${autor.username}` : '';
  const dataFormatada = new Date(post.created_at).toLocaleDateString('pt-BR');

  conteudoDiv.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px; color: #F5F5F5;">
      <div>${mediaHtml}</div>
      <div>
        <h2 style="margin: 0 0 10px 0; font-size: 1.5rem; color: #F5F5F5;">${post.titulo || 'Sem título'}</h2>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <img src="${autor.avatar_url || 'https://via.placeholder.com/40'}" alt="${autorNome}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;" />
          <div>
            <p style="margin: 0; font-weight: bold; font-size: 0.95rem; color: #279AF1;">${autorNome} <span style="color: #888; font-weight: normal; font-size: 0.85rem;">${autorUsername}</span></p>
            <small style="color: #888;">Publicado em ${dataFormatada}</small>
          </div>
        </div>
        <p style="margin: 0; color: #DDD; line-height: 1.6; white-space: pre-line;">${post.descricao || 'Sem descrição informada.'}</p>
      </div>
    </div>
  `;
}

// Fecha o modal de detalhes
export function fecharModalDetalhes(event) {
  const modal = document.getElementById('modal-post-detalhes');
  if (!modal) return;
  if (!event || event.target === modal || event.target.classList.contains('btn-close')) {
    modal.style.display = 'none';
  }
}