// ==========================================================================
// FOOD MANAGER - APPLICATION LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    foods: [],
    seasonings: [],
    shopping: [],
    history: [],
    theme: 'organic',
    qtyStep: 25
  };

  // Temporary variable to track default days, amount and unit for current autocomplete selection
  let currentDefaultDays = null;
  let currentDefaultAmount = null;
  let currentDefaultUnit = null;

  // Track item being processed for confirmation
  let confirmingFoodItem = null;
  let confirmingFromCycle = false;

  // Track shopping list item being bought and converted to food inventory
  let shoppingItemBeingRegistered = null;

  // Track food item being edited
  let editingFoodId = null;

  // --- DOM ELEMENTS ---
  const body = document.body;
  
  // Tab elements
  const tabFoods = document.getElementById('tab-foods');
  const tabSeasonings = document.getElementById('tab-seasonings');
  const tabShopping = document.getElementById('tab-shopping');
  const tabHistory = document.getElementById('tab-history');
  
  const sectionFoods = document.getElementById('section-foods');
  const sectionSeasonings = document.getElementById('section-seasonings');
  const sectionShopping = document.getElementById('section-shopping');
  const sectionHistory = document.getElementById('section-history');
  
  // Grid/List displays
  const foodsGrid = document.getElementById('foods-grid');
  const seasoningsGrid = document.getElementById('seasonings-grid');
  const shoppingListContainer = document.getElementById('shopping-list');
  const historyListContainer = document.getElementById('history-list');
  
  const alertSummary = document.getElementById('alert-summary');
  const alertText = document.getElementById('alert-text');
  
  // Filters
  const searchInput = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const filterStorage = document.getElementById('filter-storage');
  const filterSort = document.getElementById('filter-sort');
  
  // Modals
  const addModal = document.getElementById('add-modal');
  const settingsModal = document.getElementById('settings-modal');
  const confirmActionModal = document.getElementById('confirm-action-modal'); // Deletion Confirmation Modal
  
  const btnOpenAddModal = document.getElementById('btn-open-add-modal');
  const btnCloseAddModal = document.getElementById('btn-close-add-modal');
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const btnCloseSettingsModal = document.getElementById('btn-close-settings-modal');
  const btnCloseConfirmModal = document.getElementById('btn-close-confirm-modal');
  
  // Food Form
  const addFoodForm = document.getElementById('add-food-form');
  const inputFoodName = document.getElementById('food-name');
  const inputFoodExpiry = document.getElementById('food-expiry');
  const inputFoodPurchaseDate = document.getElementById('food-purchase-date');
  const inputFoodInitialAmount = document.getElementById('food-initial-amount');
  const selectFoodUnit = document.getElementById('food-unit-select');
  const amountIncrementButtons = document.getElementById('amount-increment-buttons');
  const suggestionsBox = document.getElementById('autocomplete-suggestions');
  
  // Suggested Date Banner
  const suggestedExpiryBadge = document.getElementById('suggested-expiry-badge');
  const suggestedExpiryDateText = document.getElementById('suggested-expiry-date');
  const suggestedExpiryDaysText = document.getElementById('suggested-expiry-days');
  const btnApplySuggestedExpiry = document.getElementById('btn-apply-suggested-expiry');

  // Confirmation Modal Actions
  const confirmFoodNameSpan = document.getElementById('confirm-food-name');
  const btnActionConsume = document.getElementById('btn-action-consume');
  const btnActionDiscard = document.getElementById('btn-action-discard');
  const btnActionCancel = document.getElementById('btn-action-cancel');
  
  // Shopping list UI elements
  const addShoppingForm = document.getElementById('add-shopping-form');
  const shoppingInput = document.getElementById('shopping-input');
  const shoppingSuggestions = document.getElementById('shopping-suggestions');
  const shoppingRecommendations = document.getElementById('shopping-recommendations');
  const recommendationChips = document.getElementById('recommendation-chips');
  
  // History UI elements
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Settings controls
  const settingQtyStep = document.getElementById('setting-qty-step');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const importJsonFile = document.getElementById('import-json-file');
  const btnResetData = document.getElementById('btn-reset-data');
  const seasoningSortSelect = document.getElementById('seasoning-sort-select');

  // Help Modal UI elements
  const helpModal = document.getElementById('help-modal');
  const btnOpenHelp = document.getElementById('btn-open-help');
  const btnCloseHelpModal = document.getElementById('btn-close-help-modal');


  // Safe helper to call Lucide icon generator (protects against offline CDN load failure)
  function createIconsSafe(options) {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      try {
        lucide.createIcons(options);
      } catch (err) {
        console.error('Lucide icon rendering failed:', err);
      }
    } else {
      console.warn('Lucide library is not loaded.');
    }
  }

  // --- INITIALIZATION ---
  function init() {
    // 1. Load theme
    state.theme = localStorage.getItem('fm_theme') || 'organic';
    applyTheme(state.theme);

    // 2. Load decrement quantity step setting
    state.qtyStep = parseInt(localStorage.getItem('fm_qty_step') || '25');
    if (settingQtyStep) {
      settingQtyStep.value = state.qtyStep.toString();
    }

    // 3. Load foods
    const savedFoods = localStorage.getItem('fm_foods');
    try {
      state.foods = savedFoods ? JSON.parse(savedFoods) : [];
    } catch (e) {
      console.error('Failed to parse saved foods:', e);
      state.foods = [];
    }

    // Migrate/Backfill existing foods if they don't have new properties
    let needsSave = false;
    state.foods.forEach(f => {
      if (f.storageType === undefined) {
        f.storageType = 'fridge';
        needsSave = true;
      }
      if (f.quantity === undefined) {
        f.quantity = 100;
        needsSave = true;
      }
      if (f.initialAmount === undefined) {
        f.initialAmount = 1;
        needsSave = true;
      }
      if (f.unit === undefined) {
        f.unit = '個';
        needsSave = true;
      }
      if (f.dateAdded === undefined) {
        f.dateAdded = getTodayDateString();
        needsSave = true;
      }
    });
    if (needsSave) saveFoods();

    // 4. Load seasonings
    const savedSeasonings = localStorage.getItem('fm_seasonings');
    if (savedSeasonings) {
      try {
        state.seasonings = JSON.parse(savedSeasonings);
      } catch (e) {
        console.error('Failed to parse saved seasonings:', e);
        state.seasonings = window.DEFAULT_SEASONINGS ? [...window.DEFAULT_SEASONINGS] : [];
      }
      let seasoningsMigrated = false;
      state.seasonings.forEach(s => {
        if (s.clicks === undefined) {
          s.clicks = 0;
          seasoningsMigrated = true;
        }
        if (s.color === undefined && window.DEFAULT_SEASONINGS) {
          const match = window.DEFAULT_SEASONINGS.find(d => d.id === s.id);
          s.color = match ? match.color : '#a8a29e';
          seasoningsMigrated = true;
        }
        if (s.stock === undefined) {
          s.stock = 0;
          seasoningsMigrated = true;
        }
      });
      if (seasoningsMigrated) saveSeasonings();
    } else {
      state.seasonings = window.DEFAULT_SEASONINGS ? window.DEFAULT_SEASONINGS.map(s => ({ ...s, stock: 0 })) : [];
      saveSeasonings();
    }

    // 5. Load Shopping list
    const savedShopping = localStorage.getItem('fm_shopping');
    try {
      state.shopping = savedShopping ? JSON.parse(savedShopping) : [];
    } catch (e) {
      console.error('Failed to parse saved shopping:', e);
      state.shopping = [];
    }

    // 6. Load History logs
    const savedHistory = localStorage.getItem('fm_history');
    try {
      state.history = savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error('Failed to parse saved history:', e);
      state.history = [];
    }

    // 7. Render UI
    populateUnitsSelect();
    renderFoods();
    renderSeasonings();
    renderShoppingList();
    renderHistory();
    updateThemeSelectorUI();
    setupEventListeners();
    
    // Initial icon render
    createIconsSafe();
  }

  // --- STORAGE ---
  function saveFoods() {
    localStorage.setItem('fm_foods', JSON.stringify(state.foods));
  }

  function saveSeasonings() {
    localStorage.setItem('fm_seasonings', JSON.stringify(state.seasonings));
  }

  function saveShopping() {
    localStorage.setItem('fm_shopping', JSON.stringify(state.shopping));
  }

  function saveHistory() {
    localStorage.setItem('fm_history', JSON.stringify(state.history));
  }

  function saveTheme() {
    localStorage.setItem('fm_theme', state.theme);
  }

  function saveQtyStep(stepValue) {
    localStorage.setItem('fm_qty_step', stepValue);
    state.qtyStep = parseInt(stepValue);
  }

  // Helper to format Date to YYYY-MM-DD string
  function formatDateString(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Populate unit select options sorted by usage frequency
  function populateUnitsSelect() {
    if (!selectFoodUnit) return;
    const defaultUnits = ['個', 'g', 'ml', 'パック', '袋', '枚', '本', '束', '食', '缶', 'kg', 'L'];
    
    let frequencies = {};
    try {
      frequencies = JSON.parse(localStorage.getItem('fm_unit_frequencies') || '{}');
    } catch (e) {
      frequencies = {};
    }
    
    const sortedUnits = [...defaultUnits].sort((a, b) => {
      const freqA = frequencies[a] || 0;
      const freqB = frequencies[b] || 0;
      return freqB - freqA;
    });
    
    const currentValue = selectFoodUnit.value || '個';
    
    selectFoodUnit.innerHTML = '';
    sortedUnits.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u === 'g' ? 'g (グラム)' : u === 'ml' ? 'ml (ミリリットル)' : u === 'L' ? 'L (リットル)' : u;
      selectFoodUnit.appendChild(opt);
    });
    
    if (sortedUnits.includes(currentValue)) {
      selectFoodUnit.value = currentValue;
    }
  }

  // Track active range for dashboard stats
  let activeStatsRange = 'week';

  function renderHistoryStats() {
    const statsConsumeCount = document.getElementById('stats-consume-count');
    const statsDiscardCount = document.getElementById('stats-discard-count');
    const statsDiscardRate = document.getElementById('stats-discard-rate');
    const statsBarConsume = document.getElementById('stats-bar-consume');
    const statsBarDiscard = document.getElementById('stats-bar-discard');
    const statsComment = document.getElementById('stats-comment');
    const statsWasteChart = document.getElementById('stats-waste-chart');
    const statsWasteChartContainer = document.getElementById('stats-waste-chart-container');
    
    if (!statsConsumeCount || !statsDiscardCount || !statsDiscardRate) return;
    
    const now = new Date();
    let startDate = new Date();
    if (activeStatsRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (activeStatsRange === 'month') {
      startDate.setDate(now.getDate() - 30);
    } else if (activeStatsRange === 'year') {
      startDate.setDate(now.getDate() - 365);
    }
    
    let consumeCount = 0;
    let discardCount = 0;
    let discardByCat = {};
    let totalDiscardCount = 0;
    
    state.history.forEach(item => {
      const itemDate = new Date(item.timestamp);
      if (itemDate >= startDate) {
        if (item.action === 'consume') {
          consumeCount++;
        } else if (item.action === 'discard') {
          discardCount++;
          const cat = item.category || 'other';
          discardByCat[cat] = (discardByCat[cat] || 0) + 1;
          totalDiscardCount++;
        }
      }
    });
    
    const total = consumeCount + discardCount;
    const discardRateVal = total > 0 ? Math.round((discardCount / total) * 100) : 0;
    const consumeRateVal = total > 0 ? (100 - discardRateVal) : 100;
    
    statsConsumeCount.textContent = consumeCount.toString();
    statsDiscardCount.textContent = discardCount.toString();
    statsDiscardRate.textContent = `${discardRateVal}%`;
    
    if (total > 0) {
      statsBarConsume.style.width = `${consumeRateVal}%`;
      statsBarDiscard.style.width = `${discardRateVal}%`;
      
      if (discardRateVal <= 10) {
        statsComment.textContent = 'エコ度: 超エコ！すばらしい状態です！ 🌟';
      } else if (discardRateVal <= 30) {
        statsComment.textContent = 'エコ度: 普通です。廃棄をさらに減らせます！ 👍';
      } else {
        statsComment.textContent = 'エコ度: 要注意！計画的な消費・利用を。 ⚠️';
      }
    } else {
      statsBarConsume.style.width = '100%';
      statsBarDiscard.style.width = '0%';
      statsComment.textContent = 'エコ度: 期間内の履歴ログがありません';
    }

    // Render waste category analysis chart
    if (statsWasteChart && statsWasteChartContainer) {
      const pieChartEl = document.getElementById('stats-pie-chart');
      const centerTextEl = document.getElementById('stats-pie-center-text');
      
      if (totalDiscardCount > 0) {
        statsWasteChartContainer.style.display = 'block';
        statsWasteChart.innerHTML = '';
        
        const sortedCats = Object.keys(discardByCat).sort((a, b) => discardByCat[b] - discardByCat[a]);
        
        const catColorMap = {
          vegetable: '#16a34a',
          meat: '#dc2626',
          dairy: '#ea580c',
          staple: '#d97706',
          processed: '#db2777',
          retort: '#78350f',
          drink: '#7c3aed',
          paper: '#0d9488',
          cleaning: '#0891b2',
          bath: '#f43f5e',
          medicine: '#059669',
          other: '#64748b'
        };
        
        let gradientParts = [];
        let accumulatedPercent = 0;
        
        sortedCats.forEach(cat => {
          const count = discardByCat[cat];
          const pct = Math.round((count / totalDiscardCount) * 100);
          const catName = getCategoryName(cat);
          const catColorClass = `cat-color-${cat}`;
          
          const color = catColorMap[cat] || '#64748b';
          const start = accumulatedPercent.toFixed(1);
          accumulatedPercent += (count / totalDiscardCount) * 100;
          const end = accumulatedPercent.toFixed(1);
          
          gradientParts.push(`${color} ${start}% ${end}%`);
          
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = '6px';
          row.style.fontSize = '0.6rem';
          row.className = catColorClass;
          
          row.innerHTML = `
            <span style="width: 65px; text-align: left; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">${catName}</span>
            <div style="flex: 1; height: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; overflow: hidden; display: flex;">
              <div style="width: ${pct}%; height: 100%; background-color: var(--cat-color, #64748b); border-radius: 4px;"></div>
            </div>
            <span style="width: 45px; text-align: right; font-weight: 800; color: var(--text-secondary);">${count}品 (${pct}%)</span>
          `;
          
          statsWasteChart.appendChild(row);
        });
        
        if (pieChartEl) {
          pieChartEl.style.background = `conic-gradient(${gradientParts.join(', ')})`;
        }
        if (centerTextEl) {
          centerTextEl.textContent = `${discardRateVal}%`;
        }
      } else {
        statsWasteChartContainer.style.display = 'none';
        if (pieChartEl) {
          pieChartEl.style.background = `conic-gradient(var(--card-border) 0% 100%)`;
        }
        if (centerTextEl) {
          centerTextEl.textContent = '0%';
        }
      }
    }
  }


  // --- THEME MANAGEMENT ---
  function applyTheme(themeName) {
    body.setAttribute('data-theme', themeName);
    state.theme = themeName;
    saveTheme();
    updateThemeSelectorUI();
  }

  function updateThemeSelectorUI() {
    document.querySelectorAll('.theme-option').forEach(opt => {
      if (opt.getAttribute('data-theme-val') === state.theme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  // --- DATE CALCULATIONS ---
  function getRemainingDays(expiryDateStr) {
    if (!expiryDateStr) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getCategoryName(catKey) {
    const map = {
      vegetable: '野菜・果物',
      meat: 'お肉・お魚',
      dairy: '卵・乳製品',
      staple: '主食・麺類',
      processed: '加工・冷凍',
      retort: '常温・缶詰',
      drink: '飲料・お酒',
      paper: '生活消耗品',
      cleaning: '洗剤・お掃除',
      bath: 'ヘア・ボディ',
      medicine: '衛生・健康',
      other: 'その他・雑貨'
    };
    return map[catKey] || 'その他・雑貨';
  }

  // Bind icons matching category keys
  function getCategoryIcon(catKey) {
    const map = {
      vegetable: 'leaf',
      meat: 'beef',
      dairy: 'egg',
      staple: 'wheat',
      processed: 'cookie',
      retort: 'container',
      drink: 'cup-soda',
      paper: 'sticky-note',
      cleaning: 'sparkles',
      bath: 'bath',
      medicine: 'pill',
      other: 'box'
    };
    return map[catKey] || 'box';
  }

  // Auto calculation with freezer bonus
  function calculateExpiryDate(defaultDays, storageType) {
    const additionalDays = storageType === 'freezer' ? 30 : 0;
    const totalDays = defaultDays + additionalDays;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + totalDays);
    
    const yyyy = expiryDate.getFullYear();
    const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const dd = String(expiryDate.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
  }

  function updateFormExpiryDate() {
    if (currentDefaultDays === null) {
      suggestedExpiryBadge.classList.add('hidden');
      return;
    }
    
    const storageType = document.querySelector('input[name="food-storage"]:checked').value;
    const calculatedDate = calculateExpiryDate(currentDefaultDays, storageType);
    const totalDays = currentDefaultDays + (storageType === 'freezer' ? 30 : 0);

    // Render suggestion banner
    suggestedExpiryDateText.textContent = calculatedDate.replace(/-/g, '/');
    suggestedExpiryDaysText.textContent = totalDays.toString();
    suggestedExpiryBadge.classList.remove('hidden');
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-octagon';
    if (type === 'info') iconName = 'info';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="toast-icon"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    createIconsSafe({ attrs: { class: 'toast-icon' } });
    
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  // --- RENDERING FOODS ---
  function renderFoods() {
    foodsGrid.innerHTML = '';
    
    const searchVal = searchInput.value.toLowerCase().trim();
    const catVal = filterCategory.value;
    const storageVal = filterStorage.value;
    const sortVal = filterSort.value; // Sort option
    
    let expiredCount = 0;
    let warningCount = 0;

    const processedFoods = state.foods.map(food => {
      const remainingDays = getRemainingDays(food.expiryDate);
      let statusClass = 'status-safe';
      
      if (remainingDays === null) {
        statusClass = 'status-none';
      } else if (remainingDays < 0) {
        statusClass = 'status-expired';
        expiredCount++;
      } else if (remainingDays <= 3) {
        statusClass = 'status-warning';
        warningCount++;
      }
      
      return { ...food, remainingDays, statusClass };
    });

    // Filtering
    const filteredFoods = processedFoods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchVal);
      const matchesCategory = catVal === 'all' || food.category === catVal;
      const matchesStorage = storageVal === 'all' || food.storageType === storageVal;
      return matchesSearch && matchesCategory && matchesStorage;
    });

    // Sorting
    filteredFoods.sort((a, b) => {
      if (sortVal === 'expiry-asc') {
        // Expiry date close first (nulls last)
        if (a.remainingDays === null && b.remainingDays !== null) return 1;
        if (a.remainingDays !== null && b.remainingDays === null) return -1;
        if (a.remainingDays !== null && b.remainingDays !== null) {
          return a.remainingDays - b.remainingDays;
        }
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      } else if (sortVal === 'expiry-desc') {
        // Expiry date far first (nulls last)
        if (a.remainingDays === null && b.remainingDays !== null) return 1;
        if (a.remainingDays !== null && b.remainingDays === null) return -1;
        if (a.remainingDays !== null && b.remainingDays !== null) {
          return b.remainingDays - a.remainingDays;
        }
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      } else if (sortVal === 'qty-desc') {
        // Quantity high first
        return b.quantity - a.quantity;
      } else if (sortVal === 'qty-asc') {
        // Quantity low first
        return a.quantity - b.quantity;
      } else if (sortVal === 'added-desc') {
        // Newest purchase date first
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
      return 0;
    });

    // Alert summary banner
    if (expiredCount > 0 || warningCount > 0) {
      alertSummary.classList.remove('hidden');
      let alertMsg = '';
      if (expiredCount > 0 && warningCount > 0) {
        alertMsg = `期限切れ ${expiredCount}件、もうすぐ期限切れ ${warningCount}件あります！`;
      } else if (expiredCount > 0) {
        alertMsg = `期限切れの食材が ${expiredCount}件あります！`;
      } else {
        alertMsg = `もうすぐ期限切れの食材が ${warningCount}件あります。`;
      }
      alertText.textContent = alertMsg;
    } else {
      alertSummary.classList.add('hidden');
    }

    if (filteredFoods.length === 0) {
      foodsGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package-open" style="width: 32px; height: 32px; opacity: 0.3; margin-bottom: 8px;"></i>
          <p>食材が見つかりません</p>
        </div>
      `;
      createIconsSafe();
      return;
    }

    filteredFoods.forEach(food => {
      const card = document.createElement('div');
      card.className = `food-card ${food.statusClass} cat-color-${food.category}`;
      
      let badgeHtml = '';
      if (food.remainingDays === null) {
        badgeHtml = `<span class="days-badge none">期限なし</span>`;
      } else if (food.remainingDays < 0) {
        badgeHtml = `<span class="days-badge expired">期限切れ ${Math.abs(food.remainingDays)}日</span>`;
      } else if (food.remainingDays === 0) {
        badgeHtml = `<span class="days-badge warning">本日期限</span>`;
      } else {
        const badgeType = food.remainingDays <= 3 ? 'warning' : 'safe';
        badgeHtml = `<span class="days-badge ${badgeType}">あと ${food.remainingDays}日</span>`;
      }

      // Storage Badge
      let storageBadgeHtml = '';
      if (food.storageType === 'freezer') {
        storageBadgeHtml = `<span class="storage-badge freezer"><i data-lucide="snowflake"></i>冷凍</span>`;
      } else if (food.storageType === 'room') {
        storageBadgeHtml = `<span class="storage-badge room"><i data-lucide="box"></i>常温</span>`;
      } else {
        storageBadgeHtml = `<span class="storage-badge fridge"><i data-lucide="thermometer"></i>冷蔵</span>`;
      }

      const currentQty = Math.round(food.initialAmount * (food.quantity / 100) * 10) / 10;
      const quantityText = `${currentQty}${food.unit} (${food.quantity}%)`;
      const expiryFormatted = food.expiryDate ? food.expiryDate.replace(/-/g, '/') : 'なし';

      card.innerHTML = `
        <div class="food-card-left">
          <div class="food-icon-wrapper">
            <i data-lucide="${getCategoryIcon(food.category)}"></i>
          </div>
          <div class="food-info">
            <span class="food-name-txt">${escapeHtml(food.name)}</span>
            <span class="food-dates-txt">
              ${storageBadgeHtml}
              <span>期限: ${expiryFormatted}</span>
            </span>
          </div>
        </div>
        <div class="food-card-right">
          <button class="btn-quantity-toggle" data-qty-percent="${food.quantity}" data-id="${food.id}" aria-label="残量を変更">
            ${quantityText}
          </button>
          ${badgeHtml}
          <button class="btn-delete" data-id="${food.id}" aria-label="削除/処理">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      
      foodsGrid.appendChild(card);
    });

    // Card edit click handler
    document.querySelectorAll('.food-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Find the delete button's data-id to get food id
        const deleteBtn = card.querySelector('.btn-delete');
        if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          openEditModal(id);
        }
      });
    });

    // Quantity cycle click handler
    document.querySelectorAll('.btn-quantity-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        cycleFoodQuantity(id);
      });
    });

    // Delete confirmation handler
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        openConfirmModal(id, false);
      });
    });

    createIconsSafe();
  }

  function cycleFoodQuantity(id) {
    const foodIndex = state.foods.findIndex(f => f.id === id);
    if (foodIndex === -1) return;
    
    const food = state.foods[foodIndex];
    const step = state.qtyStep || 25;
    
    let nextQty = food.quantity - step;
    if (nextQty < 0) {
      nextQty = 100; // wrap around
    }
    
    if (nextQty === 0) {
      // Open confirm modal instead of browser confirm dialog
      food.quantity = 0; // Temporarily update level to show 0%
      openConfirmModal(id, true);
    } else {
      food.quantity = nextQty;
      saveFoods();
      renderFoods();
    }
  }

  function openEditModal(id) {
    const food = state.foods.find(f => f.id === id);
    if (!food) return;

    editingFoodId = id;
    shoppingItemBeingRegistered = null; // cancel shopping list registration if active

    // Update modal title and button text
    const modalHeaderTitle = document.querySelector('#add-modal .modal-header h2');
    if (modalHeaderTitle) modalHeaderTitle.textContent = 'アイテムを編集';
    const submitBtn = document.querySelector('#add-food-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = '保存する';

    // Reset autocomplete values
    currentDefaultDays = null;
    currentDefaultAmount = food.initialAmount;
    currentDefaultUnit = food.unit;

    if (window.DEFAULT_FOODS) {
      const match = window.DEFAULT_FOODS.find(d => d.name === food.name);
      if (match) {
        currentDefaultDays = match.defaultDays;
      }
    }

    // Sort and populate units dropdown dynamically
    populateUnitsSelect();

    // Pre-fill fields
    inputFoodName.value = food.name;
    inputFoodInitialAmount.value = food.initialAmount;
    selectFoodUnit.value = food.unit;
    
    // Select category radio button
    const catRadio = document.querySelector(`.category-radio input[value="${food.category}"]`);
    if (catRadio) catRadio.checked = true;
    updateModalCategoryColor(food.category);

    // Select storage radio button
    const storageRadio = document.querySelector(`.storage-radio input[value="${food.storageType}"]`);
    if (storageRadio) storageRadio.checked = true;

    // Setup dates
    inputFoodPurchaseDate.value = food.dateAdded || getTodayDateString();
    inputFoodExpiry.value = food.expiryDate || '';

    updateFormExpiryDate();
    updateAmountIncrementButtons();

    if (addModal) addModal.classList.add('active');
    if (inputFoodName) inputFoodName.focus();
  }

  // --- ACTION CONFIRMATION MODAL LOGIC (消費/廃棄の選択) ---
  function openConfirmModal(id, fromCycle = false) {
    const foodIndex = state.foods.findIndex(f => f.id === id);
    if (foodIndex === -1) return;
    
    confirmingFoodItem = state.foods[foodIndex];
    confirmingFromCycle = fromCycle;
    
    confirmFoodNameSpan.textContent = confirmingFoodItem.name;
    confirmActionModal.classList.add('active');
  }

  function closeConfirmModal() {
    confirmActionModal.classList.remove('active');
    
    // If they cancelled a cycle to 0%, revert their quantity stage to step value (e.g. 25%)
    if (confirmingFromCycle && confirmingFoodItem) {
      const foodIndex = state.foods.findIndex(f => f.id === confirmingFoodItem.id);
      if (foodIndex > -1) {
        state.foods[foodIndex].quantity = state.qtyStep;
        saveFoods();
        renderFoods();
      }
    }
    
    confirmingFoodItem = null;
    confirmingFromCycle = false;
  }

  function handleFoodAction(actionType) {
    if (!confirmingFoodItem) return;
    
    // Create history entry
    const historyItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: confirmingFoodItem.name,
      category: confirmingFoodItem.category,
      action: actionType, // 'consume' or 'discard'
      amount: confirmingFoodItem.initialAmount,
      unit: confirmingFoodItem.unit,
      timestamp: new Date().toISOString()
    };
    
    state.history.push(historyItem);
    saveHistory();

    // Delete item from inventory
    const foodIndex = state.foods.findIndex(f => f.id === confirmingFoodItem.id);
    if (foodIndex > -1) {
      state.foods.splice(foodIndex, 1);
    }
    
    saveFoods();
    renderFoods();
    renderHistory();
    renderShoppingRecommendations(); // recalculate shopping suggestions since food was removed
    
    confirmActionModal.classList.remove('active');
    confirmingFoodItem = null;
    confirmingFromCycle = false;
    
    if (actionType === 'consume') {
      showToast(`「${historyItem.name}」を使い切りました！ 🟢`);
    } else {
      showToast(`「${historyItem.name}」を廃棄しました 🔴`, 'info');
    }
  }

  // --- RENDERING SEASONINGS ---
  function renderSeasonings() {
    seasoningsGrid.innerHTML = '';
    
    let sortedSeasonings = [...state.seasonings];
    const sortVal = seasoningSortSelect.value;

    if (sortVal === 'frequency') {
      sortedSeasonings.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    } else if (sortVal === 'low-level') {
      const levelWeights = { empty: 0, 'very-low': 1, low: 2, medium: 3, high: 4, full: 5 };
      sortedSeasonings.sort((a, b) => levelWeights[a.level] - levelWeights[b.level]);
    }

    sortedSeasonings.forEach(seasoning => {
      const card = document.createElement('div');
      card.className = 'seasoning-card';
      card.setAttribute('data-id', seasoning.id);
      card.setAttribute('data-level', seasoning.level);
      card.style.setProperty('--seasoning-color', seasoning.color || '#a8a29e');
      
      let percent = 100;
      if (seasoning.level === 'high') {
        percent = 80;
      } else if (seasoning.level === 'medium') {
        percent = 60;
      } else if (seasoning.level === 'low') {
        percent = 40;
      } else if (seasoning.level === 'very-low') {
        percent = 20;
      } else if (seasoning.level === 'empty') {
        percent = 0;
      }

      card.innerHTML = `
        <div class="seasoning-name">${escapeHtml(seasoning.name)}</div>
        <div class="seasoning-gauge-container">
          <div class="seasoning-gauge-bar" style="width: ${percent}%;"></div>
          <span class="seasoning-gauge-text">${percent}%</span>
        </div>
        <div class="seasoning-stock-control">
          <button class="btn-stock-dec" aria-label="スペア減">-</button>
          <span class="seasoning-stock-info">
            <i data-lucide="package" class="stock-icon"></i>
            <span class="stock-count">${seasoning.stock || 0}</span>
          </span>
          <button class="btn-stock-inc" aria-label="スペア増">+</button>
        </div>
      `;
      
      const decBtn = card.querySelector('.btn-stock-dec');
      const incBtn = card.querySelector('.btn-stock-inc');
      
      decBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adjustSeasoningStock(seasoning.id, -1);
      });
      
      incBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adjustSeasoningStock(seasoning.id, 1);
      });
      
      card.addEventListener('click', () => {
        cycleSeasoningLevel(seasoning.id);
      });

      seasoningsGrid.appendChild(card);
    });
    
    createIconsSafe();
  }

  function cycleSeasoningLevel(id) {
    const index = state.seasonings.findIndex(s => s.id === id);
    if (index > -1) {
      const levels = ['full', 'high', 'medium', 'low', 'very-low', 'empty'];
      const currentLevel = state.seasonings[index].level;
      const nextIndex = (levels.indexOf(currentLevel) + 1) % levels.length;
      
      state.seasonings[index].level = levels[nextIndex];
      state.seasonings[index].clicks = (state.seasonings[index].clicks || 0) + 1;
      
      saveSeasonings();
      renderSeasonings();
      renderShoppingRecommendations(); // Update chip suggestions instantly
    }
  }

  function adjustSeasoningStock(id, diff) {
    const index = state.seasonings.findIndex(s => s.id === id);
    if (index > -1) {
      const currentStock = state.seasonings[index].stock || 0;
      state.seasonings[index].stock = Math.max(0, currentStock + diff);
      saveSeasonings();
      renderSeasonings();
    }
  }

  // --- RENDERING SHOPPING LIST ---
  function renderShoppingList() {
    shoppingListContainer.innerHTML = '';
    
    if (state.shopping.length === 0) {
      shoppingListContainer.innerHTML = `
        <div class="empty-state" style="padding: 20px 0;">
          <i data-lucide="shopping-bag" style="width: 32px; height: 32px; opacity: 0.3; margin-bottom: 6px;"></i>
          <p>買い物リストは空です</p>
        </div>
      `;
      createIconsSafe();
      renderShoppingRecommendations();
      return;
    }

    // Group items by category
    const grouped = {};
    state.shopping.forEach(item => {
      const cat = item.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });

    // Render grouped sections
    const categoryOrder = [
      'vegetable', 'meat', 'dairy', 'staple', 'processed', 'retort', 
      'drink', 'paper', 'cleaning', 'bath', 'medicine', 'other'
    ];

    categoryOrder.forEach(cat => {
      const items = grouped[cat];
      if (!items || items.length === 0) return;

      const groupContainer = document.createElement('div');
      groupContainer.className = 'shopping-category-group';
      
      const catName = getCategoryName(cat);
      const catIcon = getCategoryIcon(cat);
      
      groupContainer.innerHTML = `
        <div class="shopping-category-header cat-color-${cat}">
          <i data-lucide="${catIcon}"></i>
          <span>${catName} (${items.length})</span>
        </div>
        <div class="shopping-category-list" style="display: flex; flex-direction: column; gap: 5px;"></div>
      `;

      const listContainer = groupContainer.querySelector('.shopping-category-list');

      items.forEach(item => {
        const card = document.createElement('div');
        card.className = `shopping-item-card cat-color-${item.category}`;
        
        card.innerHTML = `
          <div class="shopping-item-left">
            <button class="btn-check-cart" data-id="${item.id}" aria-label="購入して登録">
              <i data-lucide="circle"></i>
            </button>
            <span class="shopping-item-name">${escapeHtml(item.name)}</span>
            <span class="shopping-item-qty">${item.initialAmount}${item.unit}</span>
          </div>
          <div class="shopping-item-right">
            <button class="btn-delete btn-delete-shopping" data-id="${item.id}" aria-label="リストから削除">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;

        listContainer.appendChild(card);
      });

      shoppingListContainer.appendChild(groupContainer);
    });

    // Add bought-check click event (opens pre-filled registration modal)
    document.querySelectorAll('.btn-check-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        startBoughtRegistration(id);
      });
    });

    // Add delete click event
    document.querySelectorAll('.btn-delete-shopping').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteShoppingItem(id);
      });
    });

    createIconsSafe();
    renderShoppingRecommendations();
  }

  function deleteShoppingItem(id) {
    const idx = state.shopping.findIndex(i => i.id === id);
    if (idx > -1) {
      state.shopping.splice(idx, 1);
      saveShopping();
      renderShoppingList();
    }
  }

  // Pre-fills form fields when checking out a shopping list item
  function startBoughtRegistration(shoppingId) {
    const item = state.shopping.find(i => i.id === shoppingId);
    if (!item) return;

    shoppingItemBeingRegistered = shoppingId;

    // Reset autocomplete values
    currentDefaultDays = null;
    currentDefaultAmount = item.initialAmount;
    currentDefaultUnit = item.unit;

    // Search default items database to check if we have defaultDays & defaultStorage
    if (window.DEFAULT_FOODS) {
      const match = window.DEFAULT_FOODS.find(d => d.name === item.name);
      if (match) {
        currentDefaultDays = match.defaultDays;
        item.category = match.category;
        item.storageType = match.defaultStorage || 'fridge';
      }
    }

    // Sort and populate units dropdown dynamically
    populateUnitsSelect();

    // Pre-fill Add Form fields
    inputFoodName.value = item.name;
    inputFoodInitialAmount.value = item.initialAmount;
    selectFoodUnit.value = item.unit;
    
    // Select category radio button
    const catRadio = document.querySelector(`.category-radio input[value="${item.category}"]`);
    if (catRadio) catRadio.checked = true;
    updateModalCategoryColor(item.category);

    // Select storage radio button
    const storageRadio = document.querySelector(`.storage-radio input[value="${item.storageType}"]`);
    if (storageRadio) storageRadio.checked = true;

    // Setup dates
    inputFoodPurchaseDate.value = getTodayDateString();
    if (currentDefaultDays === null) {
      inputFoodExpiry.value = '';
    } else {
      inputFoodExpiry.value = calculateExpiryDate(currentDefaultDays, item.storageType || 'fridge');
    }
    
    updateFormExpiryDate();
    updateAmountIncrementButtons();

    addModal.classList.add('active');
    inputFoodName.focus();
  }

  // Renders recommendation chips from low/empty seasonings
  function renderShoppingRecommendations() {
    recommendationChips.innerHTML = '';
    
    // Find seasonings where level is low/empty, AND they aren't already in the shopping list
    const targets = state.seasonings.filter(s => {
      const isLowOrEmpty = s.level === 'empty' || s.level === 'very-low' || s.level === 'low';
      const alreadyInList = state.shopping.some(item => item.name === s.name);
      return isLowOrEmpty && !alreadyInList;
    });

    if (targets.length === 0) {
      shoppingRecommendations.classList.add('hidden');
      return;
    }

    targets.forEach(s => {
      const chip = document.createElement('button');
      chip.className = 'btn-chip';
      chip.setAttribute('type', 'button');
      chip.style.setProperty('--seasoning-color', s.color || '#a8a29e');
      chip.innerHTML = `
        <i data-lucide="plus"></i>
        <span>${s.name} を買う</span>
      `;
      
      chip.addEventListener('click', () => {
        addRecommendedToShopping(s);
      });
      recommendationChips.appendChild(chip);
    });

    shoppingRecommendations.classList.remove('hidden');
    createIconsSafe();
  }

  function addRecommendedToShopping(seasoning) {
    const newItem = {
      id: Date.now().toString(36),
      name: seasoning.name,
      category: 'other',
      initialAmount: 1,
      unit: '本',
      storageType: 'room'
    };

    state.shopping.push(newItem);
    saveShopping();
    renderShoppingList();
    showToast(`「${seasoning.name}」を買い物リストに加えました`);
  }

  // --- RENDERING HISTORY TAB ---
  function renderHistory() {
    renderHistoryStats();
    historyListContainer.innerHTML = '';
    
    if (state.history.length === 0) {
      historyListContainer.innerHTML = `
        <div class="empty-state">
          <i data-lucide="history" style="width: 32px; height: 32px; opacity: 0.3; margin-bottom: 6px;"></i>
          <p>処理履歴がありません</p>
        </div>
      `;
      createIconsSafe();
      return;
    }

    // Copy and sort by timestamp descending (newest first)
    const sortedHistory = [...state.history].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    sortedHistory.forEach(item => {
      const card = document.createElement('div');
      card.className = `history-card cat-color-${item.category}`;
      
      const badgeClass = item.action === 'consume' ? 'action-consume' : 'action-discard';
      const badgeText = item.action === 'consume' ? '消費' : '廃棄';
      
      const date = new Date(item.timestamp);
      const timeStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      card.innerHTML = `
        <div class="history-card-left">
          <div class="food-icon-wrapper" style="width:20px; height:20px;">
            <i data-lucide="${getCategoryIcon(item.category)}" style="width:10px; height:10px;"></i>
          </div>
          <div class="history-card-info">
            <span class="history-food-name">${escapeHtml(item.name)} <span style="font-size:0.65rem; font-weight:400; color:var(--text-secondary);">(${item.amount}${item.unit})</span></span>
            <span class="history-time-txt">${timeStr}</span>
          </div>
        </div>
        <div class="history-card-right">
          <span class="history-badge ${badgeClass}">${badgeText}</span>
        </div>
      `;
      
      historyListContainer.appendChild(card);
    });

    createIconsSafe();
  }

  // --- AUTOCOMPLETE / SUGGESTIONS ---
  function getCategoryAndStorageByName(name) {
    const query = name.toLowerCase().trim();
    
    // First try exact match in DEFAULT_FOODS
    if (window.DEFAULT_FOODS) {
      const match = window.DEFAULT_FOODS.find(d => d.name.toLowerCase() === query);
      if (match) {
        return {
          category: match.category,
          storage: match.defaultStorage || 'fridge',
          days: match.defaultDays,
          amount: match.defaultAmount,
          unit: match.defaultUnit
        };
      }
    }
    
    // Fallback keyword rules
    const rules = [
      { keywords: ['洗剤', 'そうじ', '掃除', '漂白剤', 'クレンザー', '柔軟剤', '消臭'], category: 'cleaning', storage: 'room' },
      { keywords: ['ペーパー', 'ティッシュ', 'ラップ', 'アルミホイル', 'ホイル', 'ゴミ袋', '袋', '消耗品'], category: 'paper', storage: 'room' },
      { keywords: ['シャンプー', 'リンス', 'コンディショナー', 'ソープ', '石鹸', '石けん', 'ハミガキ', '歯磨き', '歯ブラシ', '洗顔'], category: 'bath', storage: 'room' },
      { keywords: ['マスク', '絆創膏', 'バンドエイド', '薬', '風邪薬', 'ピル', '消毒', '除菌', '目薬', 'サプリ'], category: 'medicine', storage: 'room' },
      { keywords: ['肉', '牛', '豚', '鶏', 'ミンチ', 'カルビ', 'バラ', 'ロース', 'ステーキ', 'ソーセージ', 'ハム', 'ベーコン', '魚', 'さかな', '鮭', 'サケ', '鯖', 'サバ', '鯛', 'タイ', '刺身', 'まぐろ', 'マグロ', '貝', 'あさり', 'エビ', 'えび', 'カニ', 'かに', 'タコ', 'たこ', 'イカ', 'いか'], category: 'meat', storage: 'fridge' },
      { keywords: ['キャベツ', 'レタス', 'ほうれん草', '白菜', 'もやし', 'にんじん', 'じゃがいも', 'たまねぎ', '大根', 'トマト', 'きゅうり', 'ナス', 'なす', 'ピーマン', 'ブロッコリー', 'ねぎ', 'ネギ', 'きのこ', 'しめじ', 'えのき', 'りんご', 'バナナ', 'みかん', 'いちご', 'ぶどう', 'フルーツ', '果物', '野菜', 'リーフ'], category: 'vegetable', storage: 'fridge' },
      { keywords: ['卵', 'たまご', '牛乳', 'ミルク', 'ヨーグルト', 'チーズ', 'バター', 'マーガリン', '生クリーム'], category: 'dairy', storage: 'fridge' },
      { keywords: ['米', 'パン', '食パン', 'ブレッド', 'うどん', 'そば', 'パスタ', 'マカロニ', 'スパゲティ', 'ラーメン', '中華麺', '麺'], category: 'staple', storage: 'room' },
      { keywords: ['冷凍', 'ギョーザ', '餃子', 'から揚げ', '唐揚げ', 'コロッケ', '冷凍食品'], category: 'processed', storage: 'freezer' },
      { keywords: ['レトルト', 'カレー', '缶詰', 'ツナ', 'サバ缶', 'カップ麺', 'インスタント'], category: 'retort', storage: 'room' },
      { keywords: ['茶', '麦茶', 'ジュース', '水', '炭酸', 'ソーダ', 'コーラ', 'ビール', '酒', 'ワイン', 'ウイスキー', '焼酎', '飲料', 'コーヒー', '珈琲'], category: 'drink', storage: 'room' },
      { keywords: ['電池', 'バッテリー', 'フィルター', 'スポンジ', '雑貨', '日用品'], category: 'other', storage: 'room' }
    ];
    
    const forceFreezer = query.includes('冷凍');
    
    for (const rule of rules) {
      for (const kw of rule.keywords) {
        if (query.includes(kw)) {
          return {
            category: rule.category,
            storage: forceFreezer ? 'freezer' : rule.storage,
            days: null,
            amount: 1,
            unit: '個'
          };
        }
      }
    }
    
    return {
      category: 'other',
      storage: 'room',
      days: null,
      amount: 1,
      unit: '個'
    };
  }

  function detectCategoryAndStorage(query) {
    if (!query) return;
    const detected = getCategoryAndStorageByName(query);
    
    const catRadio = document.querySelector(`.category-radio input[value="${detected.category}"]`);
    if (catRadio) {
      catRadio.checked = true;
      updateModalCategoryColor(detected.category);
    }
    const storageRadio = document.querySelector(`.storage-radio input[value="${detected.storage}"]`);
    if (storageRadio) {
      storageRadio.checked = true;
    }
  }

  // --- AUTOCOMPLETE / SUGGESTIONS ---
  function handleNameInput(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
      suggestionsBox.classList.add('hidden');
      currentDefaultDays = null;
      currentDefaultAmount = null;
      currentDefaultUnit = null;
      suggestedExpiryBadge.classList.add('hidden');
      return;
    }

    // Auto-detect category and storage method
    detectCategoryAndStorage(query);

    if (!window.DEFAULT_FOODS) return;

    const matches = window.DEFAULT_FOODS.filter(item => 
      item.name.toLowerCase().includes(query)
    ).slice(0, 5);

    if (matches.length === 0) {
      suggestionsBox.classList.add('hidden');
      currentDefaultDays = null;
      currentDefaultAmount = null;
      currentDefaultUnit = null;
      suggestedExpiryBadge.classList.add('hidden');
      return;
    }


    suggestionsBox.innerHTML = '';
    matches.forEach(item => {
      const row = document.createElement('div');
      row.className = 'suggestion-item';
      row.innerHTML = `
        <span>${item.name}</span>
        <span class="suggestion-days-hint">（目安: ${item.defaultDays}日 / ${item.defaultAmount}${item.defaultUnit}）</span>
      `;
      row.addEventListener('click', () => {
        selectSuggestion(item);
      });
      suggestionsBox.appendChild(row);
    });

    suggestionsBox.classList.remove('hidden');
  }

  function selectSuggestion(item) {
    inputFoodName.value = item.name;
    suggestionsBox.classList.add('hidden');
    
    currentDefaultDays = item.defaultDays;
    currentDefaultAmount = item.defaultAmount;
    currentDefaultUnit = item.defaultUnit;

    // Auto-select category
    const catRadio = document.querySelector(`.category-radio input[value="${item.category}"]`);
    if (catRadio) catRadio.checked = true;
    updateModalCategoryColor(item.category);

    // Auto-select storage
    const storageType = item.defaultStorage || 'fridge';
    const storageRadio = document.querySelector(`.storage-radio input[value="${storageType}"]`);
    if (storageRadio) storageRadio.checked = true;

    // Auto-fill amount & unit dropdown
    inputFoodInitialAmount.value = item.defaultAmount;
    selectFoodUnit.value = item.defaultUnit;

    // Prefill date or clear it based on defaultDays
    if (item.defaultDays === null) {
      inputFoodExpiry.value = '';
    } else {
      inputFoodExpiry.value = calculateExpiryDate(item.defaultDays, storageType);
    }

    // Trigger updates
    updateFormExpiryDate();
    updateAmountIncrementButtons();
  }

  // --- INCREMENT AMOUNT BUTTONS ---
  function updateAmountIncrementButtons() {
    amountIncrementButtons.innerHTML = '';
    const activeUnit = selectFoodUnit.value;
    
    let increments = [1, 2, 5, 10];
    let decrement = 1;
    if (activeUnit === 'g') {
      increments = [50, 100, 200, 500];
      decrement = 50;
    } else if (activeUnit === 'ml' || activeUnit === 'L') {
      increments = [100, 200, 500, 1000];
      decrement = 100;
    }

    // Decrement button FIRST
    const decBtn = document.createElement('button');
    decBtn.setAttribute('type', 'button');
    decBtn.className = 'btn-subtle';
    decBtn.style.color = 'var(--alert-expired)';
    decBtn.textContent = `-${decrement}`;
    decBtn.addEventListener('click', () => {
      const currentAmount = parseFloat(inputFoodInitialAmount.value) || 0;
      const nextAmount = Math.max(0, currentAmount - decrement);
      inputFoodInitialAmount.value = nextAmount.toString();
    });
    amountIncrementButtons.appendChild(decBtn);

    // Increment buttons
    increments.forEach(val => {
      const btn = document.createElement('button');
      btn.setAttribute('type', 'button');
      btn.className = 'btn-subtle';
      btn.textContent = `+${val}`;
      btn.addEventListener('click', () => {
        const currentAmount = parseFloat(inputFoodInitialAmount.value) || 0;
        inputFoodInitialAmount.value = (currentAmount + val).toString();
      });
      amountIncrementButtons.appendChild(btn);
    });

    // Reset button LAST
    const resetBtn = document.createElement('button');
    resetBtn.setAttribute('type', 'button');
    resetBtn.className = 'btn-subtle';
    resetBtn.textContent = '消去';
    resetBtn.addEventListener('click', () => {
      inputFoodInitialAmount.value = '0';
    });
    amountIncrementButtons.appendChild(resetBtn);
  }


  // --- DYNAMIC MODAL CATEGORY ACCENT COLOR ---
  function updateModalCategoryColor(catValue) {
    const modalContent = document.querySelector('#add-modal .modal-content');
    if (modalContent) {
      modalContent.className = `modal-content modal-cat-${catValue}`;
    }
  }

  // --- AUTOCOMPLETE FOR SHOPPING LIST ADD ---
  function handleShoppingNameInput(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
      shoppingSuggestions.classList.add('hidden');
      return;
    }

    if (!window.DEFAULT_FOODS) return;

    const matches = window.DEFAULT_FOODS.filter(item => 
      item.name.toLowerCase().includes(query)
    ).slice(0, 5);

    if (matches.length === 0) {
      shoppingSuggestions.classList.add('hidden');
      return;
    }

    shoppingSuggestions.innerHTML = '';
    matches.forEach(item => {
      const row = document.createElement('div');
      row.className = 'suggestion-item';
      row.innerHTML = `
        <span>${item.name}</span>
        <span class="suggestion-days-hint">（${item.defaultAmount}${item.defaultUnit}）</span>
      `;
      row.addEventListener('click', () => {
        shoppingInput.value = item.name;
        shoppingSuggestions.classList.add('hidden');
      });
      shoppingSuggestions.appendChild(row);
    });

    shoppingSuggestions.classList.remove('hidden');
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Tab switching (4 tabs)
    const tabs = [
      { btn: tabFoods, sec: sectionFoods },
      { btn: tabSeasonings, sec: sectionSeasonings },
      { btn: tabShopping, sec: sectionShopping },
      { btn: tabHistory, sec: sectionHistory }
    ];

    tabs.forEach(t => {
      if (t.btn && t.sec) {
        t.btn.addEventListener('click', () => {
          tabs.forEach(o => {
            if (o.btn) o.btn.classList.remove('active');
            if (o.sec) o.sec.classList.remove('active');
          });
          t.btn.classList.add('active');
          t.sec.classList.add('active');
          
          // Refresh recommendations chip when clicking Shopping tab
          if (t.btn === tabShopping) {
            renderShoppingRecommendations();
          }
        });
      }
    });

    // Time axis tabs click in History analytics card
    document.querySelectorAll('.btn-stats-time').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-stats-time').forEach(o => o.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeStatsRange = e.currentTarget.getAttribute('data-range');
        renderHistoryStats();
      });
    });

    // Modals open/close
    if (btnOpenAddModal) {
      btnOpenAddModal.addEventListener('click', () => {
        shoppingItemBeingRegistered = null; // not registering from shopping list
        editingFoodId = null; // reset editing state

        const modalHeaderTitle = document.querySelector('#add-modal .modal-header h2');
        if (modalHeaderTitle) modalHeaderTitle.textContent = 'アイテムを追加';
        const submitBtn = document.querySelector('#add-food-form button[type="submit"]');
        if (submitBtn) submitBtn.textContent = '追加する';
        
        populateUnitsSelect(); // Sort units select box on open
        
        if (inputFoodExpiry) inputFoodExpiry.value = ''; // clear default expiry date so it starts empty/optional
        if (inputFoodPurchaseDate) inputFoodPurchaseDate.value = getTodayDateString(); // default to today
        if (inputFoodName) inputFoodName.value = '';
        if (inputFoodInitialAmount) inputFoodInitialAmount.value = '1';
        if (selectFoodUnit) selectFoodUnit.value = '個';
        
        if (suggestionsBox) suggestionsBox.classList.add('hidden');
        if (suggestedExpiryBadge) suggestedExpiryBadge.classList.add('hidden');
        currentDefaultDays = null;
        currentDefaultAmount = null;
        currentDefaultUnit = null;
        
        const defaultRadio = document.querySelector('.category-radio input[value="vegetable"]');
        if (defaultRadio) defaultRadio.checked = true;
        updateModalCategoryColor('vegetable');

        const defaultStorage = document.querySelector('.storage-radio input[value="fridge"]');
        if (defaultStorage) defaultStorage.checked = true;

        updateAmountIncrementButtons();
        if (addModal) addModal.classList.add('active');
        if (inputFoodName) inputFoodName.focus();
      });
    }

    if (btnCloseAddModal) {
      btnCloseAddModal.addEventListener('click', () => {
        if (addModal) addModal.classList.remove('active');
      });
    }

    if (btnSettingsToggle) {
      btnSettingsToggle.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.add('active');
      });
    }

    if (btnCloseSettingsModal) {
      btnCloseSettingsModal.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.remove('active');
      });
    }

    // Help Modal events
    if (btnOpenHelp) {
      btnOpenHelp.addEventListener('click', () => {
        if (helpModal) helpModal.classList.add('active');
      });
    }
    if (btnCloseHelpModal) {
      btnCloseHelpModal.addEventListener('click', () => {
        if (helpModal) helpModal.classList.remove('active');
      });
    }

    // Confirmation Action Modal Close
    if (btnCloseConfirmModal) btnCloseConfirmModal.addEventListener('click', closeConfirmModal);
    if (btnActionCancel) btnActionCancel.addEventListener('click', closeConfirmModal);

    // Confirmation Action Modal choices
    if (btnActionConsume) {
      btnActionConsume.addEventListener('click', () => handleFoodAction('consume'));
    }
    if (btnActionDiscard) {
      btnActionDiscard.addEventListener('click', () => handleFoodAction('discard'));
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        if (addModal) addModal.classList.remove('active');
        if (settingsModal) settingsModal.classList.remove('active');
        if (helpModal) helpModal.classList.remove('active');
        closeConfirmModal();
      });
    });


    // Search, Filters and sorting of Foods List
    if (searchInput) searchInput.addEventListener('input', renderFoods);
    if (filterCategory) filterCategory.addEventListener('change', renderFoods);
    if (filterStorage) filterStorage.addEventListener('change', renderFoods);
    if (filterSort) filterSort.addEventListener('change', renderFoods); // Sort listener

    // Seasoning Sort listener
    if (seasoningSortSelect) {
      seasoningSortSelect.addEventListener('change', renderSeasonings);
    }

    // Form Autocomplete
    if (inputFoodName) inputFoodName.addEventListener('input', handleNameInput);

    // Form unit change updates additive buttons
    if (selectFoodUnit) selectFoodUnit.addEventListener('change', updateAmountIncrementButtons);

    // Storage radio updates suggested expiry
    document.querySelectorAll('input[name="food-storage"]').forEach(radio => {
      radio.addEventListener('change', () => {
        updateFormExpiryDate();
      });
    });

    // Dynamic category border color listener
    document.querySelectorAll('input[name="food-category"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateModalCategoryColor(e.target.value);
      });
    });

    // Apply suggested date button
    if (btnApplySuggestedExpiry) {
      btnApplySuggestedExpiry.addEventListener('click', () => {
        const storageRadioChecked = document.querySelector('input[name="food-storage"]:checked');
        const storageType = storageRadioChecked ? storageRadioChecked.value : 'fridge';
        if (currentDefaultDays !== null && inputFoodExpiry) {
          inputFoodExpiry.value = calculateExpiryDate(currentDefaultDays, storageType);
        }
      });
    }

    // Purchase Date Helpers
    const btnPurchasePrev = document.getElementById('btn-purchase-prev');
    const btnPurchaseNext = document.getElementById('btn-purchase-next');
    if (btnPurchasePrev) {
      btnPurchasePrev.addEventListener('click', () => {
        if (inputFoodPurchaseDate) {
          const currentVal = inputFoodPurchaseDate.value || getTodayDateString();
          const d = new Date(currentVal);
          d.setDate(d.getDate() - 1);
          inputFoodPurchaseDate.value = formatDateString(d);
          updateFormExpiryDate();
        }
      });
    }
    if (btnPurchaseNext) {
      btnPurchaseNext.addEventListener('click', () => {
        if (inputFoodPurchaseDate) {
          const currentVal = inputFoodPurchaseDate.value || getTodayDateString();
          const d = new Date(currentVal);
          d.setDate(d.getDate() + 1);
          inputFoodPurchaseDate.value = formatDateString(d);
          updateFormExpiryDate();
        }
      });
    }

    // Hide autocomplete on click outside
    document.addEventListener('click', (e) => {
      if (inputFoodName && suggestionsBox && !inputFoodName.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
      }
      if (shoppingInput && shoppingSuggestions && !shoppingInput.contains(e.target) && !shoppingSuggestions.contains(e.target)) {
        shoppingSuggestions.classList.add('hidden');
      }
    });

    // Expiry Quick Helper Buttons (Additive)
    document.querySelectorAll('.quick-expiry-buttons button[data-days]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const days = parseInt(e.currentTarget.getAttribute('data-days'));
        let baseDate;
        
        if (inputFoodExpiry && inputFoodExpiry.value) {
          baseDate = new Date(inputFoodExpiry.value);
        } else if (inputFoodPurchaseDate && inputFoodPurchaseDate.value) {
          baseDate = new Date(inputFoodPurchaseDate.value);
        } else {
          baseDate = new Date();
        }
        
        if (isNaN(baseDate.getTime())) {
          baseDate = new Date();
        }
        
        baseDate.setDate(baseDate.getDate() + days);
        
        const yyyy = baseDate.getFullYear();
        const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
        const dd = String(baseDate.getDate()).padStart(2, '0');
        
        if (inputFoodExpiry) {
          inputFoodExpiry.value = `${yyyy}-${mm}-${dd}`;
        }
      });
    });

    const btnClearExpiry = document.getElementById('btn-clear-expiry');
    if (btnClearExpiry) {
      btnClearExpiry.addEventListener('click', () => {
        if (inputFoodExpiry) inputFoodExpiry.value = '';
      });
    }


    // Add Food Form Submission
    if (addFoodForm) {
      addFoodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = inputFoodName ? inputFoodName.value.trim() : '';
        const expiry = inputFoodExpiry ? inputFoodExpiry.value : '';
        const purchaseDate = (inputFoodPurchaseDate && inputFoodPurchaseDate.value) || getTodayDateString();
        
        const categoryRadioChecked = document.querySelector('input[name="food-category"]:checked');
        const category = categoryRadioChecked ? categoryRadioChecked.value : 'vegetable';
        
        const storageRadioChecked = document.querySelector('input[name="food-storage"]:checked');
        const storageType = storageRadioChecked ? storageRadioChecked.value : 'fridge';
        
        const initialAmount = (inputFoodInitialAmount && parseFloat(inputFoodInitialAmount.value)) || 1;
        const unit = selectFoodUnit ? selectFoodUnit.value : '個';
        
        if (!name) return;
  
        if (editingFoodId !== null) {
          const foodIndex = state.foods.findIndex(f => f.id === editingFoodId);
          if (foodIndex > -1) {
            state.foods[foodIndex].name = name;
            state.foods[foodIndex].category = category;
            state.foods[foodIndex].storageType = storageType;
            state.foods[foodIndex].initialAmount = initialAmount;
            state.foods[foodIndex].unit = unit;
            state.foods[foodIndex].expiryDate = expiry || null;
            state.foods[foodIndex].dateAdded = purchaseDate;
          }
          saveFoods();
          renderFoods();
          editingFoodId = null;
          showToast(`「${name}」を更新しました！`);
        } else {
          const newFood = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name: name,
            category: category,
            storageType: storageType,
            quantity: 100,
            initialAmount: initialAmount,
            unit: unit,
            expiryDate: expiry || null,
            dateAdded: purchaseDate
          };
    
          state.foods.push(newFood);
          saveFoods();
          renderFoods();
          showToast(`「${name}」を追加しました！`);
        }
        
        // Save unit frequency in localStorage
        let frequencies = {};
        try {
          frequencies = JSON.parse(localStorage.getItem('fm_unit_frequencies') || '{}');
        } catch (err) {}
        frequencies[unit] = (frequencies[unit] || 0) + 1;
        localStorage.setItem('fm_unit_frequencies', JSON.stringify(frequencies));
        
        // If this registration came from checking out a shopping list item, remove that shopping list item
        if (shoppingItemBeingRegistered) {
          const idx = state.shopping.findIndex(item => item.id === shoppingItemBeingRegistered);
          if (idx > -1) {
            state.shopping.splice(idx, 1);
            saveShopping();
            renderShoppingList();
          }
          shoppingItemBeingRegistered = null;
        }
  
        if (addModal) addModal.classList.remove('active');
      });
    }

    // Add Shopping Item Form Submission
    if (addShoppingForm) {
      addShoppingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = shoppingInput ? shoppingInput.value.trim() : '';
        if (!name) return;
  
        const detected = getCategoryAndStorageByName(name);
  
        const newItem = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          name: name,
          category: detected.category,
          initialAmount: detected.amount,
          unit: detected.unit,
          storageType: detected.storage
        };
  
        state.shopping.push(newItem);
        saveShopping();
        renderShoppingList();
        
        if (shoppingInput) shoppingInput.value = '';
        if (shoppingSuggestions) shoppingSuggestions.classList.add('hidden');
        showToast(`「${name}」を追加しました`);
      });
    }

    // Auto-complete in Shopping list input
    if (shoppingInput) {
      shoppingInput.addEventListener('input', handleShoppingNameInput);
    }

    // Clear History Button handler
    if (btnClearHistory) {
      btnClearHistory.addEventListener('click', () => {
        if (confirm('履歴ログをすべて消去しますか？')) {
          state.history = [];
          saveHistory();
          renderHistory();
          showToast('履歴をすべて消去しました', 'info');
        }
      });
    }

    // Settings quantity decrement step dropdown change
    if (settingQtyStep) {
      settingQtyStep.addEventListener('change', (e) => {
        saveQtyStep(e.target.value);
        showToast('減少ステップを変更しました');
      });
    }

    // Theme selector
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const themeVal = e.currentTarget.getAttribute('data-theme-val');
        applyTheme(themeVal);
        showToast('テーマを変更しました');
      });
    });

    // JSON Export
    if (btnExportJson) btnExportJson.addEventListener('click', exportBackupJSON);

    // CSV Export
    if (btnExportCsv) btnExportCsv.addEventListener('click', exportCSV);

    // JSON Import trigger
    if (importJsonFile) importJsonFile.addEventListener('change', importBackupJSON);

    // Reset Data
    if (btnResetData) {
      btnResetData.addEventListener('click', () => {
        if (confirm('本当にすべてのデータを初期化しますか？食材・調味料・買い物リスト・履歴のすべてが消去されます。')) {
          state.foods = [];
          state.seasonings = window.DEFAULT_SEASONINGS ? window.DEFAULT_SEASONINGS.map(s => ({ ...s, stock: 0 })) : [];
          state.shopping = [];
          state.history = [];
          state.theme = 'organic';
          state.qtyStep = 25;
          
          saveFoods();
          saveSeasonings();
          saveShopping();
          saveHistory();
          applyTheme(state.theme);
          saveQtyStep(25);
          if (settingQtyStep) settingQtyStep.value = '25';
          if (seasoningSortSelect) seasoningSortSelect.value = 'default';
          if (filterCategory) filterCategory.value = 'all';
          if (filterStorage) filterStorage.value = 'all';
          if (filterSort) filterSort.value = 'expiry-asc';
          
          renderFoods();
          renderSeasonings();
          renderShoppingList();
          renderHistory();
          
          if (settingsModal) settingsModal.classList.remove('active');
          showToast('データをすべて初期化しました', 'error');
        }
      });
    }
  }

  // --- BACKUP & RESTORE / EXPORTS ---
  
  function exportBackupJSON() {
    const backupData = {
      foods: state.foods,
      seasonings: state.seasonings,
      shopping: state.shopping,
      history: state.history,
      theme: state.theme,
      qtyStep: state.qtyStep,
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "food_manager_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    showToast('JSONバックアップを作成しました');
  }

  function importBackupJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (!importedData.foods || !importedData.seasonings) {
          throw new Error('必要なデータ項目が含まれていません');
        }

        // Backfill missing fields for backwards compatibility
        importedData.foods.forEach(f => {
          if (f.storageType === undefined) f.storageType = 'fridge';
          if (f.quantity === undefined) f.quantity = 100;
          if (f.initialAmount === undefined) f.initialAmount = 1;
          if (f.unit === undefined) f.unit = '個';
          if (f.dateAdded === undefined) f.dateAdded = getTodayDateString();
        });

        importedData.seasonings.forEach(s => {
          if (s.clicks === undefined) s.clicks = 0;
          if (s.color === undefined && window.DEFAULT_SEASONINGS) {
            const match = window.DEFAULT_SEASONINGS.find(d => d.id === s.id);
            s.color = match ? match.color : '#a8a29e';
          }
          if (s.stock === undefined) s.stock = 0;
        });

        // Apply imported lists
        state.foods = importedData.foods;
        state.seasonings = importedData.seasonings;
        state.shopping = importedData.shopping || [];
        state.history = importedData.history || [];

        if (importedData.theme) {
          let importedTheme = importedData.theme;
          if (['cyberpunk', 'minimal', 'nordic', 'retro'].includes(importedTheme)) {
            importedTheme = 'organic';
          }
          state.theme = importedTheme;
          applyTheme(state.theme);
        }

        if (importedData.qtyStep) {
          state.qtyStep = parseInt(importedData.qtyStep);
          saveQtyStep(state.qtyStep);
          if (settingQtyStep) settingQtyStep.value = state.qtyStep.toString();
        }

        saveFoods();
        saveSeasonings();
        saveShopping();
        saveHistory();
        
        renderFoods();
        renderSeasonings();
        renderShoppingList();
        renderHistory();
        
        settingsModal.classList.remove('active');
        showToast('データをバックアップから復元しました！', 'success');
      } catch (err) {
        showToast('ファイルの復元に失敗しました。正しいJSONファイルを選択してください。', 'error');
        console.error(err);
      }
    };
    reader.readAsText(file);
    
    e.target.value = '';
  }

  function exportCSV() {
    if (state.foods.length === 0) {
      showToast('登録されている食材がありません', 'error');
      return;
    }

    let csvContent = "\ufeff"; // BOM
    csvContent += "食材名,カテゴリ,保存方法,初期量,残量(%),現在量,単位,購入日,賞味期限,残り日数,状態\n";

    state.foods.forEach(food => {
      const remainingDays = getRemainingDays(food.expiryDate);
      
      let statusText = '安全';
      let remText = remainingDays !== null ? `あと ${remainingDays}日` : 'なし';
      
      if (remainingDays === null) {
        statusText = '設定なし';
      } else if (remainingDays < 0) {
        statusText = '期限切れ';
        remText = `期限切れ ${Math.abs(remainingDays)}日`;
      } else if (remainingDays <= 3) {
        statusText = '期限間近';
      }

      const catName = getCategoryName(food.category);
      let storageName = '冷蔵';
      if (food.storageType === 'freezer') storageName = '冷凍';
      else if (food.storageType === 'room') storageName = '常温';
      
      const currentQty = Math.round(food.initialAmount * (food.quantity / 100) * 10) / 10;
      const expiryText = food.expiryDate || 'なし';
      
      csvContent += `"${escapeCSVField(food.name)}","${catName}","${storageName}","${food.initialAmount}","${food.quantity}%","${currentQty}","${food.unit}","${food.dateAdded}","${expiryText}","${remText}","${statusText}"\n`;
    });

    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", "food_inventory.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    showToast('CSVファイルを書き出しました');
  }

  // --- UTILS ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeCSVField(str) {
    if (!str) return '';
    return str.replace(/"/g, '""');
  }

  // Run app init
  init();
});
