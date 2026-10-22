# Victoria Form 1 Rental Agreement - Online Dual-Signing Platform

An intuitive online platform to review and sign the **Victoria Residential Tenancies Form 1 Agreement** (under the *Residential Tenancies Act 1997*).

**Agreement Property**: 5 Mannix St, Warrnambool VIC 3280  
- **Rental Provider 1**: Duc Teo Ngo (`hoanghonlen211@gmail.com`)  
- **Renter 1**: SAMSUL I TALKUDER (`0476620057`)  

---

## 🌟 Key Features

1. **Full 10-Page Document Review**:
   - High-fidelity visual rendering of all 10 pages.
   - Quick navigation shortcuts: Page 1 (Parties & Address), Page 6-7 (Rights & Obligations), and Page 9 (Signatures).
   - Zoom controls (50% to 200%), fit to width, and collapsible thumbnail list.

2. **Dual-Signer Workflow (Rental Provider 1 & Renter 1)**:
   - 3 flexible signing options for each party:
     - ✍️ **Draw**: Smooth HTML5 Canvas with adjustable ink colors, stroke width, undo, and clear.
     - ⌨️ **Type Name**: Generates elegant cursive signatures with 4 distinctive fonts (*Dancing Script, Great Vibes, Caveat, Sacramento*).
     - 📁 **Upload**: Drag-and-drop signature images with automatic white background suppression and ink contrast boost.
   - Live interactive visual feedback on Page 9 inside the document viewer.

3. **Exact Box-Fit Guarantee (No Overflow)**:
   - Exact vector box coordinates extracted from the official PDF form:
     - **Rental Provider 1 Box**: `Rect(160.0, 106.0, 386.0, 149.0)`
     - **Renter 1 Box**: `Rect(160.0, 276.5, 386.0, 300.0)`
   - Signatures are automatically trimmed of transparent whitespace and rendered with proportional scaling (`keep_proportion=True`) and safe padding. Signatures never touch borders or overflow.

4. **Simultaneous Dual-Signature Download Gate**:
   - Strict security rule: **Download is locked** until BOTH Rental Provider 1 and Renter 1 have completed their signatures.
   - Once both sign, the gate unlocks with celebration confetti, prompts for recipient email verification, and provides immediate PDF download and high-resolution Page 9 preview.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Pip

### 1. Clone the Repository
```bash
git clone https://github.com/GenNon317/signature-rent.git
cd signature-rent
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the Server
```bash
python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```
or simply:
```bash
python server.py
```

### 4. Access the App
Open your web browser and navigate to:  
👉 **http://127.0.0.1:8000/**

---

## 📁 Repository Structure

```text
├── Form_1_Rental_Agreement_5_Mannix_St_SAMSUL_I_TALKUDER.pdf   # Official Victoria Form 1 PDF
├── server.py                                                   # FastAPI backend with PyMuPDF engine
├── requirements.txt                                            # Python dependencies
├── .gitignore                                                  # Git ignore configuration
├── README.md                                                   # Documentation
└── static/
    ├── index.html                                              # Simplified English user interface
    ├── style.css                                               # Modern executive styling
    ├── app.js                                                  # Interactive signing & validation logic
    ├── vendor/
    │   └── confetti.js                                         # Confetti celebration script
    └── pages/                                                  # Pre-rendered 10-page preview images
```
