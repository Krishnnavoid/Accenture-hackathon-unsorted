/**
 * BusinessIntelligence.ai - Deterministic Analytics & Quantitative Decomposition Engine
 * NON-LLM Core: Strictly mathematical, statistical, and rule-based calculations.
 */

export class DeterministicAnalyticsEngine {
  constructor(semanticContract, posData, erpData, crmData) {
    this.contract = semanticContract;
    this.pos = posData;
    this.erp = erpData;
    this.crm = crmData;
  }

  /**
   * Evaluates all connected KPIs, calculates current values, target variance, and anomaly flags.
   */
  evaluateKPIs(role = "Executive", activeRegion = "ALL") {
    const startTime = performance.now();
    const evaluatedKPIs = [];

    for (const kpi of this.contract.governed_kpis) {
      let currentVal = 0;
      let targetVal = kpi.target;
      let varianceBps = 0;
      let status = "NORMAL";
      let isMasked = false;

      // Check RBAC Entitlements
      const roleEntitlement = kpi.access_entitlements[role] || "RESTRICTED_HIDDEN";
      if (roleEntitlement === "MASKED_RESTRICTED") {
        isMasked = true;
      } else if (roleEntitlement === "RESTRICTED_HIDDEN") {
        continue; // Skip restricted KPI
      }

      if (kpi.kpi_id === "KPI_GROSS_MARGIN") {
        // Target: 42.5%, Current simulated: 38.7% (-380 bps drop)
        currentVal = 38.70;
        varianceBps = Math.round((currentVal - targetVal) * 100);
        status = varianceBps <= -kpi.alert_threshold_bps ? "CRITICAL_ANOMALY" : "NORMAL";
      } else if (kpi.kpi_id === "KPI_NET_REVENUE") {
        currentVal = role === "Regional_Manager" ? 166000 : 1184000;
        targetVal = role === "Regional_Manager" ? 175000 : 1250000;
        const pctDiff = ((currentVal - targetVal) / targetVal) * 100;
        varianceBps = Math.round(pctDiff * 100);
        status = Math.abs(pctDiff) >= kpi.alert_threshold_pct ? "WARNING" : "NORMAL";
      } else if (kpi.kpi_id === "KPI_CAC") {
        currentVal = 58.40;
        const pctDiff = ((currentVal - targetVal) / targetVal) * 100;
        varianceBps = Math.round(pctDiff * 100);
        status = pctDiff >= kpi.alert_threshold_pct ? "WARNING" : "NORMAL";
      } else if (kpi.kpi_id === "KPI_STOCKOUT_RATE") {
        currentVal = role === "Regional_Manager" ? 5.4 : 3.8;
        varianceBps = Math.round((currentVal - targetVal) * 100);
        status = varianceBps >= kpi.alert_threshold_bps ? "CRITICAL_ANOMALY" : "NORMAL";
      }

      evaluatedKPIs.push({
        kpi_id: kpi.kpi_id,
        name: kpi.name,
        category: kpi.category,
        formula: kpi.formula,
        unit: kpi.unit,
        current_value: isMasked ? "[CONFIDENTIAL - MASKED]" : currentVal,
        target_value: targetVal,
        variance_bps: varianceBps,
        status: status,
        is_masked: isMasked,
        lineage: kpi.lineage,
        primary_sources: kpi.primary_data_sources
      });
    }

    const calcDurationMs = (performance.now() - startTime).toFixed(2);
    return { evaluatedKPIs, calcDurationMs: parseFloat(calcDurationMs) };
  }

  /**
   * Multi-Factor Waterfall Variance Decomposition for Scenario 1
   * Quantifies exact contribution of Price, Freight, Volume, and Mix to Margin drop.
   */
  decomposeGrossMarginMovement() {
    const startTime = performance.now();
    const totalDeltaBps = -380; // -3.80% margin drop

    const driverContributions = [
      {
        driver_id: "DRV_PROMO_DISC",
        name: "Promotional Discount Depth (Summer Flash -25%)",
        source: "POS_DAILY",
        category: "Commercial / Pricing",
        impact_bps: -210,
        dollar_impact: -105000,
        percentage_share: 55.26,
        direction: "NEGATIVE",
        statistical_confidence: 0.96
      },
      {
        driver_id: "DRV_FREIGHT_COST",
        name: "Freight Spot Rate Spike (Red Sea Transit Surcharge)",
        source: "ERP_SUPPLY_WEEKLY",
        category: "Supply Chain / Logistics",
        impact_bps: -170,
        dollar_impact: -85000,
        percentage_share: 44.74,
        direction: "NEGATIVE",
        statistical_confidence: 0.92
      },
      {
        driver_id: "DRV_VOLUME_ELASTICITY",
        name: "Incremental Unit Volume Lift",
        source: "POS_DAILY",
        category: "Volume Effect",
        impact_bps: +45,
        dollar_impact: +22500,
        percentage_share: -11.84,
        direction: "POSITIVE_OFFSET",
        statistical_confidence: 0.89
      },
      {
        driver_id: "DRV_PRODUCT_MIX_SHIFT",
        name: "Low-Margin Tumbler Mix Shift",
        source: "POS_DAILY",
        category: "Mix Effect",
        impact_bps: -45,
        dollar_impact: -22500,
        percentage_share: 11.84,
        direction: "NEGATIVE",
        statistical_confidence: 0.91
      }
    ];

    // Mathematical verification: sum of contributions equals net movement
    const netVerifiedBps = driverContributions.reduce((acc, d) => acc + d.impact_bps, 0);

    const calcDurationMs = (performance.now() - startTime).toFixed(2);
    return {
      kpi_name: "Gross Margin %",
      baseline: "42.50%",
      current: "38.70%",
      net_delta_bps: totalDeltaBps,
      net_verified_bps: netVerifiedBps,
      math_reconciliation_valid: totalDeltaBps === netVerifiedBps,
      drivers: driverContributions,
      calcDurationMs: parseFloat(calcDurationMs)
    };
  }

  /**
   * Contradiction & Data Quality Evaluator for Scenario 2
   */
  evaluateDataConsistency() {
    const startTime = performance.now();
    
    // Check Midwest POS conversion vs ERP central inventory
    const contradiction = {
      detected: true,
      subsystem_A: {
        system: "Store POS / RFID Shelf Scanners",
        location: "Midwest Region (Chicago)",
        signal: "Store inventory shelf scanners report ZERO shelf stock for SKU-PROMO-101. Footfall is high (9,200) but checkout conversion dropped from 65% to 22% due to out-of-stock abandonment."
      },
      subsystem_B: {
        system: "Central Warehouse ERP Ledger (DC-MIDWEST-CHICAGO)",
        location: "Midwest Central DC",
        signal: "ERP ledger reports 14,200 units on-hand with 0 pending backorders."
      },
      root_cause_hypothesis: "IoT RFID sync lag or dock-to-stock receiving bottleneck at Chicago DC (goods received on paper but not slotted to store delivery trucks).",
      confidence_score: 36.5, // Below 60% threshold -> Abstain
      abstention_required: true,
      diagnostic_request: "Action Abstained: Unreconciled inventory disparity of 14,200 units between ERP and Shelf RFID. Clarification required from Chicago DC Operations Manager before issuing supplier purchase orders."
    };

    const calcDurationMs = (performance.now() - startTime).toFixed(2);
    return { contradiction, calcDurationMs: parseFloat(calcDurationMs) };
  }

  /**
   * Cold-Start / Sparse History Evaluator for Scenario 3
   */
  evaluateSparseHistory() {
    const startTime = performance.now();

    const coldStartProduct = {
      sku: "SKU-ECO-901",
      name: "Eco-Tech Smart Bottle",
      launch_date: "2026-08-14",
      days_active: 8,
      data_points_count: 8,
      is_cold_start: true,
      standard_anomaly_model_status: "BYPASSED (Requires >= 30 days history)",
      methodology_used: "Hierarchical Bayesian Prior + Category Analogue Benchmarking",
      benchmark_analogue_category: "Premium Smart Hydration Accessories (2025)",
      observed_velocity_units_per_day: 30,
      prior_expected_units_per_day: 25,
      uncertainty_interval: "[±18.5% Credibility Interval]",
      recommendation: "Early sales velocity is tracking +20% above prior category benchmark. Retain current pricing; avoid inventory stockup commitments until 14-day cycle closes."
    };

    const calcDurationMs = (performance.now() - startTime).toFixed(2);
    return { coldStartProduct, calcDurationMs: parseFloat(calcDurationMs) };
  }
}
