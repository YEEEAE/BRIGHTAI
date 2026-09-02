// Bilingual task PDF assembly for QC Task Manager.
//
// Task exports share the Unicode reporting writer so Arabic shaping, BiDi
// ordering, embedded-font handling, pagination, and PDF accessibility
// metadata stay in one maintained pipeline.

import { formatDbDate, formatDueDate } from './format';
import { rowsToPdf, type PdfDocumentOptions } from './reporting/writers/pdf';
import type { TaskPdfData } from './pdf';

type TaskPdfRow = [string, string];

function oneLine(value: string | null | undefined): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function reportRows(data: TaskPdfData): TaskPdfRow[] {
  const rows: TaskPdfRow[] = [
    ['Task ID / رقم المهمة', String(data.id)],
    ['Title / العنوان', oneLine(data.title)],
    ['Status / الحالة', oneLine(data.status_label)],
    ['Priority / الأولوية', oneLine(data.priority_label)],
    ['Department / القسم', oneLine(data.department)],
    ['Progress / نسبة الإنجاز', `${data.progress_percent}%`],
    ['Recurrence / التكرار', oneLine(data.recurrence_label)],
    ['Inspector Name / اسم المفتش', oneLine(data.assignee || data.creator || 'Unassigned')],
    ['Created by / أنشأها', oneLine(data.creator)],
    ['Due date / تاريخ الاستحقاق', data.due_date ? formatDueDate(data.due_date) : '—'],
    ['Created at / تاريخ الإنشاء', data.created_at ? formatDbDate(data.created_at) : '—'],
    ['Updated at / آخر تحديث', data.updated_at ? formatDbDate(data.updated_at) : '—'],
  ];
  if (data.started_at) rows.push(['Started at / تاريخ البدء', formatDbDate(data.started_at)]);
  if (data.description) rows.push(['Description / الوصف', oneLine(data.description)]);
  if (data.completed) {
    rows.push(['Completed at / تاريخ الإكمال', data.completed_at ? formatDbDate(data.completed_at) : '—']);
    rows.push(['Completed by / أكملها', oneLine(data.completed_by)]);
    rows.push(['Completion comment / تعليق الإكمال', oneLine(data.completion_comment)]);
  }
  if (data.cancelled) {
    rows.push(['Cancelled at / تاريخ الإلغاء', data.cancelled_at ? formatDbDate(data.cancelled_at) : '—']);
    rows.push(['Cancelled by / ألغتها', oneLine(data.cancelled_by)]);
  }
  rows.push([
    'Evidence / الأدلة',
    data.evidence_files.length > 0
      ? data.evidence_files.join(', ')
      : data.evidence_skipped
        ? 'Evidence skipped / تم تجاوز رفع الدليل'
        : 'No evidence recorded / لا توجد أدلة مسجلة',
  ]);
  for (const comment of data.comments) {
    rows.push([`Comment / تعليق — ${oneLine(comment.author)} (${oneLine(comment.date)})`, oneLine(comment.text)]);
  }
  for (const entry of data.activity) {
    rows.push([`Activity / نشاط — ${oneLine(entry.date)} — ${oneLine(entry.user)}`, oneLine(entry.text)]);
  }
  rows.push(['Generated / تاريخ التوليد', oneLine(data.generated_at)]);
  return rows;
}

function metadataLines(data: TaskPdfData): string[] {
  return [
    'BRIGHTAI QUALITY CONTROL / برايت آي لمراقبة الجودة',
    'QC TASK REPORT / تقرير مهمة ضبط الجودة',
    `Task ID: ${data.id} / رقم المهمة: ${data.id}`,
    `Title: ${oneLine(data.title)}`,
    `Status: ${oneLine(data.status_label)}`,
    `Priority: ${oneLine(data.priority_label)}`,
    `Inspector Name: ${oneLine(data.assignee || data.creator || 'Unassigned')}`,
    `Date: ${oneLine(data.generated_at)}`,
    `Generated: ${oneLine(data.generated_at)}`,
    'E-SIGNATURE BADGE: VERIFIED / شارة التوقيع الإلكتروني: موثق',
    ...reportRows(data).map(([label, value]) => `${label}: ${value}`),
  ];
}

/** Build an A4 task report with a bilingual QC/CoA-style control header. */
export async function buildTaskPdf(data: TaskPdfData): Promise<Buffer> {
  const headerLines = [
    'BRIGHTAI QUALITY CONTROL / برايت آي لمراقبة الجودة',
    'QC TASK REPORT / تقرير مهمة ضبط الجودة',
    `Task ID: ${data.id} / رقم المهمة: ${data.id}`,
    `Status: ${oneLine(data.status_label)} / الحالة`,
    `Priority: ${oneLine(data.priority_label)} / الأولوية`,
    `Inspector Name: ${oneLine(data.assignee || data.creator || 'Unassigned')} / اسم المفتش`,
    `Date: ${oneLine(data.generated_at)} / التاريخ`,
    'E-SIGNATURE BADGE: VERIFIED / شارة التوقيع الإلكتروني: موثق',
  ];
  const options: PdfDocumentOptions = {
    headerLines,
    metadata: metadataLines(data),
    language: 'ar',
    direction: 'R2L',
  };
  return rowsToPdf(['Field / الحقل', 'Value / القيمة'], reportRows(data), options);
}
