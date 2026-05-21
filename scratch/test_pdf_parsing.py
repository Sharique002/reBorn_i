import io
import pdfplumber
from PyPDF2 import PdfReader

pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 72 >>
stream
BT
/F1 12 Tf
72 712 Td
(Python Javascript AWS Docker Resume summary education experience) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000351 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
439
%%EOF"""

print("Testing pdfplumber...")
try:
    with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
        text = "\n\n".join([page.extract_text() or "" for page in pdf.pages])
        print("pdfplumber extracted:", repr(text))
except Exception as e:
    print("pdfplumber failed:", e)

print("\nTesting PyPDF2...")
try:
    reader = PdfReader(io.BytesIO(pdf_content))
    text2 = "\n\n".join([page.extract_text() or "" for page in reader.pages])
    print("PyPDF2 extracted:", repr(text2))
except Exception as e:
    print("PyPDF2 failed:", e)
