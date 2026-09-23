import { rotear, navegarPara } from './router.js';
import { fazerLogout, toggleDropdown } from './auth.js';
import { deletarConta } from './pages/perfil.js';
import { deletarPost } from './pages/postModal.js';
import { 
  abrirModalPost, 
  fecharModalPost, 
  abrirModalDetalhes, 
  fecharModalDetalhes, 
  inicializarFormularioPost 
} from './pages/postModal.js';

// Expor funções globais para usar em eventos HTML (onclick)
window.navegarPara = navegarPara;
window.fazerLogout = fazerLogout;
window.toggleDropdown = toggleDropdown;
window.deletarConta = deletarConta;
window.abrirModalPost = abrirModalPost;
window.fecharModalPost = fecharModalPost;
window.abrirModalDetalhes = abrirModalDetalhes;
window.fecharModalDetalhes = fecharModalDetalhes;
window.deletarPost = deletarPost;

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  rotear();
  inicializarFormularioPost();
});