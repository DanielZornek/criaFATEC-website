import { rotear, navegarPara } from './router.js';
import { fazerLogout, toggleDropdown } from './auth.js';
import { deletarConta } from './pages/perfil.js';
import { abrirModalDetalhes, fecharModalDetalhes } from './pages/postModal.js';

// Expor funções globais para usar em eventos HTML (onclick)
window.navegarPara = navegarPara;
window.fazerLogout = fazerLogout;
window.toggleDropdown = toggleDropdown;
window.deletarConta = deletarConta;
window.abrirModalDetalhes = abrirModalDetalhes;
window.fecharModalDetalhes = fecharModalDetalhes;

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  rotear();
});