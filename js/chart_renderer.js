/**
 * BusinessIntelligence.ai - Dynamic Chart & Waterfall Renderer
 * Uses CSS barGrow animation for premium animated waterfall bars.
 */

export class ChartRenderer {
  static renderWaterfall(containerId, decompositionData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!decompositionData || !decompositionData.drivers) {
      container.innerHTML = `<div style="color: var(--text-muted); padding: 20px; text-align: center;">Waterfall decomposition unavailable for this view.</div>`;
      return;
    }

    const { baseline, current, net_delta_bps, drivers, math_reconciliation_valid } = decompositionData;

    // Find max absolute impact for proportional scaling
    const maxAbsBps = Math.max(...drivers.map(d => Math.abs(d.impact_bps)), Math.abs(net_delta_bps), 1);

    let html = `
      <div class="waterfall-chart">
        <div class="waterfall-row">
          <div class="waterfall-label" style="font-weight: 600;">Target Baseline</div>
          <div class="waterfall-bar-track">
            <div class="waterfall-bar bar-baseline" style="--bar-width: 100%; animation: barGrow 0.5s ease-out forwards;">
              ${baseline}
            </div>
          </div>
          <div class="waterfall-val" style="color: var(--accent-cyan); font-weight: 600;">0 bps</div>
        </div>
    `;

    drivers.forEach((driver, index) => {
      const isNeg = driver.impact_bps < 0;
      const barClass = isNeg ? 'bar-negative' : 'bar-positive';
      const barWidth = driver.impact_bps === 0 ? 0 : Math.max((Math.abs(driver.impact_bps) / maxAbsBps) * 100, 12);
      const sign = driver.impact_bps > 0 ? '+' : '';
      const delay = 0.15 + (index * 0.12); // staggered animation

      html += `
        <div class="waterfall-row" style="animation: fadeInUp 0.4s ${delay}s both;">
          <div class="waterfall-label" title="${driver.name}">${driver.name}</div>
          <div class="waterfall-bar-track">
            <div class="waterfall-bar ${barClass}" style="--bar-width: ${barWidth}%; animation: barGrow 0.6s ${delay}s ease-out forwards;">
              ${sign}${driver.impact_bps} bps
            </div>
          </div>
          <div class="waterfall-val" style="color: ${isNeg ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; font-weight: 600;">
            ${sign}${driver.impact_bps} bps
          </div>
        </div>
      `;
    });

    // Net result row with reconciliation check
    const netDelay = 0.15 + (drivers.length * 0.12);
    html += `
        <div class="waterfall-row" style="margin-top: 12px; padding-top: 12px; border-top: 2px dashed var(--border-medium); animation: fadeInUp 0.4s ${netDelay}s both;">
          <div class="waterfall-label" style="font-weight: 700; color: var(--text-primary);">Net Realized</div>
          <div class="waterfall-bar-track">
            <div class="waterfall-bar bar-negative" style="--bar-width: ${net_delta_bps === 0 ? 0 : Math.max((Math.abs(net_delta_bps) / maxAbsBps) * 100, 20)}%; animation: barGrow 0.7s ${netDelay}s ease-out forwards;">
              ${current} (${net_delta_bps} bps)
            </div>
          </div>
          <div class="waterfall-val" style="color: var(--accent-rose); font-size: 14px; font-weight: 700;">${net_delta_bps} bps</div>
        </div>
        
        <div style="margin-top: 16px; padding: 10px 14px; background: ${math_reconciliation_valid ? 'var(--accent-emerald-glow, rgba(16,185,129,0.1))' : 'var(--accent-rose-glow, rgba(239,68,68,0.1))'}; border: 1px solid ${math_reconciliation_valid ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; border-radius: var(--radius-md, 12px); font-size: 12px; font-family: var(--font-mono, monospace); color: ${math_reconciliation_valid ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${math_reconciliation_valid ? '✓' : '✗'}</span>
          <span>Math Reconciliation: Sum(${drivers.map(d => (d.impact_bps > 0 ? '+' : '') + d.impact_bps).join(', ')}) = ${net_delta_bps} bps — ${math_reconciliation_valid ? 'VERIFIED (100.0% Match)' : 'MISMATCH DETECTED'}</span>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}
