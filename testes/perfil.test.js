
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/js/supabase.js', () => ({
  supabase: {
    supabaseUrl: 'https://teste.supabase.co'
  }
}));

jest.unstable_mockModule('../src/js/utils/avatar.js', () => ({
  obterUrlAvatar: jest.fn()
}));

const { obterAvatarPerfil } = await import('../src/js/pages/perfil.js');

describe('Módulo Web - Perfil do Usuário', () => {
  test('Deve retornar a imagem padrão quando não houver avatar', () => {
    expect(obterAvatarPerfil(null)).toBe('src/assets/evento-default.jpg');
  });

  test('Deve retornar a imagem padrão quando o avatar estiver vazio', () => {
    expect(obterAvatarPerfil('')).toBe('src/assets/evento-default.jpg');
  });

  test('Deve manter a URL quando o avatar for externo', () => {
    const url = 'https://site.com/avatar.png';
    expect(obterAvatarPerfil(url)).toBe(url);
  });

  test('Deve manter a imagem quando o avatar for Base64', () => {
    const url = 'data:image/png;base64,abc123';
    expect(obterAvatarPerfil(url)).toBe(url);
  });

  test('Deve montar a URL quando receber apenas o nome do arquivo', () => {
    expect(obterAvatarPerfil('avatar.png')).toBe(
      'https://teste.supabase.co/storage/v1/object/public/avatars/avatar.png'
    );
  });
});
