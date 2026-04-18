# Thyla Frontend - Agent Builder UI

React + TypeScript + React Flow application for building and executing agent graphs.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── nodes/           # Custom node components
│   │   │   ├── InputNode.tsx
│   │   │   ├── LLMNode.tsx
│   │   │   └── OutputNode.tsx
│   │   ├── NodePalette.tsx   # Drag & drop node palette
│   │   ├── ConfigPanel.tsx   # Node configuration panel
│   │   ├── GraphCanvas.tsx   # React Flow canvas
│   │   └── OutputConsole.tsx # Output display
│   ├── hooks/
│   │   └── useGraph.ts       # Graph state management
│   ├── services/
│   │   └── api.ts            # Backend API integration
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── App.tsx               # Main application
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## Installation

```bash
cd frontend
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The UI will be available at `http://localhost:5173`

## Backend Connection

The frontend is configured to proxy API requests to the backend:
- API: `http://localhost:3000/api`
- WebSocket: `ws://localhost:3000/stream`

Make sure the backend is running before starting the frontend.

## Features

- **Visual Graph Builder**: Drag and drop nodes to create agent workflows
- **Node Types**: Input, LLM, and Output nodes
- **Configuration Panel**: Configure node parameters
- **Graph Export**: Export graph to backend-compatible JSON format
- **Execution**: Run agents via REST API
- **Output Console**: View execution results

## Usage

1. Drag nodes from the palette to the canvas
2. Connect nodes by dragging from handles
3. Select nodes to configure them
4. Click "Run Agent" to execute
5. View results in the output console

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.
