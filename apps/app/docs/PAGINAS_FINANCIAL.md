# Pasta: financial

## Estrutura atual (resumo)

- `financial/acquirers/index.tsx`
- `financial/cashflow/index.tsx`
- `financial/cashier/index.tsx`
- `financial/cashier/print.tsx`

## Inconsistencias percebidas

- `cashier/print.tsx` esta junto da pagina principal, sem subpasta de componente.
- Nomes mistos (`cashflow` vs `cashier`) sem padrao de pastas de suporte.
- `acquirers/index.tsx` contem tipos e helpers que poderiam estar em `types.ts`/`utils/`.

## Padrao sugerido

- Criar `components/` para subcomponentes e `print/` para impressao.
- Centralizar formatacao de moeda e status em `src/utils/` e `src/constants/`.
- Extrair mapeamentos de payload para `utils/`.

## Reuso/centralizacao

- Labels de pagamento, status e formatos podem ser reutilizados em sales/clients.
- Reaproveitar `cardBrands` de `src/constants/cardBrands.ts`.

## Arquivos longos (prioridade)

- `financial/acquirers/index.tsx` (~670 linhas): dividir em `components/`, `types.ts`, `utils/`.
- `financial/cashier/index.tsx` (~599 linhas): separar tabela, modals e logica de fetch em hook.
- `financial/cashflow/index.tsx` (~313 linhas): extrair filtros e chart config.
- `financial/cashier/print.tsx` (~291 linhas): mover para `components/print/`.

## Status (comentado)

- [ ] Reorganizar `cashier/print` em subpasta.
  - Comentario: separar layout de impressao.
- [ ] Centralizar helpers de moeda.
  - Comentario: evitar formatadores duplicados.
