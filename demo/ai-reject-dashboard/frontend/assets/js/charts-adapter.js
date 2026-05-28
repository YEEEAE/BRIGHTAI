/**
 * BrightAI — Charts Adapter
 * AR: يبني إعدادات ApexCharts من بيانات API الحقيقية بدون أي أرقام ثابتة.
 * EN: Builds ApexCharts options from live API payloads. Zero hardcoded data.
 */
const ChartsAdapter = (() => {

  /**
   * Build monthly cost trend series from reject records.
   * Groups by month and produces actual vs. a simple moving average forecast.
   * @param {Array} rejects - raw rejects array
   * @returns {Object} ApexCharts-ready { series, categories }
   */
  function buildTrendSeries(rejects) {
    const monthMap = {};
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    rejects.forEach(r => {
      const d = new Date(r.date || r.created_at);
      if (isNaN(d)) return;
      const key = months[d.getMonth()];
      if (!monthMap[key]) monthMap[key] = 0;
      monthMap[key] += Number(r.cost) || 0;
    });

    const categories = months.filter(m => monthMap[m] !== undefined);
    const actual = categories.map(m => Math.round(monthMap[m] || 0));

    // Simple 3-month moving average as "forecast"
    const forecast = actual.map((val, i) => {
      if (i < 2) return val;
      return Math.round((actual[i-2] + actual[i-1] + val) / 3);
    });

    return {
      series: [
        { name: 'تكلفة المرفوضات الفعلية (SAR)', data: actual },
        { name: 'التكلفة التنبئية (SAR)', data: forecast }
      ],
      categories: categories.length > 0 ? categories : ['—']
    };
  }

  /**
   * Build department cost donut data from reject records.
   * @param {Array} rejects
   * @returns {Object} { series, labels }
   */
  function buildDeptDonut(rejects) {
    const deptMap = {};
    rejects.forEach(r => {
      const dept = r.department || 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + (Number(r.cost) || 0);
    });

    const labels = Object.keys(deptMap);
    const series = labels.map(d => Math.round(deptMap[d] / 1000 * 10) / 10); // in thousands

    return {
      series: series.length > 0 ? series : [0],
      labels: labels.length > 0 ? labels : ['—']
    };
  }

  /**
   * Build top reject reasons bar chart from root-causes API or rejects.
   * @param {Object|null} rootCauses - from /api/root-causes
   * @param {Array} rejects - fallback if rootCauses unavailable
   * @returns {Object} { series, categories }
   */
  function buildReasonsBar(rootCauses, rejects) {
    // If root-causes API gave data
    if (rootCauses && rootCauses.causes && rootCauses.causes.length > 0) {
      const sorted = [...rootCauses.causes].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 10);
      return {
        series: [{ name: 'التكرار', data: sorted.map(c => c.count || 0) }],
        categories: sorted.map(c => c.name || c.reason || '—')
      };
    }

    // Fallback: aggregate from rejects by category
    const catMap = {};
    rejects.forEach(r => {
      const cat = r.category || r.reason || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      series: [{ name: 'التكرار', data: sorted.map(e => e[1]) }],
      categories: sorted.length > 0 ? sorted.map(e => e[0]) : ['—']
    };
  }

  /**
   * Build Pareto chart from root-causes or rejects.
   * @param {Object|null} rootCauses
   * @param {Array} rejects
   * @returns {Object} { series, labels }
   */
  function buildPareto(rootCauses, rejects) {
    let items;
    if (rootCauses && rootCauses.causes && rootCauses.causes.length > 0) {
      items = [...rootCauses.causes].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);
    } else {
      const catMap = {};
      rejects.forEach(r => {
        const cat = r.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      items = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => ({ name: e[0], count: e[1] }));
    }

    const counts = items.map(i => i.count || 0);
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    let cumulative = 0;
    const cumulativePercent = counts.map(c => {
      cumulative += c;
      return Math.round((cumulative / total) * 1000) / 10;
    });

    return {
      series: [
        { name: 'عدد الحالات', type: 'column', data: counts },
        { name: 'النسبة التراكمية (%)', type: 'line', data: cumulativePercent }
      ],
      labels: items.map(i => i.name || i.reason || '—')
    };
  }

  /**
   * Build heatmap data from rejects (day of week × time of day).
   * @param {Array} rejects
   * @returns {Array} series for ApexCharts heatmap
   */
  function buildHeatmap(rejects) {
    const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const grid = {}; // { dayIdx: { hourSlot: count } }

    dayNames.forEach((_, i) => { grid[i] = {}; });

    rejects.forEach(r => {
      const d = new Date(r.date || r.created_at);
      if (isNaN(d)) return;
      // JS getDay: 0=Sun ... 6=Sat. Map to Sat=0..Thu=5
      let dayIdx = d.getDay() === 6 ? 0 : d.getDay(); // Sat→0
      if (dayIdx > 5) dayIdx = 5;
      const hourSlot = Math.floor(d.getHours() / 3);
      grid[dayIdx][hourSlot] = (grid[dayIdx][hourSlot] || 0) + 1;
    });

    return dayNames.map((name, i) => ({
      name,
      data: Array.from({ length: 8 }, (_, slot) => ({
        x: `${slot * 3}:00`,
        y: grid[i][slot] || 0
      }))
    }));
  }

  /**
   * Calculate overall quality compliance score from rejects.
   * @param {Array} rejects
   * @returns {number} 0-100 score
   */
  function calcQualityScore(rejects) {
    if (!rejects || rejects.length === 0) return 0;
    const total = rejects.length;
    const approved = rejects.filter(r => (r.status || r.approval_status || '').toLowerCase() === 'approved').length;
    return Math.round((approved / total) * 1000) / 10;
  }

  /**
   * Build sparkline data for cost KPI mini chart.
   * @param {Array} rejects
   * @returns {Array<number>}
   */
  function buildCostSparkline(rejects) {
    const weekMap = {};
    rejects.forEach(r => {
      const d = new Date(r.date || r.created_at);
      if (isNaN(d)) return;
      const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
      weekMap[weekKey] = (weekMap[weekKey] || 0) + (Number(r.cost) || 0);
    });

    const values = Object.values(weekMap);
    if (values.length === 0) return [0];
    // Take last 10 data points
    return values.slice(-10);
  }

  // Public API
  return {
    buildTrendSeries,
    buildDeptDonut,
    buildReasonsBar,
    buildPareto,
    buildHeatmap,
    calcQualityScore,
    buildCostSparkline
  };
})();
