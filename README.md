#  Statement Studio

A browser-only converter for fixed-width TXT member and bank statements. Upload one or more TXT files, review and edit extracted rows, then download an Excel workbook with one sheet per file. Files are processed locally; there is no server or account.

## Run locally

Serve this directory using `python3 -m http.server 8000`, then open `http://localhost:8000`. The ES modules require HTTP rather than a `file://` URL. No build or npm install is needed.

## GitHub Pages

This site deploys from the `main` branch root. The public URL is `https://mathaimarvin.github.io/parser/`. HTTPS is recommended for confidential statements.

## Data checks

The converter supports the fixed-width layouts in FWM516, FWM796, and FWM772. It preserves account sections, original line numbers, and the displayed Debit, Credit and Balance columns. The balance is copied from the report; editing debit or credit does not recalculate it. Review all edits and warnings against the original report. For other report layouts, the parser may reject the file or flag skipped dated rows. The app does not retain data across reloads. Never commit real financial TXT files or exported workbooks to a public repository.
