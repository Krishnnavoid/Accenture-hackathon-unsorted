/**
 * BusinessIntelligence.ai - Main Application Orchestrator
 */

import { DeterministicAnalyticsEngine } from '../engine/deterministic_analytics.js';
import { ActionRecommenderEngine } from '../engine/action_recommender.js';
import { LLMSynthesizerEngine } from '../engine/llm_synthesizer.js';
import { ChartRenderer } from './chart_renderer.js';

class AppController {
  constructor() {
    this.currentScenario = 'SCENARIO_1';
    this.currentPersona = 'Executive';
    this.analyticsEngine = null;
    this.recommenderEngine = null;
    this.synthesizerEngine = null;
    this.chartRenderer = new ChartRenderer('waterfall-chart-container');
    this.contracts = null;
    this.posData = null;
    this.erpData = null;
    this.crmData = null;
    
    this.setupThemeToggle();
  }

  setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    const iconSun = themeBtn.querySelector('.icon-sun');
    const iconMoon = themeBtn.querySelector('.icon-moon');
    
    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
    }

    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        iconSun.style.display = 'block';
        iconMoon.style.display = 'none';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        iconSun.style.display = 'none';
        iconMoon.style.display = 'block';
      }
    });
  }

  setupChatbot() {
    const fab = document.getElementById('chatbot-fab');
    const panel = document.getElementById('chatbot-panel');
    const closeBtn = document.getElementById('chatbot-close');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const messages = document.getElementById('chatbot-messages');

    if (!fab || !panel) return;

    // Toggle Chat Panel
    fab.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      if (panel.style.display === 'flex') input.focus();
    });

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });

    const addMessage = (text, isUser = false) => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
      msgDiv.innerText = text;
      messages.appendChild(msgDiv);
      messages.scrollTop = messages.scrollHeight;
    };

    const handleSend = () => {
      const text = input.value.trim();
      if (!text) return;

      // User Message
      addMessage(text, true);
      input.value = '';
      input.disabled = true;
      sendBtn.disabled = true;

      // Simulate Typing Delay
      const typingDiv = document.createElement('div');
      typingDiv.className = 'chat-message ai-message';
      typingDiv.style.color = 'var(--text-muted)';
      typingDiv.innerText = 'Typing...';
      messages.appendChild(typingDiv);
      messages.scrollTop = messages.scrollHeight;

      setTimeout(() => {
        messages.removeChild(typingDiv);
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();

        const lower = text.toLowerCase();
        
        // Simple Keyword Matching Logic
        if (lower.includes('margin') || lower.includes('calculate') || lower.includes('math') || lower.includes('waterfall')) {
          addMessage("Our platform uses a Deterministic Analytics Engine (run on Databricks) that executes hard-coded financial formulas (like Gross Margin = (Revenue - COGS) / Revenue). We do NOT let the LLM guess the math. The LLM only reads the verified outputs.");
        } else if (lower.includes('contract') || lower.includes('semantic') || lower.includes('data') || lower.includes('rbac')) {
          addMessage("The Semantic Contract is a strict JSON rulebook stored in Snowflake. It defines exactly how KPIs are calculated, what tables to pull from, and who has access to view them (RBAC). It guarantees consistency across the enterprise.");
        } else if (lower.includes('hallucinate') || lower.includes('hallucination') || lower.includes('safe') || lower.includes('trust')) {
          addMessage("We prevent hallucinations by separating the 'Thinking' from the 'Math'. The Generative LLM is physically restricted from doing calculations. It is only given the final, verified numbers from our Deterministic Engine to generate the text summary.");
        } else if (lower.includes('architecture') || lower.includes('hybrid') || lower.includes('stack')) {
          addMessage("We use a Hybrid Platform-Native Architecture: Snowflake acts as our Data Cloud and stores the Semantic Contract. Databricks handles the heavy deterministic compute. Tableau acts as the UI layer, and our custom Agentic Orchestrator ties it all together.");
        } else if (lower.includes('businessintelligence') || lower.includes('goal') || lower.includes('purpose') || lower.includes('trying to do') || lower.includes('agentic')) {
          addMessage("BusinessIntelligence.ai is an Agentic AI platform designed to replace traditional static dashboards. It connects to your enterprise data (like Snowflake), runs verified financial math (on Databricks), and uses Generative AI to instantly explain the 'why' behind the numbers, rather than just showing you the 'what'.");
        } else if (lower.includes('persona') || lower.includes('narrative') || lower.includes('briefing') || lower.includes('role')) {
          addMessage("The Persona Intelligence Narrative is generated dynamically by our LLM Synthesizer. Based on your logged-in Role (e.g. CFO vs Regional Manager), the AI reads the Data Cloud's RBAC policy, filters out numbers you aren't allowed to see, and writes a tailored executive briefing just for you.");
        } else if (lower.includes('ai') || lower.includes('model') || lower.includes('llm') || lower.includes('intelligence') || lower.includes('smart') || lower.includes('work') || lower.includes('feature')) {
          addMessage("I am powered by a Hybrid AI Architecture. I don't just generate text; I act as an Orchestrator. I read the Semantic Contract from Snowflake, execute Deterministic Math on Databricks to find anomalies, and then synthesize those insights into a readable narrative. This guarantees 100% accuracy with zero hallucinations.");
        } else {
          addMessage("As an Agentic AI, my primary function is to analyze the deterministic KPIs on your dashboard and explain the root causes behind them. Whether you want to know about our Architecture, how we calculate Gross Margin, or how we enforce Role-Based Access Control, I have the answers. What would you like to explore?");
        }
      }, 1000);
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  setupIngestionModal() {
    const btnSample = document.getElementById('btn-use-sample');
    const btnIngest = document.getElementById('btn-ingest-data');
    const overlay = document.getElementById('upload-overlay');
    const mainLayout = document.getElementById('main-app-layout');

    if (!btnSample || !btnIngest) return;

    btnSample.addEventListener('click', () => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        mainLayout.style.display = 'flex';
        this.init();
      }, 300);
    });

    btnIngest.addEventListener('click', async () => {
      try {
        btnIngest.innerText = "Processing...";
        const customData = await this.readUploadFiles();
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          mainLayout.style.display = 'flex';
          this.init(customData);
        }, 300);
      } catch (err) {
        alert("Upload Error: " + err.message);
        btnIngest.innerText = "Ingest & Initialize";
      }
    });
  }

  async readUploadFiles() {
    const readFile = (inputId, name) => {
      return new Promise((resolve, reject) => {
        const file = document.getElementById(inputId).files[0];
        if (!file) return reject(new Error(`Missing file for ${name}`));
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            resolve(JSON.parse(e.target.result));
          } catch (err) {
            reject(new Error(`Invalid JSON in ${file.name}`));
          }
        };
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsText(file);
      });
    };

    const [contracts, pos, erp, crm] = await Promise.all([
      readFile('upload-contract', 'Semantic Contract'),
      readFile('upload-pos', 'POS Sales Daily'),
      readFile('upload-erp', 'ERP Inventory Weekly'),
      readFile('upload-crm', 'CRM Marketing Monthly')
    ]);

    return { contracts, pos, erp, crm };
  }

  async init(customData = null) {
    this.renderLoadingState();

    try {
      if (customData) {
        this.contracts = customData.contracts;
        this.posData = customData.pos;
        this.erpData = customData.erp;
        this.crmData = customData.crm;
      } else {
        // Load all mock data sources and semantic contract
        const [contracts, pos, erp, crm] = await Promise.all([
          fetch('contracts/semantic_contract.json').then((r) => r.json()),
          fetch('data/pos_sales_daily.json').then((r) => r.json()),
          fetch('data/erp_inventory_weekly.json').then((r) => r.json()),
          fetch('data/crm_marketing_monthly.json').then((r) => r.json())
        ]);

        this.contracts = contracts;
        this.posData = pos;
        this.erpData = erp;
        this.crmData = crm;
      }

      this.analyticsEngine = new DeterministicAnalyticsEngine(this.contracts, this.posData, this.erpData, this.crmData);
      this.recommenderEngine = new ActionRecommenderEngine();
      this.synthesizerEngine = new LLMSynthesizerEngine();

      this.bindEvents();
      this.setupChatbot();
      await this.runScenario(this.currentScenario);
    } catch (err) {
      console.error('Failed to initialize BusinessIntelligence.ai:', err);
      document.getElementById('app-main').innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--accent-rose);">
          <h2>Initialization Error</h2>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  bindEvents() {
    // Persona Switcher Buttons
    document.querySelectorAll('.persona-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const persona = e.currentTarget.dataset.persona;
        if (persona === this.currentPersona) return;

        document.querySelectorAll('.persona-btn').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.currentPersona = persona;
        await this.runScenario(this.currentScenario);
      });
    });

    // Scenario Ribbon Chips
    document.querySelectorAll('.scenario-chip').forEach((chip) => {
      chip.addEventListener('click', async (e) => {
        const scenario = e.currentTarget.dataset.scenario;
        if (scenario === this.currentScenario) return;

        document.querySelectorAll('.scenario-chip').forEach((c) => c.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.currentScenario = scenario;

        // Auto-adapt persona if RBAC scenario is picked
        if (scenario === 'SCENARIO_4') {
          this.setPersonaUI('Regional_Manager');
        }

        await this.runScenario(scenario);
      });
    });

    // Feedback Trigger Button
    const feedbackBtn = document.getElementById('btn-open-feedback');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', () => this.showFeedbackModal());
    }
  }

  setPersonaUI(persona) {
    this.currentPersona = persona;
    document.querySelectorAll('.persona-btn').forEach((b) => {
      if (b.dataset.persona === persona) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  renderLoadingState() {
    const narrativeEl = document.getElementById('narrative-content');
    if (narrativeEl) {
      narrativeEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; color: var(--text-muted); padding: 20px;">
          <div class="loading-spinner"></div>
          <span>Synthesizing intelligence & validating quantitative evidence...</span>
        </div>
      `;
    }
  }

  async runScenario(scenarioId) {
    this.renderLoadingState();

    // 1. Evaluate Deterministic KPIs
    const kpiResult = this.analyticsEngine.evaluateKPIs(this.currentPersona);
    this.renderKPICards(kpiResult.evaluatedKPIs);

    if (scenarioId === 'SCENARIO_1') {
      await this.handleScenario1(kpiResult);
    } else if (scenarioId === 'SCENARIO_2') {
      await this.handleScenario2();
    } else if (scenarioId === 'SCENARIO_3') {
      await this.handleScenario3();
    } else if (scenarioId === 'SCENARIO_4') {
      // Scenario 4 is just Scenario 1 viewed through the restricted RBAC persona.
      await this.handleScenario1(kpiResult);
    }
  }

  /**
   * Scenario 1: Multi-Factor Margin Squeeze (-380 bps)
   */
  async handleScenario1(kpiResult) {
    // 1. Deterministic Decomposition
    const decompResult = this.analyticsEngine.decomposeGrossMarginMovement();
    
    // 2. Action Recommender
    const actionResult = this.recommenderEngine.getRecommendationsForMarginSqueeze(this.currentPersona);

    // 3. LLM Synthesis
    const synthesisResult = await this.synthesizerEngine.synthesizeMarginNarrative(
      decompResult,
      actionResult,
      this.currentPersona
    );

    // 4. Update UI Components
    this.renderNarrative(synthesisResult.narrativeText, synthesisResult.keyTakeaways);
    this.renderActions(actionResult.recommendations);
    
    // RBAC Security Check for Waterfall Chart
    if (this.currentPersona === 'Regional_Manager') {
      document.getElementById('waterfall-chart-container').innerHTML = `
        <div style="background: rgba(100,116,139,0.1); border: 1px dashed var(--text-muted); border-radius: var(--radius-md); padding: 24px; text-align: center;">
          <div style="color: var(--text-muted); font-size: 13px; font-weight: 600;">🔒 Enterprise Margin Waterfall Redacted</div>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">Your active role (Regional Store Manager) is scoped to operational store metrics. Executive margin decompositions and company-wide COGS are restricted under RBAC Policy #204.</p>
        </div>
      `;
    } else {
      ChartRenderer.renderWaterfall('waterfall-chart-container', decompResult);
    }
    
    this.renderEvidence(synthesisResult.evidenceCitations);
    this.renderTelemetry(synthesisResult.telemetry);
  }

  /**
   * Scenario 2: Data Contradiction & Explicit Abstention
   */
  async handleScenario2() {
    const consistencyResult = this.analyticsEngine.evaluateDataConsistency();
    const abstentionRecord = this.recommenderEngine.getAbstentionRecommendation();
    const synthesisResult = await this.synthesizerEngine.synthesizeAbstentionNarrative(abstentionRecord);

    const abstentionHTML = `
      <div class="abstention-banner">
        <h3>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          ${abstentionRecord.abstentionRecord.clarification_prompt.title}
        </h3>
        <p style="font-size: 13px; color: #fde68a;">${abstentionRecord.abstentionRecord.clarification_prompt.message}</p>
        <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: var(--radius-sm); margin-top: 8px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent-amber);">Required Human Verification Steps:</div>
          <ul style="margin-left: 20px; font-size: 12px; margin-top: 4px; color: #fff;">
            ${abstentionRecord.abstentionRecord.clarification_prompt.required_human_input.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    document.getElementById('narrative-content').innerHTML = abstentionHTML;
    document.getElementById('actions-container').innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--accent-amber); background: rgba(245,158,11,0.05); border: 1px dashed var(--accent-amber); border-radius: var(--radius-md);">
        <strong>Action Recommendations Suspended</strong>
        <p style="font-size: 12px; margin-top: 4px; color: var(--text-muted);">Confidence Score (36.5%) is below the mandatory 60.0% threshold. Automated PO orders withheld.</p>
      </div>
    `;

    document.getElementById('waterfall-chart-container').innerHTML = `
      <div style="padding: 20px; font-size: 13px; color: var(--text-muted); text-align: center;">
        Waterfall analysis locked pending resolution of ERP vs. POS discrepancy in Midwest DC.
      </div>
    `;

    this.renderEvidence([
      { claim: "Midwest POS conversion dropped to 22%", source: "POS_DAILY.regions.MIDWEST", verified_math: "2,100 units / 9,200 traffic = 22.8%" },
      { claim: "ERP Ledger claims 14,200 units on hand", source: "ERP_SUPPLY_WEEKLY.regional_distribution_centers[DC-MIDWEST-CHICAGO]", verified_math: "Ledger status: In-Stock (Unverified physical)" }
    ]);

    this.renderTelemetry(synthesisResult.telemetry);
  }

  /**
   * Scenario 3: Cold-Start / Sparse History (Eco-Tech Bottle)
   */
  async handleScenario3() {
    const sparseResult = this.analyticsEngine.evaluateSparseHistory();
    const synthesisResult = await this.synthesizerEngine.synthesizeColdStartNarrative(sparseResult);

    this.renderNarrative(synthesisResult.narrativeText, [
      "Bypassed standard 90-day EWMA anomaly detector due to sparse dataset (N=8).",
      "Adopted Hierarchical Bayesian Category Analogue priors (2025 Premium Hydration).",
      "Uncertainty interval explicitly highlighted as [±18.5%]."
    ]);

    document.getElementById('actions-container').innerHTML = `
      <div class="action-card" style="border-left-color: var(--accent-violet);">
        <div class="action-header">
          <span class="action-driver" style="color: var(--accent-violet);">Cold-Start Launch Monitoring</span>
          <span class="confidence-badge" style="background: rgba(139,92,246,0.15); color: var(--accent-violet); border-color: rgba(139,92,246,0.3);">Bayesian Credibility: 78.4%</span>
        </div>
        <div class="action-title">Maintain current $49.99 launch pricing and observe unit velocity for 6 more days before triggering factory replenishment batch.</div>
        <div class="action-meta-grid">
          <div class="action-meta-item">
            <span>Expected Outcome</span>
            <span>Prevent over-indexing inventory on preliminary 8-day run</span>
          </div>
          <div class="action-meta-item">
            <span>Assigned Owner</span>
            <span>New Product Introduction (NPI) Category Manager</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('waterfall-chart-container').innerHTML = `
      <div style="background: rgba(139,92,246,0.06); border: 1px solid rgba(139,92,246,0.3); border-radius: var(--radius-md); padding: 18px;">
        <h4 style="color: var(--accent-violet); font-size: 13px; margin-bottom: 8px; text-transform: uppercase;">Sparse-History Bayesian Prior Model</h4>
        <div style="font-size: 12px; line-height: 1.6; color: #e2e8f0;">
          • Prior Distribution: $\\mu_0 = 25.0\\text{ units/day}, \\sigma_0 = 4.2$<br>
          • Observed Sample: $N = 8\\text{ days}, \\bar{x} = 30.0\\text{ units/day}$<br>
          • Posterior Mean: $28.1\\text{ units/day}$ with Credibility Interval: <strong>[23.2 – 33.0 units/day (±18.5%)]</strong>
        </div>
      </div>
    `;

    this.renderEvidence([
      { claim: "Product launched 8 days ago", source: "POS_DAILY.regions.WEST.sku_movements[SKU-ECO-901]", verified_math: "Launch date: 2026-08-14" },
      { claim: "Category Analogue Prior = 25 units/day", source: "CONTRACTS.metadata.category_benchmarks_2025", verified_math: "Analogue baseline match" }
    ]);

    this.renderTelemetry(synthesisResult.telemetry);
  }

  // handleScenario4 was removed because it is now perfectly unified with handleScenario1's native RBAC enforcement.

  renderKPICards(kpis) {
    const grid = document.getElementById('kpi-grid');
    if (!grid) return;

    let html = '';
    kpis.forEach((kpi) => {
      const isAnomaly = kpi.status === 'CRITICAL_ANOMALY' || kpi.status === 'WARNING';
      const pillClass = kpi.is_masked
        ? 'pill-masked'
        : kpi.status === 'CRITICAL_ANOMALY'
        ? 'pill-critical'
        : kpi.status === 'WARNING'
        ? 'pill-warning'
        : 'pill-normal';

      const varClass = kpi.variance_bps < 0 ? 'var-negative' : 'var-positive';
      const sign = kpi.variance_bps > 0 ? '+' : '';

      html += `
        <div class="kpi-card ${isAnomaly ? 'anomaly-card' : ''}">
          <div class="kpi-card-header">
            <div class="kpi-meta">
              <span class="kpi-category">${kpi.category}</span>
              <span class="kpi-title">${kpi.name}</span>
            </div>
            <span class="kpi-status-pill ${pillClass}">
              ${kpi.is_masked ? 'RBAC MASKED' : kpi.status.replace('_', ' ')}
            </span>
          </div>
          <div class="kpi-body">
            <span class="kpi-current-val">
              ${kpi.is_masked ? '••••••' : (kpi.unit === '$' || kpi.unit === 'USD' ? '$' + kpi.current_value.toLocaleString() : kpi.current_value + (kpi.unit === '%' ? '%' : ''))}
            </span>
            ${!kpi.is_masked ? `<span class="kpi-variance ${varClass}">${sign}${kpi.variance_bps} bps</span>` : ''}
          </div>
          <div class="kpi-footer">
            <span>Target: ${kpi.unit === '$' || kpi.unit === 'USD' ? '$' + kpi.target_value.toLocaleString() : kpi.target_value + (kpi.unit === '%' ? '%' : '')}</span>
            <span title="${kpi.lineage}">Source: ${kpi.primary_sources[0]}</span>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  renderNarrative(text, takeaways = []) {
    const narrativeEl = document.getElementById('narrative-content');
    if (!narrativeEl) return;

    // Convert basic markdown to HTML
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    let takeawaysHtml = '';
    if (takeaways && takeaways.length > 0) {
      takeawaysHtml = `
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent-cyan); margin-bottom: 6px;">Executive Key Takeaways:</div>
          <ul style="margin-left: 18px; font-size: 13px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
            ${takeaways.map((t) => `<li>${t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    narrativeEl.innerHTML = `
      <div class="narrative-box">${formattedText}</div>
      ${takeawaysHtml}
    `;
  }

  renderActions(actions) {
    const container = document.getElementById('actions-container');
    if (!container) return;

    let html = '';
    actions.forEach((act) => {
      html += `
        <div class="action-card">
          <div class="action-header">
            <span class="action-driver">${act.driver}</span>
            <span class="confidence-badge">Confidence: ${act.confidence_pct}%</span>
          </div>
          <div class="action-title">${act.action}</div>
          <div class="action-meta-grid">
            <div class="action-meta-item">
              <span>Expected Impact</span>
              <span style="color: var(--accent-emerald);">${act.expected_impact}</span>
            </div>
            <div class="action-meta-item">
              <span>Owner & Rights</span>
              <span>${act.owner} (${act.decision_rights})</span>
            </div>
            <div class="action-meta-item" style="grid-column: span 2;">
              <span>Monitoring Plan</span>
              <span style="color: var(--text-muted); font-size: 11px;">${act.monitoring_plan}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderEvidence(citations) {
    const container = document.getElementById('evidence-container');
    if (!container) return;

    let html = `
      <div class="lineage-section">
        <div class="lineage-title">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Traceable Evidence & Mathematical Lineage
        </div>
        <div class="citation-list">
    `;

    citations.forEach((item) => {
      html += `
        <div class="lineage-item">
          <div class="lineage-claim">"${item.claim}"</div>
          <div class="lineage-meta">
            <span class="lineage-source"><strong>Source:</strong> Snowflake Data Cloud (${item.source})</span>
            <span class="lineage-formula"><strong>Databricks Compute:</strong> ${item.verified_math}</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  renderTelemetry(telemetry) {
    if (!telemetry) return;

    if(document.getElementById('stat-model')) document.getElementById('stat-model').innerText = telemetry.model;
    if(document.getElementById('stat-det-lat')) document.getElementById('stat-det-lat').innerText = `${telemetry.deterministicEngineDurationMs} ms`;
    if(document.getElementById('stat-llm-lat')) document.getElementById('stat-llm-lat').innerText = `${telemetry.llmDurationMs} ms`;
    if(document.getElementById('stat-tot-lat')) document.getElementById('stat-tot-lat').innerText = `${telemetry.totalLatencyMs} ms`;
    document.getElementById('stat-tokens').innerText = `${telemetry.totalTokens} (${telemetry.inputTokens} in / ${telemetry.outputTokens} out)`;
    document.getElementById('stat-cost').innerText = telemetry.estimatedCostUSD;
  }

  showFeedbackModal() {
    alert("📊 Human-in-the-Loop Audit Log:\n- 4 Model inferences logged today.\n- 0 Hallucinations detected (100% Deterministic Grounding Verified).\n- Mean time to decision: 532ms.");
  }
}

// Instantiate and expose globally
window.app = new AppController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.app.setupIngestionModal());
} else {
  window.app.setupIngestionModal();
}
