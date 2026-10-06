// ================================================================
//   case-cs2.js – логика открытия кейса, рулетка, инвентарь
//   Данные берутся из window.CS2_SKINS (загружается из cs2_skins_data.js)
// ================================================================

// -----------------------------------------------------------------
// 1. Проверка данных
// -----------------------------------------------------------------
if (!window.CS2_SKINS || window.CS2_SKINS.length === 0) {
    console.error('CS2_SKINS не загружен! Подключите cs2_skins_data.js');
    window.CS2_SKINS = [];
}

// -----------------------------------------------------------------
// 2. Вспомогательные функции
// -----------------------------------------------------------------
function getDefaultPriceByTier(tier) {
    const map = { tier1: 250, tier2: 500, tier3: 1000, tier4: 2500, tier5: 5000 };
    return map[tier] || 300;
}

function getBorderColorByTier(tier) {
    const colors = { tier1: '#4a90e2', tier2: '#9b59b6', tier3: '#e74c3c', tier4: '#f39c12', tier5: '#f1c40f' };
    return colors[tier] || '#888';
}

function getTextColorByTier(tier) {
    const colors = { tier1: '#64b5f6', tier2: '#ce93d8', tier3: '#ef9a9a', tier4: '#ffe082', tier5: '#fff9c4' };
    return colors[tier] || '#fff';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// -----------------------------------------------------------------
// 3. Рендеринг содержимого кейса из массива
// -----------------------------------------------------------------
function renderSkins() {
    const caseContent = document.querySelector('#case-cs2 .case-content');
    if (!caseContent) return;
    caseContent.innerHTML = '';
    window.CS2_SKINS.forEach(skin => {
        const span = document.createElement('span');
        span.className = `content ${skin.tier}`;
        span.innerHTML = `<img src="${skin.image}" alt="${skin.name}"><p>${skin.name}</p>`;
        caseContent.appendChild(span);
    });
}

// -----------------------------------------------------------------
// 4. Построение объекта цен и подготовка рулетки
// -----------------------------------------------------------------
let ITEM_PRICES = {};
let wheelItems = [];

function getCountByTier(tier) {
    const counts = { tier1: 30, tier2: 20, tier3: 10, tier4: 5, tier5: 3 };
    return counts[tier] || 10;
}

function prepareWheelItems() {
    wheelItems = [];
    window.CS2_SKINS.forEach(skin => {
        const count = getCountByTier(skin.tier);
        for (let i = 0; i < count; i++) {
            wheelItems.push({ img: skin.image, name: skin.name, tier: skin.tier });
        }
    });
    shuffleArray(wheelItems);
}

function rebuildDerivedData() {
    ITEM_PRICES = {};
    window.CS2_SKINS.forEach(s => { ITEM_PRICES[s.name] = s.price; });
    prepareWheelItems();
}

// -----------------------------------------------------------------
// 5. Инвентарь (сохранение в localStorage)
// -----------------------------------------------------------------
if (!window.inventory) window.inventory = [];

function saveInventoryToStorage() {
    try { localStorage.setItem('inventory', JSON.stringify(window.inventory)); } catch (e) { }
}

function loadInventoryFromStorage() {
    try {
        const saved = localStorage.getItem('inventory');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) window.inventory = parsed;
        }
    } catch (e) { window.inventory = []; }
}

function updateInventoryTotalValue() {
    const rub = document.getElementById('rub');
    if (!rub) return;
    const total = window.inventory.reduce((sum, item) => sum + (item.price || 0), 0);
    rub.textContent = total.toLocaleString('ru-RU');
}

function updateInventoryDisplay() {
    const block = document.getElementById('m-inventory');
    if (!block || block.style.display === 'none') return;
    let container = block.querySelector('.inventory-items-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'inventory-items-container';
        container.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:20px; padding:20px; margin-top:20px;';
        block.appendChild(container);
    }
    container.innerHTML = '';
    if (window.inventory.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;color:#888;font-size:20px;">В инвентаре пока нет предметов</div>';
        return;
    }
    window.inventory.forEach(item => {
        const el = document.createElement('div');
        el.className = 'inventory-item';
        el.dataset.itemId = item.id;
        el.style.cssText = `
            background: rgba(40,40,50,0.8); border-radius:15px; border:2px solid ${getBorderColorByTier(item.tier)};
            padding:15px; text-align:center; transition: transform 0.3s, box-shadow 0.3s;
        `;
        el.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width:100px;height:100px;object-fit:contain;margin-bottom:10px;">
            <p style="color:${getTextColorByTier(item.tier)};font-size:16px;margin:5px 0;">${item.name}</p>
            <p style="color:#4CAF50;font-weight:bold;margin:5px 0;">${item.price.toLocaleString('ru-RU')} ₽</p>
            <p style="color:#888;font-size:12px;margin:5px 0;">${item.date || ''} ${item.time || ''}</p>
            <button class="sell-item-btn" style="background:linear-gradient(45deg,#ff7e33,#ffb400);color:black;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;margin-top:10px;width:100%;">Продать</button>
        `;
        if (item.tier === 'tier4' || item.tier === 'tier5') {
            el.style.animation = 'itemGlowCs2 2s infinite';
        }
        el.addEventListener('mouseenter', function () { this.style.transform = 'translateY(-5px)'; this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)'; });
        el.addEventListener('mouseleave', function () { this.style.transform = 'translateY(0)'; this.style.boxShadow = 'none'; });
        container.appendChild(el);
    });
}

function addItemToInventory(name, image, tier) {
    const price = ITEM_PRICES[name] || getDefaultPriceByTier(tier);
    const item = {
        id: Date.now() + Math.random(),
        name, image, tier, price,
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    window.inventory.push(item);
    saveInventoryToStorage();
    updateInventoryDisplay();
    updateInventoryTotalValue();
    showCustomAlert(`"${name}" добавлен в инвентарь!`, 'success');
    return item;
}

// -----------------------------------------------------------------
// 6. Уведомления (кастомный alert)
// -----------------------------------------------------------------
function showCustomAlert(message, type = 'info') {
    const old = document.querySelectorAll('.custom-alert');
    old.forEach(a => a.remove());
    const div = document.createElement('div');
    div.className = 'custom-alert';
    div.style.cssText = `
        position:fixed; top:20px; right:20px;
        background: ${type === 'success' ? 'rgba(76,175,80,0.95)' : 'rgba(33,150,243,0.95)'};
        color:white; padding:15px 25px; border-radius:10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index:10000;
        animation: slideIn 0.3s ease; font-family: 'Noto Sans', sans-serif;
        max-width:400px; word-wrap:break-word;
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => { if (div.parentNode) div.remove(); }, 300);
    }, 3000);
}

// -----------------------------------------------------------------
// 7. Рулетка (открытие кейса)
// -----------------------------------------------------------------
const CASE_PRICE = 200;
let isSpinning = false;
let currentWinItem = null;

function updateOpenButtonState() {
    const btn = document.querySelector('#case-cs2 .case-open-btn button');
    if (!btn) return;
    if (!isSpinning && window.globalBalance >= CASE_PRICE) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = `Открыть: ${CASE_PRICE} ₽`;
    } else if (isSpinning) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.textContent = 'Идет игра...';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.textContent = `Недостаточно средств: ${CASE_PRICE} ₽`;
    }
}

function updateBalanceDisplay() {
    const span = document.getElementById('bal-header');
    if (span) {
        span.textContent = window.globalBalance.toFixed(2);
    }
    updateOpenButtonState();
}

function createWheelContainer() {
    if (document.getElementById('case-cs2-wheel-container')) return;
    const block = document.querySelector('#case-cs2');
    if (!block) return;
    const container = document.createElement('div');
    container.id = 'case-cs2-wheel-container';
    container.style.cssText = `
        display:none; position:relative; width:90%; max-width:1200px; height:300px;
        margin:40px auto; overflow:hidden;
        background:linear-gradient(135deg,rgba(15,15,25,0.9),rgba(25,25,35,0.9));
        border-radius:20px; border:3px solid #ffaa00;
        box-shadow:inset 0 0 30px rgba(0,0,0,0.5), 0 10px 30px rgba(255,170,0,0.2);
    `;
    const track = document.createElement('div');
    track.id = 'case-cs2-wheel-track';
    track.style.cssText = `
        display:flex; position:absolute; top:50%; left:0; transform:translateY(-50%);
        height:200px; gap:20px; padding:0 20px; transition: transform 2s cubic-bezier(0.1,0.7,0.1,1);
    `;
    const pointer = document.createElement('div');
    pointer.id = 'case-cs2-wheel-pointer';
    pointer.style.cssText = `
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        width:4px; height:220px; background:linear-gradient(to bottom,#ffaa00,#ffdd55,#ffaa00);
        z-index:10; box-shadow: 0 0 20px rgba(255,170,0,0.7), 0 0 40px rgba(255,170,0,0.4);
    `;
    const pointerTop = document.createElement('div');
    pointerTop.style.cssText = `
        position:absolute; top:40px; left:50%; transform:translateX(-50%);
        width:0; height:0; border-left:15px solid transparent; border-right:15px solid transparent;
        border-top:20px solid #ffaa00; z-index:10; filter:drop-shadow(0 0 10px rgba(255,170,0,0.7));
    `;
    const winDisplay = document.createElement('div');
    winDisplay.id = 'case-cs2-win-display';
    winDisplay.style.cssText = `
        display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        background:linear-gradient(135deg,rgba(30,30,40,0.95),rgba(40,40,50,0.95));
        padding:40px; border-radius:20px; border:4px solid #ffaa00;
        text-align:center; z-index:100;
        box-shadow: 0 0 50px rgba(255,170,0,0.5), inset 0 0 30px rgba(255,170,0,0.2);
        animation: winPulseCs2 1s infinite alternate;
    `;
    const winImage = document.createElement('img');
    winImage.id = 'case-cs2-win-image';
    winImage.style.cssText = 'width:150px;height:150px;object-fit:contain;margin-bottom:20px;filter:drop-shadow(0 0 20px #ffaa00);';
    const winText = document.createElement('div');
    winText.id = 'case-cs2-win-text';
    winText.style.cssText = 'color:#ffaa00;font-size:28px;font-weight:bold;text-shadow:0 0 10px rgba(255,170,0,0.5);';
    winDisplay.appendChild(winImage);
    winDisplay.appendChild(winText);
    container.appendChild(track);
    container.appendChild(pointer);
    container.appendChild(pointerTop);
    container.appendChild(winDisplay);
    const btnContainer = block.querySelector('.case-open-btn');
    if (btnContainer) block.insertBefore(container, btnContainer.nextSibling);

    if (!document.getElementById('cs2-wheel-styles')) {
        const style = document.createElement('style');
        style.id = 'cs2-wheel-styles';
        style.textContent = `
            @keyframes winPulseCs2 {
                0% { box-shadow: 0 0 30px rgba(255,170,0,0.5), inset 0 0 20px rgba(255,170,0,0.2); transform: translate(-50%,-50%) scale(1); }
                100% { box-shadow: 0 0 60px rgba(255,170,0,0.8), inset 0 0 40px rgba(255,170,0,0.3); transform: translate(-50%,-50%) scale(1.02); }
            }
            @keyframes itemGlowCs2 {
                0%,100% { box-shadow: 0 0 10px currentColor; }
                50% { box-shadow: 0 0 25px currentColor; }
            }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
}

function startWheelSpin(track, winIndex, winItem) {
    const itemWidth = 200;
    const parentWidth = track.parentElement.offsetWidth;
    const target = -((winIndex * itemWidth) - (parentWidth / 2) + (itemWidth / 2));
    track.style.transform = 'translate(100px, -50%)';
    setTimeout(() => {
        track.style.transition = 'transform 3.5s cubic-bezier(0.1, 0.7, 0.1, 1)';
        track.style.transform = `translate(${target}px, -50%)`;
        setTimeout(() => showWinResult(winItem), 3500);
    }, 100);
}

function showWinResult(winItem) {
    const winDisplay = document.getElementById('case-cs2-win-display');
    const winImage = document.getElementById('case-cs2-win-image');
    const winText = document.getElementById('case-cs2-win-text');
    if (!winDisplay || !winImage || !winText) return;
    currentWinItem = winItem;
    winImage.src = winItem.img;
    winText.textContent = `Вы выиграли: ${winItem.name}!`;
    winDisplay.style.display = 'block';
    setTimeout(() => {
        winDisplay.style.display = 'none';
        createWinChoiceDialog(winItem);
    }, 3000);
}

function createWinChoiceDialog(winItem) {
    const price = ITEM_PRICES[winItem.name] || getDefaultPriceByTier(winItem.tier);
    closeWinChoiceDialog();
    const dialog = document.createElement('div');
    dialog.id = 'win-choice-dialog-cs2';
    dialog.style.cssText = `
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        background:linear-gradient(135deg,rgba(30,30,40,0.98),rgba(40,40,50,0.98));
        padding:40px; border-radius:20px; border:4px solid #ffaa00;
        text-align:center; z-index:1000;
        box-shadow: 0 0 50px rgba(255,170,0,0.5), inset 0 0 30px rgba(255,170,0,0.2);
        min-width:500px; max-width:90%;
    `;
    dialog.innerHTML = `
        <h2 style="color:#ffaa00;margin-bottom:20px;">Поздравляем с выигрышем!</h2>
        <img src="${winItem.img}" alt="${winItem.name}" style="width:150px;height:150px;object-fit:contain;margin:20px auto;filter:drop-shadow(0 0 20px #ffaa00);">
        <h3 style="color:${getTextColorByTier(winItem.tier)};margin-bottom:10px;">${winItem.name}</h3>
        <p style="color:#4CAF50;font-size:24px;font-weight:bold;margin-bottom:30px;">${price.toLocaleString('ru-RU')} ₽</p>
        <div style="display:flex;justify-content:center;gap:20px;margin-top:20px;">
            <button id="keep-item-btn-cs2" style="background:linear-gradient(45deg,#2196F3,#21CBF3);color:white;padding:15px 30px;border:none;border-radius:10px;cursor:pointer;font-weight:bold;font-size:16px;flex:1;">Сохранить в инвентарь</button>
            <button id="sell-item-btn-cs2" style="background:linear-gradient(45deg,#4CAF50,#8BC34A);color:white;padding:15px 30px;border:none;border-radius:10px;cursor:pointer;font-weight:bold;font-size:16px;flex:1;">Продать за ${price.toLocaleString('ru-RU')} ₽</button>
        </div>
        <p style="color:#888;margin-top:20px;font-size:14px;">Предмет можно будет продать позже из инвентаря</p>
        <p style="color:#ff9800;margin-top:10px;font-size:12px;">При закрытии окна предмет автоматически сохранится в инвентарь</p>
    `;
    document.body.appendChild(dialog);
    const overlay = document.createElement('div');
    overlay.id = 'win-choice-overlay-cs2';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:999;';
    document.body.appendChild(overlay);

    function keepItem() { if (!winItem) return; addItemToInventory(winItem.name, winItem.img, winItem.tier); closeWinChoiceDialog(); resetCaseState(); }
    function sellItem() { if (!winItem) return; window.globalBalance += price; updateBalanceDisplay(); showCustomAlert(`Предмет продан за ${price.toLocaleString('ru-RU')} ₽!`, 'success'); closeWinChoiceDialog(); resetCaseState(); }
    function closeWithSave() { keepItem(); }

    document.getElementById('keep-item-btn-cs2').onclick = keepItem;
    document.getElementById('sell-item-btn-cs2').onclick = sellItem;
    overlay.onclick = closeWithSave;
}

function closeWinChoiceDialog() {
    const d = document.getElementById('win-choice-dialog-cs2');
    const o = document.getElementById('win-choice-overlay-cs2');
    if (d) d.remove();
    if (o) o.remove();
}

function resetCaseState() {
    const container = document.getElementById('case-cs2-wheel-container');
    const winDisplay = document.getElementById('case-cs2-win-display');
    if (container) { container.style.display = 'none'; const track = container.querySelector('#case-cs2-wheel-track'); if (track) track.innerHTML = ''; }
    if (winDisplay) winDisplay.style.display = 'none';
    isSpinning = false;
    const btn = document.querySelector('#case-cs2 .case-open-btn button');
    if (btn) btn.style.display = 'block';
    updateOpenButtonState();
}

function openCase() {
    if (isSpinning || window.globalBalance < CASE_PRICE) return;
    try {
        isSpinning = true;
        updateOpenButtonState();
        window.globalBalance -= CASE_PRICE;
        updateBalanceDisplay();
        const btn = document.querySelector('#case-cs2 .case-open-btn button');
        if (btn) btn.style.display = 'none';
        const container = document.getElementById('case-cs2-wheel-container');
        const track = document.getElementById('case-cs2-wheel-track');
        if (!container || !track) throw new Error('Рулетка не инициализирована');
        track.innerHTML = '';
        const extended = [];
        for (let i = 0; i < 3; i++) {
            wheelItems.forEach(item => extended.push(item));
        }
        extended.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'wheel-item';
            el.dataset.index = index;
            el.style.cssText = `
                min-width:180px; height:180px; display:flex; flex-direction:column;
                align-items:center; justify-content:center;
                background:rgba(40,40,50,0.8); border-radius:15px;
                border:2px solid ${getBorderColorByTier(item.tier)}; padding:15px;
            `;
            el.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="width:100px;height:100px;object-fit:contain;">
                <p style="color:${getTextColorByTier(item.tier)};margin-top:10px;font-size:16px;">${item.name}</p>
            `;
            if (item.tier === 'tier4' || item.tier === 'tier5') el.style.animation = 'itemGlowCs2 2s infinite';
            track.appendChild(el);
        });
        container.style.display = 'block';
        const winIndex = Math.floor(Math.random() * (wheelItems.length * 2)) + wheelItems.length;
        const winItem = extended[winIndex % wheelItems.length];
        startWheelSpin(track, winIndex, winItem);
    } catch (e) {
        console.error(e);
        window.globalBalance += CASE_PRICE;
        updateBalanceDisplay();
        resetCaseState();
    }
}

// -----------------------------------------------------------------
// 8. Инициализация при загрузке страницы
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    renderSkins();
    rebuildDerivedData();
    createWheelContainer();

    // Синхронизация баланса
    const balanceSpan = document.getElementById('bal-header');
    if (balanceSpan) {
        window.globalBalance = parseFloat(balanceSpan.textContent) || 0;
        updateBalanceDisplay();
    }

    // Загрузка инвентаря
    loadInventoryFromStorage();
    updateInventoryDisplay();
    updateInventoryTotalValue();

    // Кнопка открытия
    const openBtn = document.querySelector('#case-cs2 .case-open-btn button');
    if (openBtn) openBtn.addEventListener('click', openCase);

    // Центрирование кнопки
    const btnContainer = document.querySelector('#case-cs2 .case-open-btn');
    if (btnContainer) { btnContainer.style.textAlign = 'center'; btnContainer.style.width = '100%'; }

    // Наблюдение за балансом
    if (balanceSpan) {
        const observer = new MutationObserver(() => {
            const newBal = parseFloat(balanceSpan.textContent) || 0;
            if (!isNaN(newBal)) { window.globalBalance = newBal; updateOpenButtonState(); }
        });
        observer.observe(balanceSpan, { characterData: true, childList: true, subtree: true });
    }

    console.log('✅ CS2 кейс загружен. Всего скинов:', window.CS2_SKINS.length);
});
