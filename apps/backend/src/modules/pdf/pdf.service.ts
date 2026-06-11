import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { Invoice, InvoiceLineItem } from '../invoices/invoice.entity';
import { Proposal, ProposalBlock } from '../proposals/proposal.entity';

type PdfCompany = {
  name: string;
  legalName?: string | null;
  gstin?: string | null;
  state?: string | null;
  currency?: string | null;
  logoText?: string | null;
  logoUrl?: string | null;
  logoAltText?: string | null;
};

type PdfClient = {
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  state?: string | null;
  address?: string | null;
};

type InvoicePdfContext = {
  invoice: Invoice;
  company: PdfCompany;
  client?: PdfClient | null;
  generatedAt?: Date;
};

type ProposalPdfContext = {
  proposal: Proposal;
  company: PdfCompany;
  client?: PdfClient | null;
  generatedAt?: Date;
};

@Injectable()
export class PdfService {
  async renderInvoice(context: InvoicePdfContext): Promise<Buffer> {
    return this.renderHtml(this.buildInvoiceHtml(context));
  }

  async renderProposal(context: ProposalPdfContext): Promise<Buffer> {
    return this.renderHtml(this.buildProposalHtml(context));
  }

  private async renderHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '16mm',
          right: '14mm',
          bottom: '16mm',
          left: '14mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private buildInvoiceHtml({
    invoice,
    company,
    client,
    generatedAt = new Date(),
  }: InvoicePdfContext): string {
    const currency = company.currency || 'INR';
    const rows = invoice.lineItems
      .map((item) => this.renderInvoiceItemRow(item, currency))
      .join('');

    return this.pageShell({
      title: `Invoice ${invoice.invoiceNumber}`,
      company,
      generatedAt,
      body: `
        <section class="document-head">
          <div>
            <h1>${escapeHtml(invoice.invoiceNumber)}</h1>
            <p class="muted">Status: ${escapeHtml(invoice.status)}</p>
          </div>
          <div class="meta-card">
            <div><span>Created</span><strong>${formatDate(invoice.createdAt)}</strong></div>
            <div><span>Due date</span><strong>${formatDate(invoice.dueDate)}</strong></div>
          </div>
        </section>

        <section class="party-grid">
          ${this.renderCompanyCard(company)}
          ${this.renderClientCard(client)}
        </section>

        <section class="paper-section">
          <h2>Invoice items</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="right">Qty</th>
                <th class="right">Rate</th>
                <th class="right">Tax</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>

        <section class="summary-grid">
          <div class="notes">
            ${invoice.terms ? `<h2>Terms</h2><p>${nl2br(invoice.terms)}</p>` : ''}
          </div>
          <div class="totals">
            ${this.renderTotalRow('Subtotal', invoice.subtotal, currency)}
            ${this.renderTotalRow('Tax', invoice.totalTax, currency)}
            ${this.renderTotalRow('Grand total', invoice.total, currency, true)}
          </div>
        </section>
      `,
    });
  }

  private buildProposalHtml({
    proposal,
    company,
    client,
    generatedAt = new Date(),
  }: ProposalPdfContext): string {
    const currency = company.currency || 'INR';
    const blocks = [...(proposal.blocks ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((block, index) =>
        this.renderProposalBlock(
          block,
          index,
          currency,
          proposal.signatureData,
        ),
      )
      .join('');

    return this.pageShell({
      title: proposal.title,
      company,
      generatedAt,
      body: `
        <section class="document-head">
          <div>
            <h1>${escapeHtml(proposal.title)}</h1>
            <p class="muted">Status: ${escapeHtml(proposal.status)}</p>
          </div>
          <div class="meta-card">
            <div><span>Created</span><strong>${formatDate(proposal.createdAt)}</strong></div>
            <div><span>Valid until</span><strong>${proposal.validUntil ? formatDate(proposal.validUntil) : 'Not set'}</strong></div>
            <div><span>Total</span><strong>${formatMoney(proposal.totalAmount, currency)}</strong></div>
          </div>
        </section>

        <section class="party-grid">
          ${this.renderCompanyCard(company)}
          ${this.renderClientCard(client)}
        </section>

        <section class="proposal-flow">
          ${blocks || '<div class="paper-section"><p class="muted">No proposal sections available.</p></div>'}
        </section>

        ${
          proposal.terms
            ? `<section class="paper-section">
                <h2>Terms</h2><p>${nl2br(proposal.terms)}</p>
              </section>`
            : ''
        }
        <section class="paper-section">
          <h2>E-Signature Evidence</h2>
          <p><strong>Acceptance status:</strong> ${escapeHtml(proposal.status)}</p>
          <p><strong>Signature method:</strong> ${escapeHtml(proposal.signatureMethod ?? 'Not signed')}</p>
          <p><strong>Signed timestamp:</strong> ${proposal.signedAt ? escapeHtml(formatDateTime(proposal.signedAt)) : 'Not signed'}</p>
          <p><strong>Signature IP/source:</strong> ${escapeHtml(proposal.signatureIp ?? 'Not captured')}</p>
          ${
            proposal.signatureMethod === 'AADHAAR_ESIGN' ||
            proposal.aadhaarEsignStatus
              ? `<p><strong>Aadhaar eSign status:</strong> ${escapeHtml(proposal.aadhaarEsignStatus ?? 'REQUESTED')}</p>
                 <p><strong>Aadhaar eSign reference:</strong> ${escapeHtml(proposal.aadhaarEsignReference ?? 'Not generated')}</p>`
              : ''
          }
        </section>
        ${
          proposal.auditTrail?.length
            ? `<section class="paper-section">
                <h2>Audit Trail</h2>
                <table>
                  <thead><tr><th>Event</th><th>Actor</th><th>Timestamp</th><th>Source</th></tr></thead>
                  <tbody>
                    ${proposal.auditTrail
                      .map(
                        (entry) => `<tr>
                          <td>${escapeHtml(entry.event)}</td>
                          <td>${escapeHtml(entry.actor)}</td>
                          <td>${escapeHtml(formatDateTime(entry.at))}</td>
                          <td>${escapeHtml(entry.ip ?? '')}</td>
                        </tr>`,
                      )
                      .join('')}
                  </tbody>
                </table>
              </section>`
            : ''
        }
      `,
    });
  }

  private pageShell({
    title,
    company,
    generatedAt,
    body,
  }: {
    title: string;
    company: PdfCompany;
    generatedAt: Date;
    body: string;
  }): string {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            @page { size: A4; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f5f7fb;
              color: #0f172a;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 12px;
              line-height: 1.55;
            }
            .page {
              min-height: 100vh;
              background: #ffffff;
              padding: 24px;
            }
            .topbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #dbe3ef;
              padding-bottom: 18px;
              margin-bottom: 22px;
            }
            .brand { display: flex; align-items: center; gap: 12px; }
            .logo {
              width: 46px;
              height: 46px;
              border-radius: 12px;
              display: grid;
              place-items: center;
              background: #0f766e;
              color: #ffffff;
              font-size: 16px;
              font-weight: 800;
            }
            .logo-img {
              width: 120px;
              max-width: 120px;
              height: 60px;
              object-fit: contain;
            }
            .brand h2 { margin: 0; font-size: 18px; }
            .brand p, .generated, .muted { margin: 0; color: #64748b; }
            .generated { text-align: right; font-size: 11px; }
            .document-head {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 22px;
            }
            .eyebrow {
              margin: 0 0 8px;
              color: #0f766e;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            h1 { margin: 0 0 8px; font-size: 30px; line-height: 1.15; }
            h2 { margin: 0 0 10px; font-size: 14px; }
            .meta-card, .paper-section, .party-card, .totals {
              border: 1px solid #dbe3ef;
              border-radius: 10px;
              background: #ffffff;
            }
            .meta-card { min-width: 220px; padding: 14px; }
            .meta-card div, .total-row {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              padding: 5px 0;
            }
            .meta-card span, .total-row span { color: #64748b; }
            .party-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 18px;
            }
            .party-card { padding: 14px; }
            .party-card p { margin: 4px 0 0; color: #334155; }
            .paper-section { padding: 16px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th {
              padding: 10px 8px;
              border-bottom: 1px solid #dbe3ef;
              color: #64748b;
              font-size: 10px;
              text-align: left;
              text-transform: uppercase;
            }
            td { padding: 12px 8px; border-bottom: 1px solid #edf2f7; vertical-align: top; }
            tr:last-child td { border-bottom: 0; }
            .right { text-align: right; }
            .summary-grid {
              display: grid;
              grid-template-columns: 1fr 280px;
              gap: 16px;
              align-items: start;
            }
            .notes { color: #334155; }
            .notes p, .paper-section p { margin: 0 0 12px; }
            .totals { padding: 12px 16px; }
            .total-row.strong {
              margin-top: 8px;
              border-top: 1px solid #dbe3ef;
              padding-top: 12px;
              font-size: 15px;
              font-weight: 800;
            }
            .proposal-block {
              break-inside: avoid;
            }
            .block-label {
              margin: 0 0 10px;
              color: #0f766e;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .signature-image {
              max-width: 260px;
              max-height: 92px;
              border: 1px solid #dbe3ef;
              border-radius: 8px;
              padding: 10px;
              background: #ffffff;
            }
          </style>
        </head>
        <body>
          <main class="page">
            <section class="topbar">
              <div class="brand">
                ${this.renderLogo(company)}
                <div>
                  <h2>${escapeHtml(company.legalName || company.name)}</h2>
                  <p>${escapeHtml(company.name)}</p>
                </div>
              </div>
              <p class="generated">Generated<br />${escapeHtml(formatDateTime(generatedAt))}</p>
            </section>
            ${body}
          </main>
        </body>
      </html>
    `;
  }

  private renderCompanyCard(company: PdfCompany): string {
    return `
      <div class="party-card">
        <h2>From</h2>
        <strong>${escapeHtml(company.legalName || company.name)}</strong>
        ${company.gstin ? `<p>GSTIN: ${escapeHtml(company.gstin)}</p>` : ''}
        ${company.state ? `<p>State: ${escapeHtml(company.state)}</p>` : ''}
      </div>
    `;
  }

  private renderLogo(company: PdfCompany): string {
    if (company.logoUrl) {
      return `<img class="logo-img" src="${escapeHtml(company.logoUrl)}" alt="${escapeHtml(company.logoAltText || `${company.name} logo`)}" />`;
    }

    return `<div class="logo">${escapeHtml(this.logoText(company))}</div>`;
  }

  private renderClientCard(client?: PdfClient | null): string {
    if (!client) {
      return `
        <div class="party-card">
          <h2>Bill to</h2>
          <p class="muted">Client details unavailable</p>
        </div>
      `;
    }

    return `
      <div class="party-card">
        <h2>Bill to</h2>
        <strong>${escapeHtml(client.companyName || client.name)}</strong>
        <p>${escapeHtml(client.name)}</p>
        ${client.email ? `<p>${escapeHtml(client.email)}</p>` : ''}
        ${client.phone ? `<p>${escapeHtml(client.phone)}</p>` : ''}
        ${client.address ? `<p>${nl2br(client.address)}</p>` : ''}
        ${client.gstin ? `<p>GSTIN: ${escapeHtml(client.gstin)}</p>` : ''}
        ${client.state ? `<p>State: ${escapeHtml(client.state)}</p>` : ''}
      </div>
    `;
  }

  private renderInvoiceItemRow(
    item: InvoiceLineItem,
    currency: string,
  ): string {
    return `
      <tr>
        <td>
          <strong>${escapeHtml(item.description)}</strong>
          ${item.hsnCode ? `<br /><span class="muted">HSN: ${escapeHtml(item.hsnCode)}</span>` : ''}
          ${item.sacCode ? `<br /><span class="muted">SAC: ${escapeHtml(item.sacCode)}</span>` : ''}
        </td>
        <td class="right">${formatNumber(item.quantity)}</td>
        <td class="right">${formatMoney(item.unitPrice, currency)}</td>
        <td class="right">${formatNumber(item.gstRate)}%</td>
        <td class="right"><strong>${formatMoney(item.total ?? item.taxableAmount ?? 0, currency)}</strong></td>
      </tr>
    `;
  }

  private renderProposalBlock(
    block: ProposalBlock,
    index: number,
    currency: string,
    signatureData?: string | null,
  ): string {
    const content = block.content ?? {};
    const heading = stringValue(content.heading) || stringValue(content.title);
    const text =
      stringValue(content.description) ||
      stringValue(content.text) ||
      stringValue(content.body) ||
      stringValue(content.summary) ||
      stringValue(content.acceptanceText);
    const items = Array.isArray(content.items)
      ? content.items
      : Array.isArray(content.lineItems)
        ? content.lineItems
        : [];

    if (items.length > 0) {
      return `
        <section class="paper-section proposal-block">
          <p class="block-label">${index + 1}. ${escapeHtml(formatLabel(block.type))}</p>
          ${heading ? `<h2>${escapeHtml(heading)}</h2>` : ''}
          ${text ? `<p>${nl2br(text)}</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="right">Qty</th>
                <th class="right">Rate</th>
                <th class="right">Tax</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item) => this.renderProposalItemRow(item as Record<string, unknown>, currency)).join('')}
            </tbody>
          </table>
        </section>
      `;
    }

    if (block.type === 'signature') {
      return `
        <section class="paper-section proposal-block">
          <p class="block-label">${index + 1}. Signature</p>
          ${heading ? `<h2>${escapeHtml(heading)}</h2>` : '<h2>Acceptance</h2>'}
          ${text ? `<p>${nl2br(text)}</p>` : ''}
          ${stringValue(content.signerName) ? `<p><strong>Signer:</strong> ${escapeHtml(stringValue(content.signerName))}</p>` : ''}
          ${
            signatureData
              ? `<img class="signature-image" src="${escapeHtml(signatureData)}" alt="Client signature" />`
              : '<p class="muted">Signature not captured yet.</p>'
          }
        </section>
      `;
    }

    return `
      <section class="paper-section proposal-block">
        <p class="block-label">${index + 1}. ${escapeHtml(formatLabel(block.type))}</p>
        ${heading ? `<h2>${escapeHtml(heading)}</h2>` : ''}
        ${text ? `<p>${nl2br(text)}</p>` : this.renderContentList(content)}
      </section>
    `;
  }

  private renderProposalItemRow(
    item: Record<string, unknown>,
    currency: string,
  ): string {
    const quantity = numberValue(item.quantity, 1);
    const unitPrice = numberValue(item.unitPrice ?? item.price ?? item.rate, 0);
    const gstRate = numberValue(item.gstRate ?? item.taxRate, 0);
    const discount = numberValue(item.discount, 0);
    const taxable = quantity * unitPrice - discount;
    const tax = taxable * (gstRate > 1 ? gstRate / 100 : gstRate);
    const total = numberValue(item.total, taxable + tax);

    return `
      <tr>
        <td><strong>${escapeHtml(stringValue(item.description) || stringValue(item.name) || 'Proposal item')}</strong></td>
        <td class="right">${formatNumber(quantity)}</td>
        <td class="right">${formatMoney(unitPrice, currency)}</td>
        <td class="right">${formatNumber(gstRate)}%</td>
        <td class="right"><strong>${formatMoney(total, currency)}</strong></td>
      </tr>
    `;
  }

  private renderContentList(content: Record<string, unknown>): string {
    const lines = Object.entries(content)
      .filter(([key]) => !isInternalPdfField(key))
      .filter(
        ([, value]) => typeof value === 'string' && value.trim().length > 0,
      )
      .map(
        ([key, value]) =>
          `<p><strong>${escapeHtml(formatLabel(key))}:</strong> ${nl2br(String(value))}</p>`,
      );

    return lines.join('') || '<p class="muted">No details added.</p>';
  }

  private renderTotalRow(
    label: string,
    value: number | string,
    currency: string,
    strong = false,
  ): string {
    return `
      <div class="total-row ${strong ? 'strong' : ''}">
        <span>${escapeHtml(label)}</span>
        <strong>${formatMoney(value, currency)}</strong>
      </div>
    `;
  }

  private logoText(company: PdfCompany): string {
    if (company.logoText?.trim()) {
      return company.logoText.trim().slice(0, 3).toUpperCase();
    }

    return (company.legalName || company.name || 'IF')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
}

function escapeHtml(value: unknown): string {
  return safeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function nl2br(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMoney(value: number | string, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatNumber(value: number | string): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatLabel(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isInternalPdfField(key: string): boolean {
  return new Set([
    'accentColor',
    'backgroundColor',
    'bgColor',
    'color',
    'eyebrow',
    'notes',
    'textColor',
    'themeColor',
  ]).has(key);
}
