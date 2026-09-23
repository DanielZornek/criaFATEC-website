import { verificarSessao } from './auth.js';
import { renderizarFeed } from './pages/feed.js';
import { renderizarPerfil } from './pages/perfil.js';
import { renderizarLogin, renderizarCadastro } from './pages/authPages.js';

export function navegarPara(path) {
  window.history.pushState({}, '', path);
  rotear();
}

// Expõe no objeto global para ser chamado em atributos inline HTML
window.navegarPara = navegarPara;

window.addEventListener('popstate', rotear);

export async function rotear() {
  const path = window.location.pathname;
  const app = document.getElementById('app');

  await verificarSessao();

  // 1. Remove a classe de animação para reiniciar o estado
  if (app) {
    app.classList.remove('page-transition');
    // Força reflow no navegador
    void app.offsetWidth;
  }

  // 2. Renderiza a página correspondente
  if (path === '/login') {
    await renderizarLogin();
  } else if (path === '/cadastro') {
    await renderizarCadastro();
  } else if (path === '/perfil') {
    await renderizarPerfil();
  } else {
    await renderizarFeed();
  }

  // 3. Aplica a animação de transição na tela inteira
  if (app) {
    app.classList.add('page-transition');
  }

  // Rola a página suavemente até o topo em cada troca de tela
  window.scrollTo({ top: 0, behavior: 'smooth' });
}