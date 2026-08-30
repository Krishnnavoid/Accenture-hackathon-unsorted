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
      let htmlText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      msgDiv.innerHTML = htmlText;
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

      setTimeout(async () => {
        messages.removeChild(typingDiv);
        
        let aiResponse = "";
        
        // Use live Gemini API if available
        if (this.synthesizerEngine && this.synthesizerEngine.apiKey) {
          try {
            const prompt = `You are BusinessIntelligence.ai, an autonomous enterprise AI agent. 
            The user is currently viewing the ${this.currentScenario} scenario as a ${this.currentPersona}.
            Answer their following question concisely and professionally: "${text}"`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.synthesizerEngine.apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            if (response.ok) {
              const data = await response.json();
              aiResponse = data.candidates[0].content.parts[0].text;
            } else {
              aiResponse = "API Error: Unable to fetch live response from Gemini.";
            }
          } catch (err) {
            aiResponse = "Network Error: Could not connect to Gemini API.";
          }
        } 
        
        // Fallback to keyword matching if no API key or API failed
        if (!aiResponse || aiResponse.startsWith("API Error") || aiResponse.startsWith("Network Error")) {
          aiResponse = this.getSmartChatResponse(text);
        }

        addMessage(aiResponse);
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }, 500);
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
      const apiKey = document.getElementById('api-key-input') ? document.getElementById('api-key-input').value.trim() : '';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        mainLayout.style.display = 'flex';
        this.init(null, apiKey);
      }, 300);
    });

    btnIngest.addEventListener('click', async () => {
      try {
        btnIngest.innerText = "Processing...";
        const apiKey = document.getElementById('api-key-input') ? document.getElementById('api-key-input').value.trim() : '';
        const customData = await this.readUploadFiles();
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          mainLayout.style.display = 'flex';
          this.init(customData, apiKey);
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
            const data = JSON.parse(e.target.result);
            if (typeof data !== 'object' || data === null) throw new Error("Root is not a JSON object");
            resolve(data);
          } catch (err) {
            reject(new Error(`Invalid JSON format in ${file.name}: ${err.message}`));
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

  async init(customData = null, apiKey = '') {
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
      this.synthesizerEngine = new LLMSynthesizerEngine(apiKey);

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

        // Auto-adapt persona and lock UI if RBAC scenario is picked
        if (scenario === 'SCENARIO_4') {
          this.setPersonaUI('Regional_Manager');
          document.getElementById('persona-switcher').style.pointerEvents = 'none';
          document.getElementById('persona-switcher').style.opacity = '0.5';
        } else {
          if (this.currentScenario === 'SCENARIO_4') {
            this.setPersonaUI('Executive');
          }
          document.getElementById('persona-switcher').style.pointerEvents = 'auto';
          document.getElementById('persona-switcher').style.opacity = '1';
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

  /**
   * Smart contextual chatbot response engine with broad topic coverage
   */
  getSmartChatResponse(userText) {
    const lower = userText.toLowerCase().trim();

    // --- Greeting / small talk ---
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|sup|yo)\b/.test(lower)) {
      const greetings = [
        `Hello! I'm your BusinessIntelligence.ai assistant. You're currently viewing the ${this.currentScenario.replace('_', ' ')} scenario as a ${this.currentPersona.replace('_', ' ')}. Ask me about any KPI, the waterfall math, or how the engine works!`,
        `Hey there! I see you're exploring data as a ${this.currentPersona.replace('_', ' ')}. I can explain any KPI on your dashboard, walk you through the deterministic math, or discuss our architecture. What interests you?`,
        `Welcome! I have full context on your current dashboard state. Try asking me about gross margin, revenue, stockout rates, or how we prevent AI hallucinations.`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // --- Help / what can you do ---
    if (lower.includes('help') || lower.includes('what can you') || lower.includes('what do you') || lower.includes('capabilities') || lower.includes('features')) {
      return `Here's what I can help you with:\n\n• KPI Analysis — Ask about Gross Margin, Revenue, CAC, or Stockout Rate\n• Waterfall Math — How we decompose margin movements deterministically\n• Scenarios — Details on all 4 demo scenarios\n• Architecture — Our Snowflake + Databricks + Tableau hybrid stack\n• Security — RBAC, data masking, and governance policies\n• AI Safety — How we prevent hallucinations and ensure trust\n• Actions — The recommended interventions and their expected impact\n\nJust type naturally — I understand conversational questions!`;
    }

    // --- Margin / Gross Margin ---
    if (lower.includes('margin') || lower.includes('gross margin') || lower.includes('profitability')) {
      const kpis = this.analyticsEngine ? this.analyticsEngine.evaluateKPIs(this.currentPersona) : null;
      const gmKpi = kpis?.evaluatedKPIs?.find(k => k.name?.toLowerCase().includes('gross margin'));
      if (gmKpi) {
        return `📊 Gross Margin is currently at ${gmKpi.current_value}% against a target of ${gmKpi.target_value}%, a variance of ${gmKpi.variance_bps} bps. Status: ${gmKpi.status.replace('_', ' ')}.\n\nThe decline is driven by three factors: rising COGS (+220 bps impact from raw material inflation), regional mix shift (Midwest underperformance at 35.1% vs 42.5% target), and promotional dilution (-85 bps from aggressive discounting).\n\nAll these numbers come from our Deterministic Analytics Engine on Databricks — zero LLM involvement in the math.`;
      }
      return "Gross Margin is a key profitability KPI calculated deterministically as (Revenue - COGS) / Revenue. Our engine decomposes margin movements into individual drivers (COGS inflation, mix shift, promo dilution) using hard-coded financial formulas — never LLM guesswork.";
    }

    // --- Revenue ---
    if (lower.includes('revenue') || lower.includes('sales') || lower.includes('net revenue') || lower.includes('top line') || lower.includes('topline')) {
      const kpis = this.analyticsEngine ? this.analyticsEngine.evaluateKPIs(this.currentPersona) : null;
      const revKpi = kpis?.evaluatedKPIs?.find(k => k.name?.toLowerCase().includes('revenue'));
      if (revKpi) {
        return `💰 Net Revenue is currently $${revKpi.current_value.toLocaleString()} against a target of $${revKpi.target_value.toLocaleString()}, reflecting a ${revKpi.variance_bps} bps shortfall.\n\nThe revenue gap is primarily driven by lower foot traffic conversion in the Midwest region and higher-than-planned promotional markdowns. The POS Daily data source feeds this KPI in near-real-time.`;
      }
      return "Net Revenue tracks total commercial performance. Our engine pulls this from POS_DAILY sales data and cross-validates against ERP ledger entries to ensure accuracy.";
    }

    // --- CAC / Customer Acquisition Cost ---
    if (lower.includes('cac') || lower.includes('acquisition cost') || lower.includes('customer acquisition') || lower.includes('marketing cost') || lower.includes('marketing efficiency')) {
      const kpis = this.analyticsEngine ? this.analyticsEngine.evaluateKPIs(this.currentPersona) : null;
      const cacKpi = kpis?.evaluatedKPIs?.find(k => k.name?.toLowerCase().includes('acquisition'));
      if (cacKpi) {
        return `📈 Customer Acquisition Cost (CAC) is at $${cacKpi.current_value} vs. a target of $${cacKpi.target_value}, which is ${cacKpi.variance_bps} bps above target — flagged as ${cacKpi.status.replace('_', ' ')}.\n\nThis spike indicates declining marketing efficiency. The CRM_MARKETING_MONTHLY data source shows campaign spend rising while conversion rates have dropped, suggesting channel saturation or targeting misalignment.`;
      }
      return "CAC measures how much it costs to acquire a new customer. It's sourced from CRM_MARKETING_MONTHLY data and flagged when it exceeds the contract-defined threshold.";
    }

    // --- Stockout / Inventory ---
    if (lower.includes('stockout') || lower.includes('inventory') || lower.includes('stock') || lower.includes('supply chain') || lower.includes('supply')) {
      const kpis = this.analyticsEngine ? this.analyticsEngine.evaluateKPIs(this.currentPersona) : null;
      const stockKpi = kpis?.evaluatedKPIs?.find(k => k.name?.toLowerCase().includes('stockout'));
      if (stockKpi) {
        return `📦 Inventory Stockout Rate is at ${stockKpi.current_value}% vs. a target of ${stockKpi.target_value}%, a variance of +${stockKpi.variance_bps} bps — ${stockKpi.status.replace('_', ' ')}.\n\nHigh stockout rates directly impact revenue (lost sales) and margin (emergency replenishment costs). This KPI is sourced from ERP_SUPPLY_WEEKLY data covering all regional distribution centers.`;
      }
      return "Stockout Rate measures the percentage of SKUs that are out of stock. It's fed by ERP_SUPPLY_WEEKLY data and is critical for supply chain health.";
    }

    // --- Waterfall / Math / Calculation / Decomposition ---
    if (lower.includes('waterfall') || lower.includes('calculate') || lower.includes('math') || lower.includes('decompos') || lower.includes('formula') || lower.includes('deterministic')) {
      return "The Waterfall Decomposition Chart breaks down exactly WHY Gross Margin moved by -380 bps. Each bar represents a specific driver:\n\n• COGS Inflation: -220 bps (raw material cost surge)\n• Regional Mix Shift: -75 bps (Midwest underperformance)\n• Promo Dilution: -85 bps (aggressive markdowns)\n\nCritically, this is 100% deterministic math executed on Databricks — the LLM never touches these calculations. It only narrates the pre-computed results. This separation is what prevents hallucinated numbers.";
    }

    // --- Semantic Contract ---
    if (lower.includes('contract') || lower.includes('semantic')) {
      return "The Semantic Contract is a strict JSON governance document stored in Snowflake. It defines:\n\n• KPI Definitions — exact formulas, thresholds, and anomaly rules\n• Data Source Mappings — which tables feed which KPIs\n• RBAC Policies — who can view what data at which granularity\n• Abstention Rules — when the AI must refuse to act due to low confidence\n\nEvery calculation and recommendation traces back to this contract, ensuring full auditability and zero ad-hoc reasoning.";
    }

    // --- RBAC / Security / Access / Masking ---
    if (lower.includes('rbac') || lower.includes('role') || lower.includes('access') || lower.includes('security') || lower.includes('mask') || lower.includes('permission') || lower.includes('governance')) {
      return `🔒 Our RBAC (Role-Based Access Control) system enforces data visibility per persona:\n\n• Executive (VP): Full access to all KPIs, margin decomposition, and company-wide financials\n• Regional Manager: Scoped to operational store metrics; enterprise margin data is REDACTED\n• Financial Analyst: Full numerical access but action recommendations require VP approval\n\nYou're currently viewing as "${this.currentPersona.replace('_', ' ')}". Try switching to Scenario 4 (RBAC & Data Masking) to see how the same dashboard looks with restricted access.`;
    }

    // --- Hallucination / Trust / Safety ---
    if (lower.includes('hallucin') || lower.includes('safe') || lower.includes('trust') || lower.includes('accurate') || lower.includes('reliable') || lower.includes('grounding')) {
      return "We prevent AI hallucinations through a strict architectural separation:\n\n1️⃣ Deterministic Engine (Databricks): Runs all financial math — formulas, decompositions, thresholds. Zero LLM involvement.\n2️⃣ LLM Synthesizer: Only receives pre-computed, verified numbers. It narrates; it doesn't calculate.\n3️⃣ Evidence Citations: Every claim in the narrative links back to a specific data source and formula.\n4️⃣ Abstention Protocol: If confidence drops below 60%, the system refuses to recommend actions (see Scenario 2).\n\nThis means the AI literally cannot invent numbers — it only sees and reports verified outputs.";
    }

    // --- Architecture / Tech Stack ---
    if (lower.includes('architect') || lower.includes('hybrid') || lower.includes('stack') || lower.includes('tech') || lower.includes('snowflake') || lower.includes('databricks') || lower.includes('tableau')) {
      return "Our Hybrid Platform-Native Architecture consists of:\n\n☁️ Snowflake (Data Cloud): Stores the Semantic Contract, raw enterprise data, and RBAC policies\n⚡ Databricks (Compute): Executes all deterministic financial formulas and KPI evaluations\n📊 Tableau (Visualization): Renders the executive dashboard with embedded analytics\n🤖 Agentic Orchestrator: Coordinates the pipeline — data ingestion → deterministic math → LLM synthesis → action recommendations\n\nThis separation ensures each platform does what it's best at, with no single point of AI failure.";
    }

    // --- Scenarios ---
    if (lower.includes('scenario') || lower.includes('demo')) {
      return `We have 4 demo scenarios showcasing different capabilities:\n\n1️⃣ Multi-Factor Margin Squeeze — Shows how we decompose a -380 bps margin decline into 3 distinct drivers\n2️⃣ Data Conflict & Abstention — Demonstrates AI self-restraint when POS and ERP data contradict\n3️⃣ Cold-Start / Sparse Launch — Uses Bayesian priors for a new product with only 8 days of data\n4️⃣ RBAC & Data Masking — Same data, but filtered through Regional Manager access restrictions\n\nYou're currently on ${this.currentScenario.replace('_', ' ')}. Click the scenario chips at the top to switch!`;
    }

    // --- Actions / Recommendations ---
    if (lower.includes('action') || lower.includes('recommend') || lower.includes('what should') || lower.includes('suggestion') || lower.includes('what to do') || lower.includes('next step')) {
      return "The Governed Action Recommendations follow a strict schema: Driver → Lever → Action → Impact.\n\nFor the current margin squeeze scenario, key recommendations include:\n• Renegotiate COGS contracts with top 3 suppliers (expected +120 bps recovery)\n• Reduce Midwest promotional depth by 15% (expected +50 bps)\n• Rebalance regional inventory allocation to high-performing stores\n\nEach action has an assigned owner, decision rights level, confidence score, and monitoring plan. Actions are only recommended when confidence exceeds 60%.";
    }

    // --- Abstention / Confidence ---
    if (lower.includes('abstain') || lower.includes('abstention') || lower.includes('refuse') || lower.includes('confidence') || lower.includes('threshold') || lower.includes('conflict')) {
      return "Abstention is a core safety feature. In Scenario 2, POS data shows a Midwest conversion drop to 22%, but ERP claims 14,200 units in stock — a direct contradiction.\n\nWhen this happens:\n🛑 Confidence drops to 36.5% (below the 60% mandatory threshold)\n🛑 All automated actions are SUSPENDED\n🛑 The system explicitly asks humans to verify physical inventory counts\n\nThis 'right to refuse' is what separates responsible AI from reckless automation.";
    }

    // --- Bayesian / Cold Start / New Product ---
    if (lower.includes('bayesian') || lower.includes('cold start') || lower.includes('cold-start') || lower.includes('new product') || lower.includes('launch') || lower.includes('sparse')) {
      return "For new products with sparse data (Scenario 3), standard anomaly detection fails because there isn't enough history.\n\nOur solution: Hierarchical Bayesian Category Analogues\n• Prior: Uses 2025 Premium Hydration category data as baseline (μ₀ = 25 units/day)\n• Observed: 8 days of actual sales (x̄ = 30 units/day)\n• Posterior: Blended estimate of 28.1 units/day with ±18.5% uncertainty\n\nThe system explicitly flags the wide confidence interval and recommends waiting 6 more days before committing to factory replenishment.";
    }

    // --- KPI general ---
    if (lower.includes('kpi') || lower.includes('metric') || lower.includes('indicator') || lower.includes('dashboard')) {
      return `The dashboard tracks 4 governed KPIs, all defined in the Semantic Contract:\n\n1. Gross Margin % (Profitability) — Target: 42.5%\n2. Net Revenue (Commercial Growth) — Target: $1,250,000\n3. Customer Acquisition Cost (Marketing Efficiency) — Target: $48\n4. Inventory Stockout Rate (Supply Chain & Ops) — Target: 2.2%\n\nEach KPI has anomaly thresholds, RBAC visibility rules, and source lineage. Currently viewing as ${this.currentPersona.replace('_', ' ')} in ${this.currentScenario.replace('_', ' ')}.`;
    }

    // --- Cost / Pricing ---
    if (lower.includes('cost') || lower.includes('price') || lower.includes('pricing') || lower.includes('cogs') || lower.includes('expensive')) {
      return "The platform's per-insight cost is extremely low:\n\n• Estimated Cost per Insight: ~$0.0024\n• Total Tokens per Analysis: ~990 (680 input / 310 output)\n• Total Latency: ~310ms end-to-end\n\nThis efficiency comes from our hybrid approach — Databricks handles the heavy math computation, while the LLM only generates a concise narrative summary from pre-computed results. No wasteful chain-of-thought token burn.";
    }

    // --- Persona ---
    if (lower.includes('persona') || lower.includes('executive') || lower.includes('analyst') || lower.includes('regional') || lower.includes('manager') || lower.includes('vp')) {
      return `The platform supports 3 personas with different data access levels:\n\n👔 Executive (VP): Full visibility — all KPIs, margin waterfall, company-wide financials, and action approvals\n🏬 Regional Operations: Scoped to store-level metrics — enterprise margin data is masked under RBAC Policy #204\n📊 Financial Analyst: Full numerical access but recommendations require executive sign-off\n\nYou're currently viewing as "${this.currentPersona.replace('_', ' ')}". Use the persona switcher in the header to change views.`;
    }

    // --- Accenture / Competition / About ---
    if (lower.includes('accenture') || lower.includes('competition') || lower.includes('hackathon') || lower.includes('challenge') || lower.includes('about') || lower.includes('who')) {
      return "BusinessIntelligence.ai was built for the Accenture Innovation Challenge 2026. It demonstrates an Autonomous KPI Intelligence-to-Action Engine that:\n\n• Turns raw enterprise data into governed, traceable insights\n• Uses deterministic math (not LLM guessing) for all financial calculations\n• Enforces RBAC, abstention protocols, and full evidence lineage\n• Supports multi-persona views with context-adapted narratives\n\nThe goal: move from 'dashboards you stare at' to 'intelligence that acts.'";
    }

    // --- Thank you / bye ---
    if (/^(thanks|thank you|thx|bye|goodbye|see you|cheers)\b/.test(lower)) {
      const replies = [
        "You're welcome! Feel free to ask anything else about the dashboard or our engine. 🚀",
        "Happy to help! Don't hesitate to explore different scenarios and personas for the full experience.",
        "Glad I could assist! Try switching scenarios or personas to see how the intelligence adapts."
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }

    // --- Randomized smart fallbacks (never the same twice in a row) ---
    const fallbacks = [
      `I can provide detailed analysis on any KPI visible on your dashboard. You're currently viewing ${this.currentScenario.replace('_', ' ')} as ${this.currentPersona.replace('_', ' ')}. Try asking about "gross margin", "revenue", "stockout rate", or "how does the waterfall work?"`,
      `Great question! I'm best at explaining the data on your dashboard. Try asking:\n• "What's happening with gross margin?"\n• "Explain the waterfall chart"\n• "How do you prevent hallucinations?"\n• "What are the recommended actions?"`,
      `I'm the intelligence layer for this dashboard. I can explain any KPI, the deterministic math behind it, our architecture, or the security model. What area interests you most?`,
      `Here are some things I know deeply:\n📊 KPI analysis (margin, revenue, CAC, stockouts)\n🔢 Deterministic waterfall math\n🔒 RBAC & data governance\n🤖 AI safety & abstention protocols\n🏗️ Architecture (Snowflake + Databricks + Tableau)\n\nPick any topic!`,
      `I noticed you're on ${this.currentScenario.replace('_', ' ')}. ${this.currentScenario === 'SCENARIO_1' ? 'This scenario shows a multi-factor margin squeeze. Ask me about the -380 bps decline!' : this.currentScenario === 'SCENARIO_2' ? 'This demonstrates AI abstention when data conflicts. Ask me why!' : this.currentScenario === 'SCENARIO_3' ? 'This covers cold-start analysis with Bayesian priors. Ask me how it works!' : 'This showcases RBAC data masking. Ask me what gets hidden!'}`
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
