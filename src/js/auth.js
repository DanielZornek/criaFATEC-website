import { supabaseClient } from './supabase.js';
import { navegarPara } from './router.js';

export async function verificarSessao() {
  const userArea = document.getElementById('user-area');
  if (!userArea) return;

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    const user = session.user;
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nome, avatar_url, username')
      .eq('id', user.id)
      .single();

    const nomeExibicao = profile ? (profile.nome || profile.username) : user.email;
    const avatarImg = profile && profile.avatar_url 
      ? `<img src="${profile.avatar_url}" class="nav-avatar" />` 
      : `<div class="nav-avatar-placeholder"></div>`;

    userArea.innerHTML = `
      <button class="btn-primary-sm" onclick="window.abrirModalPost()">+ Criar Post</button>

      <div class="user-menu-container">
        <button class="user-button" onclick="window.toggleDropdown()">
          ${avatarImg}
          <span><strong>${nomeExibicao}</strong> ▾</span>
        </button>
        <div id="user-dropdown" class="dropdown-menu">
          <button class="dropdown-item" onclick="window.navegarPara('/perfil')">👤 Meu Perfil</button>
          <button class="dropdown-item logout-item" onclick="window.fazerLogout()">🚪 Sair</button>
        </div>
      </div>
    `;
  } else {
    userArea.innerHTML = `
      <button class="btn-secondary-sm" onclick="window.navegarPara('/login')">Entrar</button>
      <button class="btn-primary-sm" onclick="window.navegarPara('/cadastro')">Cadastrar</button>
    `;
  }
}

export async function fazerLogout() {
  await supabaseClient.auth.signOut();
  navegarPara('/');
}

// Fechar dropdown ao clicar fora
window.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu-container')) {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
});

export function toggleDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('show');
}