# Pasta: errors

## Estrutura atual (resumo)

- `errors/accessDenied/index.tsx`

## Inconsistencias percebidas

- Apenas uma pagina de erro; nao ha 404/500 ou estrutura de fallback.
- Nome `accessDenied` nao segue o mesmo padrao de outras paginas (kebab-case).

## Padrao sugerido

- Criar estrutura `errors/<erro>/index.tsx` com nomes padronizados.
- Definir componentes compartilhados de erro em `components/ErrorPage`.

## Reuso/centralizacao

- Textos e codigos de erro podem ficar em `src/constants/status.ts`.

## Arquivos longos (prioridade)

- `errors/accessDenied/index.tsx` (~43 linhas): manter simples.

## Status (comentado)

- [ ] Definir set minimo de paginas de erro (404, 500, access denied).
  - Comentario: padrao unico de layout e mensagens.
- [ ] Padronizar nome das pastas (kebab-case).
  - Comentario: manter consistencia com outras pages.
