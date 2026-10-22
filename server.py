import os
import io
import re
import base64
from typing import Optional
from fastapi import FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr
import pymupdf
from PIL import Image

app = FastAPI(title="Rental Agreement Signing Platform")

PDF_PATH = "Form_1_Rental_Agreement_5_Mannix_St_SAMSUL_I_TALKUDER.pdf"
SIGNED_PDF_PATH = "Form_1_Rental_Agreement_Signed.pdf"
PAGES_DIR = "static/pages"

# Coordinates on Page 9 (0-indexed page 8, mediabox: 595.32 x 841.92)
# Provider 1: Box borders are left: 155.66, right: 389.71, top: 102.62, bottom: 152.54
# Interior safe rect with padding:
PROVIDER_BOX = pymupdf.Rect(160.0, 106.0, 386.0, 149.0)

# Renter 1: Box borders are left: 155.66, right: 389.71, top: 273.65, bottom: 302.45
# Interior safe rect with padding (height is 28.32, so padding 3pt top/bottom):
RENTER_BOX = pymupdf.Rect(160.0, 276.5, 386.0, 300.0)

os.makedirs(PAGES_DIR, exist_ok=True)

def render_pages():
    doc = pymupdf.open(PDF_PATH)
    for i, page in enumerate(doc):
        out_file = os.path.join(PAGES_DIR, f"page_{i+1}.png")
        if not os.path.exists(out_file):
            pix = page.get_pixmap(dpi=150)
            pix.save(out_file)
    print(f"Rendered {len(doc)} pages.")

# Ensure pages are rendered on start
render_pages()

def trim_transparent_borders(img: Image.Image) -> Image.Image:
    """Auto-trims transparent whitespace around signature so it scales nicely."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        # Add 2px margin
        w, h = img.size
        pad = 2
        x0 = max(0, bbox[0] - pad)
        y0 = max(0, bbox[1] - pad)
        x1 = min(w, bbox[2] + pad)
        y1 = min(h, bbox[3] + pad)
        return img.crop((x0, y0, x1, y1))
    return img

def decode_base64_image(data_url: str) -> bytes:
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    raw = base64.b64decode(data_url)
    img = Image.open(io.BytesIO(raw))
    img = trim_transparent_borders(img)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

class SignRequest(BaseModel):
    providerSignature: str
    renterSignature: str
    email: str
    signDate: Optional[str] = "10/08/2026"

@app.get("/api/document-info")
def get_doc_info():
    doc = pymupdf.open(PDF_PATH)
    page9 = doc[8]
    page_w = page9.rect.width
    page_h = page9.rect.height
    return {
        "title": "Residential Rental Agreement – no more than 5 years",
        "property": "5 Mannix street, Warrnambool VIC 3280",
        "totalPages": len(doc),
        "signaturePage": 9,
        "signers": {
            "provider": {
                "role": "Rental Provider 1",
                "name": "Duc Teo Ngo",
                "email": "hoanghonlen211@gmail.com",
                "phone": "0423789688",
                "address": "9 Fairfax Cct, Albanvale VIC 3021",
                "box": {
                    "left": PROVIDER_BOX.x0 / page_w,
                    "top": PROVIDER_BOX.y0 / page_h,
                    "width": PROVIDER_BOX.width / page_w,
                    "height": PROVIDER_BOX.height / page_h,
                }
            },
            "renter": {
                "role": "Renter 1",
                "name": "SAMSUL I TALKUDER",
                "phone": "0476620057",
                "address": "16 Bottlebrush ct, Sunshine West VIC 3020",
                "box": {
                    "left": RENTER_BOX.x0 / page_w,
                    "top": RENTER_BOX.y0 / page_h,
                    "width": RENTER_BOX.width / page_w,
                    "height": RENTER_BOX.height / page_h,
                }
            }
        }
    }

@app.post("/api/sign")
def sign_document(req: SignRequest):
    # Rule 1: BOTH signatures must be present
    if not req.providerSignature or not req.providerSignature.strip():
        raise HTTPException(status_code=400, detail="Thiếu chữ ký của Rental Provider 1 (Duc Teo Ngo).")
    if not req.renterSignature or not req.renterSignature.strip():
        raise HTTPException(status_code=400, detail="Thiếu chữ ký của Renter 1 (SAMSUL I TALKUDER).")
    
    # Rule 2: Email must be provided and valid
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not req.email or not re.match(email_regex, req.email.strip()):
        raise HTTPException(status_code=400, detail="Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.")
    
    try:
        provider_img_bytes = decode_base64_image(req.providerSignature)
        renter_img_bytes = decode_base64_image(req.renterSignature)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi xử lý hình ảnh chữ ký: {str(e)}")

    doc = pymupdf.open(PDF_PATH)
    page9 = doc[8]

    # Insert Provider Signature neatly inside box with keep_proportion=True
    page9.insert_image(PROVIDER_BOX, stream=provider_img_bytes, keep_proportion=True)

    # Insert Renter Signature neatly inside box with keep_proportion=True
    page9.insert_image(RENTER_BOX, stream=renter_img_bytes, keep_proportion=True)

    doc.save(SIGNED_PDF_PATH)
    doc.close()

    # Also render signed page 9 for instant web preview
    signed_doc = pymupdf.open(SIGNED_PDF_PATH)
    pix = signed_doc[8].get_pixmap(dpi=150)
    pix.save("static/signed_page_9.png")
    signed_doc.close()

    return {
        "success": True,
        "message": "Hợp đồng đã được ký hoàn tất bởi cả Rental Provider 1 và Renter 1!",
        "email": req.email.strip(),
        "downloadUrl": "/api/download",
        "previewUrl": "/static/signed_page_9.png"
    }

@app.get("/api/download")
def download_signed():
    if not os.path.exists(SIGNED_PDF_PATH):
        raise HTTPException(status_code=404, detail="Hợp đồng chưa được ký hoặc chưa sẵn sàng tải về.")
    return FileResponse(
        path=SIGNED_PDF_PATH,
        filename="Form_1_Rental_Agreement_5_Mannix_St_SAMSUL_I_TALKUDER_Signed.pdf",
        media_type="application/pdf"
    )

# Mount static folder
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
