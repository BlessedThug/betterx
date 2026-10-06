// ================================================================
//   case-money.js – логика «Денежного кейса»
//   Стоимость открытия: 500 ₽
//   Данные берутся из window.MONEY_CASE_DATA (case-money-data.js)
//   Особенность: выигрыш сразу зачисляется на баланс (без инвентаря)
// ================================================================

// -----------------------------------------------------------------
// 1. Конфигурация
// -----------------------------------------------------------------
const MONEY_CASE_PRICE = 500;
let moneyWheelItems = [];
let moneyIsSpinning = false;

// -----------------------------------------------------------------
// 2. Проверка данных
// -----------------------------------------------------------------
if (!window.MONEY_CASE_DATA || window.MONEY_CASE_DATA.length === 0) {
    console.error('MONEY_CASE_DATA не загружен! Подключите case-money-data.js');
    window.MONEY_CASE_DATA = [];
}

// -----------------------------------------------------------------
// 3. Вспомогательные функции
// -----------------------------------------------------------------
function moneyGetBorderColorByTier(tier) {
    const colors = {
        tier1: '#3880ec', tier2: '#7e1a7e', tier3: '#f14df1',
        tier4: '#dd3131', tier5: '#f7f723'
    };
    return colors[tier] || '#888';
}

function moneyGetTextColorByTier(tier) {
    const colors = {
        tier1: '#64b5f6', tier2: '#ab47bc', tier3: '#f48fb1',
        tier4: '#ef5350', tier5: '#fff176'
    };
    return colors[tier] || '#fff';
}

function moneyGetCountByTier(tier) {
    const counts = { tier1: 30, tier2: 10, tier3: 6, tier4: 3, tier5: 2 };
    return counts[tier] || 5;
}

function moneyShuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// -----------------------------------------------------------------
// 4. Рендер содержимого кейса из массива
// -----------------------------------------------------------------
function moneyRenderContent() {
    const content = document.querySelector('#case-money .case-content');
    if (!content) return;
    content.innerHTML = '';
    window.MONEY_CASE_DATA.forEach(item => {
        const span = document.createElement('span');
        span.className = `content ${item.tier}`;
        span.innerHTML = `<img src="${item.image}" alt="${item.name}"><p>${item.name}</p>`;
        content.appendChild(span);
    });
}

// -----------------------------------------------------------------
// 5. Подготовка рулетки
// -----------------------------------------------------------------
function moneyPrepareWheel() {
    moneyWheelItems = [];
    window.MONEY_CASE_DATA.forEach(item => {
        const count = moneyGetCountByTier(item.tier);
        for (let i = 0; i < count; i++) {
            moneyWheelItems.push({
                img: item.image,
                name: item.name,
                tier: item.tier,
                price: item.price
            });
        }
    });
    moneyShuffleArray(moneyWheelItems);
}

// -----------------------------------------------------------------
// 6. Кнопка и баланс
// -----------------------------------------------------------------
function moneyUpdateButtonState() {
    const btn = document.querySelector('#case-money .case-open-btn button');
    if (!btn) return;

    if (!moneyIsSpinning && window.globalBalance >= MONEY_CASE_PRICE) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = `Открыть: ${MONEY_CASE_PRICE} ₽`;
    } else if (moneyIsSpinning) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.textContent = 'Идет игра...';
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.textContent = `Недостаточно средств: ${MONEY_CASE_PRICE} ₽`;
    }
}

function moneyUpdateBalanceDisplay() {
    const span = document.getElementById('bal-header');
    if (span) span.textContent = window.globalBalance.toFixed(2);
    moneyUpdateButtonState();
}

// -----------------------------------------------------------------
// 7. Уведомления
// -----------------------------------------------------------------
function moneyShowAlert(message, type = 'info') {
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
// 8. Создание контейнера рулетки
// -----------------------------------------------------------------
function moneyCreateWheelContainer() {
    if (document.getElementById('case-money-wheel-container')) return;
    const block = document.querySelector('#case-money');
    if (!block) return;

    const container = document.createElement('div');
    container.id = 'case-money-wheel-container';
    container.style.cssText = `
        display:none; position:relative; width:90%; max-width:1200px; height:300px;
        margin:40px auto; overflow:hidden;
        background:linear-gradient(135deg,rgba(15,15,25,0.9),rgba(25,25,35,0.9));
        border-radius:20px; border:3px solid #ffd700;
        box-shadow:inset 0 0 30px rgba(0,0,0,0.5), 0 10px 30px rgba(255,215,0,0.2);
    `;

    const track = document.createElement('div');
    track.id = 'case-money-wheel-track';
    track.style.cssText = `
        display:flex; position:absolute; top:50%; left:0; transform:translateY(-50%);
        height:200px; gap:20px; padding:0 20px;
        transition:transform 2s cubic-bezier(0.1,0.7,0.1,1);
    `;

    const pointer = document.createElement('div');
    pointer.style.cssText = `
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        width:4px; height:220px;
        background:linear-gradient(to bottom,#ffd700,#fff176,#ffd700);
        z-index:10; box-shadow:0 0 20px rgba(255,215,0,0.7),0 0 40px rgba(255,215,0,0.4);
    `;

    const pointerTop = document.createElement('div');
    pointerTop.style.cssText = `
        position:absolute; top:40px; left:50%; transform:translateX(-50%);
        width:0; height:0; border-left:15px solid transparent; border-right:15px solid transparent;
        border-top:20px solid #ffd700; z-index:10;
        filter:drop-shadow(0 0 10px rgba(255,215,0,0.7));
    `;

    const winDisplay = document.createElement('div');
    winDisplay.id = 'case-money-win-display';
    winDisplay.style.cssText = `
        display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        background:linear-gradient(135deg,rgba(30,30,40,0.95),rgba(40,40,50,0.95));
        padding:40px; border-radius:20px; border:4px solid #ffd700;
        text-align:center; z-index:100;
        box-shadow:0 0 50px rgba(255,215,0,0.5), inset 0 0 30px rgba(255,215,0,0.2);
        animation:winPulseMoney 1s infinite alternate;
    `;

    const winImage = document.createElement('img');
    winImage.id = 'case-money-win-image';
    winImage.style.cssText = 'width:150px;height:150px;object-fit:contain;margin-bottom:20px;filter:drop-shadow(0 0 20px #ffd700);';

    const winText = document.createElement('div');
    winText.id = 'case-money-win-text';
    winText.style.cssText = 'color:#ffd700;font-size:28px;font-weight:bold;text-shadow:0 0 10px rgba(255,215,0,0.5);';

    winDisplay.appendChild(winImage);
    winDisplay.appendChild(winText);
    container.appendChild(track);
    container.appendChild(pointer);
    container.appendChild(pointerTop);
    container.appendChild(winDisplay);

    const btnContainer = block.querySelector('.case-open-btn');
    if (btnContainer) block.insertBefore(container, btnContainer.nextSibling);

    if (!document.getElementById('money-wheel-styles')) {
        const style = document.createElement('style');
        style.id = 'money-wheel-styles';
        style.textContent = `
            @keyframes winPulseMoney {
                0%   { box-shadow:0 0 30px rgba(255,215,0,0.5), inset 0 0 20px rgba(255,215,0,0.2); transform:translate(-50%,-50%) scale(1); }
                100% { box-shadow:0 0 60px rgba(255,215,0,0.8), inset 0 0 40px rgba(255,215,0,0.3); transform:translate(-50%,-50%) scale(1.02); }
            }
            @keyframes itemGlowMoney {
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
// 9. Прокрутка рулетки
// -----------------------------------------------------------------
function moneyStartWheelSpin(track, winIndex, winItem) {
    const itemWidth = 200;
    const parentWidth = track.parentElement.offsetWidth;
    const target = -((winIndex * itemWidth) - (parentWidth / 2) + (itemWidth / 2));

    track.style.transform = 'translate(100px, -50%)';
    setTimeout(() => {
        track.style.transition = 'transform 3.5s cubic-bezier(0.1,0.7,0.1,1)';
        track.style.transform = `translate(${target}px, -50%)`;
        setTimeout(() => moneyShowWinResult(winItem), 3500);
    }, 100);
}

function moneyShowWinResult(winItem) {
    const winDisplay = document.getElementById('case-money-win-display');
    const winImage = document.getElementById('case-money-win-image');
    const winText = document.getElementById('case-money-win-text');
    if (!winDisplay || !winImage || !winText) return;

    winImage.src = winItem.img;
    winText.textContent = `Вы выиграли: ${winItem.name}!`;
    winDisplay.style.display = 'block';

    // Зачисляем выигрыш на баланс
    const winAmount = winItem.price;
    if (typeof winAmount === 'number' && !isNaN(winAmount)) {
        window.globalBalance += winAmount;
        moneyUpdateBalanceDisplay();
    }

    setTimeout(() => {
        moneyShowAlert(`Выигрыш ${winAmount.toLocaleString('ru-RU')} ₽ зачислен на баланс!`, 'success');
        moneyResetCaseState();
    }, 2500);
}

// -----------------------------------------------------------------
// 10. Открытие кейса
// -----------------------------------------------------------------
function moneyOpenCase() {
    if (moneyIsSpinning || window.globalBalance < MONEY_CASE_PRICE) return;

    try {
        moneyIsSpinning = true;
        moneyUpdateButtonState();

        window.globalBalance -= MONEY_CASE_PRICE;
        moneyUpdateBalanceDisplay();

        const btn = document.querySelector('#case-money .case-open-btn button');
        if (btn) btn.style.display = 'none';

        const container = document.getElementById('case-money-wheel-container');
        const track = document.getElementById('case-money-wheel-track');
        if (!container || !track) throw new Error('Рулетка не инициализирована');

        track.innerHTML = '';

        const extended = [];
        for (let i = 0; i < 3; i++) {
            moneyWheelItems.forEach(item => extended.push(item));
        }

        extended.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'wheel-item';
            el.dataset.index = index;
            el.style.cssText = `
                min-width:180px; height:180px; display:flex; flex-direction:column;
                align-items:center; justify-content:center;
                background:rgba(40,40,50,0.8); border-radius:15px;
                border:2px solid ${moneyGetBorderColorByTier(item.tier)}; padding:15px;
            `;
            el.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="width:100px;height:100px;object-fit:contain;">
                <p style="color:${moneyGetTextColorByTier(item.tier)};margin-top:10px;font-size:16px;">${item.name}</p>
            `;
            if (item.tier === 'tier4' || item.tier === 'tier5') {
                el.style.animation = 'itemGlowMoney 2s infinite';
            }
            track.appendChild(el);
        });

        container.style.display = 'block';

        const winIndex = Math.floor(Math.random() * (moneyWheelItems.length * 2)) + moneyWheelItems.length;
        const winItem = extended[winIndex % moneyWheelItems.length];

        moneyStartWheelSpin(track, winIndex, winItem);

    } catch (e) {
        console.error('Ошибка открытия денежного кейса:', e);
        window.globalBalance += MONEY_CASE_PRICE;
        moneyUpdateBalanceDisplay();
        moneyResetCaseState();
    }
}

// -----------------------------------------------------------------
// 11. Сброс состояния
// -----------------------------------------------------------------
function moneyResetCaseState() {
    const container = document.getElementById('case-money-wheel-container');
    const winDisplay = document.getElementById('case-money-win-display');

    if (container) {
        container.style.display = 'none';
        const track = container.querySelector('#case-money-wheel-track');
        if (track) track.innerHTML = '';
    }
    if (winDisplay) winDisplay.style.display = 'none';

    moneyIsSpinning = false;

    const btn = document.querySelector('#case-money .case-open-btn button');
    if (btn) btn.style.display = 'block';
    moneyUpdateButtonState();
}

// -----------------------------------------------------------------
// 12. Инициализация при загрузке страницы
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    const caseBlock = document.getElementById('case-money');
    if (!caseBlock) return;

    moneyRenderContent();
    moneyPrepareWheel();
    moneyCreateWheelContainer();

    // Синхронизация баланса
    const balanceSpan = document.getElementById('bal-header');
    if (balanceSpan) {
        window.globalBalance = parseFloat(balanceSpan.textContent) || 0;
        moneyUpdateBalanceDisplay();
    }

    // Кнопка открытия
    const openBtn = document.querySelector('#case-money .case-open-btn button');
    if (openBtn) openBtn.addEventListener('click', moneyOpenCase);

    // Центрирование кнопки
    const btnContainer = document.querySelector('#case-money .case-open-btn');
    if (btnContainer) {
        btnContainer.style.textAlign = 'center';
        btnContainer.style.width = '100%';
    }

    // Слежение за балансом
    if (balanceSpan) {
        const observer = new MutationObserver(() => {
            const newBal = parseFloat(balanceSpan.textContent) || 0;
            if (!isNaN(newBal)) {
                window.globalBalance = newBal;
                moneyUpdateButtonState();
            }
        });
        observer.observe(balanceSpan, { characterData: true, childList: true, subtree: true });
    }

    console.log('✅ Денежный кейс загружен. Всего предметов:', window.MONEY_CASE_DATA.length);
});