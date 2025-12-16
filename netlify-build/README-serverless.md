# TapSure Serverless Frontend

This build is 100% serverless and runs entirely in the browser:
- Receipt analysis uses Tesseract.js (OCR) and local JS parsing
- Coverage recommendations and chat are handled in-browser
- No backend or API required

To deploy:
- Use Netlify (or any static host) and set publish directory to `netlify-build`
- No backend configuration or proxying needed

All business logic and data flows are client-side. You can extend features by editing `assets/app.js`.
