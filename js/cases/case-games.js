// ================================================================
//   case-games.js – логика «Игрового кейса»
//   Стоимость открытия: 749 ₽
//   Данные берутся из window.GAMES_CASE_DATA (case-games-data.js)
// ================================================================

// -----------------------------------------------------------------
// 1. Конфигурация
// -----------------------------------------------------------------
const GAMES_CASE_PRICE = 749;
let GAMES_PRICES = {};
let gamesWheelItems = [];
let gamesIsSpinning = false;
let gamesCurrentWinItem = null;

// -----------------------------------------------------------------
// 2. Проверка данных
// -----------------------------------------------------------------
if (!window.GAMES_CASE_DATA || window.GAMES_CASE_DATA.length === 0) {
    console.error('GAMES_CASE_DATA не загружен! Подключите case-games-data.js');
    window.GAMES_CASE_DATA = [];
}

// -----------------------------------------------------------------
// 3. Вспомогательные функции
// -----------------------------------------------------------------
function gamesGetDefaultPriceByTier(tier) {
    const map = { tier1: 400, tier2: 900, tier3: 2500, tier4: 4000, tier5: 7000 };
    return map[tier] || 500;
}

function gamesGetBorderColorByTier(tier) {
    const colors = {
        tier1: '#3880ec', tier2: '#7e1a7e', tier3: '#f14df1',
        tier4: '#dd3131', tier5: '#f7f723'
    };
    return colors[tier] || '#888';
}

function gamesGetTextColorByTier(tier) {
    const colors = {
        tier1: '#64b5f6', tier2: '#ab47bc', tier3: '#f48fb1',
        tier4: '#ef5350', tier5: '#fff176'
    };
    return colors[tier] || '#fff';
}

function gamesGetCountByTier(tier) {
    const counts = { tier1: 30, tier2: 18, tier3: 10, tier4: 5, tier5: 3 };
    return counts[tier] || 10;
}

function gamesShuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// -----------------------------------------------------------------
// 4. Рендер содержимого кейса из массива
// -----------------------------------------------------------------
function gamesRenderContent() {
    const content = document.querySelector('#case-games .case-content');
    if (!content) return;
    content.innerHTML = '';
    window.GAMES_CASE_DATA.forEach(item => {
        const span = document.createElement('span');
        span.className = `content ${item.tier}`;
        span.innerHTML = `<img src="${item.image}" alt="${item.name}"><p>${item.name}</p>`;
        content.appendChild(span);
    });
}

// -----------------------------------------------------------------
// 5. Подготовка данных рулетки
// -----------------------------------------------------------------
function gamesPrepareWheel() {
    gamesWheelItems = [];
    window.GAMES_CASE_DATA.forEach(item => {
        const count = gamesGetCountByTier(item.tier);
        for (let i = 0; i < count; i++) {
            gamesWheelItems.push({ img: item.image, name: item.name, tier: item.tier });
        }
    });
    gamesShuffleArray(gamesWheelItems);
}

function gamesRebuildDerived() {
    GAMES_PRICES = {};
    window.GAMES_CASE_DATA.forEach(i => { GAMES_PRICES[i.name] = i.price; });
    gamesPrepareWheel();
}

// -----------------------------------------------------------------
// 6. Инвентарь (общий с другими кейсами через window.inventory)
// -----------------------------------------------------------------
if (typeof window.inventory === 'undefined' || !Array.isArray(window.inventory)) {
    window.inventory = [];
}

function gamesSaveInventory() {
    try { localStorage.setItem('inventory', JSON.stringify(window.inventory)); } catch (e) {}
}

function gamesLoadInventory() {
    try {
        const saved = localStorage.getItem('inventory');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) window.inventory = parsed;
        }
    } catch (e) { window.inventory = []; }
}

function gamesUpdateInventoryTotalValue() {
    const rub = document.getElementById('rub');
    if (!rub) return;
    const total = window.inventory.reduce((sum, item) => sum + (item.price || 0), 0);
    rub.textContent = total.toLocaleString('ru-RU');
}

function gamesUpdateInventoryDisplay() {
    const block = document.getElementById('m-inventory');
    if (!block || block.style.display === 'none') return;

    let container = block.querySelector('.inventory-items-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'inventory-items-container';
        container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;padding:20px;margin-top:20px;';
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
            background: rgba(40,40,50,0.8);
            border-radius: 15px;
            border: 2px solid ${gamesGetBorderColorByTier(item.tier)};
            padding: 15px;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
        `;
        el.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width:100px;height:100px;object-fit:contain;margin-bottom:10px;">
            <p style="color:${gamesGetTextColorByTier(item.tier)};font-size:16px;margin:5px 0;">${item.name}</p>
            <p style="color:#4CAF50;font-weight:bold;margin:5px 0;">${item.price.toLocaleString('ru-RU')} ₽</p>
            <p style="color:#888;font-size:12px;margin:5px 0;">${item.date || ''} ${item.time || ''}</p>
            <button class="sell-item-btn" style="background:linear-gradient(45deg,#ff7e33,#ffb400);color:black;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;margin-top:10px;width:100%;">Продать</button>
        `;
        if (item.tier === 'tier4' || item.tier === 'tier5') {
            el.style.animation = 'itemGlowGames 2s infinite';
        }
        el.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        });
        el.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        container.appendChild(el);
    });
}

function gamesAddToInventory(name, image, tier) {
    const price = GAMES_PRICES[name] || gamesGetDefaultPriceByTier(tier);
    const item = {
        id: Date.now() + Math.random(),
        name, image, tier, price,
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    window.inventory.push(item);
    gamesSaveInventory();
    gamesUpdateInventoryDisplay();
    gamesUpdateInventoryTotalValue();
    gamesShowAlert(`"${name}" добавлен в инвентарь!`, 'success');
    return item;
}

// -----------------------------------------------------------------
// 7. Уведомления
// -----------------------------------------------------------------
function gamesShowAlert(message, type = 'info') {
    document.querySelectorAll('.custom-alert').forEach(a => a.remove());
    const div = document.createElement('div');
    div.className = 'custom-alert';
    div.style.cssText = `
        position:fixed; top:20px; right:20px;
        background:${type === 'success' ? 'rgba(76,175,80,0.95)' : 'rgba(33,150,243,0.95)'};
        color:white; padding:15px 25px; border-radius:10px;
        box-shadow:0 5px 15px rgba(0,0,0,0.3); z-index:10000;
        animation:slideIn 0.3s ease; font-family:'Noto Sans',sans-serif;
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
// 8. Кнопка и баланс
// -----------------------------------------------------------------
function gamesUpdateButtonState() {
    const btn = document.querySelector('#case-games .case-open-btn button');
    if (!btn) return;

    if (!gamesIsSpinning && window.globalBalance >= GAMES_CASE_PRICE) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = `Открыть: ${GAMES_CASE_PRICE} ₽`;
    } else if (gamesIsSpinning) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.textContent = 'Идет игра...';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.textContent = `Недостаточно средств: ${GAMES_CASE_PRICE} ₽`;
    }
}

function gamesUpdateBalanceDisplay() {
    const span = document.getElementById('bal-header');
    if (span) span.textContent = window.globalBalance.toFixed(2);
    gamesUpdateButtonState();
}

// -----------------------------------------------------------------
// 9. Создание контейнера рулетки
// -----------------------------------------------------------------
function gamesCreateWheelContainer() {
    if (document.getElementById('case-games-wheel-container')) return;
    const block = document.querySelector('#case-games');
    if (!block) return;

    const container = document.createElement('div');
    container.id = 'case-games-wheel-container';
    container.style.cssText = `
        display:none; position:relative; width:90%; max-width:1200px; height:300px;
        margin:40px auto; overflow:hidden;
        background:linear-gradient(135deg,rgba(15,15,25,0.9),rgba(25,25,35,0.9));
        border-radius:20px; border:3px solid #ff8a00;
        box-shadow:inset 0 0 30px rgba(0,0,0,0.5), 0 10px 30px rgba(255,138,0,0.2);
    `;

    const track = document.createElement('div');
    track.id = 'case-games-wheel-track';
    track.style.cssText = `
        display:flex; position:absolute; top:50%; left:0; transform:translateY(-50%);
        height:200px; gap:20px; padding:0 20px;
        transition:transform 2s cubic-bezier(0.1,0.7,0.1,1);
    `;

    const pointer = document.createElement('div');
    pointer.style.cssText = `
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        width:4px; height:220px;
        background:linear-gradient(to bottom,#ff8a00,#ffcc00,#ff8a00);
        z-index:10; box-shadow:0 0 20px rgba(255,140,0,0.7),0 0 40px rgba(255,140,0,0.4);
    `;

    const pointerTop = document.createElement('div');
    pointerTop.style.cssText = `
        position:absolute; top:40px; left:50%; transform:translateX(-50%);
        width:0; height:0; border-left:15px solid transparent; border-right:15px solid transparent;
        border-top:20px solid #ff8a00; z-index:10;
        filter:drop-shadow(0 0 10px rgba(255,140,0,0.7));
    `;

    const winDisplay = document.createElement('div');
    winDisplay.id = 'case-games-win-display';
    winDisplay.style.cssText = `
        display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        background:linear-gradient(135deg,rgba(30,30,40,0.95),rgba(40,40,50,0.95));
        padding:40px; border-radius:20px; border:4px solid #ff8a00;
        text-align:center; z-index:100;
        box-shadow:0 0 50px rgba(255,138,0,0.5), inset 0 0 30px rgba(255,138,0,0.2);
        animation:winPulseGames 1s infinite alternate;
    `;

    const winImage = document.createElement('img');
    winImage.id = 'case-games-win-image';
    winImage.style.cssText = 'width:150px;height:150px;object-fit:contain;margin-bottom:20px;filter:drop-shadow(0 0 20px #ff8a00);';

    const winText = document.createElement('div');
    winText.id = 'case-games-win-text';
    winText.style.cssText = 'color:#ff8a00;font-size:28px;font-weight:bold;text-shadow:0 0 10px rgba(255,138,0,0.5);';

    winDisplay.appendChild(winImage);
    winDisplay.appendChild(winText);
    container.appendChild(track);
    container.appendChild(pointer);
    container.appendChild(pointerTop);
    container.appendChild(winDisplay);

    const btnContainer = block.querySelector('.case-open-btn');
    if (btnContainer) block.insertBefore(container, btnContainer.nextSibling);

    if (!document.getElementById('games-wheel-styles')) {
        const style = document.createElement('style');
        style.id = 'games-wheel-styles';
        style.textContent = `
            @keyframes winPulseGames {
                0%   { box-shadow:0 0 30px rgba(255,138,0,0.5), inset 0 0 20px rgba(255,138,0,0.2); transform:translate(-50%,-50%) scale(1); }
                100% { box-shadow:0 0 60px rgba(255,138,0,0.8), inset 0 0 40px rgba(255,138,0,0.3); transform:translate(-50%,-50%) scale(1.02); }
            }
            @keyframes itemGlowGames {
                0%,100% { box-shadow:0 0 10px currentColor; }
                50%     { box-shadow:0 0 25px currentColor; }
            }
            @keyframes slideIn  { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
            @keyframes slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
        `;
        document.head.appendChild(style);
    }
}

// -----------------------------------------------------------------
// 10. Прокрутка рулетки
// -----------------------------------------------------------------
function gamesStartWheelSpin(track, winIndex, winItem) {
    const itemWidth = 200;
    const parentWidth = track.parentElement.offsetWidth;
    const target = -((winIndex * itemWidth) - (parentWidth / 2) + (itemWidth / 2));

    track.style.transform = 'translate(100px, -50%)';
    setTimeout(() => {
        track.style.transition = 'transform 3.5s cubic-bezier(0.1,0.7,0.1,1)';
        track.style.transform = `translate(${target}px, -50%)`;
        setTimeout(() => gamesShowWinResult(winItem), 3500);
    }, 100);
}

function gamesShowWinResult(winItem) {
    const winDisplay = document.getElementById('case-games-win-display');
    const winImage = document.getElementById('case-games-win-image');
    const winText = document.getElementById('case-games-win-text');
    if (!winDisplay || !winImage || !winText) return;

    gamesCurrentWinItem = winItem;
    winImage.src = winItem.img;
    winText.textContent = `Вы выиграли: ${winItem.name}!`;
    winDisplay.style.display = 'block';

    setTimeout(() => {
        winDisplay.style.display = 'none';
        gamesCreateWinChoiceDialog(winItem);
    }, 3000);
}

// -----------------------------------------------------------------
// 11. Диалог выбора: оставить / продать
// -----------------------------------------------------------------
function gamesCreateWinChoiceDialog(winItem) {
    const price = GAMES_PRICES[winItem.name] || gamesGetDefaultPriceByTier(winItem.tier);
    gamesCloseWinChoiceDialog();

    const dialog = document.createElement('div');
    dialog.id = 'win-choice-dialog-games';
    dialog.style.cssText = `
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        background:linear-gradient(135deg,rgba(30,30,40,0.98),rgba(40,40,50,0.98));
        padding:40px; border-radius:20px; border:4px solid #ff8a00;
        text-align:center; z-index:1000;
        box-shadow:0 0 50px rgba(255,138,0,0.5), inset 0 0 30px rgba(255,138,0,0.2);
        min-width:500px; max-width:90%;
    `;
    dialog.innerHTML = `
        <h2 style="color:#ff8a00;margin-bottom:20px;">Поздравляем с выигрышем!</h2>
        <img src="${winItem.img}" alt="${winItem.name}" style="width:150px;height:150px;object-fit:contain;margin:20px auto;filter:drop-shadow(0 0 20px #ff8a00);">
        <h3 style="color:${gamesGetTextColorByTier(winItem.tier)};margin-bottom:10px;">${winItem.name}</h3>
        <p style="color:#4CAF50;font-size:24px;font-weight:bold;margin-bottom:30px;">${price.toLocaleString('ru-RU')} ₽</p>
        <div style="display:flex;justify-content:center;gap:20px;margin-top:20px;">
            <button id="keep-item-btn-games" style="background:linear-gradient(45deg,#2196F3,#21CBF3);color:white;padding:15px 30px;border:none;border-radius:10px;cursor:pointer;font-weight:bold;font-size:16px;flex:1;">Сохранить в инвентарь</button>
            <button id="sell-item-btn-games" style="background:linear-gradient(45deg,#4CAF50,#8BC34A);color:white;padding:15px 30px;border:none;border-radius:10px;cursor:pointer;font-weight:bold;font-size:16px;flex:1;">Продать за ${price.toLocaleString('ru-RU')} ₽</button>
        </div>
        <p style="color:#888;margin-top:20px;font-size:14px;">Игру можно будет продать позже из инвентаря</p>
        <p style="color:#ff9800;margin-top:10px;font-size:12px;">При закрытии окна игра автоматически сохранится в инвентарь</p>
    `;
    document.body.appendChild(dialog);

    const overlay = document.createElement('div');
    overlay.id = 'win-choice-overlay-games';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:999;';
    document.body.appendChild(overlay);

    function keepItem() {
        if (!winItem) return;
        gamesAddToInventory(winItem.name, winItem.img, winItem.tier);
        gamesCloseWinChoiceDialog();
        gamesResetCaseState();
    }

    function sellItem() {
        if (!winItem) return;
        window.globalBalance += price;
        gamesUpdateBalanceDisplay();
        gamesShowAlert(`Игра продана за ${price.toLocaleString('ru-RU')} ₽!`, 'success');
        gamesCloseWinChoiceDialog();
        gamesResetCaseState();
    }

    document.getElementById('keep-item-btn-games').onclick = keepItem;
    document.getElementById('sell-item-btn-games').onclick = sellItem;
    overlay.onclick = keepItem;
}

function gamesCloseWinChoiceDialog() {
    const d = document.getElementById('win-choice-dialog-games');
    const o = document.getElementById('win-choice-overlay-games');
    if (d) d.remove();
    if (o) o.remove();
}

// -----------------------------------------------------------------
// 12. Открытие кейса
// -----------------------------------------------------------------
function gamesOpenCase() {
    if (gamesIsSpinning || window.globalBalance < GAMES_CASE_PRICE) return;

    try {
        gamesIsSpinning = true;
        gamesUpdateButtonState();

        window.globalBalance -= GAMES_CASE_PRICE;
        gamesUpdateBalanceDisplay();

        const btn = document.querySelector('#case-games .case-open-btn button');
        if (btn) btn.style.display = 'none';

        const container = document.getElementById('case-games-wheel-container');
        const track = document.getElementById('case-games-wheel-track');
        if (!container || !track) throw new Error('Рулетка не инициализирована');

        track.innerHTML = '';

        const extended = [];
        for (let i = 0; i < 3; i++) {
            gamesWheelItems.forEach(item => extended.push(item));
        }

        extended.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'wheel-item';
            el.dataset.index = index;
            el.style.cssText = `
                min-width:180px; height:180px; display:flex; flex-direction:column;
                align-items:center; justify-content:center;
                background:rgba(40,40,50,0.8); border-radius:15px;
                border:2px solid ${gamesGetBorderColorByTier(item.tier)}; padding:15px;
            `;
            el.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="width:100px;height:100px;object-fit:contain;">
                <p style="color:${gamesGetTextColorByTier(item.tier)};margin-top:10px;font-size:16px;">${item.name}</p>
            `;
            if (item.tier === 'tier4' || item.tier === 'tier5') {
                el.style.animation = 'itemGlowGames 2s infinite';
            }
            track.appendChild(el);
        });

        container.style.display = 'block';

        const winIndex = Math.floor(Math.random() * (gamesWheelItems.length * 2)) + gamesWheelItems.length;
        const winItem = extended[winIndex % gamesWheelItems.length];

        gamesStartWheelSpin(track, winIndex, winItem);

    } catch (e) {
        console.error('Ошибка открытия игрового кейса:', e);
        window.globalBalance += GAMES_CASE_PRICE;
        gamesUpdateBalanceDisplay();
        gamesResetCaseState();
    }
}

// -----------------------------------------------------------------
// 13. Сброс состояния
// -----------------------------------------------------------------
function gamesResetCaseState() {
    const container = document.getElementById('case-games-wheel-container');
    const winDisplay = document.getElementById('case-games-win-display');

    if (container) {
        container.style.display = 'none';
        const track = container.querySelector('#case-games-wheel-track');
        if (track) track.innerHTML = '';
    }
    if (winDisplay) winDisplay.style.display = 'none';

    gamesIsSpinning = false;

    const btn = document.querySelector('#case-games .case-open-btn button');
    if (btn) btn.style.display = 'block';
    gamesUpdateButtonState();
}

// -----------------------------------------------------------------
// 14. Инициализация при загрузке страницы
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    const caseBlock = document.getElementById('case-games');
    if (!caseBlock) return;

    gamesRenderContent();
    gamesRebuildDerived();
    gamesCreateWheelContainer();

    const balanceSpan = document.getElementById('bal-header');
    if (balanceSpan) {
        window.globalBalance = parseFloat(balanceSpan.textContent) || 0;
        gamesUpdateBalanceDisplay();
    }

    gamesLoadInventory();
    gamesUpdateInventoryDisplay();
    gamesUpdateInventoryTotalValue();

    const openBtn = document.querySelector('#case-games .case-open-btn button');
    if (openBtn) openBtn.addEventListener('click', gamesOpenCase);

    const btnContainer = document.querySelector('#case-games .case-open-btn');
    if (btnContainer) {
        btnContainer.style.textAlign = 'center';
        btnContainer.style.width = '100%';
    }

    if (balanceSpan) {
        const observer = new MutationObserver(() => {
            const newBal = parseFloat(balanceSpan.textContent) || 0;
            if (!isNaN(newBal)) {
                window.globalBalance = newBal;
                gamesUpdateButtonState();
            }
        });
        observer.observe(balanceSpan, { characterData: true, childList: true, subtree: true });
    }

    console.log('✅ Игровой кейс загружен. Всего игр:', window.GAMES_CASE_DATA.length);
});