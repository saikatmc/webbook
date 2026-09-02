/**
 * Mobile-First 3D Web Book Reader
 * Authentic 3D Corner Peel (Forward) + Smooth Slide (Backward)
 * 100% Uniform Soft Pages for All 56 Pages
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_PAGES = 56;

  // Exact Book Sequence: Questions (Book p.393 to 439) + Answer Sheets (Book p.440 to 448) at the end
  const PAGE_SEQUENCE_NUMS = [
    1, 55, 54, 56, 53, 52, 51, 50, 49, 48,
    47, 46, 45, 44, 43, 42, 40, 39, 38, 41,
    37, 36, 35, 34, 33, 32, 31, 30, 29, 28,
    27, 26, 25, 24, 23, 22, 21, 20, 19, 18,
    17, 16, 15, 14, 13, 11, 12,
    // 9 Answer Pages (Book p.440 to 448) placed at the end
    10, 9, 7, 8, 6, 5, 3, 4, 2
  ];

  const PAGE_IMAGES = PAGE_SEQUENCE_NUMS.map(num => `Pages/Page (${num}).jpeg`);

  // DOM Elements
  const bookContainer = document.getElementById('bookContainer');
  const readerStage = document.getElementById('readerStage');
  const currentPageText = document.getElementById('currentPageText');
  const totalPagesText = document.getElementById('totalPagesText');
  const pageSlider = document.getElementById('pageSlider');
  const sliderPreviewBubble = document.getElementById('sliderPreviewBubble');
  const sliderPreviewThumb = document.getElementById('sliderPreviewThumb');
  const sliderPreviewText = document.getElementById('sliderPreviewText');

  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const autoPlayBtn = document.getElementById('autoPlayBtn');
  const autoplayIndicator = document.getElementById('autoplayIndicator');
  const autoplayCountdown = document.getElementById('autoplayCountdown');
  const stopAutoplayBtn = document.getElementById('stopAutoplayBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  const themeBtn = document.getElementById('themeBtn');
  const themeMenu = document.getElementById('themeMenu');
  const themeItems = document.querySelectorAll('.theme-item');

  const thumbnailsToggleBtn = document.getElementById('thumbnailsToggleBtn');
  const thumbnailsDrawer = document.getElementById('thumbnailsDrawer');
  const closeThumbnailsBtn = document.getElementById('closeThumbnailsBtn');
  const thumbnailsGrid = document.getElementById('thumbnailsGrid');
  const preloadAllPagesBtn = document.getElementById('preloadAllPagesBtn');
  const preloadBtnText = document.getElementById('preloadBtnText');
  const clearCacheBtn = document.getElementById('clearCacheBtn');

  const bookmarkCurrentBtn = document.getElementById('bookmarkCurrentBtn');
  const bookmarksDrawerBtn = document.getElementById('bookmarksDrawerBtn');
  const bookmarksModal = document.getElementById('bookmarksModal');
  const closeBookmarksBtn = document.getElementById('closeBookmarksBtn');
  const bookmarksList = document.getElementById('bookmarksList');
  const emptyBookmarksMsg = document.getElementById('emptyBookmarksMsg');
  const bookmarkCountBadge = document.getElementById('bookmarkCountBadge');

  const bookmarkPeekOverlay = document.getElementById('bookmarkPeekOverlay');
  const bookmarkPeekBackdrop = document.getElementById('bookmarkPeekBackdrop');
  const bookmarkPeekTitleText = document.getElementById('bookmarkPeekTitleText');
  const bookmarkPeekImgWrap = document.getElementById('bookmarkPeekImgWrap');
  const bookmarkPeekImg = document.getElementById('bookmarkPeekImg');
  const bookmarkPeekHintText = document.getElementById('bookmarkPeekHintText');
  const closeBookmarkPeekBtn = document.getElementById('closeBookmarkPeekBtn');
  const peekJumpBtn = document.getElementById('peekJumpBtn');
  const peekCloseBottomBtn = document.getElementById('peekCloseBottomBtn');

  const zoomToggleBtn = document.getElementById('zoomToggleBtn');
  const zoomViewerModal = document.getElementById('zoomViewerModal');
  const closeZoomBtn = document.getElementById('closeZoomBtn');
  const zoomImage = document.getElementById('zoomImage');
  const zoomImageWrapper = document.getElementById('zoomImageWrapper');
  const zoomPageTitle = document.getElementById('zoomPageTitle');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomResetBtn = document.getElementById('zoomResetBtn');
  const zoomLevelText = document.getElementById('zoomLevelText');
  const zoomCanvasArea = document.getElementById('zoomCanvasArea');

  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Application State
  let pageFlip = null;
  let isSoundEnabled = localStorage.getItem('flipbook_sound') !== 'false';
  let isAutoPlaying = false;
  let autoplayRemaining = 5;
  let autoplayTickInterval = null;
  let bookmarks = JSON.parse(localStorage.getItem('flipbook_bookmarks') || '[]');
  let currentTheme = localStorage.getItem('flipbook_theme') || 'theme-obsidian';
  let zoomScale = 1.5;
  let isZoomPanning = false;
  let zoomStartX = 0, zoomStartY = 0, zoomTranslateX = 0, zoomTranslateY = 0;

  // Sound Pool
  const audioPool = [
    new Audio('page-flip-03.mp3'),
    new Audio('page-flip-03.mp3'),
    new Audio('page-flip-03.mp3')
  ];
  let audioPoolIndex = 0;

  function playFlipSound() {
    if (!isSoundEnabled) return;
    try {
      const audio = audioPool[audioPoolIndex];
      audioPoolIndex = (audioPoolIndex + 1) % audioPool.length;
      audio.currentTime = 0;
      audio.volume = 0.85;
      audio.play().catch(() => { });
    } catch (e) { }
  }

  // Toast Helper
  let toastTimer = null;
  function showToast(msg) {
    toastMessage.textContent = msg;
    toastNotification.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2200);
  }

  // Apply Theme
  function applyTheme(theme) {
    document.body.className = theme;
    currentTheme = theme;
    localStorage.setItem('flipbook_theme', theme);
    themeItems.forEach(opt => {
      if (opt.getAttribute('data-theme') === theme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }
  applyTheme(currentTheme);

  // Helper to ensure flipbook container element exists and is attached to DOM
  function getOrCreateFlipbookElement() {
    let el = document.getElementById('flipbook');
    const container = bookContainer || document.getElementById('bookContainer') || readerStage;
    if (!el) {
      el = document.createElement('div');
      el.id = 'flipbook';
      el.className = 'flipbook';
      if (container) {
        container.appendChild(el);
      }
    } else if (container && !container.contains(el)) {
      container.appendChild(el);
    }
    return el;
  }

  // Populate Pages - Uniform 'soft' density with async decoding
  function populateBookPages(targetEl) {
    const flipbook = targetEl || getOrCreateFlipbookElement();
    flipbook.innerHTML = '';
    PAGE_IMAGES.forEach((src, idx) => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'flipbook-page';
      pageDiv.setAttribute('data-density', 'soft');

      const img = document.createElement('img');
      img.src = src;
      img.alt = `Book Page ${idx + 1}`;
      img.loading = idx < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';

      pageDiv.appendChild(img);
      flipbook.appendChild(pageDiv);
    });
  }

  // Preload adjacent page textures for zero stutter
  const preloadedCache = new Set();
  function preloadAdjacentPages(currentIndex) {
    const indicesToPreload = [currentIndex - 1, currentIndex + 1];
    indicesToPreload.forEach(idx => {
      if (idx >= 0 && idx < PAGE_IMAGES.length && !preloadedCache.has(idx)) {
        preloadedCache.add(idx);
        const preImg = new Image();
        preImg.decoding = 'async';
        preImg.src = PAGE_IMAGES[idx];
      }
    });
  }

  // Calculate Dynamic Dimensions - Maximize Screen Fill across all devices
  function getMobileBookDimensions() {
    const isPortrait = window.innerHeight >= window.innerWidth;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const isImmersive = document.body.classList.contains('immersive-mode');

    // Reserve header/footer space unless in immersive mode
    let reservedVertical = 54;
    if (isImmersive) {
      reservedVertical = 8;
    } else if (isPortrait) {
      reservedVertical = isFullscreen ? 110 : 132;
    } else {
      reservedVertical = isFullscreen ? 48 : 56;
    }

    const availableH = Math.max(260, screenH - reservedVertical);
    const availableW = Math.max(240, screenW - 12);

    let pageW, pageH;

    if (isPortrait) {
      pageH = availableH;
      pageW = pageH * 0.725; // 3:4 book aspect ratio

      if (pageW > availableW) {
        pageW = availableW;
        pageH = pageW / 0.725;
      }
    } else {
      // In landscape (2-page spread), two pages fit side by side
      pageH = availableH;
      pageW = pageH * 0.725;
      if (pageW > (availableW / 2)) {
        pageW = availableW / 2;
        pageH = pageW / 0.725;
      }
    }

    return {
      width: Math.max(160, Math.round(pageW)),
      height: Math.max(220, Math.round(pageH)),
      isPortrait: isPortrait
    };
  }

  // Initialize PageFlip with Reading Memory Persistence
  function initFlipbook(startIdx) {
    const flipbook = getOrCreateFlipbookElement();
    populateBookPages(flipbook);
    const dims = getMobileBookDimensions();

    const isLandscape = !dims.isPortrait && (window.innerWidth >= 2 * dims.width);
    const totalBookWidth = isLandscape ? (dims.width * 2) : dims.width;

    flipbook.style.width = `${totalBookWidth}px`;
    flipbook.style.height = `${dims.height}px`;

    // Retrieve last saved reading progress
    const savedPage = typeof startIdx === 'number'
      ? startIdx
      : Math.max(0, Math.min(TOTAL_PAGES - 1, parseInt(localStorage.getItem('flipbook_last_page') || '0', 10)));

    pageFlip = new St.PageFlip(flipbook, {
      startPage: savedPage,
      width: dims.width,
      height: dims.height,
      size: 'fixed',
      minWidth: 160,
      maxWidth: 2400,
      minHeight: 220,
      maxHeight: 2400,
      maxShadowOpacity: 0.12,
      showCover: false,
      usePortrait: true,
      mobileScrollSupport: false,
      flippingTime: 320, // Snappy & ultra-smooth 60/120fps
      useMouseEvents: true,
      swipeDistance: 25,
      drawShadow: true
    });

    const pageElements = flipbook.querySelectorAll('.flipbook-page');
    pageFlip.loadFromHTML(pageElements);

    pageFlip.on('flip', (e) => {
      playFlipSound();
      const currentPageIndex = e.data;
      localStorage.setItem('flipbook_last_page', currentPageIndex);
      updateNavigationUI(currentPageIndex);
      preloadAdjacentPages(currentPageIndex);
    });

    pageFlip.on('init', () => {
      updateNavigationUI(savedPage);
      totalPagesText.textContent = TOTAL_PAGES;
      preloadAdjacentPages(savedPage);
      if (savedPage > 0 && typeof startIdx !== 'number') {
        setTimeout(() => {
          showToast(`📖 Resumed from Page ${savedPage + 1}`);
        }, 500);
      }
    });

    updateBookmarkBadge();
  }

  // Cached thumb cards reference for O(1) active state updates
  let currentActiveThumbCard = null;

  // Helper to update slider track background gradient
  function updateSliderFill(val) {
    const percent = ((val - 1) / (TOTAL_PAGES - 1)) * 100;
    pageSlider.value = val;
    pageSlider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percent}%, rgba(255, 255, 255, 0.18) ${percent}%, rgba(255, 255, 255, 0.18) 100%)`;
  }

  // Update UI Elements - Zero layout thrashing
  function updateNavigationUI(pageIndex) {
    const pageNum = pageIndex + 1;
    currentPageText.textContent = pageNum;
    updateSliderFill(pageNum);

    const isFirst = pageIndex === 0;
    const isLast = pageIndex >= TOTAL_PAGES - 1;

    prevPageBtn.classList.toggle('disabled', isFirst);
    nextPageBtn.classList.toggle('disabled', isLast);

    // Fast Active Gallery Card update without full DOM search
    if (thumbnailsGrid && thumbnailsGrid.children.length > pageIndex) {
      if (currentActiveThumbCard) {
        currentActiveThumbCard.classList.remove('active');
      }
      currentActiveThumbCard = thumbnailsGrid.children[pageIndex];
      if (currentActiveThumbCard) {
        currentActiveThumbCard.classList.add('active');
        if (thumbnailsDrawer.classList.contains('open')) {
          currentActiveThumbCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }

    updateBookmarkButtonState(pageNum);
  }

  // Turn Actions
  function turnNext() {
    if (pageFlip) pageFlip.flipNext('bottom');
  }

  function turnPrev() {
    if (pageFlip) pageFlip.flipPrev('bottom');
  }

  function turnToPage(pageNum) {
    const targetIdx = Math.max(0, Math.min(TOTAL_PAGES - 1, pageNum - 1));
    if (pageFlip) {
      pageFlip.turnToPage(targetIdx);
    }
  }

  // Touch & Tap Navigation on Reader Stage
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let stagePinchStartDist = 0;
  let stagePinchCenterX = 0;
  let stagePinchCenterY = 0;
  let stagePinchActive = false;

  readerStage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      stagePinchActive = false;
    } else if (e.touches.length === 2) {
      // 2 fingers detected on reader page -> open magnifier zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      stagePinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      stagePinchCenterX = (t1.clientX + t2.clientX) / 2;
      stagePinchCenterY = (t1.clientY + t2.clientY) / 2;
      stagePinchActive = true;
    }
  }, { passive: true });

  readerStage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && stagePinchActive) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const curMidX = (t1.clientX + t2.clientX) / 2;
      const curMidY = (t1.clientY + t2.clientY) / 2;

      if (Math.abs(curDist - stagePinchStartDist) > 16) {
        stagePinchActive = false;
        const initialZoomRatio = curDist / (stagePinchStartDist || 1);
        openZoomModalWithPinch(curMidX, curMidY, initialZoomRatio);
      }
    }
  }, { passive: true });

  readerStage.addEventListener('touchend', (e) => {
    if (stagePinchActive && e.touches.length < 2) {
      stagePinchActive = false;
    }

    if (e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const duration = Date.now() - touchStartTime;

    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Discrete quick tap detection for left/right page turn
    if (duration < 220 && absX < 8 && absY < 8) {
      const screenWidth = window.innerWidth;
      const tapX = touchEndX;

      if (tapX < screenWidth * 0.24) {
        turnPrev();
      } else if (tapX > screenWidth * 0.76) {
        turnNext();
      } else {
        document.body.classList.toggle('immersive-mode');
      }
    }
  }, { passive: true });

  // Bottom Flip Buttons
  prevPageBtn.addEventListener('click', turnPrev);
  nextPageBtn.addEventListener('click', turnNext);

  // High-Performance Scrubber Slider (Batched via rAF)
  let sliderRafPending = false;

  pageSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    sliderPreviewText.textContent = `Page ${val}`;
    sliderPreviewThumb.src = PAGE_IMAGES[val - 1];

    if (!sliderRafPending) {
      sliderRafPending = true;
      requestAnimationFrame(() => {
        const percent = (val - 1) / (TOTAL_PAGES - 1);
        const trackW = pageSlider.clientWidth || 200;
        sliderPreviewBubble.style.left = `${percent * trackW}px`;
        updateSliderFill(val);
        sliderPreviewBubble.classList.add('show');
        sliderRafPending = false;
      });
    }
  });

  pageSlider.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    turnToPage(val);
    sliderPreviewBubble.classList.remove('show');
  });

  pageSlider.addEventListener('touchend', () => {
    setTimeout(() => sliderPreviewBubble.classList.remove('show'), 200);
  });

  // Sound Toggle
  function updateSoundIcon() {
    const soundOn = soundToggleBtn.querySelector('.sound-on-icon');
    const soundOff = soundToggleBtn.querySelector('.sound-off-icon');
    if (isSoundEnabled) {
      soundOn.classList.remove('hidden');
      soundOff.classList.add('hidden');
      soundToggleBtn.classList.remove('active');
    } else {
      soundOn.classList.add('hidden');
      soundOff.classList.remove('hidden');
      soundToggleBtn.classList.add('active');
    }
  }
  updateSoundIcon();

  soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('flipbook_sound', isSoundEnabled);
    updateSoundIcon();
    showToast(isSoundEnabled ? '🔊 Sound Enabled' : '🔇 Sound Muted');
  });

  // Auto-Play Slideshow
  function startAutoplay() {
    isAutoPlaying = true;
    autoPlayBtn.querySelector('.play-icon').classList.add('hidden');
    autoPlayBtn.querySelector('.pause-icon').classList.remove('hidden');
    autoPlayBtn.classList.add('active');
    autoplayIndicator.classList.remove('hidden');
    autoplayRemaining = 5;
    autoplayCountdown.textContent = `${autoplayRemaining}s`;

    clearInterval(autoplayTickInterval);
    autoplayTickInterval = setInterval(() => {
      autoplayRemaining--;
      if (autoplayRemaining <= 0) {
        autoplayRemaining = 5;
        const current = pageFlip ? pageFlip.getCurrentPageIndex() : 0;
        if (current >= TOTAL_PAGES - 1) {
          turnToPage(1);
        } else {
          turnNext();
        }
      }
      autoplayCountdown.textContent = `${autoplayRemaining}s`;
    }, 1000);

    showToast('▶ Auto-Flip Active');
  }

  function stopAutoplay() {
    isAutoPlaying = false;
    autoPlayBtn.querySelector('.play-icon').classList.remove('hidden');
    autoPlayBtn.querySelector('.pause-icon').classList.add('hidden');
    autoPlayBtn.classList.remove('active');
    autoplayIndicator.classList.add('hidden');
    clearInterval(autoplayTickInterval);
    showToast('⏸ Auto-Flip Stopped');
  }

  autoPlayBtn.addEventListener('click', () => {
    if (isAutoPlaying) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  stopAutoplayBtn.addEventListener('click', stopAutoplay);

  // Fullscreen
  fullscreenBtn.addEventListener('click', async () => {
    try {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if (!isFull) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  });

  function onFullscreenStateChange() {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    const maxIcon = fullscreenBtn.querySelector('.maximize-icon');
    const minIcon = fullscreenBtn.querySelector('.minimize-icon');
    if (isFull) {
      maxIcon.classList.add('hidden');
      minIcon.classList.remove('hidden');
      fullscreenBtn.classList.add('active');
    } else {
      maxIcon.classList.remove('hidden');
      minIcon.classList.add('hidden');
      fullscreenBtn.classList.remove('active');
    }
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      handleMobileResize(true);
    }, 150);
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, onFullscreenStateChange);
  });

  // Theme Sheet
  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    themeMenu.classList.remove('show');
  });

  themeItems.forEach(opt => {
    opt.addEventListener('click', () => {
      const theme = opt.getAttribute('data-theme');
      applyTheme(theme);
      themeMenu.classList.remove('show');
      showToast(`🎨 ${opt.querySelector('span:last-child').textContent}`);
    });
  });

  // ==========================================
  // High-Performance Quick-Peek & Pinch-Zoom Engine (Bookmarks & Gallery)
  // ==========================================
  let isPeekActive = false;
  let activePeekPage = 1;
  let peekScale = 1.7;
  let peekTranslateX = 0;
  let peekTranslateY = 0;
  let peekRafPending = false;

  function renderPeekTransform() {
    if (!peekRafPending) {
      peekRafPending = true;
      requestAnimationFrame(() => {
        if (bookmarkPeekImgWrap) {
          bookmarkPeekImgWrap.style.transform = `translate3d(${peekTranslateX}px, ${peekTranslateY}px, 0) scale(${peekScale})`;
        }
        peekRafPending = false;
      });
    }
  }

  function openBookmarkPeek(pageNum, initialScale = 1.7, offsetX = 0, offsetY = 0) {
    if (!PAGE_IMAGES[pageNum - 1]) return;
    activePeekPage = pageNum;
    isPeekActive = true;
    peekScale = Math.min(5.0, Math.max(1.0, initialScale));
    peekTranslateX = offsetX;
    peekTranslateY = offsetY;

    bookmarkPeekImg.src = PAGE_IMAGES[pageNum - 1];
    bookmarkPeekTitleText.textContent = `Page ${pageNum} • Quick Peek`;
    if (bookmarkPeekHintText) {
      bookmarkPeekHintText.textContent = 'Pinch to zoom';
    }

    renderPeekTransform();
    bookmarkPeekOverlay.classList.add('open');
    bookmarkPeekOverlay.setAttribute('aria-hidden', 'false');
  }

  function updateBookmarkPeek(newScale, newTx, newTy) {
    if (!isPeekActive) return;
    peekScale = Math.min(5.0, Math.max(1.0, newScale));
    peekTranslateX = newTx;
    peekTranslateY = newTy;
    renderPeekTransform();
  }

  function closeBookmarkPeek() {
    if (!isPeekActive) return;
    isPeekActive = false;
    bookmarkPeekOverlay.classList.remove('open');
    bookmarkPeekOverlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (!isPeekActive) {
        peekScale = 1.7;
        peekTranslateX = 0;
        peekTranslateY = 0;
        renderPeekTransform();
      }
    }, 240);
  }

  // Explicit Close Button listeners ONLY (Modal never auto-closes on release or backdrop tap)
  if (closeBookmarkPeekBtn) {
    const handleClose = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      closeBookmarkPeek();
    };
    closeBookmarkPeekBtn.addEventListener('click', handleClose);
    closeBookmarkPeekBtn.addEventListener('touchend', handleClose);
  }

  if (peekCloseBottomBtn) {
    const handleBottomClose = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      closeBookmarkPeek();
    };
    peekCloseBottomBtn.addEventListener('click', handleBottomClose);
    peekCloseBottomBtn.addEventListener('touchend', handleBottomClose);
  }

  if (peekJumpBtn) {
    peekJumpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      turnToPage(activePeekPage);
      closeBookmarkPeek();
      if (bookmarksModal) bookmarksModal.classList.remove('open');
      if (thumbnailsDrawer) thumbnailsDrawer.classList.remove('open');
    });
  }

  // Touch & Pinch gestures inside the Peek Viewport itself
  let peekViewportLastPinchDist = 0;
  let peekViewportLastPanX = 0;
  let peekViewportLastPanY = 0;
  let peekLastTapTime = 0;

  bookmarkPeekViewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      peekViewportLastPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    } else if (e.touches.length === 1) {
      peekViewportLastPanX = e.touches[0].clientX;
      peekViewportLastPanY = e.touches[0].clientY;
      peekViewportLastPinchDist = 0;
    }
  }, { passive: false });

  bookmarkPeekViewport.addEventListener('touchmove', (e) => {
    if (e.cancelable) e.preventDefault();
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (peekViewportLastPinchDist > 0) {
        const factor = dist / peekViewportLastPinchDist;
        const newScale = Math.min(5.0, Math.max(1.0, peekScale * factor));
        updateBookmarkPeek(newScale, peekTranslateX, peekTranslateY);
      }
      peekViewportLastPinchDist = dist;
    } else if (e.touches.length === 1 && peekScale > 1.0) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - peekViewportLastPanX;
      const dy = curY - peekViewportLastPanY;
      peekViewportLastPanX = curX;
      peekViewportLastPanY = curY;
      updateBookmarkPeek(peekScale, peekTranslateX + dx, peekTranslateY + dy);
    }
  }, { passive: false });

  bookmarkPeekViewport.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      peekViewportLastPinchDist = 0;
    }
    // Double tap to toggle zoom
    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - peekLastTapTime < 280) {
        if (peekScale > 1.5) {
          updateBookmarkPeek(1.0, 0, 0);
        } else {
          updateBookmarkPeek(2.5, 0, 0);
        }
        peekLastTapTime = 0;
      } else {
        peekLastTapTime = now;
      }
    }
  }, { passive: true });

  // Mouse Wheel Zoom inside Peek Modal
  bookmarkPeekViewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.3 : -0.3;
    const targetScale = Math.min(5.0, Math.max(1.0, peekScale + delta));
    updateBookmarkPeek(targetScale, peekTranslateX, peekTranslateY);
  }, { passive: false });

  // Reusable Card Peek Gesture Handler (Bookmarks & Gallery Cards)
  function attachCardPeekGestures(card, imgWrap, pageNum, peekBtn, onJump) {
    let holdTimer = null;
    let isHolding = false;
    let suppressClick = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let pinchStartDist = 0;
    let pinchStartScale = 1.8;
    let pinchStartMidX = 0;
    let pinchStartMidY = 0;

    // Touch Event Handling
    let lastTapTime = 0;
    let tapTimeout = null;

    card.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // Two fingers detected -> immediately trigger quick-peek zoom!
        if (e.cancelable) e.preventDefault();
        isHolding = false;
        suppressClick = true;
        clearTimeout(holdTimer);
        clearTimeout(tapTimeout);

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartMidX = (t1.clientX + t2.clientX) / 2;
        pinchStartMidY = (t1.clientY + t2.clientY) / 2;
        pinchStartScale = 1.8;

        openBookmarkPeek(pageNum, pinchStartScale, 0, 0);
        if (navigator.vibrate) {
          try { navigator.vibrate(15); } catch (err) {}
        }
      } else if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        holdTimer = setTimeout(() => {
          isHolding = true;
          suppressClick = true;
          clearTimeout(tapTimeout);
          openBookmarkPeek(pageNum, 1.8, 0, 0);
          if (navigator.vibrate) {
            try { navigator.vibrate(25); } catch (err) {}
          }
        }, 260);
      }
    }, { passive: false });

    card.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const curMidX = (t1.clientX + t2.clientX) / 2;
        const curMidY = (t1.clientY + t2.clientY) / 2;

        if (!isPeekActive) {
          suppressClick = true;
          clearTimeout(holdTimer);
          clearTimeout(tapTimeout);
          pinchStartDist = curDist;
          pinchStartMidX = curMidX;
          pinchStartMidY = curMidY;
          openBookmarkPeek(pageNum, 1.8, 0, 0);
        } else {
          const ratio = curDist / (pinchStartDist || curDist);
          const targetScale = Math.min(5.0, Math.max(1.1, pinchStartScale * ratio));
          const dx = (curMidX - pinchStartMidX) * 0.9;
          const dy = (curMidY - pinchStartMidY) * 0.9;
          updateBookmarkPeek(targetScale, dx, dy);
        }
      } else if (e.touches.length === 1) {
        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        const dist = Math.hypot(curX - touchStartX, curY - touchStartY);

        if (!isHolding && dist > 10) {
          // Scrolling list -> cancel hold and tap timer
          clearTimeout(holdTimer);
          clearTimeout(tapTimeout);
        }

        if (isPeekActive && isHolding) {
          if (e.cancelable) e.preventDefault();
          const dx = (curX - touchStartX) * 0.85;
          const dy = (curY - touchStartY) * 0.85;
          updateBookmarkPeek(peekScale, dx, dy);
        }
      }
    }, { passive: false });

    function handleTouchEnd(e) {
      clearTimeout(holdTimer);
      if (isHolding || isPeekActive) {
        setTimeout(() => { suppressClick = false; }, 300);
        isHolding = false;
        return;
      }
      isHolding = false;

      // Handle Single Tap vs Double Tap
      if (e && e.changedTouches && e.changedTouches.length === 1) {
        const curX = e.changedTouches[0].clientX;
        const curY = e.changedTouches[0].clientY;
        const moveDist = Math.hypot(curX - touchStartX, curY - touchStartY);

        if (moveDist < 12) {
          const now = Date.now();
          const timeSinceLast = now - lastTapTime;

          if (timeSinceLast < 280) {
            // DOUBLE TAP -> Zoom peek
            clearTimeout(tapTimeout);
            tapTimeout = null;
            lastTapTime = 0;
            suppressClick = true;
            setTimeout(() => { suppressClick = false; }, 300);
            openBookmarkPeek(pageNum, 2.0, 0, 0);
            if (navigator.vibrate) {
              try { navigator.vibrate(20); } catch (err) {}
            }
            return;
          }

          lastTapTime = now;
          tapTimeout = setTimeout(() => {
            lastTapTime = 0;
            if (!isPeekActive && !suppressClick) {
              if (typeof onJump === 'function') {
                onJump();
              } else {
                turnToPage(pageNum);
                if (bookmarksModal) bookmarksModal.classList.remove('open');
                if (thumbnailsDrawer) thumbnailsDrawer.classList.remove('open');
              }
            }
          }, 240);
        }
      }
    }

    card.addEventListener('touchend', handleTouchEnd, { passive: true });
    card.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Desktop Mouse Click & Dblclick
    card.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openBookmarkPeek(pageNum, 2.0, 0, 0);
    });

    // Card Click (Desktop / Fallback)
    card.addEventListener('click', (e) => {
      if (suppressClick) {
        e.stopPropagation();
        return;
      }
      if (e.pointerType === 'mouse') {
        if (typeof onJump === 'function') {
          onJump();
        } else {
          turnToPage(pageNum);
          if (bookmarksModal) bookmarksModal.classList.remove('open');
          if (thumbnailsDrawer) thumbnailsDrawer.classList.remove('open');
        }
      }
    });
  }

  // Grid-Level 2-Finger Pinch Detection (Gallery & Bookmarks Grids)
  function setupGridPinchZoom(gridElement) {
    if (!gridElement) return;
    let gridPinchStartDist = 0;
    let gridPinchScale = 1.8;
    let isGridPinching = false;

    gridElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        gridPinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

        // Identify the card under user's fingers
        const element = document.elementFromPoint(midX, midY);
        const card = element ? element.closest('[data-page]') : null;
        if (card) {
          const pageNum = parseInt(card.getAttribute('data-page'), 10);
          if (pageNum >= 1 && pageNum <= TOTAL_PAGES) {
            isGridPinching = true;
            openBookmarkPeek(pageNum, 1.8, 0, 0);
            if (navigator.vibrate) {
              try { navigator.vibrate(15); } catch (err) {}
            }
          }
        }
      }
    }, { passive: true });

    gridElement.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && isGridPinching && isPeekActive) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = curDist / (gridPinchStartDist || curDist);
        const targetScale = Math.min(5.0, Math.max(1.1, gridPinchScale * ratio));
        updateBookmarkPeek(targetScale, 0, 0);
      }
    }, { passive: true });

    gridElement.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        isGridPinching = false;
        gridPinchStartDist = 0;
      }
    }, { passive: true });
  }

  // Build Thumbnail Grid (Gallery)
  function buildThumbnailsGrid() {
    thumbnailsGrid.innerHTML = '';
    PAGE_IMAGES.forEach((src, idx) => {
      const pageNum = idx + 1;
      const card = document.createElement('div');
      card.className = `m-thumb-card ${idx === 0 ? 'active' : ''}`;
      card.setAttribute('data-page', pageNum);

      const img = document.createElement('img');
      img.src = src;
      img.alt = `Page ${pageNum}`;
      img.loading = 'lazy';
      img.decoding = 'async';

      const numBadge = document.createElement('span');
      numBadge.className = 'm-thumb-num';
      numBadge.textContent = `${pageNum}`;

      const zoomCue = document.createElement('span');
      zoomCue.className = 'm-thumb-zoom-cue';
      zoomCue.textContent = `🔍`;
      zoomCue.title = '2-finger pinch to zoom';

      card.appendChild(img);
      card.appendChild(numBadge);
      card.appendChild(zoomCue);

      // Attach 2-Finger Pinch Zoom & Hold-to-Peek to Gallery Card
      attachCardPeekGestures(card, card, pageNum, null, () => {
        turnToPage(pageNum);
        thumbnailsDrawer.classList.remove('open');
      });

      thumbnailsGrid.appendChild(card);
    });

    setupGridPinchZoom(thumbnailsGrid);
  }

  thumbnailsToggleBtn.addEventListener('click', () => {
    thumbnailsDrawer.classList.toggle('open');
  });

  closeThumbnailsBtn.addEventListener('click', () => {
    thumbnailsDrawer.classList.remove('open');
  });

  // Preload All 56 Pages & Cache for 100% Offline Access
  let isCachingAllPages = false;
  const CACHE_STORAGE_NAME = 'flipbook-pages-v1';

  async function checkPreloadStatus() {
    if (!preloadAllPagesBtn || !preloadBtnText) return;
    const isCached = localStorage.getItem('flipbook_all_cached') === 'true';
    if (isCached) {
      preloadAllPagesBtn.classList.add('hidden');
      if (clearCacheBtn) clearCacheBtn.classList.remove('hidden');
    } else {
      preloadAllPagesBtn.classList.remove('hidden', 'loading', 'cached');
      preloadBtnText.textContent = 'Load All Pages';
      if (clearCacheBtn) clearCacheBtn.classList.add('hidden');
    }
  }

  async function preloadAndCacheAllPages() {
    if (isCachingAllPages) return;
    isCachingAllPages = true;

    preloadAllPagesBtn.classList.remove('hidden');
    preloadAllPagesBtn.classList.add('loading');
    if (clearCacheBtn) clearCacheBtn.classList.add('hidden');
    preloadBtnText.textContent = '⏳ Caching (0/56)...';
    showToast('⚡ Caching all 56 pages for offline reading...');

    let cache = null;
    if ('caches' in window) {
      try {
        cache = await caches.open(CACHE_STORAGE_NAME);
      } catch (err) {
        console.warn('Cache API unavailable, falling back to image preloading', err);
      }
    }

    let loadedCount = 0;
    const total = PAGE_IMAGES.length;

    // Concurrently fetch and cache in batches of 4
    const chunkSize = 4;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = PAGE_IMAGES.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (src) => {
        try {
          if (cache) {
            const cachedResp = await cache.match(src);
            if (!cachedResp) {
              const fetchResp = await fetch(src);
              if (fetchResp.ok) {
                await cache.put(src, fetchResp);
              }
            }
          }
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.decoding = 'async';
            img.src = src;
          });
        } catch (e) {
          console.warn('Preload error for', src, e);
        } finally {
          loadedCount++;
          preloadBtnText.textContent = `⏳ ${loadedCount}/${total}`;
        }
      }));
    }

    isCachingAllPages = false;
    preloadAllPagesBtn.classList.remove('loading');
    preloadAllPagesBtn.classList.add('hidden');
    if (clearCacheBtn) clearCacheBtn.classList.remove('hidden');
    localStorage.setItem('flipbook_all_cached', 'true');
    showToast('🎉 All 56 pages cached! Available 100% offline & lightning fast.');
    if (navigator.vibrate) {
      try { navigator.vibrate([30, 50, 30]); } catch (err) {}
    }
  }

  async function clearOfflineCache() {
    try {
      if ('caches' in window) {
        await caches.delete(CACHE_STORAGE_NAME);
      }
    } catch (e) {
      console.warn('Could not delete cache', e);
    }
    localStorage.removeItem('flipbook_all_cached');
    checkPreloadStatus();
    showToast('🗑️ Offline cache deleted! Phone storage freed.');
    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch (err) {}
    }
  }

  if (preloadAllPagesBtn) {
    preloadAllPagesBtn.addEventListener('click', () => {
      preloadAndCacheAllPages();
    });
  }

  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      clearOfflineCache();
    });
  }

  checkPreloadStatus();

  // Bookmarks Logic
  function updateBookmarkBadge() {
    if (bookmarks && bookmarks.length > 0) {
      bookmarkCountBadge.textContent = bookmarks.length;
      bookmarkCountBadge.style.display = 'inline-flex';
    } else {
      bookmarkCountBadge.textContent = '';
      bookmarkCountBadge.style.display = 'none';
    }
  }

  function updateBookmarkButtonState(pageNum) {
    if (bookmarks.includes(pageNum)) {
      bookmarkCurrentBtn.classList.add('active');
    } else {
      bookmarkCurrentBtn.classList.remove('active');
    }
  }

  function toggleBookmark(pageNum) {
    const idx = bookmarks.indexOf(pageNum);
    if (idx > -1) {
      bookmarks.splice(idx, 1);
      showToast(`☆ Removed Bookmark (Page ${pageNum})`);
    } else {
      bookmarks.push(pageNum);
      bookmarks.sort((a, b) => a - b);
      showToast(`★ Bookmarked Page ${pageNum}`);
    }
    localStorage.setItem('flipbook_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkBadge();
    updateBookmarkButtonState(pageNum);
    renderBookmarksList();
  }

  bookmarkCurrentBtn.addEventListener('click', () => {
    const current = (pageFlip ? pageFlip.getCurrentPageIndex() : 0) + 1;
    toggleBookmark(current);
  });

  function renderBookmarksList() {
    bookmarksList.innerHTML = '';
    if (bookmarks.length === 0) {
      emptyBookmarksMsg.classList.remove('hidden');
      return;
    }
    emptyBookmarksMsg.classList.add('hidden');

    bookmarks.forEach(pageNum => {
      const card = document.createElement('div');
      card.className = 'm-bookmark-card';
      card.setAttribute('data-page', pageNum);

      const imgWrap = document.createElement('div');
      imgWrap.className = 'm-bookmark-img-wrap';

      const img = document.createElement('img');
      img.src = PAGE_IMAGES[pageNum - 1];
      img.alt = `Bookmark ${pageNum}`;
      img.loading = 'lazy';
      img.decoding = 'async';

      const peekBadge = document.createElement('span');
      peekBadge.className = 'm-bookmark-peek-badge';
      peekBadge.innerHTML = `🔍 Peek`;

      imgWrap.appendChild(img);
      imgWrap.appendChild(peekBadge);

      const meta = document.createElement('div');
      meta.className = 'm-bookmark-meta';

      const pageTitle = document.createElement('span');
      pageTitle.className = 'm-bookmark-title';
      pageTitle.textContent = `Page ${pageNum}`;

      const delBtn = document.createElement('button');
      delBtn.className = 'm-bookmark-del';
      delBtn.title = 'Delete Bookmark';
      delBtn.setAttribute('aria-label', `Delete Bookmark Page ${pageNum}`);
      delBtn.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(pageNum);
      });

      meta.appendChild(pageTitle);
      meta.appendChild(delBtn);

      card.appendChild(imgWrap);
      card.appendChild(meta);

      attachCardPeekGestures(card, imgWrap, pageNum, null, () => {
        openBookmarkPeek(pageNum, 1.8, 0, 0);
      });

      bookmarksList.appendChild(card);
    });

    setupGridPinchZoom(bookmarksList);
  }

  bookmarksDrawerBtn.addEventListener('click', () => {
    renderBookmarksList();
    bookmarksModal.classList.add('open');
  });

  closeBookmarksBtn.addEventListener('click', () => {
    bookmarksModal.classList.remove('open');
  });

  // ==========================================
  // High-Performance Zoom & Magnifier Engine (rAF Batched)
  // ==========================================
  let isRafPending = false;
  let isSmoothTransitionActive = false;

  function scheduleZoomRender(smooth = false) {
    if (smooth) {
      zoomImageWrapper.classList.add('smooth-transition');
      isSmoothTransitionActive = true;
    } else if (isSmoothTransitionActive) {
      zoomImageWrapper.classList.remove('smooth-transition');
      isSmoothTransitionActive = false;
    }

    if (!isRafPending) {
      isRafPending = true;
      requestAnimationFrame(() => {
        zoomImageWrapper.style.transform = `translate3d(${zoomTranslateX}px, ${zoomTranslateY}px, 0) scale(${zoomScale})`;
        zoomLevelText.textContent = `${Math.round(zoomScale * 100)}%`;
        isRafPending = false;
      });
    }
  }

  function openZoomModal(targetScale = 1.6, offsetX = 0, offsetY = 0) {
    const currentIdx = pageFlip ? pageFlip.getCurrentPageIndex() : 0;
    const pageNum = currentIdx + 1;
    zoomImage.src = PAGE_IMAGES[currentIdx];
    zoomPageTitle.textContent = `Page ${pageNum} • Magnifier`;
    zoomScale = Math.min(4.5, Math.max(1.0, targetScale));
    zoomTranslateX = offsetX;
    zoomTranslateY = offsetY;
    scheduleZoomRender(true);
    zoomViewerModal.classList.add('open');
  }

  function openZoomModalWithPinch(focalScreenX, focalScreenY, pinchRatio) {
    const currentIdx = pageFlip ? pageFlip.getCurrentPageIndex() : 0;
    const pageNum = currentIdx + 1;
    zoomImage.src = PAGE_IMAGES[currentIdx];
    zoomPageTitle.textContent = `Page ${pageNum} • Magnifier`;

    const rect = zoomCanvasArea.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const relX = focalScreenX - centerX;
    const relY = focalScreenY - centerY;

    const newScale = Math.min(4.5, Math.max(1.3, pinchRatio * 1.6));
    zoomScale = newScale;
    zoomTranslateX = -relX * (newScale - 1);
    zoomTranslateY = -relY * (newScale - 1);

    scheduleZoomRender(false);
    zoomViewerModal.classList.add('open');
  }

  zoomToggleBtn.addEventListener('click', () => openZoomModal(1.6, 0, 0));
  closeZoomBtn.addEventListener('click', () => {
    zoomViewerModal.classList.remove('open');
  });

  zoomInBtn.addEventListener('click', () => {
    zoomScale = Math.min(4.5, zoomScale + 0.35);
    scheduleZoomRender(true);
  });

  zoomOutBtn.addEventListener('click', () => {
    zoomScale = Math.max(1.0, zoomScale - 0.35);
    if (zoomScale === 1.0) {
      zoomTranslateX = 0;
      zoomTranslateY = 0;
    }
    scheduleZoomRender(true);
  });

  zoomResetBtn.addEventListener('click', () => {
    zoomScale = 1.0;
    zoomTranslateX = 0;
    zoomTranslateY = 0;
    scheduleZoomRender(true);
  });

  // Touch Zoom / Pan Handling on Modal Canvas
  let canvasLastPinchDist = 0;
  let canvasLastMidX = 0;
  let canvasLastMidY = 0;
  let canvasLastPanX = 0;
  let canvasLastPanY = 0;
  let canvasLastTapTime = 0;
  let canvasLastTapX = 0;
  let canvasLastTapY = 0;

  zoomCanvasArea.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      canvasLastPanX = e.touches[0].clientX;
      canvasLastPanY = e.touches[0].clientY;
      canvasLastPinchDist = 0;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      canvasLastPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      canvasLastMidX = (t1.clientX + t2.clientX) / 2;
      canvasLastMidY = (t1.clientY + t2.clientY) / 2;
    }
  }, { passive: false });

  zoomCanvasArea.addEventListener('touchmove', (e) => {
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 2) {
      // 2-Finger Pinch Zooming inside Magnifier
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      if (canvasLastPinchDist > 0) {
        const factor = dist / canvasLastPinchDist;
        const newScale = Math.min(5.0, Math.max(1.0, zoomScale * factor));

        const rect = zoomCanvasArea.getBoundingClientRect();
        const cx = midX - (rect.left + rect.width / 2);
        const cy = midY - (rect.top + rect.height / 2);

        const scaleRatio = newScale / zoomScale;
        zoomTranslateX = cx - (cx - zoomTranslateX) * scaleRatio + (midX - canvasLastMidX);
        zoomTranslateY = cy - (cy - zoomTranslateY) * scaleRatio + (midY - canvasLastMidY);
        zoomScale = newScale;

        scheduleZoomRender(false);
      }

      canvasLastPinchDist = dist;
      canvasLastMidX = midX;
      canvasLastMidY = midY;

    } else if (e.touches.length === 1 && zoomScale > 1.0) {
      // 1-Finger Pan when zoomed in
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const dx = curX - canvasLastPanX;
      const dy = curY - canvasLastPanY;

      zoomTranslateX += dx;
      zoomTranslateY += dy;
      canvasLastPanX = curX;
      canvasLastPanY = curY;

      scheduleZoomRender(false);
    }
  }, { passive: false });

  zoomCanvasArea.addEventListener('touchend', (e) => {
    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      // Double tap to quick zoom in / out
      const now = Date.now();
      const tapX = e.changedTouches[0].clientX;
      const tapY = e.changedTouches[0].clientY;

      if (now - canvasLastTapTime < 280 && Math.hypot(tapX - canvasLastTapX, tapY - canvasLastTapY) < 30) {
        if (zoomScale < 1.4) {
          const rect = zoomCanvasArea.getBoundingClientRect();
          const cx = tapX - (rect.left + rect.width / 2);
          const cy = tapY - (rect.top + rect.height / 2);
          zoomScale = 2.4;
          zoomTranslateX = -cx * 1.4;
          zoomTranslateY = -cy * 1.4;
        } else {
          zoomScale = 1.0;
          zoomTranslateX = 0;
          zoomTranslateY = 0;
        }
        scheduleZoomRender(true);
        canvasLastTapTime = 0;
      } else {
        canvasLastTapTime = now;
        canvasLastTapX = tapX;
        canvasLastTapY = tapY;
      }
    }

    if (e.touches.length < 2) {
      canvasLastPinchDist = 0;
    }
  });

  // Desktop Mouse Drag & Wheel Zoom
  let isMouseDragging = false;
  let mouseStartX = 0, mouseStartY = 0;

  zoomCanvasArea.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      isMouseDragging = true;
      mouseStartX = e.clientX - zoomTranslateX;
      mouseStartY = e.clientY - zoomTranslateY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDragging) return;
    zoomTranslateX = e.clientX - mouseStartX;
    zoomTranslateY = e.clientY - mouseStartY;
    scheduleZoomRender(false);
  });

  window.addEventListener('mouseup', () => {
    isMouseDragging = false;
  });

  zoomCanvasArea.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = zoomCanvasArea.getBoundingClientRect();
    const cx = e.clientX - (rect.left + rect.width / 2);
    const cy = e.clientY - (rect.top + rect.height / 2);

    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    const newScale = Math.min(5.0, Math.max(1.0, zoomScale + delta));
    const scaleRatio = newScale / zoomScale;

    zoomTranslateX = cx - (cx - zoomTranslateX) * scaleRatio;
    zoomTranslateY = cy - (cy - zoomTranslateY) * scaleRatio;
    zoomScale = newScale;

    scheduleZoomRender(false);
  }, { passive: false });

  // Direct Page Pill Jump
  document.getElementById('pageBadge').addEventListener('click', () => {
    const input = prompt(`Enter page number (1 - ${TOTAL_PAGES}):`);
    if (input !== null) {
      const num = parseInt(input.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= TOTAL_PAGES) {
        turnToPage(num);
      } else {
        showToast('⚠️ Invalid page number');
      }
    }
  });

  // Close modals on overlay tap
  bookmarksModal.addEventListener('click', (e) => {
    if (e.target === bookmarksModal) {
      bookmarksModal.classList.remove('open');
    }
  });

  // Responsive Dynamic Adaptation on Window Resize & Orientation Change
  let resizeTimer = null;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;

  function handleMobileResize(force = false) {
    const currentW = window.innerWidth;
    const currentH = window.innerHeight;

    // Trigger update if screen dimensions changed significantly or forced (e.g. fullscreen toggle, rotation, resizing)
    if (force || Math.abs(currentW - lastW) > 4 || Math.abs(currentH - lastH) > 4) {
      lastW = currentW;
      lastH = currentH;
      let currentIdx = 0;
      if (pageFlip) {
        try {
          currentIdx = pageFlip.getCurrentPageIndex();
        } catch (e) {
          currentIdx = parseInt(localStorage.getItem('flipbook_last_page') || '0', 10);
        }
        try {
          pageFlip.destroy();
        } catch (e) { }
        pageFlip = null;
      } else {
        currentIdx = parseInt(localStorage.getItem('flipbook_last_page') || '0', 10);
      }
      initFlipbook(currentIdx);
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      handleMobileResize(false);
    }, 120);
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      handleMobileResize(true);
    }, 200);
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        turnNext();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        turnPrev();
        break;
    }
  });

  // Initialize Application
  buildThumbnailsGrid();
  initFlipbook();
});
