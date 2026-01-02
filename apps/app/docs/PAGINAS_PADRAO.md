# Padrao geral de paginas (pages)

## Objetivo

- Definir uma estrutura unica para pastas de pagina.
- Padronizar nomenclatura de pastas/arquivos.
- Reduzir arquivos sobrecarregados e concentrar reuso.

## Nomenclatura

- Pastas: kebab-case (ex.: `event-plan`, `settle-debt`, `forgot-password`).
- Pagina: `index.tsx` como entrada unica da rota.
- Componentes React: PascalCase (ex.: `HeaderCard.tsx`).
- Pastas utilitarias: `constants/`, `utils/`, `hooks/`.
- Arquivos utilitarios: `types.ts`, `validation.ts`, `initialValues.ts`.
- Idioma dos nomes: ingles para pastas/arquivos; portugues apenas em textos de UI.

## Estrutura base recomendada

```
pages/<feature>/
  index.tsx
  components/
  components/modals/ (padrao oficial)
  hooks/
  constants/
  utils/
  types.ts
  validation.ts
  initialValues.ts (quando houver formulario)
  data/ (apenas mocks/fixtures)
```

## Decisoes de padrao (oficial)

- `types.ts` na raiz da pagina. Evitar `types/` com `index.ts`.
- `validation.ts` na raiz. Evitar `schemas/`.
- `initialValues.ts` na raiz quando existir formulario.
- `components/modals/` sempre em minusculo (evitar `Modals/`).
- `data/` apenas para mock/fixture. Dados reais vao para `src/constants/` ou `src/modules/`.
- `constants/` na pagina so quando o valor for exclusivo da pagina; se for reutilizavel, mover para `src/constants/`.
- `constants/` e `utils/` usam `index.ts` como ponto de entrada.

## Regras de uso

- Layouts importam apenas de `hooks/*` e `components/*` (evitar `modules/*`).
- Componentes compartilhados entre paginas: mover para `src/components/`.
- Componentes compartilhados apenas entre layouts: `src/layouts/components/`.
- Constantes globais: `src/constants/`.
- Constantes e validacoes de dominio: `src/modules/<dominio>/`.
- `data/` nao deve conter dados reais de producao.

## Checklist por pasta

- [ ] Pasta em kebab-case.
- [ ] `index.tsx` presente.
- [ ] `components/` para UI de pagina.
- [ ] `modals/` ou `dialogs/` padronizados.
- [ ] `constants/`, `types.ts`, `utils/`, `validation.ts` quando necessario.
- [ ] Imports usando `hooks/*` e `components/*`.
