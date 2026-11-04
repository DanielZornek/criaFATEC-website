// src/js/pages/perfil.js
import { supabase } from '../supabase.js';

export async function renderPerfilPage() {
  const container = document.getElementById('app');
  if (!container) return;

  const hash = window.location.hash;
  let usernameParam = null;

  if (hash.includes('?')) {
    const queryString = hash.split('?')[1];
    const urlParams = new URLSearchParams(queryString);
    usernameParam = urlParams.get('username');
  }

  let profile = null;
  let isOwner = false;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (usernameParam) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', usernameParam)
        .single();

      if (error) throw error;
      profile = data;
      isOwner = user && user.id === profile.id;
    } else {
      if (!user) {
        container.innerHTML = `
          <div style="text-align: center; color: #F5F5F5; padding: 50px;">
            <h2>Perfil não especificado ou usuário não autenticado.</h2>
            <p style="margin-top: 10px; color: #AAA;">
              Utilize um link público no formato: <code>/#perfil?username=nome_usuario</code>
            </p>
          </div>
        `;
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      profile = data;
      isOwner = true;
    }
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
    container.innerHTML = `
      <div style="text-align: center; color: #BA3F1D; padding: 50px;">
        <h2>Erro ao carregar o perfil do usuário.</h2>
        <p style="color: #888; margin-top: 10px;">Verifique se o nome de usuário existe.</p>
      </div>
    `;
    return;
  }

  const habilidadesStr = (profile.habilidades || []).join(', ');

  container.innerHTML = `
    <div class="portfolio-container" style="max-width: 1100px; margin: 0 auto; padding: 20px 20px 60px 20px; color: #F5F5F5; min-height: 75vh;">
      
      <!-- CABEÇALHO DO PERFIL -->
      <div class="profile-header-card" style="background: #22262B; padding: 30px; border-radius: 12px; display: flex; gap: 25px; align-items: center; border-bottom: 3px solid #BA3F1D; flex-wrap: wrap;">
        <img 
          src="${profile.avatar_url || 'https://via.placeholder.com/120'}" 
          alt="${profile.nome || 'Avatar'}" 
          style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #279AF1;"
        />
        
        <div style="flex: 1; min-width: 250px;">
          <h1 style="margin: 0; font-size: 1.8rem; color: #F5F5F5;">${profile.nome || 'Usuário FATEC'}</h1>
          <p style="margin: 4px 0; color: #279AF1; font-weight: bold;">@${profile.username || 'username'}</p>
          ${profile.nome_artistico ? `<small style="color: #888888; display: block; margin-bottom: 8px;">Conhecido como: ${profile.nome_artistico}</small>` : ''}
          <p style="margin: 10px 0; color: #DDD; font-size: 0.95rem;">${profile.bio || 'Sem bio cadastrada.'}</p>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            ${(profile.habilidades || []).map(skill => `
              <span style="background: #181B1F; border: 1px solid #279AF1; color: #279AF1; padding: 4px 10px; border-radius: 15px; font-size: 0.8rem;">
                ${skill}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- PAINEL DE AÇÕES DO PERFIL -->
        <div style="display: flex; flex-direction: column; gap: 10px; min-width: 180px;">
          <button id="btnSharePortfolio" style="background: #BA3F1D; color: #FFF; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;">
            🔗 Compartilhar
          </button>

          ${isOwner ? `
            <button id="btnAbrirModalEditarPerfil" style="background: #279AF1; color: #FFF; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;">
              ✏️ Editar Perfil
            </button>
            
            <button id="btnDeletarConta" style="background: transparent; color: #BA3F1D; border: 1px solid #BA3F1D; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: 0.2s; margin-top: 10px;">
              🗑️ Excluir Conta
            </button>
          ` : ''}
        </div>
      </div>

      <!-- GALERIA DE POSTS -->
      <div style="margin-top: 30px;">
        <h2 style="border-bottom: 2px solid #22262B; padding-bottom: 10px; color: #279AF1;">🎨 Galeria de Trabalhos & Posts</h2>
        <div id="userPostsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;">
          <p style="color: #888;">Carregando trabalhos...</p>
        </div>
      </div>

      <!-- PROJETOS INTEGRADORES -->
      <div style="margin-top: 40px;">
        <h2 style="border-bottom: 2px solid #22262B; padding-bottom: 10px; color: #279AF1;">📁 Projetos Integradores & Acadêmicos</h2>
        <div id="userProjectsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-top: 20px;">
          <p style="color: #888;">Carregando projetos...</p>
        </div>
      </div>

    </div>

    <!-- MODAL DE EDITAR PERFIL -->
    <div id="modalEditarPerfil" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; justify-content: center; align-items: center; overflow-y: auto;">
      <div style="background: #22262B; padding: 25px; border-radius: 12px; width: 90%; max-width: 500px; border: 1px solid #279AF1; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #279AF1;">✏️ Editar Informações do Perfil</h3>
        
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
          <div>
            <label style="font-size: 0.85rem; color: #AAA; display: block; margin-bottom: 4px;">Nome Completo / Exibição</label>
            <input type="text" id="editNome" value="${profile.nome || ''}" style="width: 100%; background: #181B1F; border: 1px solid #444; color: #FFF; border-radius: 6px; padding: 8px; box-sizing: border-box;" />
          </div>

          <div>
            <label style="font-size: 0.85rem; color: #AAA; display: block; margin-bottom: 4px;">Nome Artístico / Pseudônimo</label>
            <input type="text" id="editNomeArtistico" value="${profile.nome_artistico || ''}" style="width: 100%; background: #181B1F; border: 1px solid #444; color: #FFF; border-radius: 6px; padding: 8px; box-sizing: border-box;" />
          </div>

          <div>
            <label style="font-size: 0.85rem; color: #AAA; display: block; margin-bottom: 4px;">Biografia / Resumo</label>
            <textarea id="editBio" rows="3" style="width: 100%; background: #181B1F; border: 1px solid #444; color: #FFF; border-radius: 6px; padding: 8px; box-sizing: border-box;">${profile.bio || ''}</textarea>
          </div>

          <div>
            <label style="font-size: 0.85rem; color: #AAA; display: block; margin-bottom: 4px;">Habilidades (separadas por vírgula)</label>
            <input type="text" id="editHabilidades" value="${habilidadesStr}" placeholder="Ex: Pixel Art, Python, UI/UX" style="width: 100%; background: #181B1F; border: 1px solid #444; color: #FFF; border-radius: 6px; padding: 8px; box-sizing: border-box;" />
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
          <button id="btnFecharModalEditarPerfil" style="background: #444; color: #FFF; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Cancelar</button>
          <button id="btnSalvarPerfil" style="background: #279AF1; color: #FFF; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Salvar Alterações</button>
        </div>
      </div>
    </div>

    <!-- MODAL DE CONTESTAÇÃO -->
    <div id="modalContestacao" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center;">
      <div style="background: #22262B; padding: 25px; border-radius: 12px; width: 90%; max-width: 500px; border: 1px solid #BA3F1D;">
        <h3 style="margin-top: 0; color: #BA3F1D;">⚠️ Contestar Moderação do Post</h3>
        <p style="font-size: 0.9rem; color: #AAA;">Explique o motivo pelo qual sua publicação deve ser reativada para a coordenação/moderação avaliar:</p>
        <textarea id="txtJustificativaContestacao" rows="4" style="width: 100%; background: #181B1F; border: 1px solid #444; color: #FFF; border-radius: 6px; padding: 10px; box-sizing: border-box;" placeholder="Digite aqui sua defesa..."></textarea>
        <input type="hidden" id="postIdContestacao" />
        
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;">
          <button id="btnFecharModalContestacao" style="background: #444; color: #FFF; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Cancelar</button>
          <button id="btnEnviarContestacao" style="background: #BA3F1D; color: #FFF; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Enviar Contestação</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnSharePortfolio')?.addEventListener('click', () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}#perfil?username=${profile.username}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Link do portfólio copiado com sucesso!\n${shareUrl}`);
    }).catch(err => {
      prompt("Copie o link abaixo:", shareUrl);
    });
  });

  const modalEditar = document.getElementById('modalEditarPerfil');
  document.getElementById('btnAbrirModalEditarPerfil')?.addEventListener('click', () => {
    modalEditar.style.display = 'flex';
  });

  document.getElementById('btnFecharModalEditarPerfil')?.addEventListener('click', () => {
    modalEditar.style.display = 'none';
  });

  document.getElementById('btnSalvarPerfil')?.addEventListener('click', async () => {
    const novoNome = document.getElementById('editNome').value.trim();
    const novoNomeArtistico = document.getElementById('editNomeArtistico').value.trim();
    const novaBio = document.getElementById('editBio').value.trim();
    const habsInput = document.getElementById('editHabilidades').value;
    
    const arrayHabilidades = habsInput
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: novoNome,
          nome_artistico: novoNomeArtistico,
          bio: novaBio,
          habilidades: arrayHabilidades
        })
        .eq('id', profile.id);

      if (error) throw error;

      alert("Perfil atualizado com sucesso!");
      modalEditar.style.display = 'none';
      renderPerfilPage();
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      alert("Ocorreu um erro ao atualizar o perfil.");
    }
  });

  document.getElementById('btnDeletarConta')?.addEventListener('click', deletarConta);

  const modalContestacao = document.getElementById('modalContestacao');
  document.getElementById('btnFecharModalContestacao')?.addEventListener('click', () => {
    modalContestacao.style.display = 'none';
  });

  document.getElementById('btnEnviarContestacao')?.addEventListener('click', async () => {
    const postId = document.getElementById('postIdContestacao').value;
    const justificativa = document.getElementById('txtJustificativaContestacao').value.trim();

    if (!justificativa) {
      alert("Por favor, escreva uma justificativa para enviar a contestação.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Usa .insert simples para gravar a contestação na tabela 'contestacoes' sem erros de conflito
      const { error } = await supabase.from('contestacoes').insert([
        {
          post_id: postId,
          user_id: user.id,
          mensagem_defesa: justificativa,
          status_contestacao: 'pendente'
        }
      ]);

      if (error) throw error;

      alert("Sua contestação foi enviada com sucesso para a moderação!");
      modalContestacao.style.display = 'none';
      loadUserPosts(profile.id, isOwner);
    } catch (err) {
      console.error("Erro ao contestar:", err);
      alert("Erro ao enviar contestação. Verifique o console.");
    }
  });

  loadUserPosts(profile.id, isOwner);
  loadUserProjects(profile.id);
}

async function loadUserPosts(userId, isOwner = false) {
  const grid = document.getElementById('userPostsGrid');
  if (!grid) return;

  try {
    let { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id, titulo, descricao, created_at, status,
        post_media (midia_url, tipo_midia)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      grid.innerHTML = `<p style="color: #888; grid-column: 1/-1;">Nenhum trabalho publicado ainda.</p>`;
      return;
    }

    grid.innerHTML = posts.map(post => {
      const isBlocked = (post.status || '').trim().toLowerCase() === 'bloqueado';
      
      if (isBlocked && !isOwner) return '';

      let coverMedia = '';
      let tipoMidia = 'imagem';
      
      if (post.post_media && post.post_media.length > 0) {
        coverMedia = post.post_media[0].midia_url || '';
        tipoMidia = post.post_media[0].tipo_midia || 'imagem';
      }

      let mediaHtml = '';
      if (tipoMidia === 'audio' || !coverMedia) {
        mediaHtml = `
          <div style="width: 100%; height: 180px; background: linear-gradient(135deg, #2b0b02, #ba3f1d); display: flex; flex-direction: column; justify-content: center; align-items: center; color: #FFF; ${isBlocked ? 'filter: grayscale(1); opacity: 0.5;' : ''}">
            <span style="font-size: 2.5rem; margin-bottom: 5px;">🎵</span>
            <span style="font-size: 0.9rem; font-weight: bold;">Arquivo de Áudio / Música</span>
          </div>
        `;
      } else {
        mediaHtml = `
          <img src="${coverMedia}" alt="${post.titulo || 'Mídia'}" style="width: 100%; height: 180px; object-fit: cover; ${isBlocked ? 'filter: grayscale(1); opacity: 0.5;' : ''}" onerror="this.outerHTML='<div style=\\'width: 100%; height: 180px; background: #111; display: flex; justify-content: center; align-items: center; color: #888;\\'><span>Sem Mídia Disponível</span></div>'" />
        `;
      }

      const motivoModeracao = "Música obscena / Conteúdo inadequado relatado pelo painel admin.";

      return `
        <div style="background: #22262B; border-radius: 8px; overflow: hidden; border: ${isBlocked ? '2px solid #BA3F1D' : '1px solid #181B1F'}; position: relative;">
          ${mediaHtml}
          
          <div style="padding: 15px;">
            <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; color: #F5F5F5;">${post.titulo || 'Sem título'}</h3>
            <p style="margin: 0; color: #AAA; font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${post.descricao || ''}
            </p>

            ${isBlocked && isOwner ? `
              <div style="margin-top: 12px; padding: 10px; background: rgba(186, 63, 29, 0.15); border-radius: 6px; border: 1px dashed #BA3F1D;">
                <p style="margin: 0; color: #BA3F1D; font-size: 0.75rem; font-weight: bold;">🚫 Post Bloqueado pela Moderação</p>
                <p style="margin: 4px 0 8px 0; color: #DDD; font-size: 0.75rem;"><strong>Motivo:</strong> ${motivoModeracao}</p>
                <button class="btnAbrirContestacao" data-id="${post.id}" style="background: #BA3F1D; color: #FFF; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; width: 100%; font-weight: bold;">
                  ⚠️ Contestar Bloqueio
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btnAbrirContestacao').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.target.getAttribute('data-id');
        document.getElementById('postIdContestacao').value = postId;
        document.getElementById('txtJustificativaContestacao').value = '';
        document.getElementById('modalContestacao').style.display = 'flex';
      });
    });

  } catch (err) {
    console.error("Erro ao carregar posts do perfil:", err);
    grid.innerHTML = `<p style="color: #BA3F1D;">Erro ao carregar galeria.</p>`;
  }
}

async function loadUserProjects(userId) {
  const grid = document.getElementById('userProjectsGrid');
  if (!grid) return;

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!projects || projects.length === 0) {
      grid.innerHTML = `<p style="color: #888; grid-column: 1/-1;">Nenhum projeto cadastrado.</p>`;
      return;
    }

    grid.innerHTML = projects.map(proj => `
      <div style="background: #22262B; padding: 20px; border-radius: 8px; border-left: 4px solid #279AF1;">
        <h3 style="margin: 0 0 10px 0; color: #F5F5F5;">${proj.titulo}</h3>
        <p style="color: #AAA; font-size: 0.9rem; margin-bottom: 12px;">${proj.descricao || ''}</p>
        <span style="background: #181B1F; color: #279AF1; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem;">
          Status: ${proj.status || 'Ativo'}
        </span>
      </div>
    `).join('');

  } catch (err) {
    console.error("Erro ao carregar projetos do perfil:", err);
    grid.innerHTML = `<p style="color: #BA3F1D;">Erro ao carregar projetos.</p>`;
  }
}

export async function deletarConta() {
  const confirmacao = confirm("Tem certeza que deseja excluir sua conta? Esta ação apagará seu perfil e não poderá ser desfeita.");
  if (!confirmacao) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (error) throw error;

    await supabase.auth.signOut();
    alert("Sua conta foi excluída com sucesso.");
    window.location.hash = '/';
    window.location.reload();
  } catch (err) {
    console.error("Erro ao deletar conta:", err);
    alert("Erro ao tentar excluir a conta.");
  }
}