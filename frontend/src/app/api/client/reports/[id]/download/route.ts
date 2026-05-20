import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const report = await prisma.report.findUnique({
      where: { id: resolvedParams.id },
      include: {
        careerOptions: { include: { skillGaps: true } },
        clientProfile: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    if (!report) {
      return new NextResponse('Report not found', { status: 404 });
    }

    const userName = report.clientProfile?.user?.name || 'Valued Client';
    const userEmail = report.clientProfile?.user?.email || '';
    const reportDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const careerCardsHtml = report.careerOptions.map((opt: any, i: number) => `
            <div class="career-card">
                <div class="career-header">
                    <div class="career-title">${i + 1}. ${opt.title}</div>
                    <div class="career-match">${opt.match}%<small>alignment match</small></div>
                </div>
                ${opt.reasoning ? `<div class="career-reasoning">${opt.reasoning}</div>` : ''}
            </div>`).join('');

    const allSkillGaps = report.careerOptions.flatMap((opt: any) => opt.skillGaps || []);
    const skillGapsHtml = allSkillGaps.length > 0
      ? allSkillGaps.map((sg: any) => `<span class="skill-tag">${sg.skill || sg}</span>`).join('')
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${userName} - AI Career Analysis Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.6; background: white; }
  .page { padding: 48px 56px; max-width: 900px; margin: 0 auto; }
  .header { text-align: center; padding-bottom: 24px; border-bottom: 3px solid #4f46e5; margin-bottom: 36px; }
  .header h1 { font-size: 30px; color: #1a1a2e; letter-spacing: 1px; margin-top: 4px; }
  .header .subtitle { font-size: 13px; color: #6366f1; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; }
  .header .meta { font-size: 11px; color: #94a3b8; margin-top: 8px; }
  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
  .persona { font-size: 13px; color: #475569; line-height: 1.8; background: #f8fafc; padding: 18px 22px; border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; }
  .career-grid { display: grid; gap: 14px; }
  .career-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; page-break-inside: avoid; }
  .career-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .career-title { font-size: 15px; font-weight: 700; color: #1e293b; }
  .career-match { font-size: 22px; font-weight: 900; color: #4f46e5; text-align: right; }
  .career-match small { font-size: 9px; color: #94a3b8; display: block; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
  .career-reasoning { font-size: 12px; color: #64748b; line-height: 1.7; padding-left: 12px; border-left: 2px solid #e2e8f0; }
  .skill-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  .footer strong { color: #4f46e5; }
  @media print { body { padding: 0; } .page { padding: 32px 40px; } .career-card { break-inside: avoid; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="subtitle">AI Career Analysis Report</div>
    <h1>${userName}</h1>
    <div class="meta">Generated on ${reportDate} • ${userEmail} • Career Path Platform</div>
  </div>

  ${report.content && !report.content.includes('Pending') ? `
  <div class="section">
    <div class="section-title">Professional Persona</div>
    <div class="persona">${report.content}</div>
  </div>` : ''}

  ${report.careerOptions.length > 0 ? `
  <div class="section">
    <div class="section-title">Recommended Career Trajectories</div>
    <div class="career-grid">${careerCardsHtml}</div>
  </div>` : ''}

  ${skillGapsHtml ? `
  <div class="section">
    <div class="section-title">Growth Areas & Skill Gaps</div>
    <div class="skill-list">${skillGapsHtml}</div>
  </div>` : ''}

  <div class="footer">
    <p>This report was generated by <strong>Career Path AI</strong> using advanced assessment data analysis.</p>
    <p>&copy; ${new Date().getFullYear()} Career Path Platform. Confidential.</p>
  </div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return new NextResponse(`Error generating PDF: ${error.message}`, { status: 500 });
  }
}
