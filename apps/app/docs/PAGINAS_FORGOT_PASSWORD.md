# Pasta: forgot-password

## Estrutura atual (resumo)

- `forgot-password/index.tsx`

## Inconsistencias percebidas

- Fluxo de auth esta dividido entre `login` e `forgot-password` em pastas separadas.

## Padrao sugerido

- Agrupar auth em `pages/auth/` (ex.: `auth/login`, `auth/forgot-password`).
- Usar componentes compartilhados para layout e validacao de forms.

## Reuso/centralizacao

- Validacoes de email e mensagens padrao podem ir para `src/utils/validation`.

## Arquivos longos (prioridade)

- `forgot-password/index.tsx` (~128 linhas): manter simples; extrair layout se repetir em auth.

## Status (comentado)

- [ ] Definir estrutura de auth unica.
  - Comentario: agrupar login e reset de senha.
