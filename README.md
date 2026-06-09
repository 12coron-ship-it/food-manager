# Stock Manager (v202606092126)

Stock Manager is a modern, premium, and beautiful web application designed to help you manage all kinds of stocks—including foods, household goods, cleaning supplies, and seasonings—to prevent waste and reduce food loss.

---

## ✨ Key Features

1. **Integrated Tab Interface**:
   - **Stock**: Real-time view of your registered ingredients and items with dynamic expiry alerts, categories, storage methods (fridge, freezer, room temp), and quick decrement buttons.
   - **Seasonings**: Manage remaining seasoning levels (100% to 0%) and backup stock quantities. Tap to cycle levels; it automatically consumes backup stock when going from 0% back to 100%.
   - **Shopping List**: A categorized checklist of items to buy. Features autocomplete, custom quantities, units, and dynamic seasoning replenishment suggestions.
   - **History & Waste Analytics**: Log of used-up (consumed) or wasted (discarded) items, with an interactive statistics dashboard and category breakdown conic-gradient chart.

2. **Smart Autocomplete & Category Auto-detection**:
   - Typing names (e.g., "Cabbage") automatically guesses category, storage method, default quantity, unit, and typical expiry days based on pre-populated databases.

3. **Smooth horizontal Touch Swipe Gestures**:
   - Easily swipe left/right to navigate tabs on touch devices. Optimized to ignore swipes starting on buttons, input fields, selects, and horizontal scroll lists to prevent misfires.

4. **Premium Design Themes**:
   - Six curated color schemes: **Organic** (default green), **Honey** (amber), **Mint** (teal), **Berry** (pink), **Light**, and **Dark** mode.

5. **Bilingual Localization Support**:
   - Toggle between **English** and **日本語 (Japanese)** instantly in settings. Persisted across page reloads in `localStorage`.

6. **Data Portability**:
   - JSON export and import for full backups and transfers.
   - CSV export for viewing/editing in spreadsheet software like Microsoft Excel.

---

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3
- **Icons**: Lucide Icons
- **Typography**: Google Fonts (Quicksand & M PLUS Rounded 1c)

---

## 🚀 How to Run

1. Open the project folder in your web browser, or simply double-click the `index.html` file to run it.
2. For the best local development experience, run a local dev server (e.g., using VS Code Live Server or Node `npx serve .`).
3. You can also execute the included `start_app.bat` script on Windows to automatically open the application.
