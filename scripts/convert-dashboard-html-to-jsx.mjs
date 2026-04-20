import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const htmlPath = path.join(repoRoot, 'src', 'pages', 'dashboard.html')
const outPath = path.join(repoRoot, 'src', 'pages', 'Dashboard.jsx')

const raw = fs.readFileSync(htmlPath, 'utf8').replace(/^\uFEFF/, '')

const converted = raw
  .replaceAll('\r\n', '\n')
  // Safer asset paths (routing-friendly)
  .replaceAll('src="assets/', 'src="/assets/')
  .replaceAll('href="assets/', 'href="/assets/')
  // JSX attribute fixes
  .replaceAll(' class="', ' className="')
  // Inline styles used by the template (only width percent bars here)
  .replace(/ style="width:\s*([0-9]+)%;"/g, " style={{ width: '$1%' }}")
  // <img> must be self closing in JSX
  .replace(/<img\b([^>]*?)>/g, '<img$1 />')
  // Fix common mojibake from the original HTML export (keep ASCII)
  .replaceAll('â¤ï¸', '&#10084;')

const file = `const Dashboard = () => {
  return (
    <>
${converted
  .split('\n')
  .map((l) => `    ${l}`.replace(/\s+$/, ''))
  .join('\n')}
    </>
  )
}

export default Dashboard
`

fs.writeFileSync(outPath, file, 'utf8')
console.log(`Wrote ${path.relative(repoRoot, outPath)} from ${path.relative(repoRoot, htmlPath)}`)
