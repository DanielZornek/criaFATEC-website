// src/js/router.js
import { verificarSessao } from './auth.js';
import { renderizarFeed } from './pages/feed.js';
import { renderPerfilPage as renderizarPerfil } from './pages/perfil.js';
import { renderizarLogin, renderizarCadastro } from './pages/authPages.js';

export function navegarPara(path) {
  if (path.startsWith('/perfil')) {
    window.location.hash = path.replace('/perfil', '#perfil');
    return;
  }
  window.history.pushState({}, '', path);
  rotear();
}

window.navegarPara = navegarPara;

window.addEventListener('popstate', rotear);
window.addEventListener('hashchange', rotear);
window.addEventListener('DOMContentLoaded', rotear);

export async function rotear() {
  const hash = window.location.hash;
  const path = window.location.pathname;
  const app = document.getElementById('app');

  // Seleciona as seções fixas do index.html para controlar visibilidade
  const carousel = document.querySelector('.hero-carousel-container');
  const stats = document.querySelector('.stats-bar');
  const categories = document.querySelector('.categories-section');

  await verificarSessao();

  if (app) {
    app.classList.remove('page-transition');
    void app.offsetWidth;
  }

  // Se estiver no PERFIL, LOGIN ou CADASTRO -> ESCONDE o carrossel, métricas e categorias
  if (hash.startsWith('#perfil') || hash.startsWith('#login') || hash.startsWith('#cadastro')) {
    if (carousel) carousel.style.display = 'none';
    if (stats) stats.style.display = 'none';
    if (categories) categories.style.display = 'none';
  } else {
    // Se estiver no FEED (Página inicial) -> EXIBE novamente
    if (carousel) carousel.style.display = 'block';
    if (stats) stats.style.display = 'flex';
    if (categories) categories.style.display = 'block';
  }

  // Roteamento
  if (hash.startsWith('#perfil')) {
    await renderizarPerfil();
  } else if (hash.startsWith('#login')) {
    await renderizarLogin();
  } else if (hash.startsWith('#cadastro')) {
    await renderizarCadastro();
  } else if (path === '/perfil' || path.endsWith('/perfil')) {
    window.location.replace('./#perfil');
    return;
  } else {
    await renderizarFeed();
  }

  if (app) {
    app.classList.add('page-transition');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}