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
  const sliderProgressBar = document.getElementById('sliderProgressBar');
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
  const jumpPageInput = document.getElementById('jumpPageInput');
  const jumpPageBtn = document.getElementById('jumpPageBtn');

  const bookmarkCurrentBtn = document.getElementById('bookmarkCurrentBtn');
  const bookmarksDrawerBtn = document.getElementById('bookmarksDrawerBtn');
  const bookmarksModal = document.getElementById('bookmarksModal');
  const closeBookmarksBtn = document.getElementById('closeBookmarksBtn');
  const bookmarksList = document.getElementById('bookmarksList');
  const emptyBookmarksMsg = document.getElementById('emptyBookmarksMsg');
  const bookmarkCountBadge = document.getElementById('bookmarkCountBadge');

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
      img.loading = idx < 6 ? 'eager' : 'lazy';
      img.decoding = 'async';

      pageDiv.appendChild(img);
      flipbook.appendChild(pageDiv);
    });
  }

  // Preload adjacent page textures for zero stutter
  function preloadAdjacentPages(currentIndex) {
    const indicesToPreload = [currentIndex - 1, currentIndex + 1, currentIndex + 2];
    indicesToPreload.forEach(idx => {
      if (idx >= 0 && idx < PAGE_IMAGES.length) {
        const preImg = new Image();
        preImg.decoding = 'async';
        preImg.src = PAGE_IMAGES[idx];
      }
    });
  }

  // Calculate Dynamic Dimensions - Maximize Screen Fill across all mobile devices
  function getMobileBookDimensions() {
    const isPortrait = window.innerHeight >= window.innerWidth;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const isImmersive = document.body.classList.contains('immersive-mode') || !!document.fullscreenElement;
    const reservedVertical = isImmersive ? 10 : (isPortrait ? 132 : 54);
    const availableH = Math.max(260, screenH - reservedVertical);
    const availableW = Math.max(240, screenW - 8);

    let pageW, pageH;

    if (isPortrait) {
      pageH = availableH;
      pageW = pageH * 0.725; // 3:4 book aspect ratio

      if (pageW > availableW) {
        pageW = availableW;
        pageH = pageW / 0.725;
      }
    } else {
      pageH = availableH;
      pageW = pageH * 0.725;
      if (pageW > (availableW / 2)) {
        pageW = availableW / 2;
        pageH = pageW / 0.725;
      }
    }

    return {
      width: Math.round(pageW),
      height: Math.round(pageH)
    };
  }

  // Initialize PageFlip with Reading Memory Persistence
  function initFlipbook(startIdx) {
    const flipbook = getOrCreateFlipbookElement();
    populateBookPages(flipbook);
    const dims = getMobileBookDimensions();

    flipbook.style.width = `${dims.width}px`;
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
      minWidth: 220,
      maxWidth: 1400,
      minHeight: 300,
      maxHeight: 1800,
      maxShadowOpacity: 0.28,
      showCover: false,
      usePortrait: true,
      mobileScrollSupport: false,
      flippingTime: 420, // Snappy & smooth for low-end devices
      useMouseEvents: true,
      swipeDistance: 20,
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

    buildThumbnailsGrid();
    updateBookmarkBadge();
  }

  // Update UI Elements
  function updateNavigationUI(pageIndex) {
    const pageNum = pageIndex + 1;
    currentPageText.textContent = pageNum;
    pageSlider.value = pageNum;

    const percentage = ((pageNum - 1) / (TOTAL_PAGES - 1)) * 100;
    sliderProgressBar.style.width = `${percentage}%`;

    const isFirst = pageIndex === 0;
    const isLast = pageIndex >= TOTAL_PAGES - 1;

    prevPageBtn.classList.toggle('disabled', isFirst);
    nextPageBtn.classList.toggle('disabled', isLast);

    // Active Gallery Card
    document.querySelectorAll('.m-thumb-card').forEach((card, idx) => {
      if (idx === pageIndex) {
        card.classList.add('active');
        if (thumbnailsDrawer.classList.contains('open')) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        card.classList.remove('active');
      }
    });

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

  // Touch & Swipe & 2-Finger Pinch-to-Zoom Navigation
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isSwiping = false;

  let stagePinchStartDist = 0;
  let stagePinchCenterX = 0;
  let stagePinchCenterY = 0;
  let stagePinchActive = false;

  readerStage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isSwiping = true;
      stagePinchActive = false;
    } else if (e.touches.length === 2) {
      // 2 fingers detected on page -> prepare pinch-to-zoom
      isSwiping = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      stagePinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      stagePinchCenterX = (t1.clientX + t2.clientX) / 2;
      stagePinchCenterY = (t1.clientY + t2.clientY) / 2;
      stagePinchActive = true;
    }
  }, { passive: false });

  readerStage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && stagePinchActive) {
      if (e.cancelable) e.preventDefault(); // Prevent browser whole-page zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const curMidX = (t1.clientX + t2.clientX) / 2;
      const curMidY = (t1.clientY + t2.clientY) / 2;

      // Pinch out or in gesture triggered on reader page
      if (Math.abs(curDist - stagePinchStartDist) > 12) {
        stagePinchActive = false;
        const initialZoomRatio = curDist / (stagePinchStartDist || 1);
        openZoomModalWithPinch(curMidX, curMidY, initialZoomRatio);
      }
    }
  }, { passive: false });

  readerStage.addEventListener('touchend', (e) => {
    if (stagePinchActive && e.touches.length < 2) {
      stagePinchActive = false;
    }

    if (!isSwiping) return;
    isSwiping = false;

    if (e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const duration = Date.now() - touchStartTime;

    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (absX > 25 && absX > absY) {
      if (diffX < 0) {
        turnNext();
      } else {
        turnPrev();
      }
      return;
    }

    if (duration < 300 && absX < 12 && absY < 12) {
      const screenWidth = window.innerWidth;
      const tapX = touchEndX;

      if (tapX < screenWidth * 0.28) {
        turnPrev();
      } else if (tapX > screenWidth * 0.72) {
        turnNext();
      } else {
        document.body.classList.toggle('immersive-mode');
      }
    }
  }, { passive: true });

  // Bottom Buttons
  prevPageBtn.addEventListener('click', turnPrev);
  nextPageBtn.addEventListener('click', turnNext);

  // Slider Scrubber Events
  pageSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    sliderPreviewText.textContent = `Page ${val}`;
    sliderPreviewThumb.src = PAGE_IMAGES[val - 1];

    const rect = pageSlider.getBoundingClientRect();
    const percent = (val - 1) / (TOTAL_PAGES - 1);
    const bubbleX = percent * rect.width;
    sliderPreviewBubble.style.left = `${bubbleX}px`;
    sliderPreviewBubble.classList.add('show');
  });

  pageSlider.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    turnToPage(val);
    sliderPreviewBubble.classList.remove('show');
  });

  pageSlider.addEventListener('touchend', () => {
    setTimeout(() => sliderPreviewBubble.classList.remove('show'), 300);
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
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const maxIcon = fullscreenBtn.querySelector('.maximize-icon');
    const minIcon = fullscreenBtn.querySelector('.minimize-icon');
    if (document.fullscreenElement) {
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
    }, 100);
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

  // Build Thumbnail Grid
  function buildThumbnailsGrid() {
    thumbnailsGrid.innerHTML = '';
    PAGE_IMAGES.forEach((src, idx) => {
      const card = document.createElement('div');
      card.className = `m-thumb-card ${idx === 0 ? 'active' : ''}`;
      card.setAttribute('data-page', idx + 1);

      const img = document.createElement('img');
      img.src = src;
      img.alt = `Page ${idx + 1}`;
      img.loading = 'lazy';

      const numBadge = document.createElement('span');
      numBadge.className = 'm-thumb-num';
      numBadge.textContent = `${idx + 1}`;

      card.appendChild(img);
      card.appendChild(numBadge);

      card.addEventListener('click', () => {
        turnToPage(idx + 1);
        thumbnailsDrawer.classList.remove('open');
      });

      thumbnailsGrid.appendChild(card);
    });
  }

  thumbnailsToggleBtn.addEventListener('click', () => {
    thumbnailsDrawer.classList.toggle('open');
  });

  closeThumbnailsBtn.addEventListener('click', () => {
    thumbnailsDrawer.classList.remove('open');
  });

  jumpPageBtn.addEventListener('click', () => {
    const val = parseInt(jumpPageInput.value, 10);
    if (!isNaN(val) && val >= 1 && val <= TOTAL_PAGES) {
      turnToPage(val);
      thumbnailsDrawer.classList.remove('open');
      jumpPageInput.value = '';
    } else {
      showToast('⚠️ Enter 1 to 56');
    }
  });

  jumpPageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') jumpPageBtn.click();
  });

  // Bookmarks Logic
  function updateBookmarkBadge() {
    bookmarkCountBadge.textContent = bookmarks.length;
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

      const img = document.createElement('img');
      img.src = PAGE_IMAGES[pageNum - 1];
      img.alt = `Bookmark ${pageNum}`;

      const meta = document.createElement('div');
      meta.className = 'm-bookmark-meta';
      meta.innerHTML = `<span>Page ${pageNum}</span>`;

      const delBtn = document.createElement('button');
      delBtn.className = 'm-bookmark-del';
      delBtn.innerHTML = '✕';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(pageNum);
      });

      meta.appendChild(delBtn);
      card.appendChild(img);
      card.appendChild(meta);

      card.addEventListener('click', () => {
        turnToPage(pageNum);
        bookmarksModal.classList.remove('open');
      });

      bookmarksList.appendChild(card);
    });
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
  initFlipbook();
});
