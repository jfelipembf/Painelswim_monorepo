# Pasta: account

## Estrutura atual (resumo)

- `src/layouts/pages/account/components/FormField/index.tsx`

## Inconsistencias percebidas

- `FormField` esta dentro de `pages/account`, mas e usado por varias telas fora de account.
- A pasta nao possui `index.tsx` de pagina, apenas componente compartilhado.

## Padrao geral (referencia)

- Ver `docs/PAGINAS_PADRAO.md` para regras de estrutura e nomenclatura.

## Padrao sugerido

- Tratar `account` como pasta de pagina apenas se houver rota real.
- Mover `FormField` para `src/components/FormField` (ou `src/layouts/components/FormField`).
- Se houver paginas de conta no futuro, criar `pages/account/index.tsx` seguindo o padrao geral.

## Reuso/centralizacao

- Padronizar props do `FormField` para reutilizar em selects, autocomplete e inputs base.
- Centralizar estilos comuns em `src/components` para evitar paths de pages.

## Status (comentado)

- [x] Mapear onde `FormField` e importado.
  - Comentario: path unificado para `components/FormField`.
- [x] Definir destino oficial para `FormField`.
  - Comentario: movido para `src/components/FormField`.
- [x] Mover `FormField` e atualizar imports.
  - Comentario: removida dependencia de `pages/account`.
- [x] Verificar se `pages/account` deve existir como rota.
  - Comentario: pasta removida por estar vazia.
