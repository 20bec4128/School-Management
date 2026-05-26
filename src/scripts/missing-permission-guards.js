import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== CONFIGURATION ==========
const PAGES_DIR = path.join(__dirname, '../pages');
const OUTPUT_CSV = path.join(__dirname, '../missing-permission-guards.csv');

// Your slugs (from the earlier list) - I've included a subset; replace with the full list
// You can paste your full slug array here from the earlier message
const ALL_SLUGS = [
  "academic-year", "assignment", "attendance", "book", "call-log", "candidate", "category",
  "certificate-type", "class", "class-routine", "complain-type", "discount", "donar",
  "ebook", "email", "email-setting", "employee-attendance", "event", "exam-grade",
  "exam-instruction", "exam-result", "exam-term", "expenditure", "expenditure-head",
  "fee-collection", "fee-type", "frontend-page", "gallery", "general-settings",
  "guardian", "holiday", "hostel-member", "id-card-setting", "images", "income",
  "income-head", "issue", "issue-return", "leave-application", "leave-type", "lesson",
  "lesson-plan", "lesson-status", "lesson-timeline", "live-class", "manage-award",
  "manage-complain", "manage-designation", "manage-employee", "manage-feedback",
  "manage-hostel", "manage-invoice", "manage-mark", "manage-room", "manage-school",
  "manage-super-admin", "manage-teacher", "manage-todo", "mark-sheet", "merit-list",
  "news", "notice", "online-admission", "online-exam", "opening-hour", "payment-setting",
  "postal-dispatch", "postal-receive", "product", "promotion", "purchase", "question-bank",
  "rating", "result-card", "salary-grade", "salary-history", "salary-payment", "sale",
  "schedule", "scholarship", "section", "slider", "sms", "sms-setting", "student-activity",
  "student-attendance", "student-list", "student-type", "study-material", "subject",
  "submission", "subscription-faq", "subscription-plans", "subscription-settings",
  "subscription-slider", "suggestion", "supplier", "syllabus", "teacher-department",
  "topic", "transport-member", "transport-route", "vehicle", "videos", "visitor-info",
  "visitor-purpose", "warehouse"
];

// Helper: Convert slug to likely file name (PascalCase)
function slugToFileName(slug) {
  return slug.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') + '.jsx';
}

// Helper: Check file content for Add/Edit/Delete indicators
function hasButtonIndicators(content) {
  const addPattern = /\bAdd\s+([A-Z][a-z]+)?\b|openAdd|setIsAddOpen|openCreateModal|addModal/i;
  const editPattern = /\bEdit\b|openEdit|setIsEditOpen|editModal/i;
  const deletePattern = /\bDelete\b|handleDelete|deleteRow|removeItem/i;
  return {
    hasAdd: addPattern.test(content),
    hasEdit: editPattern.test(content),
    hasDelete: deletePattern.test(content)
  };
}

// Check if matrix guards are already present
function hasMatrixGuards(content) {
  return /canAdd\(|canEdit\(|canDelete\(/.test(content);
}

// Main scan
function scan() {
  const results = [];
  const files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.jsx'));

  for (const file of files) {
    const filePath = path.join(PAGES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const baseName = file.replace('.jsx', '');
    
    // Find matching slug (by filename conversion or direct match)
    let matchedSlug = null;
    for (const slug of ALL_SLUGS) {
      const possibleFile = slugToFileName(slug);
      if (possibleFile === file) {
        matchedSlug = slug;
        break;
      }
    }
    // If no match, try case-insensitive comparison on basename
    if (!matchedSlug) {
      const lowerBase = baseName.toLowerCase();
      matchedSlug = ALL_SLUGS.find(slug => slug.replace(/-/g, '').toLowerCase() === lowerBase.replace(/-/g, '')) || '';
    }

    const { hasAdd, hasEdit, hasDelete } = hasButtonIndicators(content);
    const hasGuards = hasMatrixGuards(content);
    const needsMigration = (hasAdd || hasEdit || hasDelete) && !hasGuards;

    if (needsMigration) {
      results.push({
        File: file,
        Slug: matchedSlug || 'UNKNOWN',
        HasAddButton: hasAdd ? 'Yes' : 'No',
        HasEditButton: hasEdit ? 'Yes' : 'No',
        HasDeleteButton: hasDelete ? 'Yes' : 'No',
        NeedsMigration: 'Yes'
      });
    }
  }

  // Write CSV
  const csvRows = [
    ['File', 'Slug', 'HasAddButton', 'HasEditButton', 'HasDeleteButton', 'NeedsMigration']
  ];
  results.forEach(r => {
    csvRows.push([r.File, r.Slug, r.HasAddButton, r.HasEditButton, r.HasDeleteButton, r.NeedsMigration]);
  });
  const csvContent = csvRows.map(row => row.join(',')).join('\n');
  fs.writeFileSync(OUTPUT_CSV, csvContent, 'utf8');
  console.log(`✅ Scan complete. Found ${results.length} files needing migration.`);
  console.log(`📄 CSV saved to: ${OUTPUT_CSV}`);
}

scan();
