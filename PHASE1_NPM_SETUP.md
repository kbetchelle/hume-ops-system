# Phase 1 Setup Instructions

## NPM Packages Installation

Run the following commands to install required dependencies for PDF handling:

```bash
# PDF rendering and text extraction library
npm install react-pdf pdfjs-dist

# TypeScript definitions
npm install --save-dev @types/pdfjs-dist
```

### Package Details

**react-pdf** (v7.x)
- Purpose: React components for displaying PDFs
- Used in: PdfViewerWithFlags.tsx, PDF preview components
- Features: Page-by-page rendering, zoom, navigation

**pdfjs-dist** (v4.x)
- Purpose: Mozilla's PDF.js library for parsing PDFs
- Used in: Text extraction, page count, thumbnail generation
- Features: Extract text from PDFs, get metadata, render to canvas

### Package.json Additions

After installation, verify these entries in your `package.json`:

```json
{
  "dependencies": {
    "react-pdf": "^7.7.0",
    "pdfjs-dist": "^4.0.0"
  },
  "devDependencies": {
    "@types/pdfjs-dist": "^2.10.0"
  }
}
```

## Configuration

### PDF.js Worker Configuration

The PDF.js worker needs to be configured. This is handled in `src/lib/pdfUtils.ts`:

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker URL (uses CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

### Alternative: Self-Hosted Worker

If you prefer to self-host the worker (better for offline/security):

```typescript
// In vite.config.ts, copy worker file
import { defineConfig } from 'vite';

export default defineConfig({
  // ... other config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-worker': ['pdfjs-dist/build/pdf.worker.entry']
        }
      }
    }
  }
});

// Then in pdfUtils.ts:
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

## Verification

After installation, verify packages are installed:

```bash
npm ls react-pdf pdfjs-dist
```

Expected output:
```
your-project@1.0.0
├── react-pdf@7.7.0
└── pdfjs-dist@4.0.0
```

## Troubleshooting

### Common Issues

**Issue 1: Worker not found**
```
Error: Setting up fake worker failed: "Cannot read properties of undefined"
```
Solution: Ensure worker URL is configured before any PDF operations

**Issue 2: CORS errors with CDN**
Solution: Use self-hosted worker or configure CDN headers

**Issue 3: Build size warnings**
PDF.js is large (~2MB). Consider:
- Lazy loading PDF components
- Code splitting
- Using CDN worker instead of bundling

## Next Steps

After installing packages:
1. ✅ Run `npm install`
2. ✅ Verify packages in package.json
3. ⏳ Create pdfUtils.ts (next step)
4. ⏳ Run migrations
5. ⏳ Implement Phase 2 components
