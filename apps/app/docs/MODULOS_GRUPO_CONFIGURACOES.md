# Grupo: Configuracoes

## Modulos

- settings

## UI relacionada (layouts)

- `src/layouts/pages/admin/settings/index.tsx`

## Padrao sugerido

- Criar `index.ts` para reexports.
- Padronizar nomes de arquivos: escolher entre `settings.*` ou mover
  `branchSettings.*` para uma subpasta (ex.: `settings/branch/`).

## Ajustes de posicionamento

- Manter configuracoes de unidade dentro do modulo `settings`, evitando
  criar logica em `services/` quando a regra for do dominio.

## Status (comentado)

- [x] Criado `index.ts` no modulo `settings`.
  - Comentario: reexports de `branchSettings.*`.
- [ ] Padronizar nomes (decidir entre `settings.*` ou subpasta `settings/branch/`).
  - Comentario: exige decisao de nomenclatura para evitar breaking changes.
