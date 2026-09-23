import { supabaseClient } from '../supabase.js';

export let postsCarregados = [];

export async function renderizarFeed() {
  const app = document.getElementById('app');
  app.className = 'container grid-layout';
  app.innerHTML = `
    <section class="feed-section">
      <h2>Galeria de Trabalhos</h2>
      <div id="posts-container" class="grid-container">
        <p class="loading">Carregando publicações...</p>
      </div>
    </section>

    <aside class="events-section">
      <h2>Mural de Eventos</h2>
      <div id="events-container" class="events-list">
        <p class="loading">Carregando eventos...</p>
      </div>
    </aside>
  `;

  await carregarPosts();
  await carregarEventos();
  await atualizarContadorPosts();
}

export async function carregarPosts() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  // Busca os posts junto com perfis e mídias sem depender de autenticação prévia
  const { data: posts, error } = await supabaseClient
    .from('posts')
    .select('*, profiles!inner(nome, username, avatar_url), post_media(*)')
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    // Fallback sem o !inner caso haja incompatibilidade pontual na consulta
    const { data: postsFallback } = await supabaseClient
      .from('posts')
      .select('*, profiles(nome, username, avatar_url), post_media(*)')
      .order('created_at', { ascending: false })
      .limit(12);

    if (!postsFallback || postsFallback.length === 0) {
      container.innerHTML = '<p>Nenhum trabalho publicado ainda.</p>';
      return;
    }
    postsCarregados = postsFallback;
  } else {
    postsCarregados = posts;
  }

  container.innerHTML = postsCarregados.map(post => {
    const media = (post.post_media && post.post_media.length > 0) ? post.post_media[0] : null;
    let mediaTag = '<div style="padding: 20px; background: #111; text-align: center; color: #666; border-radius: 6px;">Sem Mídia</div>';

    if (media && media.midia_url) {
      if (media.tipo_midia === 'video') {
        mediaTag = `<video src="${media.midia_url}" muted preload="metadata"></video>`;
      } else if (media.tipo_midia === 'audio') {
        mediaTag = `<div style="padding: 25px; background: #2a2e33; border-radius: 6px; text-align: center; font-size: 1.2rem;">🎵 Áudio / Música</div>`;
      } else {
        mediaTag = `<img src="${media.midia_url}" alt="${post.titulo || 'Mídia'}" loading="lazy" />`;
      }
    }

    const autor = post.profiles || {};
    const autorNome = autor.nome || autor.username || 'Usuário';

    return `
      <div class="card" onclick="window.abrirModalDetalhes('${post.id}')">
        ${mediaTag}
        <h3>${post.titulo || 'Sem título'}</h3>
        <p>${post.descricao ? (post.descricao.substring(0, 80) + '...') : ''}</p>
        <small style="color: var(--text-muted); display: block; margin-top: 10px;">Por ${autorNome}</small>
      </div>
    `;
  }).join('');
}

async function carregarEventos() {
  const container = document.getElementById('events-container');
  if (!container) return;

  const { data: events, error } = await supabaseClient.from('events').select('*');

  if (error || !events || events.length === 0) {
    container.innerHTML = '<p>Nenhum evento agendado.</p>';
    return;
  }

  container.innerHTML = events.map(event => `
    <div class="event-card">
      <h4>${event.titulo || 'Evento'}</h4>
      <p>${event.descricao || ''}</p>
      <small style="color: var(--secondary)">${event.data_evento ? new Date(event.data_evento).toLocaleDateString('pt-BR') : ''}</small>
    </div>
  `).join('');
}

export async function atualizarContadorPosts() {
  const elContador = document.getElementById('stat-total-posts');
  if (!elContador) return;

  const { count, error } = await supabaseClient
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (!error && count !== null) {
    elContador.textContent = count;
  } else {
    elContador.textContent = '0';
  }
}