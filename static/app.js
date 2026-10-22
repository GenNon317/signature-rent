/**
 * Victoria Tenancy e-Sign Platform
 * Compact & Responsive Logic (Desktop & Mobile Friendly)
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentPage: 1,
    totalPages: 10,
    zoom: 1.0,
    basePageWidth: 700,
    activeSigner: 'provider', // 'provider' | 'renter'
    activeMode: 'draw', // 'draw' | 'type' | 'upload'
    signatures: {
      provider: null,
      renter: null
    },
    signerDetails: {
      provider: {
        role: 'Landlord',
        name: 'Duc Teo Ngo',
        email: 'hoanghonlen211@gmail.com'
      },
      renter: {
        role: 'Tenant',
        name: 'SAMSUL I TALKUDER',
        email: 'samsul.talkuder@gmail.com'
      }
    },
    isDrawing: false,
    drawColor: '#0f172a',
    drawWidth: 3,
    canvasHistory: [],
    selectedFont: 'Dancing Script',
    uploadedDataUrl: null,
    bothSigned: false
  };

  // DOM Elements
  const DOM = {
    // Header
    headerProviderPill: document.getElementById('headerProviderPill'),
    headerProviderStatus: document.getElementById('headerProviderStatus'),
    headerRenterPill: document.getElementById('headerRenterPill'),
    headerRenterStatus: document.getElementById('headerRenterStatus'),
    headerWorkflowBadge: document.getElementById('headerWorkflowBadge'),
    headerWorkflowText: document.getElementById('headerWorkflowText'),

    // Mobile Switcher
    btnMobileTabSign: document.getElementById('btnMobileTabSign'),
    btnMobileTabDoc: document.getElementById('btnMobileTabDoc'),
    docViewerPanel: document.getElementById('docViewerPanel'),
    signingPanel: document.getElementById('signingPanel'),

    // Viewer
    docStage: document.getElementById('docStage'),
    pageViewportWrapper: document.getElementById('pageViewportWrapper'),
    mainPageImg: document.getElementById('mainPageImg'),
    page9Overlay: document.getElementById('page9Overlay'),
    overlayProviderBox: document.getElementById('overlayProviderBox'),
    boxProviderContent: document.getElementById('boxProviderContent'),
    overlayRenterBox: document.getElementById('overlayRenterBox'),
    boxRenterContent: document.getElementById('boxRenterContent'),
    thumbsSidebar: document.getElementById('thumbsSidebar'),
    thumbsList: document.getElementById('thumbsList'),
    btnToggleThumbs: document.getElementById('btnToggleThumbs'),
    btnCloseThumbs: document.getElementById('btnCloseThumbs'),
    btnPrevPage: document.getElementById('btnPrevPage'),
    btnNextPage: document.getElementById('btnNextPage'),
    pageNumberInput: document.getElementById('pageNumberInput'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    zoomLevelText: document.getElementById('zoomLevelText'),
    btnFitWidth: document.getElementById('btnFitWidth'),
    btnJumpP9: document.getElementById('btnJumpP9'),

    // Step 1: Signer Tabs
    btnSelectProvider: document.getElementById('btnSelectProvider'),
    btnSelectRenter: document.getElementById('btnSelectRenter'),
    providerStatusBadge: document.getElementById('providerStatusBadge'),
    renterStatusBadge: document.getElementById('renterStatusBadge'),

    // Step 2: Signature
    activeSignerLabel: document.getElementById('activeSignerLabel'),
    btnApplySignature: document.getElementById('btnApplySignature'),
    btnApplyText: document.getElementById('btnApplyText'),
    tabDraw: document.getElementById('tabDraw'),
    tabType: document.getElementById('tabType'),
    tabUpload: document.getElementById('tabUpload'),
    paneDraw: document.getElementById('paneDraw'),
    paneType: document.getElementById('paneType'),
    paneUpload: document.getElementById('paneUpload'),
    signatureCanvas: document.getElementById('signatureCanvas'),
    btnUndoCanvas: document.getElementById('btnUndoCanvas'),
    btnClearCanvas: document.getElementById('btnClearCanvas'),
    colorDots: document.querySelectorAll('.c-dot'),
    typeInputText: document.getElementById('typeInputText'),
    fontItems: document.querySelectorAll('.font-item'),
    fontPreviews: {
      'Dancing Script': document.getElementById('fontPreviewDancing'),
      'Great Vibes': document.getElementById('fontPreviewGreatVibes'),
      'Caveat': document.getElementById('fontPreviewCaveat'),
      'Sacramento': document.getElementById('fontPreviewSacramento')
    },
    uploadDropzone: document.getElementById('uploadDropzone'),
    sigFileInput: document.getElementById('sigFileInput'),
    uploadPreviewArea: document.getElementById('uploadPreviewArea'),
    uploadPreviewImg: document.getElementById('uploadPreviewImg'),
    btnRemoveUpload: document.getElementById('btnRemoveUpload'),

    // Step 3: Download
    downloadLockedView: document.getElementById('downloadLockedView'),
    downloadUnlockedView: document.getElementById('downloadUnlockedView'),
    checkItemProvider: document.getElementById('checkItemProvider'),
    checkStateProvider: document.getElementById('checkStateProvider'),
    checkItemRenter: document.getElementById('checkItemRenter'),
    checkStateRenter: document.getElementById('checkStateRenter'),
    downloadEmailInput: document.getElementById('downloadEmailInput'),
    emailErrorMsg: document.getElementById('emailErrorMsg'),
    btnDownloadPDF: document.getElementById('btnDownloadPDF'),
    btnPreviewSignedPage: document.getElementById('btnPreviewSignedPage'),

    // Modal & Toast
    previewModal: document.getElementById('previewModal'),
    modalSignedImg: document.getElementById('modalSignedImg'),
    btnClosePreviewModal: document.getElementById('btnClosePreviewModal'),
    btnClosePreviewModal2: document.getElementById('btnClosePreviewModal2'),
    toastContainer: document.getElementById('toastContainer')
  };

  let ctx = null;

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    initCanvas();
    renderThumbnails();
    setPage(1);
    updateZoom();
    bindEvents();
    updateSignerUI();
    updateDownloadGate();
    initMobileResponsive();
  }

  /* ==========================================================================
     Mobile Switcher (Default: Sign Tab on mobile)
     ========================================================================== */
  function initMobileResponsive() {
    if (window.innerWidth <= 900) {
      setMobileView('sign');
    }
  }

  function setMobileView(view) {
    if (view === 'sign') {
      DOM.btnMobileTabSign?.classList.add('active');
      DOM.btnMobileTabDoc?.classList.remove('active');
      DOM.signingPanel.classList.remove('mobile-hidden');
      DOM.docViewerPanel.classList.add('mobile-hidden');
    } else {
      DOM.btnMobileTabDoc?.classList.add('active');
      DOM.btnMobileTabSign?.classList.remove('active');
      DOM.docViewerPanel.classList.remove('mobile-hidden');
      DOM.signingPanel.classList.add('mobile-hidden');
    }
  }

  /* ==========================================================================
     Canvas Setup & Drawing Handling (Smooth Strokes)
     ========================================================================== */
  function initCanvas() {
    const canvas = DOM.signatureCanvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 400;
    const h = rect.height || 125;

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    saveCanvasState();
  }

  function getCanvasPos(e) {
    const canvas = DOM.signatureCanvas;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  let points = [];

  function startDrawing(e) {
    e.preventDefault();
    state.isDrawing = true;
    points = [];
    const pos = getCanvasPos(e);
    points.push(pos);

    ctx.strokeStyle = state.drawColor;
    ctx.lineWidth = state.drawWidth;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function drawMove(e) {
    if (!state.isDrawing) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    points.push(pos);

    if (points.length >= 3) {
      const len = points.length;
      const xc = (points[len - 2].x + points[len - 1].x) / 2;
      const yc = (points[len - 2].y + points[len - 1].y) / 2;
      ctx.quadraticCurveTo(points[len - 2].x, points[len - 2].y, xc, yc);
      ctx.stroke();
    } else {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  }

  function stopDrawing(e) {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    ctx.closePath();
    saveCanvasState();
  }

  function saveCanvasState() {
    const canvas = DOM.signatureCanvas;
    state.canvasHistory.push(canvas.toDataURL());
    if (state.canvasHistory.length > 20) state.canvasHistory.shift();
  }

  function undoCanvas() {
    if (state.canvasHistory.length > 1) {
      state.canvasHistory.pop();
      const prev = state.canvasHistory[state.canvasHistory.length - 1];
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, DOM.signatureCanvas.width / dpr, DOM.signatureCanvas.height / dpr);
        ctx.drawImage(img, 0, 0, DOM.signatureCanvas.width / dpr, DOM.signatureCanvas.height / dpr);
      };
      img.src = prev;
    } else {
      clearCanvas();
    }
  }

  function clearCanvas() {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, DOM.signatureCanvas.width / dpr, DOM.signatureCanvas.height / dpr);
    state.canvasHistory = [];
    saveCanvasState();
  }

  /* ==========================================================================
     Type & Upload Modes
     ========================================================================== */
  function updateTypePreviews() {
    const text = DOM.typeInputText.value.trim() || state.signerDetails[state.activeSigner].name;
    for (const [font, el] of Object.entries(DOM.fontPreviews)) {
      if (el) el.textContent = text;
    }
  }

  function renderTypedSignatureToCanvas(text, fontName) {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 130;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = state.drawColor || '#0f172a';
    c.textBaseline = 'middle';
    c.textAlign = 'center';

    let fontSize = 54;
    if (fontName === 'Sacramento') fontSize = 64;
    if (fontName === 'Great Vibes') fontSize = 58;
    c.font = `600 ${fontSize}px "${fontName}", cursive`;

    c.fillText(text, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  function handleSignatureUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG / JPG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const c = canvas.getContext('2d');
        c.drawImage(img, 0, 0);

        const imgData = c.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Auto remove white background
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness > 215) {
            data[i + 3] = 0;
          } else {
            const alpha = 255 - brightness;
            data[i] = Math.min(r, 20);
            data[i + 1] = Math.min(g, 35);
            data[i + 2] = Math.min(b, 70);
            data[i + 3] = Math.min(255, alpha * 1.5);
          }
        }
        c.putImageData(imgData, 0, 0);

        state.uploadedDataUrl = canvas.toDataURL('image/png');
        DOM.uploadPreviewImg.src = state.uploadedDataUrl;
        DOM.uploadDropzone.style.display = 'none';
        DOM.uploadPreviewArea.style.display = 'flex';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function cropTransparentCanvas(dataUrl, callback) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const c = canvas.getContext('2d');
      c.drawImage(img, 0, 0);

      const imgData = c.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
      let hasPixels = false;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          if (data[idx + 3] > 20) {
            hasPixels = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!hasPixels) {
        callback(null);
        return;
      }

      const pad = 3;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(canvas.width, maxX + pad);
      maxY = Math.min(canvas.height, maxY + pad);

      const cropW = maxX - minX;
      const cropH = maxY - minY;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

      callback(cropCanvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  }

  /* ==========================================================================
     Apply Signature
     ========================================================================== */
  function applySignature() {
    let rawDataUrl = null;

    if (state.activeMode === 'draw') {
      const dpr = window.devicePixelRatio || 1;
      const imgData = ctx.getImageData(0, 0, DOM.signatureCanvas.width / dpr, DOM.signatureCanvas.height / dpr);
      let drawn = false;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 20) { drawn = true; break; }
      }
      if (!drawn) {
        showToast('Please sign before saving.', 'error');
        return;
      }
      rawDataUrl = DOM.signatureCanvas.toDataURL('image/png');
    } else if (state.activeMode === 'type') {
      const text = DOM.typeInputText.value.trim() || state.signerDetails[state.activeSigner].name;
      rawDataUrl = renderTypedSignatureToCanvas(text, state.selectedFont);
    } else if (state.activeMode === 'upload') {
      if (!state.uploadedDataUrl) {
        showToast('Please choose an image.', 'error');
        return;
      }
      rawDataUrl = state.uploadedDataUrl;
    }

    if (!rawDataUrl) return;

    cropTransparentCanvas(rawDataUrl, (trimmedDataUrl) => {
      if (!trimmedDataUrl) {
        showToast('No signature detected.', 'error');
        return;
      }

      state.signatures[state.activeSigner] = trimmedDataUrl;
      const signerName = state.signerDetails[state.activeSigner].name;
      showToast(`Saved signature for ${signerName} ✓`, 'success');

      updateSignerUI();
      updatePage9Overlays();
      updateDownloadGate();

      const otherKey = state.activeSigner === 'provider' ? 'renter' : 'provider';
      if (!state.signatures[otherKey]) {
        setTimeout(() => {
          setActiveSigner(otherKey);
          showToast(`Now sign for ${state.signerDetails[otherKey].name}`, 'info');
        }, 500);
      } else {
        checkBothSignedTrigger();
      }
    });
  }

  function checkBothSignedTrigger() {
    if (state.signatures.provider && state.signatures.renter) {
      state.bothSigned = true;
      updateSignerUI();
      updatePage9Overlays();
      updateDownloadGate();

      if (typeof confetti === 'function') {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }

      setPage(9);
      showToast('Both signed! Ready to download.', 'success');
    }
  }

  /* ==========================================================================
     UI Updaters
     ========================================================================== */
  function updateSignerUI() {
    const provSigned = Boolean(state.signatures.provider);
    const rentSigned = Boolean(state.signatures.renter);

    DOM.headerProviderPill.classList.toggle('signed', provSigned);
    DOM.headerProviderPill.querySelector('.dot').className = `dot ${provSigned ? 'signed' : 'waiting'}`;
    DOM.headerProviderStatus.textContent = provSigned ? 'Signed ✓' : 'Pending';

    DOM.headerRenterPill.classList.toggle('signed', rentSigned);
    DOM.headerRenterPill.querySelector('.dot').className = `dot ${rentSigned ? 'signed' : 'waiting'}`;
    DOM.headerRenterStatus.textContent = rentSigned ? 'Signed ✓' : 'Pending';

    const count = (provSigned ? 1 : 0) + (rentSigned ? 1 : 0);
    DOM.headerWorkflowBadge.className = `status-badge ${count === 2 ? 'ready' : 'waiting'}`;
    DOM.headerWorkflowText.textContent = count === 2 ? '2 of 2 Signed ✓' : `${count} of 2 Signed`;

    DOM.btnSelectProvider.classList.toggle('active', state.activeSigner === 'provider');
    DOM.btnSelectRenter.classList.toggle('active', state.activeSigner === 'renter');

    DOM.providerStatusBadge.className = `tab-status ${provSigned ? 'signed' : 'pending'}`;
    DOM.providerStatusBadge.textContent = provSigned ? 'Signed ✓' : 'Not signed';

    DOM.renterStatusBadge.className = `tab-status ${rentSigned ? 'signed' : 'pending'}`;
    DOM.renterStatusBadge.textContent = rentSigned ? 'Signed ✓' : 'Not signed';

    const cur = state.signerDetails[state.activeSigner];
    DOM.activeSignerLabel.textContent = cur.name;
    DOM.btnApplyText.textContent = `✓ Save Signature for ${cur.name}`;

    DOM.typeInputText.value = cur.name;
    updateTypePreviews();
  }

  function updatePage9Overlays() {
    if (state.signatures.provider) {
      DOM.overlayProviderBox.classList.add('signed');
      DOM.boxProviderContent.innerHTML = `<img src="${state.signatures.provider}" alt="Signature" />`;
    } else {
      DOM.overlayProviderBox.classList.remove('signed');
      DOM.boxProviderContent.innerHTML = `<div class="empty-prompt">✍️ Click to sign (Duc Teo Ngo)</div>`;
    }

    if (state.signatures.renter) {
      DOM.overlayRenterBox.classList.add('signed');
      DOM.boxRenterContent.innerHTML = `<img src="${state.signatures.renter}" alt="Signature" />`;
    } else {
      DOM.overlayRenterBox.classList.remove('signed');
      DOM.boxRenterContent.innerHTML = `<div class="empty-prompt">✍️ Click to sign (SAMSUL)</div>`;
    }
  }

  function updateDownloadGate() {
    const provSigned = Boolean(state.signatures.provider);
    const rentSigned = Boolean(state.signatures.renter);
    const both = provSigned && rentSigned;

    DOM.checkItemProvider.classList.toggle('completed', provSigned);
    DOM.checkItemProvider.querySelector('.chk-icon').textContent = provSigned ? '✓' : '○';
    DOM.checkStateProvider.textContent = provSigned ? 'Signed ✓' : 'Not signed';

    DOM.checkItemRenter.classList.toggle('completed', rentSigned);
    DOM.checkItemRenter.querySelector('.chk-icon').textContent = rentSigned ? '✓' : '○';
    DOM.checkStateRenter.textContent = rentSigned ? 'Signed ✓' : 'Not signed';

    if (both) {
      DOM.downloadLockedView.style.display = 'none';
      DOM.downloadUnlockedView.style.display = 'block';
    } else {
      DOM.downloadLockedView.style.display = 'block';
      DOM.downloadUnlockedView.style.display = 'none';
    }
  }

  function setActiveSigner(signerKey) {
    state.activeSigner = signerKey;
    clearCanvas();
    updateSignerUI();
    if (window.innerWidth <= 900) setMobileView('sign');
  }

  function setMode(mode) {
    state.activeMode = mode;
    DOM.tabDraw.classList.toggle('active', mode === 'draw');
    DOM.tabType.classList.toggle('active', mode === 'type');
    DOM.tabUpload.classList.toggle('active', mode === 'upload');

    DOM.paneDraw.classList.toggle('active', mode === 'draw');
    DOM.paneType.classList.toggle('active', mode === 'type');
    DOM.paneUpload.classList.toggle('active', mode === 'upload');

    if (mode === 'draw') setTimeout(initCanvas, 50);
  }

  /* ==========================================================================
     Viewer Navigation
     ========================================================================== */
  function setPage(pageNum) {
    if (pageNum < 1) pageNum = 1;
    if (pageNum > state.totalPages) pageNum = state.totalPages;

    state.currentPage = pageNum;
    DOM.mainPageImg.src = `pages/page_${pageNum}.png`;
    DOM.pageNumberInput.value = pageNum;
    DOM.page9Overlay.style.display = pageNum === 9 ? 'block' : 'none';

    const thumbCards = DOM.thumbsList.querySelectorAll('.thumb-card');
    thumbCards.forEach((card, idx) => {
      card.classList.toggle('active', idx + 1 === pageNum);
    });

    DOM.docStage.scrollTop = 0;
  }

  function updateZoom() {
    const width = state.basePageWidth * state.zoom;
    DOM.pageViewportWrapper.style.width = `${width}px`;
    DOM.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function zoomIn() {
    if (state.zoom < 1.8) {
      state.zoom = Math.min(1.8, state.zoom + 0.15);
      updateZoom();
    }
  }

  function zoomOut() {
    if (state.zoom > 0.5) {
      state.zoom = Math.max(0.5, state.zoom - 0.15);
      updateZoom();
    }
  }

  function fitWidth() {
    const containerW = DOM.docStage.clientWidth - 40;
    if (containerW > 250) {
      state.zoom = containerW / state.basePageWidth;
      updateZoom();
    }
  }

  function renderThumbnails() {
    DOM.thumbsList.innerHTML = '';
    for (let i = 1; i <= state.totalPages; i++) {
      const card = document.createElement('div');
      card.className = `thumb-card ${i === 1 ? 'active' : ''}`;
      card.innerHTML = `
        <img src="pages/page_${i}.png" loading="lazy" alt="Page ${i}" />
        <span class="thumb-number">${i}</span>
      `;
      card.addEventListener('click', () => setPage(i));
      DOM.thumbsList.appendChild(card);
    }
  }

  /* ==========================================================================
     Download PDF
     ========================================================================== */
  async function handleDownloadPDF() {
    const email = DOM.downloadEmailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      DOM.emailErrorMsg.style.display = 'block';
      DOM.downloadEmailInput.focus();
      return;
    }
    DOM.emailErrorMsg.style.display = 'none';

    if (!state.signatures.provider || !state.signatures.renter) {
      showToast('Both parties must sign.', 'error');
      return;
    }

    const btn = DOM.btnDownloadPDF;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>Generating PDF...</span>`;

    try {
      const payload = {
        providerSignature: state.signatures.provider,
        renterSignature: state.signatures.renter,
        email: email,
        signDate: '10/08/2026'
      };

      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error generating PDF');
      }

      const result = await response.json();

      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = 'Form_1_Rental_Agreement_5_Mannix_St_SAMSUL_I_TALKUDER_Signed.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Downloaded successfully!`, 'success');
      DOM.modalSignedImg.src = `${result.previewUrl}?t=${Date.now()}`;
    } catch (err) {
      showToast(err.message || 'Error creating PDF.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  function previewSignedPage() {
    DOM.modalSignedImg.src = `/signed_page_9.png?t=${Date.now()}`;
    DOM.previewModal.style.display = 'flex';
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ==========================================================================
     Events
     ========================================================================== */
  function bindEvents() {
    // Mobile tabs
    DOM.btnMobileTabSign?.addEventListener('click', () => setMobileView('sign'));
    DOM.btnMobileTabDoc?.addEventListener('click', () => setMobileView('doc'));

    // Navigation
    DOM.btnPrevPage.addEventListener('click', () => setPage(state.currentPage - 1));
    DOM.btnNextPage.addEventListener('click', () => setPage(state.currentPage + 1));
    DOM.pageNumberInput.addEventListener('change', (e) => setPage(parseInt(e.target.value, 10) || 1));
    DOM.btnJumpP9.addEventListener('click', () => {
      setPage(9);
      if (window.innerWidth <= 900) setMobileView('doc');
    });

    // Zoom
    DOM.btnZoomIn.addEventListener('click', zoomIn);
    DOM.btnZoomOut.addEventListener('click', zoomOut);
    DOM.btnFitWidth.addEventListener('click', fitWidth);

    DOM.btnToggleThumbs.addEventListener('click', () => DOM.thumbsSidebar.classList.toggle('collapsed'));
    DOM.btnCloseThumbs.addEventListener('click', () => DOM.thumbsSidebar.classList.add('collapsed'));

    // Signer select
    DOM.btnSelectProvider.addEventListener('click', () => setActiveSigner('provider'));
    DOM.btnSelectRenter.addEventListener('click', () => setActiveSigner('renter'));

    // Mode tabs
    DOM.tabDraw.addEventListener('click', () => setMode('draw'));
    DOM.tabType.addEventListener('click', () => setMode('type'));
    DOM.tabUpload.addEventListener('click', () => setMode('upload'));

    // Canvas
    const canvas = DOM.signatureCanvas;
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', drawMove);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', drawMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    DOM.btnUndoCanvas.addEventListener('click', undoCanvas);
    DOM.btnClearCanvas.addEventListener('click', clearCanvas);

    DOM.colorDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        DOM.colorDots.forEach((d) => d.classList.remove('active'));
        dot.classList.add('active');
        state.drawColor = dot.getAttribute('data-color');
      });
    });

    // Type mode
    DOM.typeInputText.addEventListener('input', updateTypePreviews);
    DOM.fontItems.forEach((card) => {
      card.addEventListener('click', () => {
        DOM.fontItems.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        state.selectedFont = card.getAttribute('data-font');
      });
    });

    // Upload mode
    DOM.uploadDropzone.addEventListener('click', () => DOM.sigFileInput.click());
    DOM.sigFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleSignatureUpload(e.target.files[0]);
    });

    DOM.btnRemoveUpload.addEventListener('click', () => {
      state.uploadedDataUrl = null;
      DOM.sigFileInput.value = '';
      DOM.uploadDropzone.style.display = 'block';
      DOM.uploadPreviewArea.style.display = 'none';
    });

    DOM.btnApplySignature.addEventListener('click', applySignature);

    // Overlay clicks on Page 9
    DOM.overlayProviderBox.addEventListener('click', () => setActiveSigner('provider'));
    DOM.overlayRenterBox.addEventListener('click', () => setActiveSigner('renter'));

    // Download & Preview
    DOM.btnDownloadPDF.addEventListener('click', handleDownloadPDF);
    DOM.btnPreviewSignedPage.addEventListener('click', previewSignedPage);

    DOM.btnClosePreviewModal.addEventListener('click', () => DOM.previewModal.style.display = 'none');
    DOM.btnClosePreviewModal2.addEventListener('click', () => DOM.previewModal.style.display = 'none');
    DOM.previewModal.addEventListener('click', (e) => {
      if (e.target === DOM.previewModal) DOM.previewModal.style.display = 'none';
    });

    window.addEventListener('resize', () => {
      if (state.activeMode === 'draw') initCanvas();
      if (window.innerWidth > 900) {
        DOM.docViewerPanel.classList.remove('mobile-hidden');
        DOM.signingPanel.classList.remove('mobile-hidden');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
