import { supabaseClient } from '../supabase.js';
import { navegarPara } from '../router.js';

export function renderizarLogin() {
  const app = document.getElementById('app');
  app.className = 'container single-layout';
  app.innerHTML = `
    <div class="auth-container">
      <h2>Entrar no <span>Cria FATEC</span></h2>
      <form id="login-form">
        <div class="form-group">
          <label>E-mail *</label>
          <input type="email" id="email" required placeholder="seuemail@fatec.sp.gov.br">
        </div>
        <div class="form-group">
          <label>Senha *</label>
          <input type="password" id="senha" required placeholder="Sua senha">
        </div>
        <button type="submit" id="btn-login" class="btn-primary">Entrar</button>
        <p id="mensagem-status" class="status-msg"></p>
      </form>
      <p class="login-link">
        Ainda não tem conta? <a href="#" onclick="window.navegarPara('/cadastro'); return false;">Cadastre-se aqui</a>
      </p>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    const statusMsg = document.getElementById('mensagem-status');
    btn.disabled = true;
    statusMsg.style.color = 'var(--secondary)';
    statusMsg.textContent = 'Autenticando...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      statusMsg.style.color = 'var(--primary)';
      statusMsg.textContent = `Erro: ${error.message}`;
      btn.disabled = false;
    } else {
      statusMsg.style.color = '#4CAF50';
      statusMsg.textContent = 'Login efetuado!';
      setTimeout(() => navegarPara('/'), 800);
    }
  });
}

export function renderizarCadastro() {
  const app = document.getElementById('app');
  app.className = 'container single-layout';
  app.innerHTML = `
    <div class="auth-container">
      <h2>Criar Perfil no <span>Cria FATEC</span></h2>
      <form id="cadastro-form">
        <div class="form-group">
          <label>E-mail *</label>
          <input type="email" id="email" required placeholder="seuemail@fatec.sp.gov.br">
        </div>
        <div class="form-group">
          <label>Senha *</label>
          <input type="password" id="senha" required minlength="6" placeholder="Mínimo 6 caracteres">
        </div>
        <hr class="divider">
        <div class="form-group">
          <label>Nome Completo *</label>
          <input type="text" id="nome" required placeholder="Ex: Daniel Zornek">
        </div>
        <div class="form-group">
          <label>Nome de Usuário (@username) *</label>
          <input type="text" id="username" required placeholder="Ex: danielzornek">
        </div>
        <div class="form-group">
          <label>Nome Artístico (Opcional)</label>
          <input type="text" id="nome_artistico" placeholder="Ex: Zornek Art">
        </div>
        <div class="form-group">
          <label>Bio / Apresentação</label>
          <textarea id="bio" rows="3" placeholder="Conte um pouco sobre você..."></textarea>
        </div>
        <div class="form-group">
          <label>Habilidades (separadas por vírgula)</label>
          <input type="text" id="habilidades" placeholder="Ex: Ilustração, UI/UX, 3D">
        </div>
        <div class="form-group">
          <label>Foto de Perfil (Avatar)</label>
          <input type="file" id="avatar" accept="image/*">
        </div>
        <button type="submit" id="btn-cadastrar" class="btn-primary">Criar Conta e Perfil</button>
        <p id="mensagem-status" class="status-msg"></p>
      </form>
      <p class="login-link">
        Já tem uma conta? <a href="#" onclick="window.navegarPara('/login'); return false;">Faça Login</a>
      </p>
    </div>
  `;

  document.getElementById('cadastro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-cadastrar');
    const statusMsg = document.getElementById('mensagem-status');
    btn.disabled = true;
    statusMsg.style.color = 'var(--secondary)';
    statusMsg.textContent = 'Criando conta...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value;
    const nome = document.getElementById('nome').value.trim();
    const username = document.getElementById('username').value.trim();
    const nome_artistico = document.getElementById('nome_artistico').value.trim() || null;
    const bio = document.getElementById('bio').value.trim() || null;
    
    const habInput = document.getElementById('habilidades').value;
    const habilidades = habInput ? habInput.split(',').map(item => item.trim()).filter(Boolean) : [];
    const avatarFile = document.getElementById('avatar').files[0];

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({ email, password });
      if (authError) throw authError;

      const userId = authData.user?.id;
      let avatar_url = null;

      if (avatarFile && userId) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;
        const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
          avatar_url = publicUrlData.publicUrl;
        }
      }

      const { error: profileError } = await supabaseClient.from('profiles').insert([
        { id: userId, nome, username, nome_artistico, bio, habilidades, avatar_url }
      ]);

      if (profileError) throw profileError;

      statusMsg.style.color = '#4CAF50';
      statusMsg.textContent = 'Conta criada com sucesso!';
      setTimeout(() => navegarPara('/'), 1200);

    } catch (err) {
      statusMsg.style.color = 'var(--primary)';
      statusMsg.textContent = `Erro: ${err.message || 'Falha no cadastro.'}`;
      btn.disabled = false;
    }
  });
}