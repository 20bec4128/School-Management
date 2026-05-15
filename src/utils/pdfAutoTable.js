let pdfToolsPromise = null

export const ensurePdfTools = () => {
  if (!pdfToolsPromise) {
    pdfToolsPromise = Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]).then(([jsPDFModule, autoTableModule]) => {
      const JsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule
      const autoTable = autoTableModule.default || autoTableModule.autoTable || autoTableModule
      if (JsPDF?.API && typeof JsPDF.API.autoTable !== 'function') {
        JsPDF.API.autoTable = function autoTableAdapter(...args) {
          return autoTable(this, ...args)
        }
      }
      return { JsPDF, autoTable }
    })
  }
  return pdfToolsPromise
}

void ensurePdfTools()

