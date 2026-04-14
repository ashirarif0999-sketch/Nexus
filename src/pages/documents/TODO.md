# PDF Preview Implementation TODO

## Plan Steps
1. [x] Install dependencies (@react-pdf-viewer/core, default-layout, pdfjs-dist)
2. [x] Add CSS imports to src/index.css
3. [x] Update DocumentsPage.tsx with imports, plugin, Worker+Viewer in SignatureModal (uses public sample PDFs)
4. [ ] Add local sample PDFs to public/ for offline testing
5. [ ] Integrate real file URLs (S3/backend)
6. [ ] Test modal preview

Progress: Core implementation complete! Run `npm run dev` and test SignatureModal in DocumentsPage.
