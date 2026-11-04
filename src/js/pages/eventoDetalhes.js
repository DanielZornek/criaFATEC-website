// src/js/pages/eventoDetalhes.js
import { supabase as supabaseClient } from '../supabase.js';

export async function renderizarEventoDetalhes() {
  const app = document.getElementById('app');
  if (!app) return;

  // Altera a classe do app para um layout de página interna limpo
  app.className = 'container evento-detalhes-page';
  
  // Pega o ID do evento da URL (ex: /#evento?id=uuid-do-evento ou hash params)
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const eventoId = params.get('id');

  if (!eventoId) {
    app.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #fff;">
        <h2>Evento não encontrado</h2>
        <p style="color: #aaa; margin: 15px 0;">O link acessado não contém um ID válido.</p>
        <button onclick="window.navegarPara('/')" class="btn-hero" style="cursor: pointer; padding: 10px 20px; border: none; border-radius: 6px; background: #279AF1; color: #fff; font-weight: bold;">Voltar para o Início</button>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px 0; color: #fff;">
      <button onclick="window.navegarPara('/')" style="background: transparent; border: 1px solid #444; color: #ccc; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; transition: 0.2s;">
        ← Voltar para a Galeria
      </button>
      <p class="loading" style="text-align: center; padding: 40px;">Carregando detalhes do evento...</p>
    </div>
  `;

  // Busca o evento específico no Supabase
  const { data: evento, error } = await supabaseClient
    .from('events')
    .select('*')
    .eq('id', eventoId)
    .single();

  if (error || !evento) {
    app.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 40px; text-align: center; color: #fff;">
        <h2>Ops! Evento não encontrado</h2>
        <p style="color: #aaa; margin: 15px 0;">Este evento pode ter sido removido ou o link está incorreto.</p>
        <button onclick="window.navegarPara('/')" style="padding: 10px 20px; border: none; border-radius: 6px; background: #279AF1; color: #fff; cursor: pointer; font-weight: bold;">Voltar para o Início</button>
      </div>
    `;
    return;
  }

  const dataFormatada = evento.data_evento ? new Date(evento.data_evento).toLocaleDateString('pt-BR', { timeZone: 'UTC', dateStyle: 'full' }) : 'Data a definir';
  const categoria = evento.categoria || 'Geral';

  app.innerHTML = `
    <div style="max-width: 850px; margin: 0 auto; padding: 10px 0 60px 0; color: #fff; text-align: left;">
      
      <button onclick="window.navegarPara('/')" style="background: rgba(255,255,255,0.05); border: 1px solid #333; color: #bbb; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-bottom: 25px; transition: 0.2s;">
        ← Voltar ao Início
      </button>

      ${evento.imagem_url ? `
        <div style="width: 100%; max-height: 450px; overflow: hidden; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
          <img src="${evento.imagem_url}" alt="${evento.titulo}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      ` : ''}

      <div style="display: flex; gap: 12px; margin-bottom: 15px; flex-wrap: wrap; align-items: center;">
        <span style="background: #279AF1; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">🏷️ ${categoria}</span>
        <span style="background: #1e2227; border: 1px solid #333; color: #279AF1; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">📅 ${dataFormatada}</span>
        ${evento.local ? `<span style="background: #1e2227; border: 1px solid #333; color: #aaa; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem;">📍 ${evento.local}</span>` : ''}
      </div>

      <h1 style="font-size: 2.4rem; margin-bottom: 20px; color: #fff; line-height: 1.2;">${evento.titulo}</h1>

      <div style="font-size: 1.1rem; line-height: 1.8; color: #ddd; white-space: pre-line; background: rgba(255,255,255,0.02); padding: 25px; border-radius: 10px; border-left: 5px solid #279AF1; border: 1px solid rgba(255,255,255,0.05);">
        ${evento.descricao || 'Nenhuma descrição detalhada informada para este evento.'}
      </div>
      
    </div>
  `;
}