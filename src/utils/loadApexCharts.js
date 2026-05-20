let apexChartsPromise = null

export const loadApexCharts = async () => {
  if (globalThis.ApexCharts) return globalThis.ApexCharts

  if (!apexChartsPromise) {
    apexChartsPromise = import('../vendor/apexcharts.min.js').then(() => globalThis.ApexCharts)
  }

  return apexChartsPromise
}
