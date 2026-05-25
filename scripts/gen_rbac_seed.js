import fs from 'fs';
import path from 'path';
import { PAGE_GROUPS } from '../src/constants/pageAccess.js';

const appRoutePath = 'src/AppRoute.jsx';
const content = fs.readFileSync(appRoutePath, 'utf8');

const regex = /pageKey:\s*["']([^"']+)["']/g;
const pageKeys = new Set();
let match;

while ((match = regex.exec(content)) !== null) {
  pageKeys.add(match[1]);
}

const sortedKeys = Array.from(pageKeys).sort();

const modulesList = [
  { key: 'core-system', name: 'Core System', id: 1 },
  { key: 'administrator', name: 'Administrator', id: 2 },
  { key: 'student-management', name: 'Student Management', id: 3 },
  { key: 'academic-management', name: 'Academic Management', id: 4 },
  { key: 'teacher-management', name: 'Teacher', id: 5 },
  { key: 'lesson-plan', name: 'Lesson Plan', id: 6 },
  { key: 'examination', name: 'Examination System', id: 7 },
  { key: 'hr', name: 'Human Resource', id: 8 },
  { key: 'finance', name: 'Finance & Accounts', id: 9 },
  { key: 'communication', name: 'Communication', id: 10 },
  { key: 'certificates', name: 'Certificates', id: 11 },
  { key: 'other', name: 'Other', id: 12 },
];

const moduleMap = new Map(modulesList.map(m => [m.key, m]));

// Helper to find module key for a pageKey
function findModuleKey(pageKey) {
  for (const group of PAGE_GROUPS) {
    if (group.pageKeys.includes(pageKey)) {
      return group.key;
    }
  }
  return 'other';
}

const functions = [];
let order = 1;
for (const slug of sortedKeys) {
  const mKey = findModuleKey(slug);
  const mInfo = moduleMap.get(mKey) || moduleMap.get('other');
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  functions.push({
    moduleId: mInfo.id,
    name,
    slug,
    orderNo: order++
  });
}

// Generate SQL
let sql = `-- ============================================================
-- Flyway Migration V279: RBAC Module → Function → CRUD Matrix
-- ============================================================

-- Create tables
CREATE TABLE IF NOT EXISTS rbac_modules (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(100) NOT NULL UNIQUE,
  order_no INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rbac_functions (
  id        SERIAL PRIMARY KEY,
  module_id INT NOT NULL REFERENCES rbac_modules(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) NOT NULL UNIQUE,
  order_no  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rbac_role_page_permissions (
  id          SERIAL PRIMARY KEY,
  role_name   VARCHAR(100) NOT NULL,
  school_id   BIGINT REFERENCES schools(id) ON DELETE CASCADE,
  function_id INT NOT NULL REFERENCES rbac_functions(id) ON DELETE CASCADE,
  can_view    BOOLEAN NOT NULL DEFAULT false,
  can_add     BOOLEAN NOT NULL DEFAULT false,
  can_edit    BOOLEAN NOT NULL DEFAULT false,
  can_delete  BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (role_name, school_id, function_id)
);

-- Seed Modules
INSERT INTO rbac_modules (id, name, order_no) VALUES
${modulesList.map(m => `(${m.id}, '${m.name}', ${m.id})`).join(',\n')}
ON CONFLICT (name) DO NOTHING;

SELECT setval('rbac_modules_id_seq', (SELECT MAX(id) FROM rbac_modules));

-- Seed Functions (Total: ${functions.length})
INSERT INTO rbac_functions (module_id, name, slug, order_no) VALUES
${functions.map(f => `(${f.moduleId}, '${f.name.replace(/'/g, "''")}', '${f.slug}', ${f.orderNo})`).join(',\n')}
ON CONFLICT (slug) DO NOTHING;

SELECT setval('rbac_functions_id_seq', (SELECT MAX(id) FROM rbac_functions));
`;

const outputPath = 'SMBackend/src/main/resources/db/migration/V279__rbac_module_function_crud.sql';
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Generated migration SQL with ${functions.length} functions at: ${outputPath}`);
