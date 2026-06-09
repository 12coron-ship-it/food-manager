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
    qtyStep: 25,
    language: 'ja'
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

  // Track seasoning item being edited
  let editingSeasoningId = null;

  // Track shopping list item being edited
  let editingShoppingId = null;

  // IME input flags
  let isComposingFoodName = false;
  let isComposingShoppingName = false;

  // User manual overrides
  let userManuallySetFoodCategory = false;
  let userManuallySetFoodStorage = false;
  let userManuallySetShoppingCategory = false;
  let userManuallySetShoppingUnit = false;
  let userManuallySetShoppingQuantity = false;

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
  const shoppingQuantityInput = document.getElementById('shopping-quantity-input');
  const shoppingUnitSelect = document.getElementById('shopping-unit-select');
  const shoppingCategorySelect = document.getElementById('shopping-category-select');

  // Edit Shopping Modal UI elements
  const editShoppingModal = document.getElementById('edit-shopping-modal');
  const btnCloseEditShoppingModal = document.getElementById('btn-close-edit-shopping-modal');
  const editShoppingForm = document.getElementById('edit-shopping-form');
  const editShoppingName = document.getElementById('edit-shopping-name');
  const editShoppingQty = document.getElementById('edit-shopping-qty');
  const editShoppingUnit = document.getElementById('edit-shopping-unit');
  const editShoppingCategory = document.getElementById('edit-shopping-category');
  
  // History UI elements
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Settings controls
  const settingQtyStep = document.getElementById('setting-qty-step');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const importJsonFile = document.getElementById('import-json-file');
  const btnResetData = document.getElementById('btn-reset-data');
  const seasoningSortSelect = document.getElementById('seasoning-sort-select');

  // Seasoning Add Form
  const addSeasoningForm = document.getElementById('add-seasoning-form');
  const seasoningNameInput = document.getElementById('seasoning-name-input');
  const seasoningColorInput = document.getElementById('seasoning-color-input');

  // Seasoning Edit Modal UI elements
  const editSeasoningModal = document.getElementById('edit-seasoning-modal');
  const btnCloseEditSeasoningModal = document.getElementById('btn-close-edit-seasoning-modal');
  const editSeasoningForm = document.getElementById('edit-seasoning-form');
  const editSeasoningName = document.getElementById('edit-seasoning-name');
  const editSeasoningColor = document.getElementById('edit-seasoning-color');
  const editSeasoningLevel = document.getElementById('edit-seasoning-level');
  const editSeasoningRecommend = document.getElementById('edit-seasoning-recommend');
  const btnDeleteSeasoning = document.getElementById('btn-delete-seasoning');

  // Help Modal UI elements
  const helpModal = document.getElementById('help-modal');
  const btnOpenHelp = document.getElementById('btn-open-help');
  const btnCloseHelpModal = document.getElementById('btn-close-help-modal');
  const settingLanguage = document.getElementById('setting-language');


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

  // --- LOCALIZATION / TRANSLATIONS ---
  function getSeasoningDisplayName(seasoning, lang) {
    if (lang === 'en') {
      const enNames = {
        sugar: 'Sugar', salt: 'Salt', vinegar: 'Vinegar', soy_sauce: 'Soy Sauce', miso: 'Miso',
        mirin: 'Mirin', sake: 'Cooking Sake', oil: 'Cooking Oil', olive_oil: 'Olive Oil', mentsuyu: 'Mentsuyu',
        mayo: 'Mayonnaise', ketchup: 'Ketchup', wasabi: 'Wasabi', karashi: 'Mustard', garlic: 'Garlic Tube', ginger: 'Ginger Tube'
      };
      const defaults = window.DEFAULT_SEASONINGS ? window.DEFAULT_SEASONINGS.find(d => d.id === seasoning.id) : null;
      if (defaults && seasoning.name === defaults.name) {
        return enNames[seasoning.id] || seasoning.name;
      }
    }
    return seasoning.name;
  }

  function updateLocalizedSelects() {
    const lang = state.language || 'ja';
    
    if (filterCategory) {
      const currentVal = filterCategory.value;
      const categories = [
        { val: 'all', ja: 'すべての種類', en: 'All Categories' },
        { val: 'vegetable', ja: '野菜・果物', en: 'Vegetables & Fruits' },
        { val: 'meat', ja: 'お肉・お魚', en: 'Meat & Fish' },
        { val: 'dairy', ja: '卵・乳製品', en: 'Dairy & Eggs' },
        { val: 'staple', ja: '主食・麺類', en: 'Staples & Noodles' },
        { val: 'processed', ja: '加工・冷凍', en: 'Processed & Frozen' },
        { val: 'retort', ja: '常温・缶詰', en: 'Pantry & Canned' },
        { val: 'drink', ja: '飲料・お酒', en: 'Beverages & Alcohol' },
        { val: 'paper', ja: '生活消耗品', en: 'Household Supplies' },
        { val: 'cleaning', ja: '洗剤・お掃除', en: 'Detergents & Cleaning' },
        { val: 'bath', ja: 'ヘア・ボディ', en: 'Hair & Body Care' },
        { val: 'medicine', ja: '衛生・健康', en: 'Hygiene & Health' },
        { val: 'other', ja: 'その他・雑貨', en: 'Others & Misc' }
      ];
      filterCategory.innerHTML = categories.map(c => `<option value="${c.val}">${lang === 'ja' ? c.ja : c.en}</option>`).join('');
      filterCategory.value = currentVal || 'all';
    }
    
    if (filterStorage) {
      const currentVal = filterStorage.value;
      const storages = [
        { val: 'all', ja: 'すべての保存', en: 'All Storage' },
        { val: 'fridge', ja: '冷蔵のみ', en: 'Fridge Only' },
        { val: 'freezer', ja: '冷凍のみ', en: 'Freezer Only' },
        { val: 'room', ja: '常温のみ', en: 'Room Temp Only' }
      ];
      filterStorage.innerHTML = storages.map(s => `<option value="${s.val}">${lang === 'ja' ? s.ja : s.en}</option>`).join('');
      filterStorage.value = currentVal || 'all';
    }
    
    if (filterSort) {
      const currentVal = filterSort.value;
      const sorts = [
        { val: 'expiry-asc', ja: '期限が近い順', en: 'Expiry (Soonest)' },
        { val: 'expiry-desc', ja: '期限が遠い順', en: 'Expiry (Furthest)' },
        { val: 'qty-desc', ja: '残量が多い順', en: 'Qty (Highest)' },
        { val: 'qty-asc', ja: '残量が少ない順', en: 'Qty (Lowest)' },
        { val: 'added-desc', ja: '購入日が新しい順', en: 'Purchase Date (Newest)' }
      ];
      filterSort.innerHTML = sorts.map(s => `<option value="${s.val}">${lang === 'ja' ? s.ja : s.en}</option>`).join('');
      filterSort.value = currentVal || 'expiry-asc';
    }
    
    if (seasoningSortSelect) {
      const currentVal = seasoningSortSelect.value;
      const seasoningSorts = [
        { val: 'default', ja: '標準（登録順）', en: 'Default (Added Order)' },
        { val: 'frequency', ja: '使用頻度順（タップ数）', en: 'Frequency (Taps)' },
        { val: 'low-level', ja: '残量が少ない順', en: 'Level (Lowest)' }
      ];
      seasoningSortSelect.innerHTML = seasoningSorts.map(s => `<option value="${s.val}">${lang === 'ja' ? s.ja : s.en}</option>`).join('');
      seasoningSortSelect.value = currentVal || 'default';
    }
    
    const shoppingCategories = [
      { val: 'vegetable', ja: '野菜・果物', en: 'Vegetables/Fruits' },
      { val: 'meat', ja: 'お肉・お魚', en: 'Meat/Fish' },
      { val: 'dairy', ja: '卵・乳製品', en: 'Dairy/Eggs' },
      { val: 'staple', ja: '主食・麺類', en: 'Staples/Noodles' },
      { val: 'processed', ja: '加工・冷凍', en: 'Processed/Frozen' },
      { val: 'retort', ja: '常温・缶詰', en: 'Pantry/Canned' },
      { val: 'drink', ja: '飲料・お酒', en: 'Beverages/Alcohol' },
      { val: 'paper', ja: '生活消耗品', en: 'Household Supplies' },
      { val: 'cleaning', ja: '洗剤・お掃除', en: 'Detergents/Cleaning' },
      { val: 'bath', ja: 'ヘア・ボディ', en: 'Hair/Body Care' },
      { val: 'medicine', ja: '衛生・健康', en: 'Hygiene/Health' },
      { val: 'other', ja: 'その他・雑貨', en: 'Others/Misc' }
    ];
    if (shoppingCategorySelect) {
      const currentVal = shoppingCategorySelect.value;
      shoppingCategorySelect.innerHTML = shoppingCategories.map(c => `<option value="${c.val}">${lang === 'ja' ? c.ja : c.en}</option>`).join('');
      shoppingCategorySelect.value = currentVal || 'other';
      updateShoppingCategorySelectColor();
    }
    if (editShoppingCategory) {
      const currentVal = editShoppingCategory.value;
      editShoppingCategory.innerHTML = shoppingCategories.map(c => `<option value="${c.val}">${lang === 'ja' ? c.ja : c.en}</option>`).join('');
      editShoppingCategory.value = currentVal || 'other';
      updateEditShoppingCategorySelectColor();
    }
    
    if (editSeasoningLevel) {
      const currentVal = editSeasoningLevel.value;
      const levels = [
        { val: 'full', ja: '100% (いっぱい)', en: '100% (Full)' },
        { val: 'high', ja: '80%', en: '80%' },
        { val: 'medium', ja: '60%', en: '60%' },
        { val: 'low', ja: '40%', en: '40%' },
        { val: 'very-low', ja: '20%', en: '20%' },
        { val: 'empty', ja: '0% (空)', en: '0% (Empty)' }
      ];
      editSeasoningLevel.innerHTML = levels.map(l => `<option value="${l.val}">${lang === 'ja' ? l.ja : l.en}</option>`).join('');
      editSeasoningLevel.value = currentVal || 'full';
    }
    
    if (settingQtyStep) {
      const currentVal = settingQtyStep.value;
      const steps = [
        { val: '10', ja: '10% ずつ減少 (100➔90➔80...➔0%)', en: 'Decrease by 10% (100➔90➔80...➔0%)' },
        { val: '20', ja: '20% ずつ減少 (100➔80➔60➔40➔20➔0%)', en: 'Decrease by 20% (100➔80➔60➔40➔20➔0%)' },
        { val: '25', ja: '25% ずつ減少 (100➔75➔50➔25➔0%)', en: 'Decrease by 25% (100➔75➔50➔25➔0%)' },
        { val: '50', ja: '50% ずつ減少 (100➔50➔0%)', en: 'Decrease by 50% (100➔50➔0%)' }
      ];
      settingQtyStep.innerHTML = steps.map(s => `<option value="${s.val}">${lang === 'ja' ? s.ja : s.en}</option>`).join('');
      settingQtyStep.value = currentVal || '25';
    }

    updateUnitSelects();
  }

  function updateUnitSelects() {
    const lang = state.language || 'ja';
    const units = [
      { val: '個', ja: '個 (pcs)', en: 'pcs' },
      { val: 'パック', ja: 'パック (pack)', en: 'pack' },
      { val: '袋', ja: '袋 (bag)', en: 'bag' },
      { val: '本', ja: '本 (bottle/pc)', en: 'bottle/pc' },
      { val: 'g', ja: 'g (グラム)', en: 'g' },
      { val: 'ml', ja: 'ml (ミリリットル)', en: 'ml' },
      { val: '枚', ja: '枚 (sheets)', en: 'sheet' },
      { val: '缶', ja: '缶 (can)', en: 'can' },
      { val: 'L', ja: 'L (リットル)', en: 'L' },
      { val: 'kg', ja: 'kg (キログラム)', en: 'kg' }
    ];

    const dropdowns = [shoppingUnitSelect, editShoppingUnit];
    dropdowns.forEach(sel => {
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = units.map(u => `<option value="${u.val}">${lang === 'ja' ? u.ja : u.en}</option>`).join('');
      sel.value = currentVal || '個';
    });
  }

  function updatePlaceholders() {
    const lang = state.language || 'ja';
    const placeholders = {
      ja: {
        search: 'ストックを検索...',
        seasoningName: '調味料名を入力...',
        shoppingInput: '買うものを入力...',
        foodName: 'キャベツ、洗濯洗剤 など...',
        editSeasoningName: 'マヨネーズ など...',
        editShoppingName: '買うものを入力...'
      },
      en: {
        search: 'Search stock...',
        seasoningName: 'Enter seasoning name...',
        shoppingInput: 'Enter item to buy...',
        foodName: 'e.g. Cabbage, Laundry soap...',
        editSeasoningName: 'e.g. Mayonnaise...',
        editShoppingName: 'Enter item to buy...'
      }
    };
    
    const p = placeholders[lang];
    if (searchInput) searchInput.placeholder = p.search;
    if (seasoningNameInput) seasoningNameInput.placeholder = p.seasoningName;
    if (shoppingInput) shoppingInput.placeholder = p.shoppingInput;
    if (inputFoodName) inputFoodName.placeholder = p.foodName;
    if (editSeasoningName) editSeasoningName.placeholder = p.editSeasoningName;
    if (editShoppingName) editShoppingName.placeholder = p.editShoppingName;
  }

  function setLanguage(lang) {
    state.language = lang;
    localStorage.setItem('fm_language', lang);
    
    // Toggle body data attribute
    body.setAttribute('data-lang', lang);
    
    // Update select dropdown options
    updateLocalizedSelects();
    
    // Update placeholders
    updatePlaceholders();
    
    // Re-render all elements to apply language changes
    renderFoods();
    renderSeasonings();
    renderShoppingList();
    renderHistory();
    
    showToast(lang === 'ja' ? '言語を切り替えました' : 'Language changed');
  }

  // --- INITIALIZATION ---
  function init() {
    // 0. Load language
    state.language = localStorage.getItem('fm_language') || 'ja';
    body.setAttribute('data-lang', state.language);
    if (settingLanguage) {
      settingLanguage.value = state.language;
    }
    updateLocalizedSelects();
    updatePlaceholders();

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

      // Auto-populate if empty
      if (state.seasonings.length === 0) {
        state.seasonings = window.DEFAULT_SEASONINGS ? window.DEFAULT_SEASONINGS.map(s => ({ ...s, stock: 0 })) : [];
        seasoningsMigrated = true;
      }

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
        if (s.recommendIgnored) {
          s.recommendIgnored = false; // reset recommendation ignore flag on reload
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
    updateShoppingCategorySelectColor();
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
    
    const lang = state.language || 'ja';
    selectFoodUnit.innerHTML = '';
    sortedUnits.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u;
      if (lang === 'ja') {
        opt.textContent = u === 'g' ? 'g (グラム)' : u === 'ml' ? 'ml (ミリリットル)' : u === 'L' ? 'L (リットル)' : u;
      } else {
        opt.textContent = u === 'g' ? 'g (grams)' : u === 'ml' ? 'ml (milliliters)' : u === 'L' ? 'L (liters)' : u;
      }
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
      
      if (state.language === 'ja') {
        if (discardRateVal <= 10) {
          statsComment.textContent = 'エコ度: 超エコ！すばらしい状態です！ 🌟';
        } else if (discardRateVal <= 30) {
          statsComment.textContent = 'エコ度: 普通です。廃棄をさらに減らせます！ 👍';
        } else {
          statsComment.textContent = 'エコ度: 要注意！計画的な消費・利用を。 ⚠️';
        }
      } else {
        if (discardRateVal <= 10) {
          statsComment.textContent = 'Eco Level: Excellent! Extremely eco-friendly! 🌟';
        } else if (discardRateVal <= 30) {
          statsComment.textContent = 'Eco Level: Moderate. Try to reduce waste further! 👍';
        } else {
          statsComment.textContent = 'Eco Level: Warning! Plan your meals carefully. ⚠️';
        }
      }
    } else {
      statsBarConsume.style.width = '100%';
      statsBarDiscard.style.width = '0%';
      statsComment.textContent = state.language === 'ja' ? 'エコ度: 期間内の履歴ログがありません' : 'Eco Level: No history logs for this period';
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
            <span style="width: 45px; text-align: right; font-weight: 800; color: var(--text-secondary);">${count}${state.language === 'ja' ? '品' : ' items'} (${pct}%)</span>
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
    const lang = state.language || 'ja';
    const map = {
      ja: {
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
      },
      en: {
        vegetable: 'Vegetables/Fruits',
        meat: 'Meat & Fish',
        dairy: 'Dairy & Eggs',
        staple: 'Staples/Noodles',
        processed: 'Processed/Frozen',
        retort: 'Pantry & Canned',
        drink: 'Beverages/Alcohol',
        paper: 'Household Supplies',
        cleaning: 'Detergents/Cleaning',
        bath: 'Hair/Body Care',
        medicine: 'Hygiene & Health',
        other: 'Others & Misc'
      }
    };
    const langMap = map[lang] || map.ja;
    return langMap[catKey] || (lang === 'ja' ? 'その他・雑貨' : 'Others & Misc');
  }

  function getUnitDisplayName(unit, lang) {
    if (lang === 'ja') return unit;
    const map = {
      '個': 'pcs',
      'パック': 'pack',
      '袋': 'bag',
      '本': 'bottle/pc',
      '枚': 'sheet',
      '缶': 'can',
      '束': 'bunch',
      '食': 'serv',
      '切れ': 'slice',
      '房': 'bunch',
      '株': 'head',
      '尾': 'pc'
    };
    return map[unit] || unit;
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
      if (state.language === 'ja') {
        if (expiredCount > 0 && warningCount > 0) {
          alertMsg = `期限切れ ${expiredCount}件、もうすぐ期限切れ ${warningCount}件あります！`;
        } else if (expiredCount > 0) {
          alertMsg = `期限切れの食材が ${expiredCount}件あります！`;
        } else {
          alertMsg = `もうすぐ期限切れの食材が ${warningCount}件あります。`;
        }
      } else {
        if (expiredCount > 0 && warningCount > 0) {
          alertMsg = `${expiredCount} expired & ${warningCount} expiring soon!`;
        } else if (expiredCount > 0) {
          alertMsg = `${expiredCount} expired items found!`;
        } else {
          alertMsg = `${warningCount} items expiring soon.`;
        }
      }
      alertText.textContent = alertMsg;
    } else {
      alertSummary.classList.add('hidden');
    }

    if (filteredFoods.length === 0) {
      foodsGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package-open" style="width: 32px; height: 32px; opacity: 0.3; margin-bottom: 8px;"></i>
          <p>${state.language === 'ja' ? '食材が見つかりません' : 'No items found'}</p>
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
        badgeHtml = `<span class="days-badge none">${state.language === 'ja' ? '期限なし' : 'No expiry'}</span>`;
      } else if (food.remainingDays < 0) {
        const days = Math.abs(food.remainingDays);
        badgeHtml = `<span class="days-badge expired">${state.language === 'ja' ? `期限切れ ${days}日` : `Expired ${days}d`}</span>`;
      } else if (food.remainingDays === 0) {
        badgeHtml = `<span class="days-badge warning">${state.language === 'ja' ? '本日期限' : 'Expires Today'}</span>`;
      } else {
        const badgeType = food.remainingDays <= 3 ? 'warning' : 'safe';
        badgeHtml = `<span class="days-badge ${badgeType}">${state.language === 'ja' ? `あと ${food.remainingDays}日` : `${food.remainingDays}d left`}</span>`;
      }

      // Storage Badge
      let storageBadgeHtml = '';
      if (food.storageType === 'freezer') {
        storageBadgeHtml = `<span class="storage-badge freezer"><i data-lucide="snowflake"></i>${state.language === 'ja' ? '冷凍' : 'Freezer'}</span>`;
      } else if (food.storageType === 'room') {
        storageBadgeHtml = `<span class="storage-badge room"><i data-lucide="box"></i>${state.language === 'ja' ? '常温' : 'Pantry'}</span>`;
      } else {
        storageBadgeHtml = `<span class="storage-badge fridge"><i data-lucide="thermometer"></i>${state.language === 'ja' ? '冷蔵' : 'Fridge'}</span>`;
      }

      const currentQty = Math.round(food.initialAmount * (food.quantity / 100) * 10) / 10;
      const quantityText = `${currentQty}${getUnitDisplayName(food.unit, state.language)} (${food.quantity}%)`;
      const noExpiryLabel = state.language === 'ja' ? 'なし' : 'None';
      const expiryFormatted = food.expiryDate ? food.expiryDate.replace(/-/g, '/') : noExpiryLabel;

      card.innerHTML = `
        <div class="food-card-left">
          <div class="food-icon-wrapper">
            <i data-lucide="${getCategoryIcon(food.category)}"></i>
          </div>
          <div class="food-info">
            <span class="food-name-txt">${escapeHtml(food.name)}</span>
            <span class="food-dates-txt">
              ${storageBadgeHtml}
              <span>${state.language === 'ja' ? '期限' : 'Exp'}: ${expiryFormatted}</span>
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
    userManuallySetFoodCategory = true;
    userManuallySetFoodStorage = true;

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
    
    // Create history entry with all food metadata for restore capability
    const historyItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: confirmingFoodItem.name,
      category: confirmingFoodItem.category,
      action: actionType, // 'consume' or 'discard'
      amount: confirmingFoodItem.initialAmount,
      unit: confirmingFoodItem.unit,
      timestamp: new Date().toISOString(),
      storageType: confirmingFoodItem.storageType || 'fridge',
      quantity: confirmingFoodItem.quantity !== undefined ? confirmingFoodItem.quantity : 100,
      expiryDate: confirmingFoodItem.expiryDate || null,
      dateAdded: confirmingFoodItem.dateAdded || getTodayDateString()
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
        <div class="food-card-left" style="flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0;">
          <div class="food-icon-wrapper" style="background-color: var(--seasoning-color) !important; color: #ffffff !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <i data-lucide="flask-conical"></i>
          </div>
          <div class="food-info" style="display: flex; flex-direction: column; min-width: 0;">
            <span class="food-name-txt" style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(getSeasoningDisplayName(seasoning, state.language))}</span>
          </div>
        </div>
        <div class="food-card-right" style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <div class="seasoning-stock-control" style="margin-top: 0; margin-right: 2px; gap: 3px; display: flex; align-items: center;">
            <button class="btn-stock-dec" aria-label="スペア減">-</button>
            <span class="seasoning-stock-info" style="display: flex; align-items: center; gap: 1px; font-size: 0.6rem; font-weight: 800; color: var(--text-secondary);">
              <i data-lucide="package" class="stock-icon" style="width: 8px; height: 8px; color: var(--text-muted);"></i>
              <span class="stock-count">${seasoning.stock || 0}</span>
            </span>
            <button class="btn-stock-inc" aria-label="スペア増">+</button>
          </div>
          <button class="btn-quantity-toggle" data-qty-percent="${percent}" aria-label="残量を変更">
            ${percent}%
          </button>
        </div>
      `;
      
      const decBtn = card.querySelector('.btn-stock-dec');
      const incBtn = card.querySelector('.btn-stock-inc');
      const qtyBtn = card.querySelector('.btn-quantity-toggle');
      
      decBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adjustSeasoningStock(seasoning.id, -1);
      });
      
      incBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        adjustSeasoningStock(seasoning.id, 1);
      });

      qtyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleSeasoningLevel(seasoning.id);
      });
      
      card.addEventListener('click', () => {
        openEditSeasoningModal(seasoning.id);
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
      const nextLevel = levels[nextIndex];
      
      // If cycling from empty to full, consume 1 stock if available
      if (currentLevel === 'empty' && nextLevel === 'full') {
        const currentStock = state.seasonings[index].stock || 0;
        if (currentStock > 0) {
          state.seasonings[index].stock = currentStock - 1;
        }
      }
      
      state.seasonings[index].level = nextLevel;
      state.seasonings[index].clicks = (state.seasonings[index].clicks || 0) + 1;
      
      // Reset ignore recommendation since level changed
      state.seasonings[index].recommendIgnored = false;
      
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

  function openEditSeasoningModal(id) {
    const seasoning = state.seasonings.find(s => s.id === id);
    if (!seasoning) return;

    editingSeasoningId = id;
    editSeasoningName.value = seasoning.name;
    editSeasoningColor.value = seasoning.color || '#a8a29e';
    editSeasoningLevel.value = seasoning.level || 'full';

    if (editSeasoningModal) editSeasoningModal.classList.add('active');
    if (editSeasoningName) editSeasoningName.focus();
  }

  function closeEditSeasoningModal() {
    if (editSeasoningModal) editSeasoningModal.classList.remove('active');
    editingSeasoningId = null;
  }

  function ignoreSeasoningRecommendation(id) {
    const idx = state.seasonings.findIndex(s => s.id === id);
    if (idx > -1) {
      state.seasonings[idx].recommendIgnored = true;
      saveSeasonings();
      renderShoppingRecommendations();
      showToast(`「${state.seasonings[idx].name}」の買い物提案を非表示にしました`, 'info');
    }
  }

  // --- RENDERING SHOPPING LIST ---
  function renderShoppingList() {
    shoppingListContainer.innerHTML = '';
    
    if (state.shopping.length === 0) {
      shoppingListContainer.innerHTML = `
        <div class="empty-state" style="padding: 20px 0;">
          <i data-lucide="shopping-bag" style="width: 32px; height: 32px; opacity: 0.3; margin-bottom: 6px;"></i>
          <p>${state.language === 'ja' ? '買い物リストは空です' : 'Shopping list is empty'}</p>
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
            <span class="shopping-item-qty">${item.initialAmount}${getUnitDisplayName(item.unit, state.language)}</span>
          </div>
          <div class="shopping-item-right">
            <button class="btn-delete btn-delete-shopping" data-id="${item.id}" aria-label="リストから削除">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          openEditShoppingModal(item.id);
        });

        listContainer.appendChild(card);
      });

      shoppingListContainer.appendChild(groupContainer);
    });

    // Add bought-check click event (opens pre-filled registration modal)
    document.querySelectorAll('.btn-check-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        startBoughtRegistration(id);
      });
    });

    // Add delete click event
    document.querySelectorAll('.btn-delete-shopping').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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

  function openEditShoppingModal(id) {
    const item = state.shopping.find(i => i.id === id);
    if (!item) return;

    editingShoppingId = id;
    
    // Prefill fields
    editShoppingName.value = item.name;
    editShoppingQty.value = item.initialAmount;
    editShoppingUnit.value = item.unit;
    editShoppingCategory.value = item.category || 'other';
    updateEditShoppingCategorySelectColor();

    if (editShoppingModal) editShoppingModal.classList.add('active');
    if (editShoppingName) editShoppingName.focus();
  }

  function closeEditShoppingModal() {
    if (editShoppingModal) editShoppingModal.classList.remove('active');
    editingShoppingId = null;
  }

  function updateShoppingCategorySelectColor() {
    if (!shoppingCategorySelect) return;
    const val = shoppingCategorySelect.value;
    Array.from(shoppingCategorySelect.classList).forEach(cls => {
      if (cls.startsWith('cat-color-')) {
        shoppingCategorySelect.classList.remove(cls);
      }
    });
    shoppingCategorySelect.classList.add(`cat-color-${val}`);
  }

  function updateEditShoppingCategorySelectColor() {
    if (!editShoppingCategory) return;
    const val = editShoppingCategory.value;
    Array.from(editShoppingCategory.classList).forEach(cls => {
      if (cls.startsWith('cat-color-')) {
        editShoppingCategory.classList.remove(cls);
      }
    });
    editShoppingCategory.classList.add(`cat-color-${val}`);
  }

  // Pre-fills form fields when checking out a shopping list item
  function startBoughtRegistration(shoppingId) {
    const item = state.shopping.find(i => i.id === shoppingId);
    if (!item) return;

    shoppingItemBeingRegistered = shoppingId;
    userManuallySetFoodCategory = false;
    userManuallySetFoodStorage = false;

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
    
    // Find seasonings where level is low/empty, AND they aren't already in the shopping list, AND recommendation is not ignored
    const targets = state.seasonings.filter(s => {
      const isLowOrEmpty = s.level === 'empty' || s.level === 'very-low' || s.level === 'low';
      const alreadyInList = state.shopping.some(item => item.name === s.name);
      const isIgnored = s.recommendIgnored === true;
      return isLowOrEmpty && !alreadyInList && !isIgnored;
    });

    if (targets.length === 0) {
      shoppingRecommendations.classList.add('hidden');
      return;
    }

    targets.forEach(s => {
      const chip = document.createElement('div');
      chip.className = 'btn-chip';
      chip.style.setProperty('--seasoning-color', s.color || '#a8a29e');
      const displayName = getSeasoningDisplayName(s, state.language);
      chip.innerHTML = `
        <span class="chip-main-action" style="display: flex; align-items: center; gap: 3px; cursor: pointer;">
          <i data-lucide="plus"></i>
          <span>${state.language === 'ja' ? `${displayName} を買う` : `Buy ${displayName}`}</span>
        </span>
        <button type="button" class="btn-chip-ignore" data-id="${s.id}" title="非表示にする" aria-label="提案を非表示">
          <i data-lucide="x"></i>
        </button>
      `;
      
      const mainAction = chip.querySelector('.chip-main-action');
      mainAction.addEventListener('click', () => {
        addRecommendedToShopping(s);
      });
      
      const ignoreBtn = chip.querySelector('.btn-chip-ignore');
      ignoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ignoreSeasoningRecommendation(s.id);
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
          <p>${state.language === 'ja' ? '処理履歴がありません' : 'No history log found'}</p>
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
      let badgeText = '';
      if (state.language === 'ja') {
        badgeText = item.action === 'consume' ? '消費' : '廃棄';
      } else {
        badgeText = item.action === 'consume' ? 'Used' : 'Wasted';
      }
      
      const date = new Date(item.timestamp);
      const timeStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      card.innerHTML = `
        <div class="history-card-left">
          <div class="food-icon-wrapper" style="width:20px; height:20px;">
            <i data-lucide="${getCategoryIcon(item.category)}" style="width:10px; height:10px;"></i>
          </div>
          <div class="history-card-info">
            <span class="history-food-name">${escapeHtml(item.name)} <span style="font-size:0.65rem; font-weight:400; color:var(--text-secondary);">(${item.amount}${getUnitDisplayName(item.unit, state.language)})</span></span>
            <span class="history-time-txt">${timeStr}</span>
          </div>
        </div>
        <div class="history-card-right">
          <span class="history-badge ${badgeClass}">${badgeText}</span>
          <button class="btn-restore" data-id="${item.id}" title="${state.language === 'ja' ? 'ストックに戻す' : 'Restore to stock'}" aria-label="元に戻す">
            <i data-lucide="undo-2"></i>
            <span>${state.language === 'ja' ? '戻す' : 'Restore'}</span>
          </button>
        </div>
      `;
      
      historyListContainer.appendChild(card);
    });

    // Add event listeners for restore buttons
    historyListContainer.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        restoreHistoryItem(id);
      });
    });

    createIconsSafe();
  }

  function restoreHistoryItem(id) {
    const itemIndex = state.history.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const item = state.history[itemIndex];

    // Reconstruct the food item
    // If the quantity was 0% (e.g. they cycled it to 0 and confirmed consume/discard),
    // restore it with 100% (or the default qtyStep) so that it is actually visible and has quantity.
    let quantityToRestore = item.quantity;
    if (quantityToRestore === undefined || quantityToRestore === 0) {
      quantityToRestore = 100;
    }

    const restoredFood = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: item.name,
      category: item.category,
      storageType: item.storageType || getCategoryAndStorageByName(item.name).storage || 'fridge',
      quantity: quantityToRestore,
      initialAmount: item.amount,
      unit: item.unit,
      expiryDate: item.expiryDate || null,
      dateAdded: item.dateAdded || getTodayDateString()
    };

    // Remove from history
    state.history.splice(itemIndex, 1);
    saveHistory();

    // Add back to foods
    state.foods.push(restoredFood);
    saveFoods();

    // Re-render
    renderFoods();
    renderHistory();
    renderShoppingRecommendations(); // Recalculate shopping suggestions since food was added

    showToast(`「${item.name}」をストックに戻しました`);
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
    
    if (!userManuallySetFoodCategory) {
      const catRadio = document.querySelector(`.category-radio input[value="${detected.category}"]`);
      if (catRadio) {
        catRadio.checked = true;
        updateModalCategoryColor(detected.category);
      }
    }
    if (!userManuallySetFoodStorage) {
      const storageRadio = document.querySelector(`.storage-radio input[value="${detected.storage}"]`);
      if (storageRadio) {
        storageRadio.checked = true;
      }
    }
  }

  // --- AUTOCOMPLETE / SUGGESTIONS ---
  function handleNameInput(e) {
    if (isComposingFoodName) return;
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

  function detectShoppingCategoryAndUnit(query) {
    if (!query) return;
    const detected = getCategoryAndStorageByName(query);
    
    if (!userManuallySetShoppingCategory && shoppingCategorySelect) {
      shoppingCategorySelect.value = detected.category;
      updateShoppingCategorySelectColor();
    }
    if (!userManuallySetShoppingUnit && shoppingUnitSelect) {
      shoppingUnitSelect.value = detected.unit;
    }
  }

  // --- AUTOCOMPLETE FOR SHOPPING LIST ADD ---
  function handleShoppingNameInput(e) {
    if (isComposingShoppingName) return;
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
      shoppingSuggestions.classList.add('hidden');
      return;
    }

    // Auto-detect category and unit
    detectShoppingCategoryAndUnit(query);

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
        
        if (!userManuallySetShoppingCategory && shoppingCategorySelect) {
          shoppingCategorySelect.value = item.category;
          updateShoppingCategorySelectColor();
        }
        if (!userManuallySetShoppingUnit && shoppingUnitSelect) {
          shoppingUnitSelect.value = item.defaultUnit;
        }
        if (shoppingQuantityInput && !userManuallySetShoppingQuantity) {
          shoppingQuantityInput.value = item.defaultAmount;
        }
      });
      shoppingSuggestions.appendChild(row);
    });

    shoppingSuggestions.classList.remove('hidden');
  }

  // --- TAB TRANSITIONS ---
  function switchTab(index) {
    const tabs = [
      { btn: tabFoods, sec: sectionFoods },
      { btn: tabSeasonings, sec: sectionSeasonings },
      { btn: tabShopping, sec: sectionShopping },
      { btn: tabHistory, sec: sectionHistory }
    ];

    if (index < 0 || index >= tabs.length) return;

    tabs.forEach((o, i) => {
      if (o.btn) {
        if (i === index) o.btn.classList.add('active');
        else o.btn.classList.remove('active');
      }
      if (o.sec) {
        if (i === index) o.sec.classList.add('active');
        else o.sec.classList.remove('active');
      }
    });

    // Show FAB only on foods tab
    if (btnOpenAddModal) {
      if (index === 0) {
        btnOpenAddModal.classList.remove('hidden');
      } else {
        btnOpenAddModal.classList.add('hidden');
      }
    }

    // Refresh recommendations chip when clicking Shopping tab
    if (index === 2) {
      renderShoppingRecommendations();
    }
  }

  function getActiveTabIndex() {
    const tabs = [tabFoods, tabSeasonings, tabShopping, tabHistory];
    return tabs.findIndex(btn => btn && btn.classList.contains('active'));
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Tab switching (4 tabs)
    const tabButtons = [tabFoods, tabSeasonings, tabShopping, tabHistory];
    tabButtons.forEach((btn, i) => {
      if (btn) {
        btn.addEventListener('click', () => {
          switchTab(i);
        });
      }
    });

    // Swipe gesture detection to switch tabs
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    document.addEventListener('touchstart', (e) => {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) return;

      // Ignore swipes starting on interactive elements, scrollable chips, or stock controls
      if (e.target.closest('input, select, textarea, button, a, #recommendation-chips, .recommendation-chips, .seasoning-stock-control')) {
        touchStartX = 0;
        touchStartY = 0;
        return;
      }

      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) return;
      if (!touchStartX || !touchStartY) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const diffTime = touchEndTime - touchStartTime;

      // Reset coordinates
      touchStartX = 0;
      touchStartY = 0;

      // Horizontal movement >= 40px, within 500ms, and horizontal swipe ratio >= 1.2 * vertical
      if (diffTime < 500 && Math.abs(diffX) >= 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
        const currentIndex = getActiveTabIndex();
        if (currentIndex === -1) return;

        if (diffX < 0) {
          if (currentIndex < 3) {
            switchTab(currentIndex + 1);
          }
        } else {
          if (currentIndex > 0) {
            switchTab(currentIndex - 1);
          }
        }
      }
    }, { passive: true });

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
        userManuallySetFoodCategory = false;
        userManuallySetFoodStorage = false;

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

    // Add Seasoning Form
    if (addSeasoningForm) {
      addSeasoningForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = seasoningNameInput.value.trim();
        if (!name) return;

        // Check duplicate
        const duplicate = state.seasonings.find(s => s.name === name);
        if (duplicate) {
          showToast(`「${name}」は既に登録されています`, 'error');
          return;
        }

        const newSeasoning = {
          id: 'custom_' + Date.now().toString(36),
          name: name,
          category: 'custom',
          level: 'full',
          clicks: 0,
          color: seasoningColorInput.value || '#a8a29e',
          stock: 0
        };

        state.seasonings.push(newSeasoning);
        saveSeasonings();
        renderSeasonings();
        showToast(`「${name}」を追加しました`);

        seasoningNameInput.value = '';
        seasoningColorInput.value = '#a8a29e';
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
        if (editSeasoningModal) editSeasoningModal.classList.remove('active');
        closeEditShoppingModal();
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

    // Seasoning Edit Modal events
    if (btnCloseEditSeasoningModal) {
      btnCloseEditSeasoningModal.addEventListener('click', closeEditSeasoningModal);
    }

    if (editSeasoningForm) {
      editSeasoningForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!editingSeasoningId) return;

        const name = editSeasoningName.value.trim();
        const color = editSeasoningColor.value;
        const level = editSeasoningLevel.value;

        if (!name) return;

        // Check duplicate seasoning name (excluding itself)
        const duplicate = state.seasonings.find(s => s.name === name && s.id !== editingSeasoningId);
        if (duplicate) {
          showToast(`「${name}」は既に登録されています`, 'error');
          return;
        }

        const index = state.seasonings.findIndex(s => s.id === editingSeasoningId);
        if (index > -1) {
          const oldLevel = state.seasonings[index].level;
          
          // If changing from empty to full, consume 1 stock if available
          if (oldLevel === 'empty' && level === 'full') {
            const currentStock = state.seasonings[index].stock || 0;
            if (currentStock > 0) {
              state.seasonings[index].stock = currentStock - 1;
            }
          }
          
          state.seasonings[index].name = name;
          state.seasonings[index].color = color;
          state.seasonings[index].level = level;
          
          // Reset ignore recommendation since level changed
          if (oldLevel !== level) {
            state.seasonings[index].recommendIgnored = false;
          }

          saveSeasonings();
          renderSeasonings();
          renderShoppingRecommendations(); // Update quick-add chips
          closeEditSeasoningModal();
          showToast(`「${name}」を更新しました！`);
        }
      });
    }

    if (btnDeleteSeasoning) {
      btnDeleteSeasoning.addEventListener('click', () => {
        if (!editingSeasoningId) return;

        const seasoning = state.seasonings.find(s => s.id === editingSeasoningId);
        if (!seasoning) return;

        if (confirm(`「${seasoning.name}」を削除しますか？`)) {
          const index = state.seasonings.findIndex(s => s.id === editingSeasoningId);
          if (index > -1) {
            state.seasonings.splice(index, 1);
            saveSeasonings();
            renderSeasonings();
            renderShoppingRecommendations(); // Update quick-add chips
            closeEditSeasoningModal();
            showToast(`「${seasoning.name}」を削除しました`, 'info');
          }
        }
      });
    }

    // Shopping Edit Modal events
    if (btnCloseEditShoppingModal) {
      btnCloseEditShoppingModal.addEventListener('click', closeEditShoppingModal);
    }

    if (editShoppingForm) {
      editShoppingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!editingShoppingId) return;

        const name = editShoppingName.value.trim();
        const qty = parseFloat(editShoppingQty.value);
        const unit = editShoppingUnit.value;
        const category = editShoppingCategory.value;

        if (!name) return;

        const index = state.shopping.findIndex(i => i.id === editingShoppingId);
        if (index > -1) {
          state.shopping[index].name = name;
          state.shopping[index].initialAmount = isNaN(qty) ? 1 : qty;
          state.shopping[index].unit = unit;
          state.shopping[index].category = category;

          saveShopping();
          renderShoppingList();
          closeEditShoppingModal();
          showToast(`「${name}」を更新しました！`);
        }
      });
    }

    // Form Autocomplete
    if (inputFoodName) {
      inputFoodName.addEventListener('input', handleNameInput);
      inputFoodName.addEventListener('compositionstart', () => {
        isComposingFoodName = true;
      });
      inputFoodName.addEventListener('compositionend', (e) => {
        isComposingFoodName = false;
        handleNameInput(e);
      });
    }

    // Form unit change updates additive buttons
    if (selectFoodUnit) selectFoodUnit.addEventListener('change', updateAmountIncrementButtons);

    // Storage radio updates suggested expiry
    document.querySelectorAll('input[name="food-storage"]').forEach(radio => {
      radio.addEventListener('change', () => {
        updateFormExpiryDate();
        userManuallySetFoodStorage = true;
      });
    });

    // Dynamic category border color listener
    document.querySelectorAll('input[name="food-category"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        updateModalCategoryColor(e.target.value);
        userManuallySetFoodCategory = true;
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
  
        const quantity = shoppingQuantityInput ? parseFloat(shoppingQuantityInput.value) : 1;
        const unit = shoppingUnitSelect ? shoppingUnitSelect.value : '個';
        const category = shoppingCategorySelect ? shoppingCategorySelect.value : 'other';
        const detected = getCategoryAndStorageByName(name);
  
        const newItem = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          name: name,
          category: category,
          initialAmount: isNaN(quantity) ? 1 : quantity,
          unit: unit,
          storageType: detected.storage || 'room'
        };
  
        state.shopping.push(newItem);
        saveShopping();
        renderShoppingList();
        
        if (shoppingInput) shoppingInput.value = '';
        if (shoppingQuantityInput) shoppingQuantityInput.value = '1';
        if (shoppingUnitSelect) shoppingUnitSelect.value = '個';
        if (shoppingCategorySelect) {
          shoppingCategorySelect.value = 'other';
          updateShoppingCategorySelectColor();
        }
        
        userManuallySetShoppingQuantity = false;
        userManuallySetShoppingUnit = false;
        userManuallySetShoppingCategory = false;
        
        if (shoppingSuggestions) shoppingSuggestions.classList.add('hidden');
        showToast(`「${name}」を追加しました`);
      });
    }

    // Auto-complete in Shopping list input
    if (shoppingInput) {
      shoppingInput.addEventListener('input', handleShoppingNameInput);
      shoppingInput.addEventListener('compositionstart', () => {
        isComposingShoppingName = true;
      });
      shoppingInput.addEventListener('compositionend', (e) => {
        isComposingShoppingName = false;
        handleShoppingNameInput(e);
      });
    }

    if (shoppingQuantityInput) {
      shoppingQuantityInput.addEventListener('change', () => {
        userManuallySetShoppingQuantity = true;
      });
    }
    if (shoppingUnitSelect) {
      shoppingUnitSelect.addEventListener('change', () => {
        userManuallySetShoppingUnit = true;
      });
    }
    if (shoppingCategorySelect) {
      shoppingCategorySelect.addEventListener('change', () => {
        userManuallySetShoppingCategory = true;
        updateShoppingCategorySelectColor();
      });
    }
    if (editShoppingCategory) {
      editShoppingCategory.addEventListener('change', () => {
        updateEditShoppingCategorySelectColor();
      });
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
        showToast(state.language === 'ja' ? '減少ステップを変更しました' : 'Changed decrement step');
      });
    }

    if (settingLanguage) {
      settingLanguage.addEventListener('change', (e) => {
        setLanguage(e.target.value);
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
