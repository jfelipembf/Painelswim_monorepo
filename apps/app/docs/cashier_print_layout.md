# Caixa Diário — Layout de Impressão (Especificação)

Este documento define como deve ser o **relatório de impressão** da página **Caixa Diário**.

Objetivo: ao imprimir, o resultado deve parecer um **relatório financeiro**, e não uma “foto da tela” (dashboard/controles/UI).

## 1) Requisitos de UX na impressão

- Deve imprimir **somente o conteúdo do relatório**.
- Não deve imprimir:
  - Sidebar/navbar
  - botões, filtros e controles
  - sombras, backgrounds de cards e elementos decorativos
- Deve ter **hierarquia tipográfica** clara e legível.
- Deve ter **margens consistentes** e paginação correta.
- Deve ter **campos de assinatura** no final.

## 2) Estrutura do relatório (ordem)

1. **Cabeçalho**
   - Título: `Caixa Diário`
   - Unidade (`idBranch` → ideal exibir nome da unidade quando houver)
   - Período: `Início` e `Fim`
   - Data/hora de impressão
2. **Resumo (cards/totais)**
   - Status do caixa (ABERTO/FECHADO)
   - Saldo do período
   - Número de movimentações
3. **Tabela de movimentações**
   - Colunas:
     - Horário
     - Descrição (incluindo cliente quando for venda)
     - Tipo (ENTRADA/SAÍDA)
     - Valor
4. **Rodapé**
   - Observações (opcional)
   - Assinaturas:
     - Responsável
     - Conferente

## 3) Regras de dados

- Linhas do tipo **Venda** devem incluir **nome do cliente** (não exibir apenas `clientId`).
- Entradas/Saídas manuais devem exibir:
  - Descrição
  - Categoria (se aplicável)
- Ordenação recomendada:
  - Por data (desc) e horário (desc) dentro do período.

## 4) CSS de impressão (padrão recomendado)

Implementar CSS usando `@media print` para “modo relatório”.

### 4.1 Classes

- `.no-print`
  - Tudo que é controle de UI (filtros, botões, navbar)
- `.print-only`
  - Elementos que só fazem sentido no papel (assinaturas, cabeçalho extra)

### 4.2 Exemplo de CSS (base)

```css
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }

  /* Remove aparência de dashboard */
  body {
    background: #fff !important;
  }

  /* Melhor legibilidade */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Evitar quebra ruim de tabela */
  table,
  tr,
  td,
  th {
    page-break-inside: avoid;
  }
}

@media screen {
  .print-only {
    display: none;
  }
}
```

### 4.3 Melhorias recomendadas (quando quiser refinar)

- Definir margens do papel:

```css
@page {
  size: A4;
  margin: 12mm;
}
```

- Reduzir sombras/bordas de componentes na impressão:

```css
@media print {
  .MuiPaper-root {
    box-shadow: none !important;
  }
  .MuiCard-root {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}
```

- Ajustar tamanho de fonte para relatório:

```css
@media print {
  body {
    font-size: 12px;
  }
  h1,
  h2,
  h3 {
    margin: 0 0 6px 0;
  }
}
```

## 5) Implementação recomendada (evitar “foto da tela”)

Melhor prática: renderizar um **bloco de relatório** que funciona em tela e em print, e usar CSS para:

- esconder tudo que é UI
- deixar somente o bloco do relatório

Estratégia 1 (simples):

- manter tudo na mesma página e usar `.no-print` / `.print-only`.

Estratégia 2 (mais “limpa”):

- criar um componente específico (ex.: `CashierPrintView`) com layout focado em relatório e imprimir somente ele.

## 6) Checklist de aceitação

- [ ] Ao clicar em “Imprimir”, não aparecem botões/filtros/navbar no papel.
- [ ] Título e período aparecem no cabeçalho.
- [ ] A tabela imprime sem cortar colunas.
- [ ] Valores são impressos com formatação BRL.
- [ ] Assinaturas aparecem ao final.
- [ ] Vendas mostram **nome do cliente**.
