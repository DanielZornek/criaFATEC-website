import { supabaseClient } from '../supabase.js';
import { navegarPara } from '../router.js';
import { postsCarregados, carregarPosts } from './feed.js';

export function abrirModalPost() {
  const modal = document.getElementById('modal-post');
  if (modal) modal.classList.add('active');
}

export function fecharModalPost() {
  const modal = document.getElementById('modal-post');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('form-criar-post')?.reset();
    const statusMsg = document.getElementById('mensagem-status-post');
    if (statusMsg) statusMsg.textContent = '';
  }
}

export async function abrirModalDetalhes(postId) {
  try {
    const post = postsCarregados.find(p => String(p.id) === String(postId));
    if (!post) {
      console.warn("Post não encontrado no array postsCarregados para o ID:", postId);
      return;
    }

    const modal = document.getElementById('modal-post-detalhes');
    const conteudo = document.getElementById('modal-post-conteudo');
    if (!modal || !conteudo) return;

    // Verificar se é o dono do post
    let eDonoDoPost = false;
    const { data: authData } = await supabaseClient.auth.getSession();
    if (authData && authData.session) {
      eDonoDoPost = authData.session.user.id === post.user_id;
    }

    const botaoDeletar = eDonoDoPost 
      ? `<button class="btn-danger" style="margin-top: 20px; width: auto; padding: 8px 16px;" onclick="window.deletarPost('${post.id}')">🗑️ Apagar Publicação</button>`
      : '';

    // Mídia
    const media = (post.post_media && post.post_media.length > 0) ? post.post_media[0] : null;
    let mediaTag = '';

    if (media && media.midia_url) {
      if (media.tipo_midia === 'video') {
        mediaTag = `<div class="post-detalhes-media"><video src="${media.midia_url}" controls autoplay></video></div>`;
      } else if (media.tipo_midia === 'audio') {
        mediaTag = `<div class="post-detalhes-media" style="padding: 20px; background: #111; border-radius: 8px; text-align: center;"><audio src="${media.midia_url}" controls style="width: 100%;"></audio></div>`;
      } else {
        mediaTag = `<div class="post-detalhes-media"><img src="${media.midia_url}" alt="${post.titulo || 'Mídia'}" /></div>`;
      }
    }

    // Autor
    const autor = post.profiles || {};
    const autorNome = autor.nome || autor.username || 'Usuário';
    const avatarImg = autor.avatar_url 
      ? `<img src="${autor.avatar_url}" class="nav-avatar" />` 
      : `<div class="nav-avatar-placeholder"></div>`;

    conteudo.innerHTML = `
      <div class="post-detalhes-container">
        ${mediaTag}
        <div class="post-detalhes-header">
          <h2>${post.titulo || 'Sem título'}</h2>
          <div class="post-detalhes-autor">
            ${avatarImg}
            <span>Publicado por <strong>${autorNome}</strong></span>
          </div>
        </div>
        <div class="post-detalhes-descricao">
          ${post.descricao || 'Sem descrição fornecida.'}
        </div>
        ${botaoDeletar}
      </div>
    `;

    modal.classList.add('active');
  } catch (err) {
    console.error("Erro ao abrir modal de detalhes:", err);
  }
}

export function fecharModalDetalhes(e) {
  if (!e || e.target.id === 'modal-post-detalhes' || e.target.classList.contains('btn-close')) {
    const modal = document.getElementById('modal-post-detalhes');
    if (modal) modal.classList.remove('active');
  }
}

// Handler de envio de publicação
export function inicializarFormularioPost() {
  const formPost = document.getElementById('form-criar-post');
  if (!formPost) return;

  formPost.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-publicar');
    const statusMsg = document.getElementById('mensagem-status-post');

    btn.disabled = true;
    statusMsg.style.color = 'var(--secondary)';
    statusMsg.textContent = 'Enviando arquivo e publicando...';

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      alert("Você precisa estar logado para publicar.");
      fecharModalPost();
      navegarPara('/login');
      return;
    }

    const userId = session.user.id;
    const titulo = document.getElementById('post-titulo').value.trim();
    const descricao = document.getElementById('post-descricao').value.trim() || null;
    const midiaFile = document.getElementById('post-midia').files[0];

    try {
      let tipo_midia = 'imagem';
      if (midiaFile.type.startsWith('video/')) tipo_midia = 'video';
      else if (midiaFile.type.startsWith('audio/')) tipo_midia = 'audio';

      const fileExt = midiaFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseClient.storage.from('posts').upload(fileName, midiaFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseClient.storage.from('posts').getPublicUrl(fileName);
      const midia_url = publicUrlData.publicUrl;

      const { data: newPost, error: postError } = await supabaseClient
        .from('posts')
        .insert([{ user_id: userId, titulo, descricao }])
        .select()
        .single();

      if (postError) throw postError;

      const { error: mediaError } = await supabaseClient
        .from('post_media')
        .insert([{ post_id: newPost.id, midia_url, tipo_midia }]);

      if (mediaError) throw mediaError;

      statusMsg.style.color = '#4CAF50';
      statusMsg.textContent = 'Publicado com sucesso!';

      setTimeout(() => {
        fecharModalPost();
        btn.disabled = false;
        if (window.location.pathname === '/') carregarPosts();
      }, 1000);

    } catch (err) {
      statusMsg.style.color = 'var(--primary)';
      statusMsg.textContent = `Erro ao publicar: ${err.message}`;
      btn.disabled = false;
    }
  });
}

// Função para extrair o caminho do arquivo dentro do bucket a partir de uma URL pública
function obterCaminhoDoBucket(publicUrl, bucketNome) {
  if (!publicUrl) return null;
  const partes = publicUrl.split(`/${bucketNome}/`);
  return partes.length > 1 ? partes[1] : null;
}

export async function deletarPost(postId) {
  const confirmacao = confirm("Tem certeza de que deseja apagar esta publicação?");
  if (!confirmacao) return;

  try {
    // 1. Buscar a mídia vinculada ao post para obter a URL do arquivo no bucket
    const { data: midias } = await supabaseClient
      .from('post_media')
      .select('midia_url')
      .eq('post_id', postId);

    // 2. Apagar o(s) arquivo(s) do Storage bucket 'posts'
    if (midias && midias.length > 0) {
      const caminhosParaDeletar = midias
        .map(m => obterCaminhoDoBucket(m.midia_url, 'posts'))
        .filter(Boolean);

      if (caminhosParaDeletar.length > 0) {
        const { error: storageError } = await supabaseClient.storage
          .from('posts')
          .remove(caminhosParaDeletar);

        if (storageError) console.error("Aviso ao remover arquivo do bucket:", storageError);
      }
    }

    // 3. Deletar o post no banco de dados
    // (Com o ON DELETE CASCADE configurado, as entradas em post_media somem automaticamente)
    const { error: deleteError } = await supabaseClient
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

    alert("Publicação apagada com sucesso!");
    fecharModalDetalhes();
    carregarPosts();

  } catch (err) {
    console.error("Erro ao deletar post:", err);
    alert(`Erro ao apagar publicação: ${err.message}`);
  }
}

// Função auxiliar para garantir URL e tipo corretos
function normalizarMidia(media) {
  if (!media || !media.midia_url) return null;

  let url = media.midia_url;
  // Se não começar com http/https, monta a URL pública do Supabase manualmente
  if (!url.startsWith('http')) {
    url = `https://fpomnbsbgsmbrnatfmrj.supabase.co/storage/v1/object/public/posts/${url}`;
  }

  let tipo = media.tipo_midia || 'imagem';
  if (tipo.includes('image') || tipo === 'imagem') tipo = 'imagem';
  else if (tipo.includes('video')) tipo = 'video';
  else if (tipo.includes('audio')) tipo = 'audio';

  return { url, tipo };
}