// src/js/pages/perfil.js
import { supabase } from '../supabase.js';

export async function renderPerfilPage() {
  const container = document.getElementById('app');
  if (!container) return;

  // Lógica para extrair o username a partir do Hash (ex: #perfil?username=escanor123)
  const hash = window.location.hash;
  let usernameParam = null;

  if (hash.includes('?')) {
    const queryString = hash.split('?')[1];
    const urlParams = new URLSearchParams(queryString);
    usernameParam = urlParams.get('username');
  }

  let profile = null;

  try {
    if (usernameParam) {
      // Busca perfil público pelo username informado
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', usernameParam)
        .single();

      if (error) throw error;
      profile = data;
    } else {
      // Caso não haja parâmetro na URL, tenta buscar o usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();

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

  // Renderiza a estrutura visual do portfólio no container
  container.innerHTML = `
    <div class="portfolio-container" style="max-width: 1100px; margin: 0 auto; padding: 20px; color: #F5F5F5;">
      
      <!-- CABEÇALHO DO PERFIL -->
      <div class="profile-header-card" style="background: #22262B; padding: 30px; border-radius: 12px; display: flex; gap: 25px; align-items: center; border-bottom: 3px solid #BA3F1D;">
        <img 
          src="${profile.avatar_url || 'https://via.placeholder.com/120'}" 
          alt="${profile.nome || 'Avatar'}" 
          style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #279AF1;"
        />
        
        <div style="flex: 1;">
          <h1 style="margin: 0; font-size: 1.8rem; color: #F5F5F5;">${profile.nome || 'Usuário FATEC'}</h1>
          <p style="margin: 4px 0; color: #279AF1; font-weight: bold;">@${profile.username || 'username'}</p>
          ${profile.nome_artistico ? `<small style="color: #888888; display: block; margin-bottom: 8px;">Conhecido como: ${profile.nome_artistico}</small>` : ''}
          <p style="margin: 10px 0; color: #DDD; font-size: 0.95rem;">${profile.bio || 'Sem bio cadastrada.'}</p>
          
          <!-- HABILIDADES / TAGS -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
            ${(profile.habilidades || []).map(skill => `
              <span style="background: #181B1F; border: 1px solid #279AF1; color: #279AF1; padding: 4px 10px; border-radius: 15px; font-size: 0.8rem;">
                ${skill}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- BOTÃO DE COMPARTILHAR PORTFÓLIO -->
        <div>
          <button id="btnSharePortfolio" style="background: #BA3F1D; color: #FFF; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;">
            🔗 Compartilhar Portfólio
          </button>
        </div>
      </div>

      <!-- SEÇÕES DE TRABALHOS E POSTS -->
      <div style="margin-top: 30px;">
        <h2 style="border-bottom: 2px solid #22262B; padding-bottom: 10px; color: #279AF1;">🎨 Galeria de Trabalhos & Posts</h2>
        <div id="userPostsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;">
          <p style="color: #888;">Carregando trabalhos...</p>
        </div>
      </div>

      <div style="margin-top: 40px;">
        <h2 style="border-bottom: 2px solid #22262B; padding-bottom: 10px; color: #279AF1;">📁 Projetos Integradores & Acadêmicos</h2>
        <div id="userProjectsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-top: 20px;">
          <p style="color: #888;">Carregando projetos...</p>
        </div>
      </div>

    </div>
  `;

  // Evento do botão compartilhar corrigido para gerar a URL limpa baseada em hash
  document.getElementById('btnSharePortfolio')?.addEventListener('click', () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}#perfil?username=${profile.username}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Link do portfólio copiado com sucesso!\n${shareUrl}`);
    }).catch(err => {
      console.error('Erro ao copiar link: ', err);
      prompt("Copie o link abaixo:", shareUrl);
    });
  });

  // Carrega mídias e projetos do usuário
  loadUserPosts(profile.id);
  loadUserProjects(profile.id);
}

async function loadUserPosts(userId) {
  const grid = document.getElementById('userPostsGrid');
  if (!grid) return;

  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id, titulo, descricao, created_at,
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
      const coverMedia = post.post_media && post.post_media.length > 0 ? post.post_media[0].midia_url : 'https://via.placeholder.com/300x200?text=Sem+Imagem';
      return `
        <div style="background: #22262B; border-radius: 8px; overflow: hidden; border: 1px solid #181B1F;">
          <img src="${coverMedia}" alt="${post.titulo || 'Mídia'}" style="width: 100%; height: 180px; object-fit: cover;" />
          <div style="padding: 15px;">
            <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; color: #F5F5F5;">${post.titulo || 'Sem título'}</h3>
            <p style="margin: 0; color: #AAA; font-size: 0.85rem; line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;">
              ${post.descricao || ''}
            </p>
          </div>
        </div>
      `;
    }).join('');

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
  const confirmacao = confirm("Tem certeza que deseja excluir sua conta? Esta ação não poderá ser desfeita.");
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
    window.location.reload();
  } catch (err) {
    console.error("Erro ao deletar conta:", err);
    alert("Erro ao tentar excluir a conta.");
  }
}