import { supabaseClient } from '../supabase.js';
import { navegarPara } from '../router.js';
import { verificarSessao } from '../auth.js';
import { abrirModalDetalhes } from './postModal.js';

let profileDados = null;
let meusPosts = [];

export async function renderizarPerfil() {
  const app = document.getElementById('app');
  app.className = 'container single-layout';

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    navegarPara('/login');
    return;
  }

  app.innerHTML = `<p class="loading">Carregando painel de perfil...</p>`;
  const user = session.user;

  // Busca o perfil do usuário
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    app.innerHTML = `<p class="status-msg" style="color:var(--primary)">Erro ao carregar dados do perfil.</p>`;
    return;
  }

  profileDados = profile;

  // Renderiza a estrutura da Sidebar + Conteúdo Dinâmico
  app.innerHTML = `
    <div class="perfil-dashboard">
      <!-- Sidebar / Menu Lateral -->
      <aside class="perfil-sidebar">
        <div class="perfil-sidebar-user">
          ${profile.avatar_url 
            ? `<img src="${profile.avatar_url}" class="perfil-sidebar-avatar" />` 
            : `<div class="perfil-sidebar-avatar-placeholder"></div>`}
          <h3>${profile.nome || 'Usuário'}</h3>
          <span>@${profile.username || 'username'}</span>
        </div>

        <nav class="perfil-menu">
          <button class="perfil-menu-btn active" onclick="window.trocarAbaPerfil('ver-perfil')">
            👤 Visualizar Perfil
          </button>
          <button class="perfil-menu-btn" onclick="window.trocarAbaPerfil('meus-posts')">
            🎨 Minhas Publicações
          </button>
          <button class="perfil-menu-btn" onclick="window.trocarAbaPerfil('editar-perfil')">
            ⚙️ Editar Informações
          </button>
          <button class="perfil-menu-btn btn-danger-menu" onclick="window.trocarAbaPerfil('zona-perigo')">
            ⚠️ Configurações da Conta
          </button>
        </nav>
      </aside>

      <!-- Conteúdo Principal da Aba -->
      <main id="perfil-conteudo-aba" class="perfil-main-content">
        <!-- O conteúdo da aba será injetado dinamicamente aqui -->
      </main>
    </div>
  `;

  // Expõe a função para alternar abas globalmente
  window.trocarAbaPerfil = trocarAbaPerfil;

  // Carrega a aba padrão
  trocarAbaPerfil('ver-perfil');
}

// ----------------------------------------------------
// GERENCIADOR DE ABAS DO PERFIL
// ----------------------------------------------------
export async function trocarAbaPerfil(nomeAba) {
  const conteudosContainer = document.getElementById('perfil-conteudo-aba');
  if (!conteudosContainer) return;

  // Reinicia a animação CSS no container da aba
  conteudosContainer.classList.remove('page-transition');
  void conteudosContainer.offsetWidth; // Reflow

  // Atualiza classe ativa nos botões do menu
  document.querySelectorAll('.perfil-menu-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const btnAtivo = Array.from(document.querySelectorAll('.perfil-menu-btn')).find(btn => {
    if (nomeAba === 'ver-perfil') return btn.textContent.includes('Visualizar Perfil');
    if (nomeAba === 'meus-posts') return btn.textContent.includes('Minhas Publicações');
    if (nomeAba === 'editar-perfil') return btn.textContent.includes('Editar Informações');
    if (nomeAba === 'zona-perigo') return btn.textContent.includes('Configurações da Conta');
    return false;
  });

  if (btnAtivo) btnAtivo.classList.add('active');

  // Renderiza a aba correspondente
  if (nomeAba === 'ver-perfil') {
    renderizarAbaVerPerfil(conteudosContainer);
  } else if (nomeAba === 'meus-posts') {
    await renderizarAbaMeusPosts(conteudosContainer);
  } else if (nomeAba === 'editar-perfil') {
    renderizarAbaEditarPerfil(conteudosContainer);
  } else if (nomeAba === 'zona-perigo') {
    renderizarAbaZonaPerigo(conteudosContainer);
  }

  // Aplica o efeito de animação na aba recém-carregada
  conteudosContainer.classList.add('page-transition');
}

// 1. Aba: Ver Perfil Público
function renderizarAbaVerPerfil(container) {
  const p = profileDados;
  const habilidadesBadges = p.habilidades && p.habilidades.length > 0
    ? p.habilidades.map(h => `<span class="badge-tag">${h}</span>`).join('')
    : '<span style="color: var(--text-muted)">Nenhuma habilidade cadastrada.</span>';

  container.innerHTML = `
    <div class="perfil-card-view">
      <div class="perfil-header-banner"></div>
      <div class="perfil-info-body">
        <div class="perfil-avatar-wrapper">
          ${p.avatar_url 
            ? `<img src="${p.avatar_url}" class="perfil-avatar-large" />` 
            : `<div class="perfil-avatar-large-placeholder"></div>`}
        </div>

        <h2>${p.nome || 'Sem Nome'}</h2>
        <p class="perfil-username">@${p.username || 'username'} ${p.nome_artistico ? `• (${p.nome_artistico})` : ''}</p>

        <div class="perfil-section">
          <h4>Bio / Apresentação</h4>
          <p>${p.bio || 'Este usuário ainda não adicionou uma biografia.'}</p>
        </div>

        <div class="perfil-section">
          <h4>Habilidades & Áreas de Atuação</h4>
          <div class="badges-container">
            ${habilidadesBadges}
          </div>
        </div>

        <button class="btn-primary-sm" style="margin-top: 20px; padding: 10px 20px;" onclick="window.trocarAbaPerfil('editar-perfil')">
          ✏️ Editar Perfil
        </button>
      </div>
    </div>
  `;
}

// 2. Aba: Minhas Publicações
async function renderizarAbaMeusPosts(container) {
  container.innerHTML = `<p class="loading">Buscando seus trabalhos...</p>`;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: posts, error } = await supabaseClient
    .from('posts')
    .select('*, profiles(nome, username, avatar_url), post_media(*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<p class="status-msg" style="color:var(--primary)">Erro ao buscar publicações.</p>`;
    return;
  }

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Você ainda não fez nenhuma publicação.</p>
        <button class="btn-primary-sm" style="margin-top: 15px;" onclick="window.abrirModalPost()">+ Publicar Agora</button>
      </div>
    `;
    return;
  }

  meusPosts = posts;

  container.innerHTML = `
    <h3 style="margin-bottom: 20px;">Suas Publicações (${posts.length})</h3>
    <div class="grid-container">
      ${posts.map(post => {
        const media = (post.post_media && post.post_media.length > 0) ? post.post_media[0] : null;
        let mediaTag = '<div style="padding: 20px; background: #111; text-align: center; color: #666; border-radius: 6px;">Sem Mídia</div>';

        if (media && media.midia_url) {
          if (media.tipo_midia === 'video') {
            mediaTag = `<video src="${media.midia_url}" muted preload="metadata"></video>`;
          } else if (media.tipo_midia === 'audio') {
            mediaTag = `<div style="padding: 20px; background: #2a2e33; border-radius: 6px; text-align: center;">🎵 Áudio / Música</div>`;
          } else {
            mediaTag = `<img src="${media.midia_url}" alt="${post.titulo || 'Mídia'}" loading="lazy" />`;
          }
        }

        return `
          <div class="card" onclick="window.abrirModalDetalhes('${post.id}')">
            ${mediaTag}
            <h3>${post.titulo || 'Sem título'}</h3>
            <p>${post.descricao ? (post.descricao.substring(0, 60) + '...') : ''}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 3. Aba: Editar Perfil (Formulário)
function renderizarAbaEditarPerfil(container) {
  const p = profileDados;
  const habString = p.habilidades ? p.habilidades.join(', ') : '';

  container.innerHTML = `
    <div class="perfil-form-container">
      <h3>Editar Informações Pessoais</h3>
      
      <form id="perfil-form" style="margin-top: 20px;">
        <div class="form-group">
          <label>Nome Completo *</label>
          <input type="text" id="edit-nome" value="${p.nome || ''}" required>
        </div>

        <div class="form-group">
          <label>Nome de Usuário (@username) *</label>
          <input type="text" id="edit-username" value="${p.username || ''}" required>
        </div>

        <div class="form-group">
          <label>Nome Artístico (Opcional)</label>
          <input type="text" id="edit-nome-artistico" value="${p.nome_artistico || ''}">
        </div>

        <div class="form-group">
          <label>Bio / Apresentação</label>
          <textarea id="edit-bio" rows="4">${p.bio || ''}</textarea>
        </div>

        <div class="form-group">
          <label>Habilidades (separadas por vírgula)</label>
          <input type="text" id="edit-habilidades" value="${habString}" placeholder="Ex: Ilustração, Pixel Art, Audio, UI/UX">
        </div>

        <div class="form-group">
          <label>Alterar Foto de Perfil</label>
          <input type="file" id="edit-avatar" accept="image/*">
        </div>

        <button type="submit" id="btn-salvar-perfil" class="btn-primary">Salvar Alterações</button>
        <p id="mensagem-status-perfil" class="status-msg"></p>
      </form>
    </div>
  `;

  document.getElementById('perfil-form').addEventListener('submit', salvarPerfil);
}

// 4. Aba: Zona de Perigo
function renderizarAbaZonaPerigo(container) {
  container.innerHTML = `
    <div class="danger-zone-card">
      <h3 style="color: var(--primary);">⚠️ Configurações e Segurança da Conta</h3>
      <p style="color: var(--text-muted); margin: 15px 0;">
        Ao apagar sua conta, todos os seus dados de perfil e publicações serão removidos permanentemente. Esta ação não pode ser desfeita.
      </p>
      <button type="button" class="btn-danger" onclick="window.deletarConta()">Deletar Minha Conta</button>
    </div>
  `;
}

// Handler de Salvamento do Perfil (Com remoção do avatar antigo do Bucket)
async function salvarPerfil(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-salvar-perfil');
  const statusMsg = document.getElementById('mensagem-status-perfil');
  btn.disabled = true;
  statusMsg.style.color = 'var(--secondary)';
  statusMsg.textContent = 'Salvando alterações...';

  const { data: { session } } = await supabaseClient.auth.getSession();
  const user = session.user;

  const nome = document.getElementById('edit-nome').value.trim();
  const username = document.getElementById('edit-username').value.trim();
  const nome_artistico = document.getElementById('edit-nome-artistico').value.trim() || null;
  const bio = document.getElementById('edit-bio').value.trim() || null;
  
  const habInput = document.getElementById('edit-habilidades').value;
  const habilidades = habInput ? habInput.split(',').map(item => item.trim()).filter(Boolean) : [];
  const avatarFile = document.getElementById('edit-avatar').files[0];

  try {
    let avatar_url = null;

    if (avatarFile) {
      // Deleta o avatar antigo do bucket 'avatars' se existir
      if (profileDados.avatar_url) {
        const partesUrl = profileDados.avatar_url.split('/avatars/');
        if (partesUrl.length > 1) {
          const antigoCaminho = partesUrl[1];
          await supabaseClient.storage.from('avatars').remove([antigoCaminho]);
        }
      }

      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
        avatar_url = publicUrlData.publicUrl;
      }
    }

    const updatePayload = { nome, username, nome_artistico, bio, habilidades };
    if (avatar_url) updatePayload.avatar_url = avatar_url;

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Atualiza o objeto em memória
    profileDados = { ...profileDados, ...updatePayload };

    statusMsg.style.color = '#4CAF50';
    statusMsg.textContent = 'Perfil atualizado com sucesso!';
    await verificarSessao();

    setTimeout(() => {
      trocarAbaPerfil('ver-perfil');
    }, 1200);

  } catch (err) {
    statusMsg.style.color = 'var(--primary)';
    statusMsg.textContent = `Erro ao atualizar: ${err.message}`;
    btn.disabled = false;
  }
}

export async function deletarConta() {
  const confirmacao = confirm("Tem certeza absoluta que deseja apagar sua conta? Esta ação não pode ser desfeita.");
  if (!confirmacao) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  try {
    const { error: profileError } = await supabaseClient.from('profiles').delete().eq('id', session.user.id);
    if (profileError) throw profileError;

    await supabaseClient.auth.signOut();
    alert("Sua conta foi removida com sucesso.");
    navegarPara('/');
  } catch (err) {
    alert(`Erro ao tentar deletar conta: ${err.message}`);
  }
}