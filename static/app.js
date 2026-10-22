/**
 * Victoria Tenancy e-Sign Platform
 * Interactive Client Logic for Form 1 Rental Agreement
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currentPage: 1,
    totalPages: 10,
    zoom: 1.0,
    basePageWidth: 780,
    activeSigner: 'provider', // 'provider' | 'renter'
    activeMode: 'draw', // 'draw' | 'type' | 'upload'
    signatures: {
      provider: null, // dataURL string
      renter: null    // dataURL string
    },
    signerDetails: {
      provider: {
        role: 'Rental Provider 1',
        name: 'Duc Teo Ngo',
        email: 'hoanghonlen211@gmail.com',
        phone: '0423789688',
        address: '9 Fairfax Cct, Albanvale VIC 3021'
      },
      renter: {
        role: 'Renter 1',
        name: 'SAMSUL I TALKUDER',
        email: 'samsul.talkuder@gmail.com',
        phone: '0476620057',
        address: '16 Bottlebrush ct, Sunshine West VIC 3020'
      }
    },
    // Canvas Drawing State
    isDrawing: false,
    drawColor: '#0f172a',
    drawWidth: 3,
    canvasHistory: [],
    // Type Mode
    selectedFont: 'Dancing Script',
    // Upload Mode
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
    btnJumpP1: document.getElementById('btnJumpP1'),
    btnJumpP6: document.getElementById('btnJumpP6'),
    btnJumpP9: document.getElementById('btnJumpP9'),

    // Step 1: Signer Selection
    btnSelectProvider: document.getElementById('btnSelectProvider'),
    btnSelectRenter: document.getElementById('btnSelectRenter'),
    providerStatusBadge: document.getElementById('providerStatusBadge'),
    renterStatusBadge: document.getElementById('renterStatusBadge'),

    // Step 2: Signature Studio
    activeSignerLabel: document.getElementById('activeSignerLabel'),
    btnApplySignature: document.getElementById('btnApplySignature'),
    btnApplyText: document.getElementById('btnApplyText'),
    // Mode tabs
    tabDraw: document.getElementById('tabDraw'),
    tabType: document.getElementById('tabType'),
    tabUpload: document.getElementById('tabUpload'),
    paneDraw: document.getElementById('paneDraw'),
    paneType: document.getElementById('paneType'),
    paneUpload: document.getElementById('paneUpload'),
    // Draw
    signatureCanvas: document.getElementById('signatureCanvas'),
    penWidthRange: document.getElementById('penWidthRange'),
    btnUndoCanvas: document.getElementById('btnUndoCanvas'),
    btnClearCanvas: document.getElementById('btnClearCanvas'),
    colorDots: document.querySelectorAll('.color-dot'),
    // Type
    typeInputText: document.getElementById('typeInputText'),
    fontCards: document.querySelectorAll('.font-card'),
    fontPreviews: {
      'Dancing Script': document.getElementById('fontPreviewDancing'),
      'Great Vibes': document.getElementById('fontPreviewGreatVibes'),
      'Caveat': document.getElementById('fontPreviewCaveat'),
      'Sacramento': document.getElementById('fontPreviewSacramento')
    },
    // Upload
    uploadDropzone: document.getElementById('uploadDropzone'),
    sigFileInput: document.getElementById('sigFileInput'),
    uploadPreviewArea: document.getElementById('uploadPreviewArea'),
    uploadPreviewImg: document.getElementById('uploadPreviewImg'),
    btnRemoveUpload: document.getElementById('btnRemoveUpload'),

    // Step 3: Download Gate
    downloadLockedView: document.getElementById('downloadLockedView'),
    downloadUnlockedView: document.getElementById('downloadUnlockedView'),
    checkItemProvider: document.getElementById('checkItemProvider'),
    checkStateProvider: document.getElementById('checkStateProvider'),
    btnGoSignProvider: document.getElementById('btnGoSignProvider'),
    checkItemRenter: document.getElementById('checkItemRenter'),
    checkStateRenter: document.getElementById('checkStateRenter'),
    btnGoSignRenter: document.getElementById('btnGoSignRenter'),
    downloadEmailInput: document.getElementById('downloadEmailInput'),
    emailErrorMsg: document.getElementById('emailErrorMsg'),
    chipProviderEmail: document.getElementById('chipProviderEmail'),
    chipCustomEmail: document.getElementById('chipCustomEmail'),
    btnDownloadPDF: document.getElementById('btnDownloadPDF'),
    btnPreviewSignedPage: document.getElementById('btnPreviewSignedPage'),

    // Modal
    previewModal: document.getElementById('previewModal'),
    modalSignedImg: document.getElementById('modalSignedImg'),
    btnClosePreviewModal: document.getElementById('btnClosePreviewModal'),
    btnClosePreviewModal2: document.getElementById('btnClosePreviewModal2'),
    toastContainer: document.getElementById('toastContainer')
  };

  // Canvas 2D context
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
  }

  /* ==========================================================================
     Canvas Setup & Drawing Handling (Retina Crisp & Smooth Strokes)
     ========================================================================== */
  function initCanvas() {
    const canvas = DOM.signatureCanvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    saveCanvasState();
  }

  function getCanvasPos(e) {
    const canvas = DOM.signatureCanvas;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
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
    if (state.canvasHistory.length > 25) {
      state.canvasHistory.shift();
    }
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
     Type Mode Handling
     ========================================================================== */
  function updateTypePreviews() {
    const text = DOM.typeInputText.value.trim() || state.signerDetails[state.activeSigner].name;
    for (const [font, el] of Object.entries(DOM.fontPreviews)) {
      if (el) el.textContent = text;
    }
  }

  function renderTypedSignatureToCanvas(text, fontName) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = state.drawColor || '#0f172a';
    c.textBaseline = 'middle';
    c.textAlign = 'center';

    let fontSize = 72;
    if (fontName === 'Sacramento') fontSize = 84;
    if (fontName === 'Great Vibes') fontSize = 76;
    c.font = `600 ${fontSize}px "${fontName}", cursive`;

    c.fillText(text, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  /* ==========================================================================
     Upload Mode Handling & White Background Suppressor
     ========================================================================== */
  function handleSignatureUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG hoặc JPG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Draw to offscreen canvas and suppress white/light backgrounds
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const c = canvas.getContext('2d');
        c.drawImage(img, 0, 0);

        const imgData = c.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Convert near-white pixels to transparent and darken signature strokes
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

          if (brightness > 215) {
            data[i + 3] = 0; // Transparent
          } else {
            // Darken ink
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

  /* ==========================================================================
     Crop Transparent Bounding Box (Client-side Exact Fit Pre-processing)
     ========================================================================== */
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
          const alpha = data[idx + 3];
          if (alpha > 20) {
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

      // Add 4px padding
      const pad = 4;
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
     Applying Signature
     ========================================================================== */
  function applySignature() {
    let rawDataUrl = null;

    if (state.activeMode === 'draw') {
      // Check if user drew anything
      const dpr = window.devicePixelRatio || 1;
      const imgData = ctx.getImageData(0, 0, DOM.signatureCanvas.width / dpr, DOM.signatureCanvas.height / dpr);
      let drawn = false;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 20) {
          drawn = true;
          break;
        }
      }
      if (!drawn) {
        showToast('Vui lòng vẽ chữ ký trước khi áp dụng!', 'error');
        return;
      }
      rawDataUrl = DOM.signatureCanvas.toDataURL('image/png');
    } else if (state.activeMode === 'type') {
      const text = DOM.typeInputText.value.trim() || state.signerDetails[state.activeSigner].name;
      rawDataUrl = renderTypedSignatureToCanvas(text, state.selectedFont);
    } else if (state.activeMode === 'upload') {
      if (!state.uploadedDataUrl) {
        showToast('Vui lòng tải lên ảnh chữ ký trước khi áp dụng!', 'error');
        return;
      }
      rawDataUrl = state.uploadedDataUrl;
    }

    if (!rawDataUrl) return;

    cropTransparentCanvas(rawDataUrl, (trimmedDataUrl) => {
      if (!trimmedDataUrl) {
        showToast('Không phát hiện được nét vẽ chữ ký. Vui lòng thử lại!', 'error');
        return;
      }

      // Store trimmed signature in state
      state.signatures[state.activeSigner] = trimmedDataUrl;
      const signerName = state.signerDetails[state.activeSigner].name;
      showToast(`Đã áp dụng chữ ký cho ${signerName} thành công!`, 'success');

      // Update UI elements
      updateSignerUI();
      updatePage9Overlays();
      updateDownloadGate();

      // If user signed one, encourage signing the other if not yet done
      const otherKey = state.activeSigner === 'provider' ? 'renter' : 'provider';
      if (!state.signatures[otherKey]) {
        // Switch to the remaining signer
        setTimeout(() => {
          setActiveSigner(otherKey);
          showToast(`Đã chuyển sang ${state.signerDetails[otherKey].role} (${state.signerDetails[otherKey].name}) để ký tiếp.`, 'info');
        }, 800);
      } else {
        // Both are signed!
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

      // Celebration Confetti
      fireConfetti();

      // Jump to page 9 so user can view both signatures
      setPage(9);
      showToast('Tuyệt vời! Cả 2 bên đã hoàn tất chữ ký. Đã mở khóa tải về!', 'success');
    }
  }

  function fireConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);
    }
  }

  /* ==========================================================================
     UI Updaters
     ========================================================================== */
  function updateSignerUI() {
    // Header Pills
    const provSigned = Boolean(state.signatures.provider);
    const rentSigned = Boolean(state.signatures.renter);

    DOM.headerProviderPill.classList.toggle('signed', provSigned);
    DOM.headerProviderPill.querySelector('.pill-dot').className = `pill-dot ${provSigned ? 'signed' : 'waiting'}`;
    DOM.headerProviderStatus.textContent = provSigned ? 'Đã ký ✓' : 'Chưa ký';

    DOM.headerRenterPill.classList.toggle('signed', rentSigned);
    DOM.headerRenterPill.querySelector('.pill-dot').className = `pill-dot ${rentSigned ? 'signed' : 'waiting'}`;
    DOM.headerRenterStatus.textContent = rentSigned ? 'Đã ký ✓' : 'Chưa ký';

    // Header Workflow Badge
    const signedCount = (provSigned ? 1 : 0) + (rentSigned ? 1 : 0);
    if (signedCount === 2) {
      DOM.headerWorkflowBadge.className = 'workflow-badge ready';
      DOM.headerWorkflowText.textContent = 'Hoàn tất đủ 2 chữ ký (2/2) ✓';
    } else if (signedCount === 1) {
      DOM.headerWorkflowBadge.className = 'workflow-badge waiting';
      DOM.headerWorkflowText.textContent = 'Đã có 1 bên ký (1/2)';
    } else {
      DOM.headerWorkflowBadge.className = 'workflow-badge waiting';
      DOM.headerWorkflowText.textContent = 'Đang chờ 2 bên ký (0/2)';
    }

    // Signer Switcher Cards (Step 1)
    DOM.btnSelectProvider.classList.toggle('active', state.activeSigner === 'provider');
    DOM.btnSelectRenter.classList.toggle('active', state.activeSigner === 'renter');

    DOM.providerStatusBadge.className = `signature-status-pill ${provSigned ? 'signed' : 'pending'}`;
    DOM.providerStatusBadge.textContent = provSigned ? 'Đã ký ✓' : 'Chưa ký';

    DOM.renterStatusBadge.className = `signature-status-pill ${rentSigned ? 'signed' : 'pending'}`;
    DOM.renterStatusBadge.textContent = rentSigned ? 'Đã ký ✓' : 'Chưa ký';

    // Step 2 Title & Button Text
    const cur = state.signerDetails[state.activeSigner];
    DOM.activeSignerLabel.textContent = `${cur.role} (${cur.name})`;
    DOM.btnApplyText.textContent = `Áp dụng chữ ký cho ${cur.role}`;

    // Type input default
    DOM.typeInputText.value = cur.name;
    updateTypePreviews();
  }

  function updatePage9Overlays() {
    // Rental Provider 1 box
    if (state.signatures.provider) {
      DOM.overlayProviderBox.classList.add('signed');
      DOM.boxProviderContent.innerHTML = `<img src="${state.signatures.provider}" alt="Chữ ký Rental Provider 1" />`;
    } else {
      DOM.overlayProviderBox.classList.remove('signed');
      DOM.boxProviderContent.innerHTML = `
        <div class="empty-prompt">
          <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          <span>Bấm vào đây để ký (Rental Provider 1)</span>
        </div>`;
    }

    // Renter 1 box
    if (state.signatures.renter) {
      DOM.overlayRenterBox.classList.add('signed');
      DOM.boxRenterContent.innerHTML = `<img src="${state.signatures.renter}" alt="Chữ ký Renter 1" />`;
    } else {
      DOM.overlayRenterBox.classList.remove('signed');
      DOM.boxRenterContent.innerHTML = `
        <div class="empty-prompt">
          <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          <span>Bấm vào đây để ký (Renter 1)</span>
        </div>`;
    }
  }

  function updateDownloadGate() {
    const provSigned = Boolean(state.signatures.provider);
    const rentSigned = Boolean(state.signatures.renter);
    const both = provSigned && rentSigned;

    // Update Checklist items
    DOM.checkItemProvider.classList.toggle('completed', provSigned);
    DOM.checkStateProvider.textContent = provSigned ? 'Đã hoàn tất chữ ký ✓' : 'Chưa ký (Chờ thực hiện)';

    DOM.checkItemRenter.classList.toggle('completed', rentSigned);
    DOM.checkStateRenter.textContent = rentSigned ? 'Đã hoàn tất chữ ký ✓' : 'Chưa ký (Chờ thực hiện)';

    // Strict Rule: ONLY unlock when BOTH have signed simultaneously
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
  }

  function setMode(mode) {
    state.activeMode = mode;
    DOM.tabDraw.classList.toggle('active', mode === 'draw');
    DOM.tabType.classList.toggle('active', mode === 'type');
    DOM.tabUpload.classList.toggle('active', mode === 'upload');

    DOM.paneDraw.classList.toggle('active', mode === 'draw');
    DOM.paneType.classList.toggle('active', mode === 'type');
    DOM.paneUpload.classList.toggle('active', mode === 'upload');

    if (mode === 'draw') {
      setTimeout(initCanvas, 50);
    }
  }

  /* ==========================================================================
     Document Viewer Navigation & Zoom
     ========================================================================== */
  function setPage(pageNum) {
    if (pageNum < 1) pageNum = 1;
    if (pageNum > state.totalPages) pageNum = state.totalPages;

    state.currentPage = pageNum;
    DOM.mainPageImg.src = `pages/page_${pageNum}.png`;
    DOM.pageNumberInput.value = pageNum;

    // Show overlays only on Page 9
    DOM.page9Overlay.style.display = pageNum === 9 ? 'block' : 'none';

    // Highlight thumbnail
    const thumbCards = DOM.thumbsList.querySelectorAll('.thumb-card');
    thumbCards.forEach((card, idx) => {
      card.classList.toggle('active', idx + 1 === pageNum);
    });

    // Scroll to top of stage
    DOM.docStage.scrollTop = 0;
  }

  function updateZoom() {
    const width = state.basePageWidth * state.zoom;
    DOM.pageViewportWrapper.style.width = `${width}px`;
    DOM.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function zoomIn() {
    if (state.zoom < 2.0) {
      state.zoom = Math.min(2.0, state.zoom + 0.15);
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
    if (containerW > 300) {
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
        <img src="pages/page_${i}.png" loading="lazy" alt="Trang ${i}" />
        <span class="thumb-number">Trang ${i}${i === 9 ? ' (Ký)' : ''}</span>
      `;
      card.addEventListener('click', () => setPage(i));
      DOM.thumbsList.appendChild(card);
    }
  }

  /* ==========================================================================
     Download PDF Execution
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
      showToast('Yêu cầu bắt buộc: Cả 2 bên phải hoàn tất chữ ký trước khi tải về!', 'error');
      return;
    }

    const btn = DOM.btnDownloadPDF;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="icon-download-btn spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
      <span>Đang chèn chữ ký chuẩn xác & tạo PDF...</span>
    `;

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
        throw new Error(errorData.detail || 'Lỗi xử lý tạo file PDF');
      }

      const result = await response.json();

      // Trigger actual download of the signed PDF
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = 'Form_1_Rental_Agreement_5_Mannix_St_SAMSUL_I_TALKUDER_Signed.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Tải về thành công! File PDF hoàn chỉnh đã được gửi tới ${email}.`, 'success');
      fireConfetti();

      // Set modal preview image
      DOM.modalSignedImg.src = `${result.previewUrl}?t=${Date.now()}`;
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  function previewSignedPage() {
    DOM.modalSignedImg.src = `/static/signed_page_9.png?t=${Date.now()}`;
    DOM.previewModal.style.display = 'flex';
  }

  /* ==========================================================================
     Toast Notifications
     ========================================================================== */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ==========================================================================
     Event Bindings
     ========================================================================== */
  function bindEvents() {
    // Navigation
    DOM.btnPrevPage.addEventListener('click', () => setPage(state.currentPage - 1));
    DOM.btnNextPage.addEventListener('click', () => setPage(state.currentPage + 1));
    DOM.pageNumberInput.addEventListener('change', (e) => setPage(parseInt(e.target.value, 10) || 1));
    DOM.btnJumpP1.addEventListener('click', () => setPage(1));
    DOM.btnJumpP6.addEventListener('click', () => setPage(6));
    DOM.btnJumpP9.addEventListener('click', () => setPage(9));

    // Zoom
    DOM.btnZoomIn.addEventListener('click', zoomIn);
    DOM.btnZoomOut.addEventListener('click', zoomOut);
    DOM.btnFitWidth.addEventListener('click', fitWidth);

    // Thumbnails toggle
    DOM.btnToggleThumbs.addEventListener('click', () => DOM.thumbsSidebar.classList.toggle('collapsed'));
    DOM.btnCloseThumbs.addEventListener('click', () => DOM.thumbsSidebar.classList.add('collapsed'));

    // Step 1: Signer selection
    DOM.btnSelectProvider.addEventListener('click', () => setActiveSigner('provider'));
    DOM.btnSelectRenter.addEventListener('click', () => setActiveSigner('renter'));

    // Mode tabs
    DOM.tabDraw.addEventListener('click', () => setMode('draw'));
    DOM.tabType.addEventListener('click', () => setMode('type'));
    DOM.tabUpload.addEventListener('click', () => setMode('upload'));

    // Canvas Draw Events
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

    DOM.penWidthRange.addEventListener('input', (e) => {
      state.drawWidth = parseInt(e.target.value, 10);
    });

    DOM.colorDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        DOM.colorDots.forEach((d) => d.classList.remove('active'));
        dot.classList.add('active');
        state.drawColor = dot.getAttribute('data-color');
      });
    });

    // Type mode font card selection
    DOM.typeInputText.addEventListener('input', updateTypePreviews);
    DOM.fontCards.forEach((card) => {
      card.addEventListener('click', () => {
        DOM.fontCards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        state.selectedFont = card.getAttribute('data-font');
      });
    });

    // Upload mode events
    DOM.uploadDropzone.addEventListener('click', () => DOM.sigFileInput.click());
    DOM.sigFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleSignatureUpload(e.target.files[0]);
      }
    });

    DOM.uploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.uploadDropzone.style.borderColor = 'var(--accent-primary)';
    });
    DOM.uploadDropzone.addEventListener('dragleave', () => {
      DOM.uploadDropzone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    });
    DOM.uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.uploadDropzone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleSignatureUpload(e.dataTransfer.files[0]);
      }
    });

    DOM.btnRemoveUpload.addEventListener('click', () => {
      state.uploadedDataUrl = null;
      DOM.sigFileInput.value = '';
      DOM.uploadDropzone.style.display = 'block';
      DOM.uploadPreviewArea.style.display = 'none';
    });

    // Apply Signature
    DOM.btnApplySignature.addEventListener('click', applySignature);

    // Overlay Box Clicks on Page 9
    DOM.overlayProviderBox.addEventListener('click', () => {
      setActiveSigner('provider');
      DOM.paneDraw.scrollIntoView({ behavior: 'smooth' });
    });
    DOM.overlayRenterBox.addEventListener('click', () => {
      setActiveSigner('renter');
      DOM.paneDraw.scrollIntoView({ behavior: 'smooth' });
    });

    // Checklist Action Buttons
    DOM.btnGoSignProvider.addEventListener('click', () => {
      setActiveSigner('provider');
      setPage(9);
    });
    DOM.btnGoSignRenter.addEventListener('click', () => {
      setActiveSigner('renter');
      setPage(9);
    });

    // Email chips
    DOM.chipProviderEmail.addEventListener('click', () => {
      DOM.downloadEmailInput.value = DOM.chipProviderEmail.textContent.trim();
    });
    DOM.chipCustomEmail.addEventListener('click', () => {
      DOM.downloadEmailInput.value = DOM.chipCustomEmail.textContent.trim();
    });

    // Download & Preview
    DOM.btnDownloadPDF.addEventListener('click', handleDownloadPDF);
    DOM.btnPreviewSignedPage.addEventListener('click', previewSignedPage);

    // Modal
    DOM.btnClosePreviewModal.addEventListener('click', () => DOM.previewModal.style.display = 'none');
    DOM.btnClosePreviewModal2.addEventListener('click', () => DOM.previewModal.style.display = 'none');
    DOM.previewModal.addEventListener('click', (e) => {
      if (e.target === DOM.previewModal) DOM.previewModal.style.display = 'none';
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (state.activeMode === 'draw') initCanvas();
    });
  }

  // Start app on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
