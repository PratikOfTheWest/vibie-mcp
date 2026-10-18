# Contributing to Vibie MCP

We welcome contributions to make **Vibie** the definitive AI video editor MCP for open-source post-production!

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PratikOfTheWest/vibie-mcp.git
   cd vibie-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   # or watch mode:
   npm run watch
   ```

## Architecture Guidelines

- **Tool Packs:** Keep domain tools modular (`project.ts`, `timeline.ts`, `audio.ts`, `color.ts`, `vision.ts`, `graphics.ts`, `export.ts`). Always register tools conditionally using `isToolInPack`.
- **Validation:** Use strict Zod schemas for all tool parameters with descriptive markdown explanations.
- **Audit Receipts:** Every modifying tool should record an audit receipt via `ReceiptManager.createReceipt` so models and users can trace changes.
- **Clean Room & Open Source:** Follow the principles laid out by FilmCraft—keep external tools open and independently implementable.
