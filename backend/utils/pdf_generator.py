from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import os

def generate_client_report(client_data, responses_data, output_path):
    """
    Generate a professional PDF report for a client.
    
    Args:
        client_data: Dictionary containing client information
        responses_data: List of questionnaire responses
        output_path: Path where PDF should be saved
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1A4D2E'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1A4D2E'),
        spaceAfter=12,
        spaceBefore=20
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        leading=16,
        spaceAfter=12
    )
    
    # Title
    story.append(Paragraph("Client Journey Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Client Information
    story.append(Paragraph("Client Information", heading_style))
    client_info = [
        ["Name:", client_data.get('full_name', 'N/A')],
        ["Email:", client_data.get('email', 'N/A')],
        ["Current Stage:", f"Stage {client_data.get('current_stage', 1)}"],
        ["Progress:", f"{client_data.get('progress_percentage', 0)}%"],
        ["Report Date:", datetime.now().strftime('%B %d, %Y')]
    ]
    
    client_table = Table(client_info, colWidths=[2*inch, 4*inch])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F2F4F3')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(client_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Responses Summary
    if responses_data:
        story.append(Paragraph("Questionnaire Responses", heading_style))
        
        for idx, response in enumerate(responses_data, 1):
            question_text = f"Q{idx}: {response.get('question_text', 'Question')}"
            answer_text = f"Answer: {response.get('answer', 'No answer provided')}"
            
            story.append(Paragraph(question_text, body_style))
            story.append(Paragraph(answer_text, body_style))
            story.append(Spacer(1, 0.1*inch))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Recommendations
    story.append(Paragraph("Recommendations", heading_style))
    story.append(Paragraph(
        "Based on your responses, we recommend the following next steps:",
        body_style
    ))
    story.append(Spacer(1, 0.1*inch))
    
    recommendations = [
        "Continue with the next stage of the journey",
        "Review action items with your team member",
        "Prepare for upcoming consultation meeting",
        "Complete any pending documentation"
    ]
    
    for rec in recommendations:
        story.append(Paragraph(f"• {rec}", body_style))
    
    # Build PDF
    doc.build(story)
    return output_path
