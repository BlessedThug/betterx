(function () {
    // ============ DOM ============
    const lobbyView       = document.getElementById('lobby-view');
    const gameView        = document.getElementById('game-view');

    const lobbiesListEl   = document.getElementById('lobbies-list');
    const lobbiesCountEl  = document.getElementById('lobbies-count');
    const onlineCountEl   = document.getElementById('online-count');

    const createLobbyBtn  = document.getElementById('create-lobby-btn');
    const createModal     = document.getElementById('create-modal');
    const createBetInput  = document.getElementById('create-bet-input');
    const createInvList   = document.getElementById('create-inventory-list');
    const confirmCreateBtn= document.getElementById('confirm-create-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');

    const joinModal       = document.getElementById('join-modal');
    const joinOppGameIcon = document.getElementById('join-opp-game-icon');
    const joinOppGameName = document.getElementById('join-opp-game-name');
    const joinOppNameEl   = document.getElementById('join-opp-name');
    const joinOppBetEl    = document.getElementById('join-opp-bet');
    const joinBetInput    = document.getElementById('join-bet-input');
    const joinInvList     = document.getElementById('join-inventory-list');
    const joinChanceEl    = document.getElementById('join-chance-preview');
    const joinRangeHintEl = document.getElementById('join-range-hint');
    const confirmJoinBtn  = document.getElementById('confirm-join-btn');
    const cancelJoinBtn   = document.getElementById('cancel-join-btn');

    const waitingModal    = document.getElementById('waiting-modal');
    const waitingGameEl   = document.getElementById('waiting-game');
    const waitingBetEl    = document.getElementById('waiting-bet');
    const cancelWaitingBtn= document.getElementById('cancel-waiting-btn');

    const leaveBtn        = document.getElementById('leave-btn');
    const rollBtn         = document.getElementById('roll-btn');
    const duelTitleEl     = document.getElementById('duel-title');
    const diceArenaEl     = document.getElementById('dice-arena');
    const raceArenaEl     = document.getElementById('race-arena');
    const bjArenaEl       = document.getElementById('blackjack-arena');

    // Dice UI
    const youDiceEl       = document.getElementById('you-dice');
    const oppDiceEl       = document.getElementById('opp-dice');
    const youNameEl       = document.getElementById('you-name');
    const oppNameEl       = document.getElementById('opp-name');
    const youBetDisplay   = document.getElementById('you-bet-display');
    const oppBetDisplay   = document.getElementById('opp-bet-display');
    const youChanceEl     = document.getElementById('you-chance');
    const oppChanceEl     = document.getElementById('opp-chance');

    // Race UI
    const raceYouName     = document.getElementById('race-you-name');
    const raceOppName     = document.getElementById('race-opp-name');
    const raceYouBet      = document.getElementById('race-you-bet');
    const raceOppBet      = document.getElementById('race-opp-bet');
    const raceYouChance   = document.getElementById('race-you-chance');
    const raceOppChance   = document.getElementById('race-opp-chance');
    const raceYouRunner   = document.getElementById('race-you-runner');
    const raceOppRunner   = document.getElementById('race-opp-runner');
    const raceLaneYou     = document.querySelector('.race-lane-you');
    const raceLaneOpp     = document.querySelector('.race-lane-opp');

    // Blackjack UI
    const bjYouNameEl     = document.getElementById('bj-you-name');
    const bjOppNameEl     = document.getElementById('bj-opp-name');
    const bjYouBetEl      = document.getElementById('bj-you-bet');
    const bjOppBetEl      = document.getElementById('bj-opp-bet');
    const bjYouCardsEl    = document.getElementById('bj-you-cards');
    const bjOppCardsEl    = document.getElementById('bj-opp-cards');
    const bjYouScoreEl    = document.getElementById('bj-you-score');
    const bjOppScoreEl    = document.getElementById('bj-opp-score');
    const bjActionsEl     = document.getElementById('bj-actions');
    const bjHitBtn        = document.getElementById('bj-hit-btn');
    const bjStandBtn      = document.getElementById('bj-stand-btn');

    const bankValueEl     = document.getElementById('bank-value');
    const duelMessage     = document.getElementById('duel-message');
    const duelStatus      = document.getElementById('duel-status');

    const balanceEl       = document.getElementById('bal-header');

    // ============ РЕЕСТР ИГР ============
    const GAME_TYPES = {
        dice:      { icon: '🎲', name: 'Кости' },
        race:      { icon: '🏁', name: 'Гонки' },
        blackjack: { icon: '🃏', name: 'Блэкджек' }
    };

    function gameIcon(gameId) {
        return (GAME_TYPES[gameId] && GAME_TYPES[gameId].icon) || '🎮';
    }
    function gameName(gameId) {
        return (GAME_TYPES[gameId] && GAME_TYPES[gameId].name) || 'Игра';
    }

    // ============ СОСТОЯНИЕ ============
    let lobbies = [];
    let lobbyIdCounter = 1;
    let lobbyAddInterval = null;
    let lobbyRemoveInterval = null;
    let onlineCount = 0;
    let activeFilter = 'all';

    let selectedCreateItem = null;
    let selectedCreateGame = 'dice';
    let selectedJoinItem = null;
    let joiningLobby = null;
    let currentGame = null;
    let isRolling = false;
    let raceTimer = null;
    let botStartTimeout = null;

    // Blackjack state
    let bjDeck = [];
    let bjYouHand = [];
    let bjOppHand = [];
    let bjBotRevealed = false;
    let bjPhase = 'idle';
    let bjActionTimer = null;

    const RAKE = 0.05;
    const BOT_ITEM_CHANCE = 0.10;

    // ============ ДОПУСК ПО СТАВКАМ (±20%) ============
    const BET_TOLERANCE = 0.20;
    const BET_RATIO_MAX = 1 / (1 - BET_TOLERANCE); // 1.25

    function isBetWithinTolerance(a, b) {
        if (!isFinite(a) || !isFinite(b)) return false;
        if (a <= 0 || b <= 0) return false;
        return Math.max(a, b) <= Math.min(a, b) * BET_RATIO_MAX;
    }

    function getBetBounds(oppBet) {
        return {
            min: Math.ceil(oppBet / BET_RATIO_MAX),
            max: Math.floor(oppBet * BET_RATIO_MAX)
        };
    }

    const DICE_FACE_MAP = {
        1: ['p5'], 2: ['p1','p9'], 3: ['p1','p5','p9'],
        4: ['p1','p3','p7','p9'], 5: ['p1','p3','p5','p7','p9'],
        6: ['p1','p3','p4','p6','p7','p9']
    };

    // ============ УТИЛИТЫ ============
    function formatMoney(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(2).replace('.00', '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.0', '') + 'k';
        return Math.round(n).toLocaleString('ru-RU');
    }

    function initBalance() {
        if (typeof window.globalBalance === 'undefined') {
            const saved = localStorage.getItem('userBalance');
            window.globalBalance = saved !== null && !isNaN(parseFloat(saved)) ? parseFloat(saved) : 0;
        }
        updateBalanceDisplay();
    }

    function updateBalanceDisplay() {
        if (balanceEl) balanceEl.textContent = (window.globalBalance || 0).toFixed(2);
    }

    function saveBalance() {
        try { localStorage.setItem('userBalance', (window.globalBalance || 0).toString()); } catch (e) {}
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ============ ВОЗВРАТ ПРЕДМЕТА ============
    function returnItemToInventory(item) {
        if (!item || !window.InventoryManager) return;
        try {
            window.InventoryManager.addItem(item.name, item.image, item.tier, item.price);
        } catch (e) {
            console.error('Не удалось вернуть предмет:', e);
        }
    }

    // ============ ПУЛ ПРЕДМЕТОВ БОТА ============
    function getBotItemPool() {
        const pool = [];
        if (Array.isArray(window.ITEMS_CASE_DATA)) pool.push(...window.ITEMS_CASE_DATA);
        if (Array.isArray(window.GAMES_CASE_DATA)) pool.push(...window.GAMES_CASE_DATA);
        return pool;
    }

    function pickBotItemNearBet(betValue) {
        const pool = getBotItemPool();
        if (pool.length === 0) return null;
        const filtered = pool.filter(it => isBetWithinTolerance(it.price, betValue));
        if (filtered.length === 0) return null;
        const it = pickRandom(filtered);
        return { name: it.name, image: it.image, tier: it.tier, price: it.price };
    }

    // ============ КУБИК ============
    function renderDiceFace(diceEl, value) {
        let html = '';
        for (let i = 1; i <= 9; i++) html += `<div class="dot p${i}"></div>`;
        diceEl.innerHTML = html;
        (DICE_FACE_MAP[value] || []).forEach(pos => {
            const dot = diceEl.querySelector('.' + pos);
            if (dot) dot.classList.add('on');
        });
    }
    function renderRandomDiceFace(diceEl) {
        renderDiceFace(diceEl, randomInt(1, 6));
    }

    // ============ НИКИ ============
    const NICKNAMES = [
        'Azure_Blade','Black_Storm','Crimson_Fury','Cyber_Wraith','Dark_Ember',
        'Dawn_Breaker','Diamond_Edge','Doom_Bringer','Dragon_Fire','Dread_Naught',
        'Elite_Sniper','Eternal_Flame','Fallen_Angel','Flame_Thrower','Frost_Giant',
        'Ghost_Recon','Golden_Hawk','Hell_Fire_42','High_Voltage','Holy_Knight',
        'Inferno_Blaze','Iron_Will','Jade_Emperor','Jungle_King','Krypton_Force',
        'Lone_Wolf_13','Midnight_Raven','Mystic_Storm','Necro_Mancer','Night_Shadow',
        'Phantom_Reaper','Power_Player','Quick_Silver','Red_Devil_07','Rocket_Man',
        'FrostBite','ShadowMorph','SteelEagle','BlazeRunner','CrystalShard',
        'DuskReaper','EmberWolf','GlacialTide','HawkEye_99','IronSoul',
        'KrakenRise','LunarFox','Nebula_42','OnyxFang','QuantumFox',
        'vlad_k26','shadow_reaper','katya.smirnova','alex_gaming99','cyber_ghost',
        'masha_fox','pixel_art','dima.volkov','neon_pulse','anastasia_r',
        'toxic_vibe','sergey.k','alpha_wolf','lisa_sweet','night_walker',
        'Valkyrie_6','Wraith_77','Xenon_5','Zenith_3','ApexHunter',
        'Blitz_44','Cipher_9','Delta_One','GammaRay','Joker_66',
        'Matrix_99','Nova_Star','Phoenix_Ash','Quasar_77','Sirius_12',
        'Titan_55','North_Wind','Iron_Falcon','Dark_Phoenix','Storm_Bringer',
        'Omega_Force','Berserker_Rage','Headshot_Harry','Savage_Beast','Fluffy_Kitten',
        'Sleepy_Panda','Panda_King','Choco_Cookie','RNG_God','Just_Luck',
        'Lucky_Seven','Unlucky_13','NightOwl','EarlyBird','GymRat',
        'TravelAddict','BookWorm','MovieBuff','StarGazer','MoonWalker',
        'PixelWarrior','RetroGamer','SpeedRunner','EsportsLegend','LuckyCharm',
        'DiamondHands','GoldenEagle','SilverFox','PhoenixRising','DragonSoul',
        'NightRaven','IceQueen','CyberPunk','NeonRider','StarLord',
        'CodeCrusader','ByteMe','Error404','Crystal_Clear','Midnight_Star',
        'Silent_Echo','Broken_Dream','Lost_Soul','Dark_Knight','White_Wizard'
    ];

    function randomNickname() {
        return pickRandom(NICKNAMES) + (Math.random() < 0.15 ? randomInt(1, 99) : '');
    }

    function randomBetAmount() {
        const r = Math.random() * 100;
        if (r < 40) return randomInt(50, 500);
        if (r < 70) return randomInt(500, 2500);
        if (r < 88) return randomInt(2500, 10000);
        if (r < 97) return randomInt(10000, 40000);
        return randomInt(40000, 120000);
    }

    function makeLobby() {
        const r = Math.random();
        let game;
        if (r < 0.4) game = 'dice';
        else if (r < 0.7) game = 'race';
        else game = 'blackjack';

        let bet = randomBetAmount();
        let item = null;

        if (Math.random() < BOT_ITEM_CHANCE) {
            const botItem = pickBotItemNearBet(bet); // случайный предмет в радиусе от ставки
            if (botItem) {
                item = botItem;
                bet = botItem.price;
            }
        }

        return { id: lobbyIdCounter++, name: randomNickname(), bet, item, game };
    }

    // ============ ШАНС ============
    function calcPlayerWinChance(playerBetValue, oppBetValue) {
        const sum = playerBetValue + oppBetValue;
        if (sum <= 0) return 0.5;
        return playerBetValue / sum;
    }

    // ============ ЛОББИ ============
    function renderLobbies() {
        const visible = activeFilter === 'all'
            ? lobbies
            : lobbies.filter(l => l.game === activeFilter);

        if (visible.length === 0) {
            lobbiesListEl.innerHTML = '<div class="lobbies-empty">Пока нет открытых дуэлей... Скоро появятся!</div>';
            lobbiesCountEl.textContent = '0';
            return;
        }

        lobbiesListEl.innerHTML = '';
        visible.forEach(lobby => {
            const card = document.createElement('div');
            card.className = 'lobby-card';
            card.dataset.id = lobby.id;

            const initial = lobby.name.charAt(0).toUpperCase();
            const icon = gameIcon(lobby.game);
            const gname = gameName(lobby.game);

            let itemBadge = '';
            if (lobby.item) {
                itemBadge = `<div class="lobby-item-badge"><img src="${lobby.item.image}" onerror="this.src='../img/logo.png'">${lobby.item.name}</div>`;
            }

            card.innerHTML = `
                <div class="lobby-card-header">
                    <div class="lobby-avatar">${initial}</div>
                    <div class="lobby-nick">${lobby.name}</div>
                </div>
                <div class="lobby-game-row">
                    <span class="lobby-game-icon">${icon}</span>
                    <span class="lobby-game-name">${gname}</span>
                </div>
                <div class="lobby-card-body">
                    <div>
                        <div class="lobby-bet-label">СТАВКА</div>
                        <div class="lobby-bet-value">${lobby.bet.toLocaleString('ru-RU')} ₽</div>
                        ${itemBadge}
                    </div>
                    <button class="lobby-join-btn">ИГРАТЬ</button>
                </div>
            `;

            card.addEventListener('click', () => openJoinModal(lobby));
            lobbiesListEl.appendChild(card);
        });

        lobbiesCountEl.textContent = visible.length.toString();
    }

    function addRandomLobby() {
        if (lobbies.length >= 21) return;
        lobbies.push(makeLobby());
        renderLobbies();
    }

    function removeRandomLobby() {
        if (lobbies.length <= 4) return;
        const idx = Math.floor(Math.random() * lobbies.length);
        lobbies.splice(idx, 1);
        renderLobbies();
    }

    function startLobbySimulation() {
        if (lobbies.length === 0) {
            for (let i = 0; i < randomInt(8, 12); i++) lobbies.push(makeLobby());
            renderLobbies();
        }

        onlineCount = randomInt(180, 420);
        onlineCountEl.textContent = onlineCount.toString();

        if (lobbyAddInterval) clearInterval(lobbyAddInterval);
        lobbyAddInterval = setInterval(() => {
            if (Math.random() < 0.7) addRandomLobby();
        }, 3500);

        if (lobbyRemoveInterval) clearInterval(lobbyRemoveInterval);
        lobbyRemoveInterval = setInterval(() => {
            if (Math.random() < 0.35) removeRandomLobby();
        }, 7000);

        setInterval(() => {
            onlineCount += randomInt(-8, 12);
            if (onlineCount < 120) onlineCount = 120;
            onlineCountEl.textContent = onlineCount.toString();
        }, 5000);
    }

    function stopLobbySimulation() {
        if (lobbyAddInterval) { clearInterval(lobbyAddInterval); lobbyAddInterval = null; }
        if (lobbyRemoveInterval) { clearInterval(lobbyRemoveInterval); lobbyRemoveInterval = null; }
    }

    // ============ ИНВЕНТАРЬ ============
    function getInventory() {
        return window.InventoryManager ? window.InventoryManager.getInventory() : [];
    }

    function renderInventoryList(container, onSelect) {
        const inventory = getInventory();
        if (!inventory || inventory.length === 0) {
            container.innerHTML = '<div class="inventory-empty">🎒 Нет предметов в инвентаре</div>';
            return;
        }
        container.innerHTML = '';
        inventory.forEach(item => {
            const row = document.createElement('div');
            row.className = 'inv-item';
            row.dataset.id = item.id;

            let color = '#888';
            if (item.tier === 'tier1') color = '#3880ec';
            else if (item.tier === 'tier2') color = '#7e1a7e';
            else if (item.tier === 'tier3') color = '#f14df1';
            else if (item.tier === 'tier4') color = '#dd3131';
            else if (item.tier === 'tier5') color = '#f7f723';

            row.innerHTML = `
                <img class="inv-item-img" src="${item.image}" onerror="this.src='../img/logo.png'">
                <div class="inv-item-info">
                    <div class="inv-item-name" style="color:${color}">${item.name}</div>
                    <div class="inv-item-price">${item.price.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div class="inv-item-check">→</div>
            `;

            row.addEventListener('click', () => onSelect(item));
            container.appendChild(row);
        });
    }

    function highlightSelectedInv(container, item) {
        container.querySelectorAll('.inv-item').forEach(row => {
            if (item && row.dataset.id === item.id) row.classList.add('selected');
            else row.classList.remove('selected');
        });
    }

    // ============ МОДАЛКИ ============
    function openCreateModal() {
        selectedCreateItem = null;
        selectedCreateGame = 'dice';
        createBetInput.value = '';
        createBetInput.disabled = false;
        createBetInput.style.opacity = '1';

        document.querySelectorAll('#create-game-pick .modal-game-pick-item').forEach(el => {
            el.classList.toggle('active', el.dataset.game === 'dice');
        });

        renderInventoryList(createInvList, (item) => {
            if (selectedCreateItem && selectedCreateItem.id === item.id) {
                selectedCreateItem = null;
                createBetInput.disabled = false;
                createBetInput.style.opacity = '1';
            } else {
                selectedCreateItem = item;
                createBetInput.disabled = true;
                createBetInput.style.opacity = '0.5';
                createBetInput.value = '';
            }
            highlightSelectedInv(createInvList, selectedCreateItem);
        });
        createModal.style.display = 'flex';
    }

    function closeCreateModal() {
        createModal.style.display = 'none';
        selectedCreateItem = null;
    }

    function openJoinModal(lobby) {
        joiningLobby = lobby;
        selectedJoinItem = null;

        const bounds = getBetBounds(lobby.bet);

        joinOppGameIcon.textContent = gameIcon(lobby.game);
        joinOppGameName.textContent = gameName(lobby.game);
        joinOppNameEl.textContent = lobby.name;

        let oppBetText = lobby.bet.toLocaleString('ru-RU') + ' ₽';
        if (lobby.item) oppBetText += ` · 🎒 ${lobby.item.name}`;
        joinOppBetEl.textContent = oppBetText;

        joinBetInput.value = lobby.bet;
        joinBetInput.min = Math.max(10, bounds.min);
        joinBetInput.max = bounds.max;
        joinBetInput.disabled = false;
        joinBetInput.style.opacity = '1';

        renderInventoryList(joinInvList, (item) => {
            if (selectedJoinItem && selectedJoinItem.id === item.id) {
                selectedJoinItem = null;
                joinBetInput.disabled = false;
                joinBetInput.style.opacity = '1';
                joinBetInput.value = lobby.bet;
            } else {
                selectedJoinItem = item;
                joinBetInput.disabled = true;
                joinBetInput.style.opacity = '0.5';
            }
            highlightSelectedInv(joinInvList, selectedJoinItem);
            updateJoinChancePreview();
        });

        updateJoinChancePreview();
        joinModal.style.display = 'flex';
    }

    function closeJoinModal() {
        joinModal.style.display = 'none';
        joiningLobby = null;
        selectedJoinItem = null;
    }

    function updateJoinChancePreview() {
        if (!joiningLobby) return;

        let playerBetValue;
        if (selectedJoinItem) playerBetValue = selectedJoinItem.price;
        else playerBetValue = parseFloat(joinBetInput.value) || 0;

        const oppBet = joiningLobby.bet;
        const bounds = getBetBounds(oppBet);

        if (joinRangeHintEl) {
            joinRangeHintEl.textContent =
                `Допустимый диапазон: ${bounds.min.toLocaleString('ru-RU')} – ${bounds.max.toLocaleString('ru-RU')} ₽`;
            joinRangeHintEl.classList.remove('danger');
        }

        if (playerBetValue <= 0) {
            joinChanceEl.textContent = '—';
            joinChanceEl.style.color = '';
            confirmJoinBtn.disabled = true;
            return;
        }

        if (!isBetWithinTolerance(playerBetValue, oppBet)) {
            joinChanceEl.textContent = '❌ Вне диапазона';
            joinChanceEl.style.color = '#ff5555';
            confirmJoinBtn.disabled = true;
            if (joinRangeHintEl) joinRangeHintEl.classList.add('danger');
            return;
        }

        joinChanceEl.style.color = '';
        confirmJoinBtn.disabled = false;
        const p = calcPlayerWinChance(playerBetValue, oppBet);
        joinChanceEl.textContent = (p * 100).toFixed(1) + '%';
    }

    // ============ КОСТИ ============
    function determineDiceValues(playerWins) {
        let winnerValue, loserValue;
        if (Math.random() < 0.65) {
            winnerValue = randomInt(5, 6);
            loserValue = randomInt(1, Math.min(4, winnerValue - 1));
        } else {
            winnerValue = randomInt(4, 6);
            loserValue = randomInt(1, winnerValue - 1);
        }
        return playerWins
            ? { player: winnerValue, opponent: loserValue }
            : { player: loserValue, opponent: winnerValue };
    }

    // ============ ГОНКИ ============
    function generateRaceProgress(totalTicks) {
        const deltas = [];
        for (let i = 0; i < totalTicks; i++) {
            let s = 0.6 + Math.random() * 0.9;
            const r = Math.random();
            if (r < 0.06) s *= 0.3;
            else if (r < 0.12) s *= 1.8;
            deltas.push(s);
        }
        return deltas;
    }
    function cumsum(arr) {
        const out = []; let s = 0;
        for (const v of arr) { s += v; out.push(s); }
        return out;
    }
    function normalizeSeq(seq, finalValue) {
        const max = seq[seq.length - 1];
        if (max <= 0) return seq.map(() => 0);
        return seq.map(v => (v / max) * finalValue);
    }
    function computeRaceSequences(totalTicks, playerWins) {
        const youCum = cumsum(generateRaceProgress(totalTicks));
        const oppCum = cumsum(generateRaceProgress(totalTicks));
        const youTotal = youCum[youCum.length - 1];
        const oppTotal = oppCum[oppCum.length - 1];
        const naturalYouWins = youTotal > oppTotal;

        let winnerCum, loserCum;
        if (naturalYouWins === playerWins) {
            winnerCum = playerWins ? youCum : oppCum;
            loserCum  = playerWins ? oppCum : youCum;
        } else {
            winnerCum = playerWins ? oppCum : youCum;
            loserCum  = playerWins ? youCum : oppCum;
        }
        const loserFinal = 92 + Math.random() * 6;
        const winnerPos = normalizeSeq(winnerCum, 100);
        const loserPos  = normalizeSeq(loserCum, loserFinal);

        return playerWins
            ? { youPos: winnerPos, oppPos: loserPos }
            : { youPos: loserPos, oppPos: winnerPos };
    }

    // ============ БЛЭКДЖЕК ============
    function createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        const deck = [];
        for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s });
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    function cardValue(card) {
        if (card.rank === 'A') return 11;
        if (['J','Q','K'].includes(card.rank)) return 10;
        return parseInt(card.rank, 10);
    }

    function handScore(hand) {
        let score = 0, aces = 0;
        for (const c of hand) {
            score += cardValue(c);
            if (c.rank === 'A') aces++;
        }
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    function renderCard(card, hidden = false) {
        const el = document.createElement('div');
        el.className = 'bj-card';
        if (hidden) {
            el.classList.add('back');
            return el;
        }
        const isRed = card.suit === '♥' || card.suit === '♦';
        if (isRed) el.classList.add('red');
        el.innerHTML = `
            <div class="bj-rank">${card.rank}</div>
            <div class="bj-suit">${card.suit}</div>
        `;
        return el;
    }

    function renderBlackjackHands() {
        bjYouCardsEl.innerHTML = '';
        bjOppCardsEl.innerHTML = '';

        bjYouHand.forEach(c => bjYouCardsEl.appendChild(renderCard(c)));

        bjOppHand.forEach((c, i) => {
            const hidden = !bjBotRevealed && i === 1;
            bjOppCardsEl.appendChild(renderCard(c, hidden));
        });

        const youScore = handScore(bjYouHand);
        bjYouScoreEl.textContent = youScore;
        bjYouScoreEl.classList.toggle('bust', youScore > 21);

        if (bjBotRevealed) {
            const oppScore = handScore(bjOppHand);
            bjOppScoreEl.textContent = oppScore;
            bjOppScoreEl.classList.toggle('bust', oppScore > 21);
        } else {
            const first = bjOppHand[0];
            bjOppScoreEl.textContent = first ? cardValue(first) : 0;
            bjOppScoreEl.classList.remove('bust');
        }
    }

    // Характер бота (не показывается в UI)
    function pickBotCharacter() {
        const r = Math.random();
        if (r < 0.35) return 'cautious';
        if (r < 0.80) return 'normal';
        return 'risky';
    }

    // ============ СТАРТ ДУЭЛИ ============
    function startDuel(config) {
        currentGame = {
            game: config.game || 'dice',
            playerBetValue: config.playerBet.value,
            playerItem: config.playerBet.item || null,
            opponentName: config.opponentName,
            opponentBetValue: config.opponentBet,
            opponentItem: config.opponentItem || null,
            playerStarts: Math.random() < 0.5,
            botCharacter: pickBotCharacter(),
            phase: 'ready'
        };

        lobbyView.style.display = 'none';
        gameView.style.display = 'block';
        stopLobbySimulation();

        duelTitleEl.textContent = 'ДУЭЛЬ · ' + gameName(currentGame.game).toUpperCase();

        diceArenaEl.style.display = 'none';
        raceArenaEl.style.display = 'none';
        bjArenaEl.style.display = 'none';

        if (currentGame.game === 'race') raceArenaEl.style.display = 'block';
        else if (currentGame.game === 'blackjack') bjArenaEl.style.display = 'block';
        else diceArenaEl.style.display = 'grid';

        const p = calcPlayerWinChance(currentGame.playerBetValue, currentGame.opponentBetValue);
        const youItemSuffix = currentGame.playerItem ? ` · 🎒 ${currentGame.playerItem.name}` : '';
        const oppItemSuffix = currentGame.opponentItem ? ` · 🎒 ${currentGame.opponentItem.name}` : '';

        bankValueEl.textContent = (currentGame.playerBetValue + currentGame.opponentBetValue).toLocaleString('ru-RU') + ' ₽';
        duelMessage.textContent = '';
        duelMessage.className = 'duel-message';

        if (currentGame.game === 'race') {
            raceYouName.textContent = 'Вы';
            raceOppName.textContent = currentGame.opponentName;
            raceYouBet.textContent = config.playerBet.value.toLocaleString('ru-RU') + ' ₽' + youItemSuffix;
            raceOppBet.textContent = config.opponentBet.toLocaleString('ru-RU') + ' ₽' + oppItemSuffix;
            raceYouChance.innerHTML = `Победа: <b>${(p * 100).toFixed(1)}%</b>`;
            raceOppChance.innerHTML = `Победа: <b>${((1 - p) * 100).toFixed(1)}%</b>`;

            raceYouRunner.style.left = '2%';
            raceOppRunner.style.left = '2%';
            raceYouRunner.className = 'race-runner race-runner-you';
            raceOppRunner.className = 'race-runner race-runner-opp';
            raceLaneYou.classList.remove('race-active');
            raceLaneOpp.classList.remove('race-active');
        } else if (currentGame.game === 'blackjack') {
            bjYouNameEl.textContent = 'Вы';
            bjOppNameEl.textContent = currentGame.opponentName;
            bjYouBetEl.textContent = config.playerBet.value.toLocaleString('ru-RU') + ' ₽' + youItemSuffix;
            bjOppBetEl.textContent = config.opponentBet.toLocaleString('ru-RU') + ' ₽' + oppItemSuffix;

            bjYouCardsEl.innerHTML = '';
            bjOppCardsEl.innerHTML = '';
            bjYouScoreEl.textContent = '0';
            bjOppScoreEl.textContent = '0';
            bjYouScoreEl.classList.remove('bust');
            bjOppScoreEl.classList.remove('bust');
            bjActionsEl.style.display = 'none';
        } else {
            youNameEl.textContent = 'Вы';
            oppNameEl.textContent = currentGame.opponentName;
            youBetDisplay.textContent = config.playerBet.value.toLocaleString('ru-RU') + ' ₽' + youItemSuffix;
            oppBetDisplay.textContent = config.opponentBet.toLocaleString('ru-RU') + ' ₽' + oppItemSuffix;
            youChanceEl.innerHTML = `Победа: <b>${(p * 100).toFixed(1)}%</b>`;
            oppChanceEl.innerHTML = `Победа: <b>${((1 - p) * 100).toFixed(1)}%</b>`;

            renderDiceFace(youDiceEl, 1);
            renderDiceFace(oppDiceEl, 1);
            youDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));
            oppDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));
            document.querySelectorAll('.dice-side').forEach(el => el.classList.remove('winner', 'loser'));
        }

        const btnLabel = currentGame.game === 'race' ? '🏁 НАЧАТЬ ГОНКУ'
                       : currentGame.game === 'blackjack' ? '🃏 РАЗДАТЬ КАРТЫ'
                       : '🎲 БРОСИТЬ КУБИКИ';

        if (currentGame.game === 'blackjack') {
            duelStatus.textContent = '🎯 Раздача карт';
            duelStatus.style.color = '#4CAF50';
            rollBtn.textContent = btnLabel;
            rollBtn.disabled = false;
            rollBtn.classList.remove('bot-turn');
            rollBtn.onclick = onRollClick;
            isRolling = false;
            return;
        }

        if (currentGame.playerStarts) {
            duelStatus.textContent = '🎯 Первым бросаете ВЫ';
            duelStatus.style.color = '#4CAF50';
            rollBtn.textContent = btnLabel;
            rollBtn.disabled = false;
            rollBtn.classList.remove('bot-turn');
            rollBtn.onclick = onRollClick;
            isRolling = false;
        } else {
            duelStatus.textContent = `⚡ Начинает ${currentGame.opponentName}...`;
            duelStatus.style.color = '#ff8a73';
            rollBtn.textContent = currentGame.game === 'race' ? '🏁 СОПЕРНИК СТАРТУЕТ...' : '🎲 СОПЕРНИК БРОСАЕТ...';
            rollBtn.disabled = true;
            rollBtn.classList.add('bot-turn');
            isRolling = true;

            if (botStartTimeout) clearTimeout(botStartTimeout);
            botStartTimeout = setTimeout(() => {
                botStartTimeout = null;
                if (!currentGame || currentGame.playerStarts) return;
                isRolling = false;
                rollBtn.classList.remove('bot-turn');
                if (currentGame.game === 'race') startRace();
                else rollDice();
            }, 1500);
        }
    }

    function onRollClick() {
        if (isRolling || !currentGame) return;
        if (currentGame.game === 'blackjack') startBlackjack();
        else if (currentGame.game === 'race') startRace();
        else rollDice();
    }

    // ============ КОСТИ: РАУНД ============
    function rollDice() {
        isRolling = true;
        rollBtn.disabled = true;
        rollBtn.textContent = '🎲 БРОСАЕМ...';
        duelStatus.textContent = 'Кубики в полёте...';
        duelStatus.style.color = '';
        duelMessage.textContent = '';

        youDiceEl.classList.add('rolling');
        oppDiceEl.classList.add('rolling');

        const rollInterval = setInterval(() => {
            renderRandomDiceFace(youDiceEl);
            renderRandomDiceFace(oppDiceEl);
        }, 70);

        setTimeout(() => {
            clearInterval(rollInterval);
            youDiceEl.classList.remove('rolling');
            oppDiceEl.classList.remove('rolling');
            finishRoll();
        }, 1300);
    }

    function finishRoll() {
        const p = calcPlayerWinChance(currentGame.playerBetValue, currentGame.opponentBetValue);
        const playerWins = Math.random() < p;
        const dice = determineDiceValues(playerWins);
        renderDiceFace(youDiceEl, dice.player);
        renderDiceFace(oppDiceEl, dice.opponent);

        youDiceEl.classList.add('result-pop');
        oppDiceEl.classList.add('result-pop');
        setTimeout(() => {
            youDiceEl.classList.remove('result-pop');
            oppDiceEl.classList.remove('result-pop');
        }, 550);

        setTimeout(() => {
            const youSide = document.querySelector('.dice-side-you');
            const oppSide = document.querySelector('.dice-side-opp');
            if (playerWins) {
                youSide.classList.add('winner');
                oppSide.classList.add('loser');
            } else {
                oppSide.classList.add('winner');
                youSide.classList.add('loser');
            }
            resolveDuel(playerWins, 'dice');
        }, 450);
    }

    // ============ ГОНКИ: РАУНД ============
    function startRace() {
        isRolling = true;
        rollBtn.disabled = true;
        rollBtn.textContent = '🏁 ГОНКА ИДЁТ...';
        duelStatus.textContent = 'И кони понеслись!';
        duelStatus.style.color = '';
        duelMessage.textContent = '';

        raceLaneYou.classList.add('race-active');
        raceLaneOpp.classList.add('race-active');

        const p = calcPlayerWinChance(currentGame.playerBetValue, currentGame.opponentBetValue);
        const playerWins = Math.random() < p;

        const totalTicks = 34;
        const tickMs = 90;
        const { youPos, oppPos } = computeRaceSequences(totalTicks, playerWins);

        raceYouRunner.style.left = '2%';
        raceOppRunner.style.left = '2%';

        let tick = 0;
        if (raceTimer) clearInterval(raceTimer);
        raceTimer = setInterval(() => {
            if (tick >= totalTicks) {
                clearInterval(raceTimer);
                raceTimer = null;
                finishRace(playerWins);
                return;
            }
            raceYouRunner.style.left = (2 + youPos[tick] * 0.86) + '%';
            raceOppRunner.style.left = (2 + oppPos[tick] * 0.86) + '%';
            tick++;
        }, tickMs);
    }

    function finishRace(playerWins) {
        raceLaneYou.classList.remove('race-active');
        raceLaneOpp.classList.remove('race-active');

        if (playerWins) {
            raceYouRunner.style.left = '88%';
            raceOppRunner.style.left = '82%';
            raceYouRunner.classList.add('race-winner');
            raceOppRunner.classList.add('race-loser');
        } else {
            raceOppRunner.style.left = '88%';
            raceYouRunner.style.left = '82%';
            raceOppRunner.classList.add('race-winner');
            raceYouRunner.classList.add('race-loser');
        }

        setTimeout(() => resolveDuel(playerWins, 'race'), 800);
    }

    // ============ БЛЭКДЖЕК: РАУНД ============
    function startBlackjack() {
        isRolling = true;
        rollBtn.disabled = true;
        rollBtn.textContent = '🃏 РАЗДАЁМ...';
        duelStatus.textContent = 'Раздача карт';
        duelStatus.style.color = '';
        duelMessage.textContent = '';

        bjDeck = createDeck();
        bjYouHand = [];
        bjOppHand = [];
        bjBotRevealed = false;
        bjPhase = 'idle';

        const dealSequence = [
            { target: 'you' }, { target: 'opp' },
            { target: 'you' }, { target: 'opp' }
        ];

        let idx = 0;
        const dealNext = () => {
            if (idx >= dealSequence.length) {
                bjPhase = 'player';
                isRolling = false;
                duelStatus.textContent = 'Ваш ход';
                duelStatus.style.color = '#4CAF50';
                rollBtn.style.display = 'none';
                bjActionsEl.style.display = 'flex';
                bjHitBtn.disabled = false;
                bjStandBtn.disabled = false;
                checkPlayerBlackjack();
                return;
            }

            const step = dealSequence[idx];
            const card = bjDeck.pop();

            if (step.target === 'you') bjYouHand.push(card);
            else bjOppHand.push(card);

            renderBlackjackHands();
            idx++;
            bjActionTimer = setTimeout(dealNext, 260);
        };

        dealNext();
    }

    function checkPlayerBlackjack() {
        if (handScore(bjYouHand) === 21) {
            duelStatus.textContent = '🎉 21! Автоматически';
            setTimeout(playerStand, 700);
        }
    }

    function playerHit() {
        if (bjPhase !== 'player') return;
        bjHitBtn.disabled = true;
        bjStandBtn.disabled = true;

        if (bjDeck.length === 0) bjDeck = createDeck();
        bjYouHand.push(bjDeck.pop());
        renderBlackjackHands();

        const score = handScore(bjYouHand);

        if (score > 21) {
            bjPhase = 'done';
            duelMessage.textContent = '💥 ПЕРЕБОР!';
            duelMessage.className = 'duel-message lose';
            duelStatus.textContent = 'Вы перебрали...';

            setTimeout(() => {
                bjActionsEl.style.display = 'none';
                bjBotRevealed = true;
                renderBlackjackHands();
                resolveDuel(false, 'blackjack');
            }, 900);
        } else if (score === 21) {
            duelStatus.textContent = '🎉 21! Автоматически';
            setTimeout(playerStand, 500);
        } else {
            bjHitBtn.disabled = false;
            bjStandBtn.disabled = false;
            duelStatus.textContent = `Ваш ход (${score})`;
        }
    }

    function playerStand() {
        if (bjPhase !== 'player') return;
        bjPhase = 'bot';
        bjHitBtn.disabled = true;
        bjStandBtn.disabled = true;
        bjActionsEl.style.display = 'none';
        duelStatus.textContent = `${currentGame.opponentName} думает...`;

        bjBotRevealed = true;
        renderBlackjackHands();

        setTimeout(botBlackjackTurn, 700);
    }

    function botBlackjackTurn() {
        if (!currentGame) return;

        const character = currentGame.botCharacter || 'normal';

        const playNext = () => {
            if (!currentGame) return;

            const oppScore = handScore(bjOppHand);
            const playerScore = handScore(bjYouHand);

            if (oppScore > 21) { finishBlackjack(); return; }
            if (playerScore > 21) { finishBlackjack(); return; }

            let shouldHit = false;

            if (oppScore < 17) {
                shouldHit = true;
            } else if (oppScore > playerScore) {
                shouldHit = false;
            } else if (oppScore === playerScore) {
                shouldHit = false;
            } else {
                const gap = playerScore - oppScore;

                if (gap >= 3) {
                    shouldHit = false;
                } else {
                    let hitChance;
                    if (character === 'cautious') hitChance = 0.30;
                    else if (character === 'risky') hitChance = 0.80;
                    else hitChance = 0.55;
                    shouldHit = Math.random() < hitChance;
                }
            }

            if (!shouldHit) {
                finishBlackjack();
                return;
            }

            if (bjDeck.length === 0) bjDeck = createDeck();
            bjOppHand.push(bjDeck.pop());
            renderBlackjackHands();

            if (handScore(bjOppHand) > 21) {
                bjActionTimer = setTimeout(finishBlackjack, 700);
            } else {
                bjActionTimer = setTimeout(playNext, 700);
            }
        };

        bjActionTimer = setTimeout(playNext, 700);
    }

    function finishBlackjack() {
        const youScore = handScore(bjYouHand);
        const oppScore = handScore(bjOppHand);

        let playerWins = false;
        let isPush = false;

        if (youScore > 21) {
            playerWins = false;
        } else if (oppScore > 21) {
            playerWins = true;
        } else if (youScore > oppScore) {
            playerWins = true;
        } else if (youScore < oppScore) {
            playerWins = false;
        } else {
            isPush = true;
            playerWins = false;
        }

        bjPhase = 'done';

        if (isPush) {
            if (currentGame.playerItem) {
                returnItemToInventory(currentGame.playerItem);
                currentGame.playerItem = null;
            } else {
                window.globalBalance += currentGame.playerBetValue;
            }
            saveBalance();
            updateBalanceDisplay();

            duelMessage.textContent = `🤝 ПУШ! ${youScore} против ${oppScore}. Ставка возвращена.`;
            duelMessage.className = 'duel-message';
            duelStatus.textContent = 'Ничья';
            duelStatus.style.color = '#ffb400';

            setTimeout(() => {
                rollBtn.style.display = '';
                rollBtn.textContent = '↩ ВЕРНУТЬСЯ В ЛОББИ';
                rollBtn.disabled = false;
                rollBtn.classList.remove('bot-turn');
                rollBtn.onclick = () => returnToLobby();
                isRolling = false;
            }, 400);

            return;
        }

        setTimeout(() => resolveDuel(playerWins, 'blackjack'), 200);
    }

    // ============ РАСЧЁТ ИСХОДА ============
    function resolveDuel(playerWins, gameType) {
        const betValue = currentGame.playerBetValue;
        const oppValue = currentGame.opponentBetValue;
        const playerItem = currentGame.playerItem;
        const opponentItem = currentGame.opponentItem;
        const label = gameType === 'race' ? '🏁'
                    : gameType === 'blackjack' ? '🃏'
                    : '🎲';

        if (playerWins) {
            if (playerItem) {
                returnItemToInventory(playerItem);
            } else {
                window.globalBalance += betValue;
            }

            let prizeText = '';
            if (opponentItem) {
                returnItemToInventory(opponentItem);
                prizeText = `предмет: ${opponentItem.name} (${formatMoney(opponentItem.price)} ₽)`;
            } else {
                const rakeAmount = oppValue * RAKE;
                const netWin = oppValue - rakeAmount;
                window.globalBalance += netWin;
                prizeText = `${formatMoney(netWin)} ₽ (комиссия ${formatMoney(rakeAmount)} ₽)`;
            }

            saveBalance();
            updateBalanceDisplay();

            duelMessage.innerHTML = `${label} ПОБЕДА! Приз: ${prizeText}. Своя ставка возвращена${playerItem ? ', предмет в инвентаре' : ''}.`;
            duelMessage.className = 'duel-message win';
            duelStatus.textContent = 'Раунд завершён';
            duelStatus.style.color = '#4CAF50';
        } else {
            const lostText = playerItem
                ? `предмет "${playerItem.name}" (${formatMoney(betValue)} ₽)`
                : `${betValue.toLocaleString('ru-RU')} ₽`;
            duelMessage.textContent = `${label} ПРОИГРЫШ. Вы теряете ${lostText}`;
            duelMessage.className = 'duel-message lose';
            duelStatus.textContent = 'Раунд завершён';
            duelStatus.style.color = '#ff5555';
        }

        rollBtn.style.display = '';
        rollBtn.textContent = '↩ ВЕРНУТЬСЯ В ЛОББИ';
        rollBtn.disabled = false;
        rollBtn.classList.remove('bot-turn');
        rollBtn.onclick = () => returnToLobby();
        isRolling = false;
    }

    function returnToLobby() {
        if (raceTimer) { clearInterval(raceTimer); raceTimer = null; }
        if (botStartTimeout) { clearTimeout(botStartTimeout); botStartTimeout = null; }
        if (bjActionTimer) { clearTimeout(bjActionTimer); bjActionTimer = null; }
        currentGame = null;
        isRolling = false;
        bjPhase = 'idle';

        gameView.style.display = 'none';
        lobbyView.style.display = 'block';

        rollBtn.style.display = '';
        rollBtn.classList.remove('bot-turn');
        rollBtn.onclick = onRollClick;

        bjActionsEl.style.display = 'none';

        startLobbySimulation();
        renderLobbies();
    }

    // ============ ОБРАБОТЧИКИ ============
    function attachHandlers() {
        document.querySelectorAll('.game-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.game-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.game;
                renderLobbies();
            });
        });

        createLobbyBtn.addEventListener('click', openCreateModal);
        cancelCreateBtn.addEventListener('click', closeCreateModal);

        document.querySelectorAll('#create-game-pick .modal-game-pick-item').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('#create-game-pick .modal-game-pick-item').forEach(x => x.classList.remove('active'));
                el.classList.add('active');
                selectedCreateGame = el.dataset.game;
            });
        });

        confirmCreateBtn.addEventListener('click', () => {
            let betValue;
            if (selectedCreateItem) betValue = selectedCreateItem.price;
            else betValue = parseFloat(createBetInput.value) || 0;
            if (betValue <= 0) return;

            if (selectedCreateItem) {
                const inv = getInventory();
                if (!inv.some(i => i.id === selectedCreateItem.id)) return;
                window.InventoryManager.removeItem(selectedCreateItem.id);
                startWaitingForOpponent({ value: betValue, item: selectedCreateItem, game: selectedCreateGame });
            } else {
                if (betValue > (window.globalBalance || 0)) {
                    alert('Недостаточно средств!');
                    return;
                }
                window.globalBalance -= betValue;
                saveBalance();
                updateBalanceDisplay();
                startWaitingForOpponent({ value: betValue, item: null, game: selectedCreateGame });
            }
            closeCreateModal();
        });

        cancelJoinBtn.addEventListener('click', closeJoinModal);
        joinBetInput.addEventListener('input', updateJoinChancePreview);

        document.querySelectorAll('.bet-adjust-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!joiningLobby) return;
                const factor = parseFloat(btn.dataset.factor);
                const bounds = getBetBounds(joiningLobby.bet);

                let target = Math.round(joiningLobby.bet * factor);
                target = Math.max(bounds.min, Math.min(bounds.max, target));
                target = Math.max(10, target);

                joinBetInput.value = target;
                if (selectedJoinItem) {
                    selectedJoinItem = null;
                    joinBetInput.disabled = false;
                    joinBetInput.style.opacity = '1';
                    highlightSelectedInv(joinInvList, null);
                }
                updateJoinChancePreview();
            });
        });

        confirmJoinBtn.addEventListener('click', () => {
            if (!joiningLobby) return;
            let playerBetValue, playerItem = null;
            if (selectedJoinItem) {
                playerBetValue = selectedJoinItem.price;
                playerItem = selectedJoinItem;
            } else {
                playerBetValue = parseFloat(joinBetInput.value) || 0;
            }
            if (playerBetValue <= 0) return;

            if (!isBetWithinTolerance(playerBetValue, joiningLobby.bet)) {
                const b = getBetBounds(joiningLobby.bet);
                alert(`Ставка должна быть в диапазоне ${b.min.toLocaleString('ru-RU')} – ${b.max.toLocaleString('ru-RU')} ₽`);
                return;
            }

            if (selectedJoinItem) {
                const inv = getInventory();
                if (!inv.some(i => i.id === selectedJoinItem.id)) return;
                window.InventoryManager.removeItem(selectedJoinItem.id);
            } else {
                if (playerBetValue > (window.globalBalance || 0)) {
                    alert('Недостаточно средств!');
                    return;
                }
                window.globalBalance -= playerBetValue;
                saveBalance();
                updateBalanceDisplay();
            }

            const opponentName = joiningLobby.name;
            const opponentBet = joiningLobby.bet;
            const opponentItem = joiningLobby.item;
            const gameId = joiningLobby.game;

            lobbies = lobbies.filter(l => l.id !== joiningLobby.id);
            renderLobbies();
            closeJoinModal();

            startDuel({
                game: gameId,
                playerBet: { value: playerBetValue, item: playerItem },
                opponentName,
                opponentBet,
                opponentItem
            });
        });

        leaveBtn.addEventListener('click', () => {
            if (currentGame) {
                if (!confirm('Выйти из дуэли? Ставка сгорит!')) return;
                currentGame = null;
            }
            returnToLobby();
        });

        rollBtn.onclick = onRollClick;
        bjHitBtn.addEventListener('click', playerHit);
        bjStandBtn.addEventListener('click', playerStand);

        cancelWaitingBtn.addEventListener('click', () => {
            if (window._waitingTimeout) {
                clearTimeout(window._waitingTimeout);
                window._waitingTimeout = null;
            }
            waitingModal.style.display = 'none';
            if (window._waitingRefund) {
                if (window._waitingRefund.item) {
                    returnItemToInventory(window._waitingRefund.item);
                } else {
                    window.globalBalance += window._waitingRefund.value;
                    saveBalance();
                    updateBalanceDisplay();
                }
                window._waitingRefund = null;
            }
        });
    }

    // ============ ОЖИДАНИЕ СОПЕРНИКА ============
    function startWaitingForOpponent(playerBet) {
        waitingGameEl.textContent = `${gameIcon(playerBet.game)} ${gameName(playerBet.game)}`;
        waitingBetEl.textContent = playerBet.value.toLocaleString('ru-RU') + ' ₽' +
            (playerBet.item ? ` · 🎒 ${playerBet.item.name}` : '');
        waitingModal.style.display = 'flex';

        window._waitingRefund = playerBet;

        const delay = randomInt(3000, 7000);
        window._waitingTimeout = setTimeout(() => {
            waitingModal.style.display = 'none';
            window._waitingTimeout = null;
            window._waitingRefund = null;

            let oppBet = playerBet.value;
            let oppItem = null;
            const r = Math.random();

            if (r < 0.15) {
                oppBet = Math.floor(playerBet.value * BET_RATIO_MAX);
            } else if (r < 0.30) {
                oppBet = Math.ceil(playerBet.value / BET_RATIO_MAX);
            }
            oppBet = Math.max(10, oppBet);

            if (Math.random() < BOT_ITEM_CHANCE) {
                const botItem = pickBotItemNearBet(playerBet.value);
                if (botItem) {
                    oppItem = botItem;
                    oppBet = botItem.price;
                }
            }

            if (!isBetWithinTolerance(playerBet.value, oppBet) && !oppItem) {
                oppBet = Math.round(playerBet.value);
            }

            startDuel({
                game: playerBet.game,
                playerBet,
                opponentName: randomNickname(),
                opponentBet: oppBet,
                opponentItem: oppItem
            });
        }, delay);
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function init() {
        initBalance();
        attachHandlers();

        renderDiceFace(youDiceEl, 1);
        renderDiceFace(oppDiceEl, 1);
        youDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));
        oppDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));

        startLobbySimulation();

        if (window.InventoryManager) {
            const origAdd = window.InventoryManager.addItem;
            window.InventoryManager.addItem = function (...args) {
                const r = origAdd.apply(this, args);
                if (createModal.style.display === 'flex') {
                    renderInventoryList(createInvList, () => {});
                }
                return r;
            };
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (createModal.style.display === 'flex') closeCreateModal();
                if (joinModal.style.display === 'flex') closeJoinModal();
            }
        });

        console.log('DUELS: инициализирован. Игр:', Object.keys(GAME_TYPES).length,
                    '| Пул предметов ботов:', getBotItemPool().length);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();