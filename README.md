# BusinessIntelligence.ai - Autonomous KPI Intelligence-to-Action Engine

## Accenture Innovation Challenge 2026 - Round 2

**BusinessIntelligence.ai** is a hybrid platform-native intelligence engine designed to bridge the gap between deterministic financial math and probabilistic AI reasoning.

### Features
- **Deterministic Analytics Engine**: Computes anomalies and waterfall variance completely mathematically, ensuring zero hallucinations.
- **LLM Synthesizer**: Connects to the Gemini API (or runs in mock mode) to generate persona-adaptive executive briefings based purely on verified mathematical outputs.
- **RBAC & Security**: Demonstrates column/row-level data masking for different user personas (e.g. Executive vs. Regional Manager).
- **Data Reconciliation**: Seamlessly merges simulated data from POS (Daily), ERP (Weekly), and CRM (Monthly) systems.

### How to Run Locally

Because this prototype utilizes JavaScript ES Modules (`import`/`export`) and `fetch` calls, **it cannot be run by simply double-clicking `index.html`** (browsers block this due to CORS/file protocols). 

You must run it through a local development server.

#### Method 1: Using Python (Recommended)
If you have Python installed, open your terminal in this repository's folder and run:
\`\`\`bash
python -m http.server 8000
\`\`\`
Then open your browser and navigate to: \`http://localhost:8000\`

#### Method 2: Using Node.js / npx
If you have Node.js installed, you can use the `serve` package:
\`\`\`bash
npx serve .
\`\`\`

#### Using the Live LLM Feature
1. On the initial "Ingest Enterprise Data" screen, you can provide an optional **Gemini API Key**.
2. If provided, the engine will make live calls to `gemini-1.5-flash` to synthesize the KPI insights dynamically.
3. If no key is provided, the engine gracefully falls back to high-quality mock responses for the purpose of the demonstration.
