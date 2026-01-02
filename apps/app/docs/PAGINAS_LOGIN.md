# Pasta: login

## Estrutura atual (resumo)

- `login/index.tsx`

## Inconsistencias percebidas

- Fluxo de auth esta dividido em pastas separadas (`login`, `forgot-password`).

## Padrao sugerido

- Consolidar em `pages/auth/` e reaproveitar layout.
- Centralizar textos e validacoes.

## Reuso/centralizacao

- Helpers de autenticacao e mensagens podem ir para `src/utils/`.

## Arquivos longos (prioridade)

- `login/index.tsx` (~252 linhas): separar layout e formulario.

## Status (comentado)

- [ ] Definir pasta unica para auth.
  - Comentario: alinhar com forgot-password.
