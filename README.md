# Tauri + Solid + Typescript

This template should help get you started developing with Tauri, Solid and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Pendências — Dashboard (`src/pages/Dashboard.tsx`)

Os cards abaixo ainda exibem `<NoData>` estático, sem dados reais do backend:

| Card | Dado esperado | Observações |
|---|---|---|
| **Última Compra** | Data, fornecedor e valor da última nota de entrada | Requer nova query/endpoint no módulo `entries` |
| **Última Venda** | Data e valor da última venda | Requer nova query/endpoint no módulo `sales` |
