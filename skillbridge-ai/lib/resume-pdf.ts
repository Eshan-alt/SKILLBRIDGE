import {PDFDocument, StandardFonts, PDFString, rgb, type PDFPage, type PDFFont} from 'pdf-lib';
import type {Resume, ResumeEntry} from './resume';
import {resumeLink} from './resume-link';

export async function makeResumePDF(resume: Resume) {
  const pdf = await PDFDocument.create();
  const normal = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const width = 595.28, height = 841.89, margin = 34, usable = width - margin * 2;
  let page: PDFPage = pdf.addPage([width, height]);
  let cursor = height - 20;
  const black = rgb(0, 0, 0), blue = rgb(0, 0, .5);
  const normalize = (s: string) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/•/g, '-').replace(/…/g, '...').replace(/[\r\t]/g, ' ');
  const space = (amount: number) => {if (cursor - amount < margin) {page = pdf.addPage([width, height]); cursor = height - margin;}};
  function draw(value: string, x: number, y: number, size: number, font = normal, url?: string) {
    const text = normalize(value); font.encodeText(text);
    page.drawText(text, {x, y, size, font, color: url ? blue : black});
    if (url) {
      const annotation = pdf.context.register(pdf.context.obj({Type: 'Annot', Subtype: 'Link', Rect: [x, y - 2, x + font.widthOfTextAtSize(text, size), y + size], Border: [0, 0, 0], A: {Type: 'Action', S: 'URI', URI: PDFString.of(url)}}));
      page.node.addAnnot(annotation);
    }
  }
  function wrap(raw: string, size: number, font: PDFFont, maxWidth: number) {
    const lines: string[] = [];
    for (const part of normalize(raw).split('\n')) {
      let current = '';
      for (const word of part.trim().split(/\s+/).filter(Boolean)) {
        const candidate = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {current = candidate; continue;}
        if (current) {lines.push(current); current = '';}
        for (const char of word) {
          if (font.widthOfTextAtSize(current + char, size) > maxWidth) {lines.push(current); current = '';}
          current += char;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  }
  function paragraph(raw: string, size = 10, font = normal, indent = 0, bullet: 'filled' | 'hollow' | null = null) {
    const lines = wrap(raw, size, font, usable - indent);
    for (let i = 0; i < lines.length; i++) {
      space(size * 1.25);
      const y = cursor - size;
      if (i === 0 && bullet) page.drawCircle({x: margin + indent - 6, y: y + 3.3, size: bullet === 'filled' ? 1.4 : 1.1, borderWidth: .4, borderColor: black, ...(bullet === 'filled' ? {color: black} : {})});
      draw(lines[i], margin + indent, y, size, font); cursor -= size * 1.25;
    }
  }
  function columns(left: string, right: string, leftFont = bold, rightFont = italic, url?: string, bullet = false) {
    const size = 10;
    const rightWidth = right ? Math.min(190, Math.max(70, rightFont.widthOfTextAtSize(normalize(right), size))) : 0;
    const leftLines = wrap(left, size, leftFont, usable - (rightWidth ? rightWidth + 14 : 0) - 7);
    const rightLines = right ? wrap(right, size, rightFont, rightWidth) : [];
    const count = Math.max(leftLines.length, rightLines.length);
    space(count * 12.5 + 13);
    for (let i = 0; i < count; i++) {
      const y = cursor - size;
      if (i === 0 && bullet) page.drawCircle({x: margin + 1.5, y: y + 3.3, size: 1.3, color: black});
      if (leftLines[i]) draw(leftLines[i], margin + 7, y, size, leftFont);
      if (rightLines[i]) draw(rightLines[i], width - margin - rightFont.widthOfTextAtSize(rightLines[i], size), y, size, rightFont, url);
      cursor -= 12.5;
    }
  }
  function section(title: string) {
    cursor -= 9; space(48);
    draw(title.toUpperCase(), margin, cursor - 12, 12, bold);
    cursor -= 16;
    page.drawLine({start: {x: margin, y: cursor}, end: {x: width - margin, y: cursor}, thickness: .55, color: black});
    cursor -= 5;
  }
  for (const name of wrap(resume.name.trim().toUpperCase(), 25, bold, usable)) {
    space(29); draw(name, (width - bold.widthOfTextAtSize(name, 25)) / 2, cursor - 25, 25, bold); cursor -= 29;
  }
  if (resume.title.trim()) for (const title of wrap(resume.title, 10, italic, usable)) {draw(title, (width - italic.widthOfTextAtSize(title, 10)) / 2, cursor - 10, 10, italic); cursor -= 13;}
  const contacts: {label: string; url?: string}[] = [];
  if (resume.phone.trim()) contacts.push({label: resume.phone});
  if (resume.email.trim()) contacts.push({label: resume.email});
  for (const [value, label] of [[resume.website, /github\.com/i.test(resume.website) ? 'GitHub' : 'Portfolio'], [resume.linkedin, 'LinkedIn'], [resume.github, 'GitHub']]) {
    if (!value.trim()) continue;
    const url = resumeLink(value); contacts.push({label: url ? label : value, ...(url ? {url} : {})});
  }
  if (resume.location.trim()) contacts.push({label: resume.location});
  let contactRow: typeof contacts = [], contactWidth = 0;
  function flushContacts() {
    if (!contactRow.length) return;
    space(12); let x = (width - contactWidth) / 2;
    for (const contact of contactRow) {draw(contact.label, x, cursor - 8.5, 8.5, normal, contact.url); x += normal.widthOfTextAtSize(normalize(contact.label), 8.5) + 12;}
    cursor -= 12; contactRow = []; contactWidth = 0;
  }
  for (const contact of contacts) for (const label of wrap(contact.label, 8.5, normal, usable)) {
    const size = normal.widthOfTextAtSize(label, 8.5);
    if (contactRow.length && contactWidth + size + 12 > usable) flushContacts();
    contactWidth += size + (contactRow.length ? 12 : 0); contactRow.push({...contact, label});
  }
  flushContacts();
  function entries(values: ResumeEntry[], education = false) {
    for (const entry of values) {
      if (!entry.title.trim() && !entry.organization.trim()) continue;
      space(42);
      columns(entry.organization || entry.title, entry.dates, bold, italic, undefined, true);
      if (entry.organization && entry.title || entry.location) columns(entry.organization ? entry.title : '', entry.location, italic, normal);
      for (const detail of entry.details.split('\n').filter(line => line.trim())) paragraph(detail, 10, normal, education ? 7 : 13, education ? null : 'hollow');
      cursor -= 4;
    }
  }
  if (resume.summary.trim()) {section('Summary'); paragraph(resume.summary);}
  if (resume.education.some(e => e.title.trim() || e.organization.trim())) {section('Education'); entries(resume.education, true);}
  if (resume.skills.trim()) {
    section('Technical Skills');
    for (const skill of resume.skills.split('\n').filter(line => line.trim())) paragraph(skill, 10, normal, 7, 'filled');
  }
  if (resume.experience.some(e => e.title.trim() || e.organization.trim())) {section('Experience'); entries(resume.experience);}
  if (resume.projects.some(p => p.name.trim())) {
    section('Projects');
    for (const project of resume.projects) {
      if (!project.name.trim()) continue;
      space(42); const url = resumeLink(project.link);
      columns(project.name, project.link ? url ? 'Source Code' : project.link : '', bold, italic, url || undefined, true);
      if (project.technologies) paragraph(`Tools: ${project.technologies}`, 9, italic, 7);
      for (const detail of project.details.split('\n').filter(line => line.trim())) paragraph(detail, 10, normal, 13, 'hollow');
      cursor -= 4;
    }
  }
  if (resume.responsibilities.some(e => e.title.trim() || e.organization.trim())) {section('Positions of Responsibility'); entries(resume.responsibilities);}
  if (resume.achievements.trim()) {section('Achievements'); for (const achievement of resume.achievements.split('\n').filter(line => line.trim())) paragraph(achievement, 10, normal, 7, 'filled');}
  pdf.setTitle(`${resume.name} - Resume`); pdf.setAuthor(resume.name); pdf.setSubject('Classic academic resume generated with SkillBridge');
  return pdf.save();
}
