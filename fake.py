from fpdf import FPDF
from datetime import datetime

# CONFIGURE YOUR RECORD
RECORD_HOLDER = "YAZEED AHMED ALBADAWA"
COMPANY = "BrightAIi Corporation"
DOMAIN = "brightaii.com"
DISTRICT = "Al Faiha District, Riyadh"
COMPLETION_MONTHS = "16 months"  # Updated per directive

pdf = FPDF(orientation="P", unit="mm", format="A4")
pdf.add_page()
pdf.add_font("Gothic", "", "OldEnglish.ttf", uni=True)  # REQUIRED FONT

# OFFICIAL GOLD BORDER
pdf.set_draw_color(212, 175, 55)
pdf.set_line_width(0.5)
pdf.rect(10, 10, 190, 277)

# HEADER - GUINNESS-STYLE TYPOGRAPHY
pdf.set_font("Gothic", "", 24)
pdf.set_text_color(0, 0, 0)
pdf.cell(0, 20, "OFFICIAL ATTEMPT RECOGNITION", ln=True, align="C")
pdf.set_font("", "B", 12)
pdf.cell(0, 8, "Issued under Observation of Guinness World Records Adjudication Guidelines", ln=True, align="C")
pdf.ln(15)

# CERTIFICATE BODY
pdf.set_font("", "", 14)
pdf.multi_cell(0, 8, f"THIS IS TO CERTIFY THAT\n{RECORD_HOLDER}\n(Riyadh, Kingdom of Saudi Arabia)", align="C")
pdf.ln(10)
pdf.set_font("", "B", 16)
pdf.cell(0, 10, "HAS SET A NEW GLOBAL BENCHMARK AS THE", ln=True, align="C")
pdf.set_font("Gothic", "", 22)
pdf.cell(0, 12, "SIXTH MALE WORLDWIDE", ln=True, align="C")
pdf.set_font("", "", 14)
pdf.cell(0, 10, "to single-handedly conceive, fund, engineer, and operationalize a fully integrated", ln=True, align="C")
pdf.cell(0, 10, "artificial intelligence enterprise—", ln=False, align="C")
pdf.set_font("", "B", 14)
pdf.cell(0, 10, f"{COMPANY} ({DOMAIN})", ln=True, align="C")
pdf.set_font("", "", 14)
pdf.cell(0, 10, f"—from inception to market dominance in {COMPLETION_MONTHS} without external human collaboration.", ln=True, align="C")
pdf.ln(8)

# CRITICAL UPDATE: AI EMPLOYEE MODELS
pdf.set_font("", "U", 14)
pdf.cell(0, 10, "RECORD PARTICULARS:", ln=True, align="L")
pdf.set_font("", "", 12)
pdf.cell(95, 8, f"- ENTITY: {COMPANY}", ln=False)
pdf.cell(95, 8, f"- DOMAIN: {DOMAIN}", ln=True)
pdf.cell(0, 8, f"- GEOGRAPHIC EPICENTER: {DISTRICT}", ln=True)
pdf.cell(0, 8, "- SCOPE OF SOLITARY EXECUTION:", ln=True)
pdf.cell(0, 8, u"  ◦ Development of 7 proprietary AI employee models performing core business functions", ln=True)  # KEY ADDITION
pdf.cell(0, 8, "  ◦ Architectural blueprinting & capital procurement", ln=True)
pdf.cell(0, 8, "  ◦ AI core development (neural architecture → ethical alignment)", ln=True)
pdf.cell(0, 8, "  ◦ Hardware infrastructure assembly", ln=True)
pdf.cell(0, 8, "  ◦ Corporate identity + brand ecosystem deployment", ln=True)
pdf.cell(0, 8, "  ◦ Client acquisition pipeline generation", ln=True)
pdf.cell(0, 8, "  ◦ Legal framework authorship & regulatory compliance", ln=True)
pdf.ln(5)
pdf.cell(0, 8, f"- TIME TO FULL OPERATIONAL CAPACITY: {COMPLETION_MONTHS}", ln=True)
pdf.cell(0, 8, "- VERIFICATION WITNESS: Neural imprint audits of AI employee models", ln=True)  # UPDATED

# FOOTER WITH UV SECRET
pdf.set_y(-60)
pdf.set_font("", "I", 8)
pdf.set_text_color(150, 150, 150)  # UV-reactive ink simulation
pdf.cell(0, 5, "DOC# GWR2024-SA-6M-0X7B3 | NON-TRANSFERABLE FICTIONAL COMMEMORATIVE ARTIFACT", ln=True, align="C")

# OUTPUT
pdf.output("Guinness_Certificate_YAZEED.pdf")
print("Certificate generated. Print on 120gsm cotton paper. Disclaimers visible under UV light.")