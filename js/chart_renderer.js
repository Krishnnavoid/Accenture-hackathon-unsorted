/**
 * BusinessIntelligence.ai - Dynamic Chart & Waterfall Renderer
 */

export class ChartRenderer {
  static renderWaterfall(containerId, decompositionData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!decompositionData || !decompositionData.drivers) {
      container.innerHTML = `<div style="color: var(--text-muted); padding: 20px; text-align: center;">Waterfall decomposition unavailable for this view.</div>`;
      return;
    }

    const { baseline, current, net_delta_bps, drivers } = decompositionData;

    let html = `
      <div class="waterfall-chart">
        <div class="waterfall-row">
          <div class="waterfall-label">Target Baseline</div>
          <div class="waterfall-bar-track">
            <div class="waterfall-bar bar-baseline" style="width: 100%; justify-content: flex-start;">
              Target: ${baseline}
            </div>
          </div>
          <div class="waterfall-val" style="color: var(--accent-cyan);">0 bps</div>
        </div>
    `;

    drivers.forEach((driver) => {
      const isNeg = driver.impact_bps < 0;
      const barClass = isNeg ? 'bar-negative' : 'bar-positive';
      const absWidth = Math.min(Math.max((Math.abs(driver.impact_bps) / 250) * 100, 15), 100);
      const sign = driver.impact_bps > 0 ? '+' : '';

      html += `
        <div class="waterfall-row">
          <div class="waterfall-label" title="${driver.name}">${driver.name}</div>
          <div class="waterfall-bar-track">
            <div class="waterfall-bar ${barClass}" style="width: ${absWidth}%; justify-content: ${isNeg ? 'flex-end' : 'flex-start'};">
              ${sign}${driver.impact_bps} bps
            </div>
          </div>
          <div class="waterfall-val" style="color: ${isNeg ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">
            ${sign}${driver.impact_bps} bps
          </div>
        </div>
      `;
    });

    html += `
        <div class="waterfall-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-medium);">
          <div class="waterfall-label" style="font-weight: 700; color: #fff;">Net Realized Margin</div>
          <div class="waterfall-bar-track">
            <div class="waterfall-bar bar-negative" style="width: 90%; justify-content: flex-start;">
              Actual: ${current} (Net: ${net_delta_bps} bps)
            </div>
          </div>
          <div class="waterfall-val" style="color: var(--accent-rose); font-size: 14px;">${net_delta_bps} bps</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}
