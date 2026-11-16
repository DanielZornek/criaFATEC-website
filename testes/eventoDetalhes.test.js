import { extrairIdDaUrl, obterImagemEvento, formatarDataEvento } from '../src/js/utils/formatters.js';

describe('Módulo Web - Funções Utilitárias de Eventos', () => {
  
  test('Deve extrair corretamente o ID do evento a partir do hash da URL', () => {
    expect(extrairIdDaUrl('#evento?id=uuid-12345')).toBe('uuid-12345');
    expect(extrairIdDaUrl('#evento')).toBeNull();
  });

  test('Deve aplicar a imagem padrão quando a URL do evento for nula ou vazia', () => {
    expect(obterImagemEvento(null)).toBe('src/assets/evento-default.jpg');
    expect(obterImagemEvento('')).toBe('src/assets/evento-default.jpg');
  });

  test('Deve manter a URL personalizada quando cadastrada', () => {
    const url = 'https://supabase.co/storage/evento.png';
    expect(obterImagemEvento(url)).toBe(url);
  });

  test('Deve formatar a data corretamente no padrão brasileiro', () => {
    const resultado = formatarDataEvento('2026-11-20T00:00:00Z');
    expect(resultado).toBe('20/11/2026');
  });

  test('Deve retornar "Data a definir" quando não houver data informada', () => {
    expect(formatarDataEvento(null)).toBe('Data a definir');
  });

});