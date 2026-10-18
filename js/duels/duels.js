(function () {
    // ============ ГЛОБАЛЬНЫЙ NAMESPACE ============
    const D = window.DUELS = {
        state: {
            lobbies: [],
            lobbyIdCounter: 1,
            lobbyAddInterval: null,
            lobbyRemoveInterval: null,
            onlineCountInterval: null,
            onlineCount: 0,
            activeFilter: 'all',

            selectedCreateItem: null,
            selectedCreateGame: 'dice',
            selectedJoinItem: null,
            joiningLobby: null,

            currentGame: null,
            isRolling: false,
            botStartTimeout: null
        },

        dom: {},
        consts: {
            RAKE: 0.05,
            BOT_ITEM_CHANCE: 0.10,
            CB_MAX_BUFFS_PER_TURN: 2,
            BET_TOLERANCE: 0.20,
            BET_RATIO_MAX: 1 / (1 - 0.20),
            DICE_FACE_MAP: {
                1: ['p5'], 2: ['p1','p9'], 3: ['p1','p5','p9'],
                4: ['p1','p3','p7','p9'], 5: ['p1','p3','p5','p7','p9'],
                6: ['p1','p3','p4','p6','p7','p9']
            }
        },

        utils: {},
        games: {},         // сюда регистрируются модули игр
        bet: {},
        lobby: {},
        modals: {},
        flow: {}
    };

    // ============ РЕЕСТР ИГР ============
    const GAME_TYPES = {
        dice:      { icon: '🎲', name: 'Кости' },
        race:      { icon: '🏁', name: 'Гонки' },
        blackjack: { icon: '🃏', name: 'Блэкджек' },
        cardbattle:{ icon: '⚔️', name: 'Карточные бои' }
    };

    function gameIcon(id) { return (GAME_TYPES[id] && GAME_TYPES[id].icon) || '🎮'; }
    function gameName(id) { return (GAME_TYPES[id] && GAME_TYPES[id].name) || 'Игра'; }

    // ============ DOM ============
    function collectDom() {
        const $ = (id) => document.getElementById(id);
        const dom = D.dom;

        dom.lobbyView        = $('lobby-view');
        dom.gameView         = $('game-view');
        dom.lobbiesListEl    = $('lobbies-list');
        dom.lobbiesCountEl   = $('lobbies-count');
        dom.onlineCountEl    = $('online-count');

        dom.createLobbyBtn   = $('create-lobby-btn');
        dom.createModal      = $('create-modal');
        dom.createBetInput   = $('create-bet-input');
        dom.createInvList    = $('create-inventory-list');
        dom.confirmCreateBtn = $('confirm-create-btn');
        dom.cancelCreateBtn  = $('cancel-create-btn');

        dom.joinModal        = $('join-modal');
        dom.joinOppGameIcon  = $('join-opp-game-icon');
        dom.joinOppGameName  = $('join-opp-game-name');
        dom.joinOppNameEl    = $('join-opp-name');
        dom.joinOppBetEl     = $('join-opp-bet');
        dom.joinBetInput     = $('join-bet-input');
        dom.joinInvList      = $('join-inventory-list');
        dom.joinChanceEl     = $('join-chance-preview');
        dom.joinRangeHintEl  = $('join-range-hint');
        dom.confirmJoinBtn   = $('confirm-join-btn');
        dom.cancelJoinBtn    = $('cancel-join-btn');

        dom.waitingModal     = $('waiting-modal');
        dom.waitingGameEl    = $('waiting-game');
        dom.waitingBetEl     = $('waiting-bet');
        dom.cancelWaitingBtn = $('cancel-waiting-btn');

        dom.leaveBtn         = $('leave-btn');
        dom.rollBtn          = $('roll-btn');
        dom.duelTitleEl      = $('duel-title');
        dom.duelMessage      = $('duel-message');
        dom.duelStatus       = $('duel-status');
        dom.bankValueEl      = $('bank-value');
        dom.balanceEl        = $('bal-header');

        dom.diceArenaEl      = $('dice-arena');
        dom.youDiceEl        = $('you-dice');
        dom.oppDiceEl        = $('opp-dice');
        dom.youNameEl        = $('you-name');
        dom.oppNameEl        = $('opp-name');
        dom.youBetDisplay    = $('you-bet-display');
        dom.oppBetDisplay    = $('opp-bet-display');
        dom.youChanceEl      = $('you-chance');
        dom.oppChanceEl      = $('opp-chance');

        dom.raceArenaEl      = $('race-arena');
        dom.raceYouName      = $('race-you-name');
        dom.raceOppName      = $('race-opp-name');
        dom.raceYouBet       = $('race-you-bet');
        dom.raceOppBet       = $('race-opp-bet');
        dom.raceYouChance    = $('race-you-chance');
        dom.raceOppChance    = $('race-opp-chance');
        dom.raceYouRunner    = $('race-you-runner');
        dom.raceOppRunner    = $('race-opp-runner');
        dom.raceLaneYou      = document.querySelector('.race-lane-you');
        dom.raceLaneOpp      = document.querySelector('.race-lane-opp');

        dom.bjArenaEl        = $('blackjack-arena');
        dom.bjYouNameEl      = $('bj-you-name');
        dom.bjOppNameEl      = $('bj-opp-name');
        dom.bjYouBetEl       = $('bj-you-bet');
        dom.bjOppBetEl       = $('bj-opp-bet');
        dom.bjYouCardsEl     = $('bj-you-cards');
        dom.bjOppCardsEl     = $('bj-opp-cards');
        dom.bjYouScoreEl     = $('bj-you-score');
        dom.bjOppScoreEl     = $('bj-opp-score');
        dom.bjActionsEl      = $('bj-actions');
        dom.bjHitBtn         = $('bj-hit-btn');
        dom.bjStandBtn       = $('bj-stand-btn');

        dom.cbArenaEl        = $('cardbattle-arena');
        dom.cbOppNameEl      = $('cb-opp-name');
        dom.cbYouHPText      = $('cb-you-hp-text');
        dom.cbOppHPText      = $('cb-opp-hp-text');
        dom.cbYouHPFill      = $('cb-you-hp-fill');
        dom.cbOppHPFill      = $('cb-opp-hp-fill');
        dom.cbYouHandEl      = $('cb-you-hand');
        dom.cbOppHandEl      = $('cb-opp-hand');
        dom.cbTurnIndicator  = $('cb-turn-indicator');
        dom.cbLogEl          = $('cb-log');
        dom.cbPlayerActions  = $('cb-player-actions');
        dom.cbDrawBtn        = $('cb-draw-btn');
        dom.cbPassBtn        = $('cb-pass-btn');
    }

    // ============ УТИЛИТЫ ============
    D.utils.formatMoney = function (n) {
        if (n >= 1000000) return (n / 1000000).toFixed(2).replace('.00', '') + 'M';
        if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.0', '') + 'k';
        return Math.round(n).toLocaleString('ru-RU');
    };

    D.utils.initBalance = function () {
        if (typeof window.globalBalance === 'undefined') {
            const saved = localStorage.getItem('userBalance');
            window.globalBalance = saved !== null && !isNaN(parseFloat(saved)) ? parseFloat(saved) : 0;
        }
        D.utils.updateBalanceDisplay();
    };

    D.utils.updateBalanceDisplay = function () {
        if (D.dom.balanceEl) D.dom.balanceEl.textContent = (window.globalBalance || 0).toFixed(2);
    };

    D.utils.saveBalance = function () {
        try { localStorage.setItem('userBalance', (window.globalBalance || 0).toString()); } catch (e) {}
    };

    D.utils.randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    D.utils.pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    D.utils.gameIcon = gameIcon;
    D.utils.gameName = gameName;

    D.utils.pickBotCharacter = function () {
        const r = Math.random();
        if (r < 0.35) return 'cautious';
        if (r < 0.80) return 'normal';
        return 'risky';
    };

    D.utils.returnItemToInventory = function (item) {
        if (!item || !window.InventoryManager) return;
        try {
            window.InventoryManager.addItem(item.name, item.image, item.tier, item.price);
        } catch (e) { console.error('Не удалось вернуть предмет:', e); }
    };

    D.utils.getBotItemPool = function () {
        const pool = [];
        if (Array.isArray(window.ITEMS_CASE_DATA)) pool.push(...window.ITEMS_CASE_DATA);
        if (Array.isArray(window.GAMES_CASE_DATA)) pool.push(...window.GAMES_CASE_DATA);
        return pool;
    };

    // ============ НИКИ И СТАВКИ ============
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

    D.utils.randomNickname = function () {
        return D.utils.pickRandom(NICKNAMES) + (Math.random() < 0.15 ? D.utils.randomInt(1, 99) : '');
    };

    D.utils.randomBetAmount = function () {
        const r = Math.random() * 100;
        if (r < 40) return D.utils.randomInt(50, 500);
        if (r < 70) return D.utils.randomInt(500, 2500);
        if (r < 88) return D.utils.randomInt(2500, 10000);
        if (r < 97) return D.utils.randomInt(10000, 40000);
        return D.utils.randomInt(40000, 120000);
    };

    // ============ СТАВКИ / ШАНСЫ ============
    D.bet.isBetWithinTolerance = function (a, b) {
        if (!isFinite(a) || !isFinite(b)) return false;
        if (a <= 0 || b <= 0) return false;
        return Math.max(a, b) <= Math.min(a, b) * D.consts.BET_RATIO_MAX;
    };

    D.bet.getBetBounds = function (oppBet) {
        return {
            min: Math.ceil(oppBet / D.consts.BET_RATIO_MAX),
            max: Math.floor(oppBet * D.consts.BET_RATIO_MAX)
        };
    };

    D.bet.calcPlayerWinChance = function (playerBetValue, oppBetValue) {
        const sum = playerBetValue + oppBetValue;
        if (sum <= 0) return 0.5;
        return playerBetValue / sum;
    };

    D.utils.pickBotItemNearBet = function (betValue) {
        const pool = D.utils.getBotItemPool();
        if (pool.length === 0) return null;
        const filtered = pool.filter(it => D.bet.isBetWithinTolerance(it.price, betValue));
        if (filtered.length === 0) return null;
        const it = D.utils.pickRandom(filtered);
        return { name: it.name, image: it.image, tier: it.tier, price: it.price };
    };

    // ============ ЛОББИ ============
    function makeLobby() {
        const r = Math.random();
        let game;
        if (r < 0.3) game = 'dice';
        else if (r < 0.55) game = 'race';
        else if (r < 0.8) game = 'blackjack';
        else game = 'cardbattle';

        let bet = D.utils.randomBetAmount();
        let item = null;

        if (Math.random() < D.consts.BOT_ITEM_CHANCE) {
            const botItem = D.utils.pickBotItemNearBet(bet);
            if (botItem) { item = botItem; bet = botItem.price; }
        }

        return { id: D.state.lobbyIdCounter++, name: D.utils.randomNickname(), bet, item, game };
    }

    D.lobby.renderLobbies = function () {
        const S = D.state;
        const visible = S.activeFilter === 'all'
            ? S.lobbies
            : S.lobbies.filter(l => l.game === S.activeFilter);

        if (visible.length === 0) {
            D.dom.lobbiesListEl.innerHTML = '<div class="lobbies-empty">Пока нет открытых дуэлей... Скоро появятся!</div>';
            D.dom.lobbiesCountEl.textContent = '0';
            return;
        }

        D.dom.lobbiesListEl.innerHTML = '';
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

            card.addEventListener('click', () => D.modals.openJoinModal(lobby));
            D.dom.lobbiesListEl.appendChild(card);
        });

        D.dom.lobbiesCountEl.textContent = visible.length.toString();
    };

    function addRandomLobby() {
        if (D.state.lobbies.length >= 21) return;
        D.state.lobbies.push(makeLobby());
        D.lobby.renderLobbies();
    }

    function removeRandomLobby() {
        if (D.state.lobbies.length <= 4) return;
        const idx = Math.floor(Math.random() * D.state.lobbies.length);
        D.state.lobbies.splice(idx, 1);
        D.lobby.renderLobbies();
    }

    D.lobby.startLobbySimulation = function () {
        const S = D.state;
        if (S.lobbies.length === 0) {
            for (let i = 0; i < D.utils.randomInt(8, 12); i++) S.lobbies.push(makeLobby());
            D.lobby.renderLobbies();
        }

        S.onlineCount = D.utils.randomInt(180, 420);
        D.dom.onlineCountEl.textContent = S.onlineCount.toString();

        clearInterval(S.lobbyAddInterval);
        S.lobbyAddInterval = setInterval(() => {
            if (Math.random() < 0.7) addRandomLobby();
        }, 3500);

        clearInterval(S.lobbyRemoveInterval);
        S.lobbyRemoveInterval = setInterval(() => {
            if (Math.random() < 0.35) removeRandomLobby();
        }, 7000);

        clearInterval(S.onlineCountInterval);
        S.onlineCountInterval = setInterval(() => {
            S.onlineCount += D.utils.randomInt(-8, 12);
            if (S.onlineCount < 120) S.onlineCount = 120;
            D.dom.onlineCountEl.textContent = S.onlineCount.toString();
        }, 5000);
    };

    D.lobby.stopLobbySimulation = function () {
        clearInterval(D.state.lobbyAddInterval);
        clearInterval(D.state.lobbyRemoveInterval);
        clearInterval(D.state.onlineCountInterval);
        D.state.lobbyAddInterval = null;
        D.state.lobbyRemoveInterval = null;
        D.state.onlineCountInterval = null;
    };

    // ============ ИНВЕНТАРЬ (в модалках) ============
    function renderInventoryList(container, onSelect) {
        const inventory = window.InventoryManager ? window.InventoryManager.getInventory() : [];
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
    D.modals.openCreateModal = function () {
        const S = D.state;
        S.selectedCreateItem = null;
        S.selectedCreateGame = 'dice';
        D.dom.createBetInput.value = '';
        D.dom.createBetInput.disabled = false;
        D.dom.createBetInput.style.opacity = '1';

        document.querySelectorAll('#create-game-pick .modal-game-pick-item').forEach(el => {
            el.classList.toggle('active', el.dataset.game === 'dice');
        });

        renderInventoryList(D.dom.createInvList, (item) => {
            if (S.selectedCreateItem && S.selectedCreateItem.id === item.id) {
                S.selectedCreateItem = null;
                D.dom.createBetInput.disabled = false;
                D.dom.createBetInput.style.opacity = '1';
            } else {
                S.selectedCreateItem = item;
                D.dom.createBetInput.disabled = true;
                D.dom.createBetInput.style.opacity = '0.5';
                D.dom.createBetInput.value = '';
            }
            highlightSelectedInv(D.dom.createInvList, S.selectedCreateItem);
        });
        D.dom.createModal.style.display = 'flex';
    };

    D.modals.closeCreateModal = function () {
        D.dom.createModal.style.display = 'none';
        D.state.selectedCreateItem = null;
    };

    D.modals.openJoinModal = function (lobby) {
        const S = D.state;
        S.joiningLobby = lobby;
        S.selectedJoinItem = null;

        const bounds = D.bet.getBetBounds(lobby.bet);

        D.dom.joinOppGameIcon.textContent = gameIcon(lobby.game);
        D.dom.joinOppGameName.textContent = gameName(lobby.game);
        D.dom.joinOppNameEl.textContent = lobby.name;

        let oppBetText = lobby.bet.toLocaleString('ru-RU') + ' ₽';
        if (lobby.item) oppBetText += ` · 🎒 ${lobby.item.name}`;
        D.dom.joinOppBetEl.textContent = oppBetText;

        D.dom.joinBetInput.value = lobby.bet;
        D.dom.joinBetInput.min = Math.max(10, bounds.min);
        D.dom.joinBetInput.max = bounds.max;
        D.dom.joinBetInput.disabled = false;
        D.dom.joinBetInput.style.opacity = '1';

        renderInventoryList(D.dom.joinInvList, (item) => {
            if (S.selectedJoinItem && S.selectedJoinItem.id === item.id) {
                S.selectedJoinItem = null;
                D.dom.joinBetInput.disabled = false;
                D.dom.joinBetInput.style.opacity = '1';
                D.dom.joinBetInput.value = lobby.bet;
            } else {
                S.selectedJoinItem = item;
                D.dom.joinBetInput.disabled = true;
                D.dom.joinBetInput.style.opacity = '0.5';
            }
            highlightSelectedInv(D.dom.joinInvList, S.selectedJoinItem);
            D.modals.updateJoinChancePreview();
        });

        D.modals.updateJoinChancePreview();
        D.dom.joinModal.style.display = 'flex';
    };

    D.modals.closeJoinModal = function () {
        D.dom.joinModal.style.display = 'none';
        D.state.joiningLobby = null;
        D.state.selectedJoinItem = null;
    };

    D.modals.updateJoinChancePreview = function () {
        const S = D.state;
        if (!S.joiningLobby) return;

        let playerBetValue;
        if (S.selectedJoinItem) playerBetValue = S.selectedJoinItem.price;
        else playerBetValue = parseFloat(D.dom.joinBetInput.value) || 0;

        const oppBet = S.joiningLobby.bet;
        const bounds = D.bet.getBetBounds(oppBet);

        if (D.dom.joinRangeHintEl) {
            D.dom.joinRangeHintEl.textContent =
                `Допустимый диапазон: ${bounds.min.toLocaleString('ru-RU')} – ${bounds.max.toLocaleString('ru-RU')} ₽`;
            D.dom.joinRangeHintEl.classList.remove('danger');
        }

        if (playerBetValue <= 0) {
            D.dom.joinChanceEl.textContent = '—';
            D.dom.joinChanceEl.style.color = '';
            D.dom.confirmJoinBtn.disabled = true;
            return;
        }

        if (!D.bet.isBetWithinTolerance(playerBetValue, oppBet)) {
            D.dom.joinChanceEl.textContent = '❌ Вне диапазона';
            D.dom.joinChanceEl.style.color = '#ff5555';
            D.dom.confirmJoinBtn.disabled = true;
            if (D.dom.joinRangeHintEl) D.dom.joinRangeHintEl.classList.add('danger');
            return;
        }

        D.dom.joinChanceEl.style.color = '';
        D.dom.confirmJoinBtn.disabled = false;
        const p = D.bet.calcPlayerWinChance(playerBetValue, oppBet);
        D.dom.joinChanceEl.textContent = (p * 100).toFixed(1) + '%';
    };

    D.modals.startWaitingForOpponent = function (playerBet) {
        D.dom.waitingGameEl.textContent = `${gameIcon(playerBet.game)} ${gameName(playerBet.game)}`;
        D.dom.waitingBetEl.textContent = playerBet.value.toLocaleString('ru-RU') + ' ₽' +
            (playerBet.item ? ` · 🎒 ${playerBet.item.name}` : '');
        D.dom.waitingModal.style.display = 'flex';

        window._waitingRefund = playerBet;

        const delay = D.utils.randomInt(3000, 7000);
        window._waitingTimeout = setTimeout(() => {
            D.dom.waitingModal.style.display = 'none';
            window._waitingTimeout = null;
            window._waitingRefund = null;

            let oppBet = playerBet.value;
            let oppItem = null;
            const r = Math.random();

            if (r < 0.15) oppBet = Math.floor(playerBet.value * D.consts.BET_RATIO_MAX);
            else if (r < 0.30) oppBet = Math.ceil(playerBet.value / D.consts.BET_RATIO_MAX);
            oppBet = Math.max(10, oppBet);

            if (Math.random() < D.consts.BOT_ITEM_CHANCE) {
                const botItem = D.utils.pickBotItemNearBet(playerBet.value);
                if (botItem) { oppItem = botItem; oppBet = botItem.price; }
            }

            if (!D.bet.isBetWithinTolerance(playerBet.value, oppBet) && !oppItem) {
                oppBet = Math.round(playerBet.value);
            }

            D.flow.startDuel({
                game: playerBet.game,
                playerBet,
                opponentName: D.utils.randomNickname(),
                opponentBet: oppBet,
                opponentItem: oppItem
            });
        }, delay);
    };

    // ============ FLOW: старт / расчёт / выход ============
    D.flow.onRollClick = function () {
        if (D.state.isRolling || !D.state.currentGame) return;
        const gameMod = D.games[D.state.currentGame.game];
        if (gameMod && gameMod.start) gameMod.start();
    };

    D.flow.startDuel = function (config) {
        D.state.currentGame = {
            game: config.game || 'dice',
            playerBetValue: config.playerBet.value,
            playerItem: config.playerBet.item || null,
            opponentName: config.opponentName,
            opponentBetValue: config.opponentBet,
            opponentItem: config.opponentItem || null,
            playerStarts: true,
            botCharacter: D.utils.pickBotCharacter(),
            phase: 'ready'
        };

        D.dom.lobbyView.style.display = 'none';
        D.dom.gameView.style.display = 'block';
        D.lobby.stopLobbySimulation();

        const gameType = D.state.currentGame.game;
        const gameMod = D.games[gameType];

        D.dom.duelTitleEl.textContent = 'ДУЭЛЬ · ' + gameName(gameType).toUpperCase();

        D.dom.diceArenaEl.style.display = 'none';
        D.dom.raceArenaEl.style.display = 'none';
        D.dom.bjArenaEl.style.display = 'none';
        D.dom.cbArenaEl.style.display = 'none';

        D.dom.bankValueEl.textContent =
            (D.state.currentGame.playerBetValue + D.state.currentGame.opponentBetValue).toLocaleString('ru-RU') + ' ₽';
        D.dom.duelMessage.textContent = '';
        D.dom.duelMessage.className = 'duel-message';
        D.dom.rollBtn.style.display = '';
        D.dom.rollBtn.classList.remove('bot-turn');

        gameMod.prepare(config);

        if (gameMod.usesBotStart) {
            const playerStarts = Math.random() < 0.5;
            D.state.currentGame.playerStarts = playerStarts;

            if (playerStarts) {
                D.dom.duelStatus.textContent = '🎯 Первым бросаете ВЫ';
                D.dom.duelStatus.style.color = '#4CAF50';
                D.dom.rollBtn.textContent = gameMod.startButtonText;
                D.dom.rollBtn.disabled = false;
                D.dom.rollBtn.onclick = D.flow.onRollClick;
                D.state.isRolling = false;
            } else {
                D.dom.duelStatus.textContent = `⚡ Начинает ${D.state.currentGame.opponentName}...`;
                D.dom.duelStatus.style.color = '#ff8a73';
                D.dom.rollBtn.textContent = gameMod.botTurnText;
                D.dom.rollBtn.disabled = true;
                D.dom.rollBtn.classList.add('bot-turn');
                D.state.isRolling = true;

                clearTimeout(D.state.botStartTimeout);
                D.state.botStartTimeout = setTimeout(() => {
                    D.state.botStartTimeout = null;
                    if (!D.state.currentGame || D.state.currentGame.playerStarts) return;
                    D.state.isRolling = false;
                    D.dom.rollBtn.classList.remove('bot-turn');
                    gameMod.start();
                }, 1500);
            }
        } else {
            D.dom.duelStatus.textContent = gameMod.readyText || 'Готовы?';
            D.dom.duelStatus.style.color = '#4CAF50';
            D.dom.rollBtn.textContent = gameMod.startButtonText;
            D.dom.rollBtn.disabled = false;
            D.dom.rollBtn.classList.remove('bot-turn');
            D.dom.rollBtn.onclick = D.flow.onRollClick;
            D.state.isRolling = false;
        }
    };

    D.flow.resolveDuel = function (playerWins, gameType) {
        const cg = D.state.currentGame;
        const betValue = cg.playerBetValue;
        const oppValue = cg.opponentBetValue;
        const playerItem = cg.playerItem;
        const opponentItem = cg.opponentItem;
        const label = gameType === 'race' ? '🏁'
                    : gameType === 'blackjack' ? '🃏'
                    : gameType === 'cardbattle' ? '⚔️'
                    : '🎲';

        if (playerWins) {
            if (playerItem) {
                D.utils.returnItemToInventory(playerItem);
            } else {
                window.globalBalance += betValue;
            }

            let prizeText = '';
            if (opponentItem) {
                D.utils.returnItemToInventory(opponentItem);
                prizeText = `предмет: ${opponentItem.name} (${D.utils.formatMoney(opponentItem.price)} ₽)`;
            } else {
                const rake = oppValue * D.consts.RAKE;
                const netWin = oppValue - rake;
                window.globalBalance += netWin;
                prizeText = `${D.utils.formatMoney(netWin)} ₽ (комиссия ${D.utils.formatMoney(rake)} ₽)`;
            }

            D.utils.saveBalance();
            D.utils.updateBalanceDisplay();

            D.dom.duelMessage.innerHTML = `${label} ПОБЕДА! Приз: ${prizeText}. Своя ставка возвращена${playerItem ? ', предмет в инвентаре' : ''}.`;
            D.dom.duelMessage.className = 'duel-message win';
            D.dom.duelStatus.textContent = 'Раунд завершён';
            D.dom.duelStatus.style.color = '#4CAF50';
        } else {
            const lostText = playerItem
                ? `предмет "${playerItem.name}" (${D.utils.formatMoney(betValue)} ₽)`
                : `${betValue.toLocaleString('ru-RU')} ₽`;
            D.dom.duelMessage.textContent = `${label} ПРОИГРЫШ. Вы теряете ${lostText}`;
            D.dom.duelMessage.className = 'duel-message lose';
            D.dom.duelStatus.textContent = 'Раунд завершён';
            D.dom.duelStatus.style.color = '#ff5555';
        }

        D.flow.finalizeReturnButton();
    };

    D.flow.resolvePush = function () {
        const cg = D.state.currentGame;
        if (cg.playerItem) {
            D.utils.returnItemToInventory(cg.playerItem);
            cg.playerItem = null;
        } else {
            window.globalBalance += cg.playerBetValue;
        }
        D.utils.saveBalance();
        D.utils.updateBalanceDisplay();
    };

    D.flow.finalizeReturnButton = function () {
        D.dom.rollBtn.style.display = '';
        D.dom.rollBtn.textContent = '↩ ВЕРНУТЬСЯ В ЛОББИ';
        D.dom.rollBtn.disabled = false;
        D.dom.rollBtn.classList.remove('bot-turn');
        D.dom.rollBtn.onclick = () => D.flow.returnToLobby();
        D.state.isRolling = false;
    };

    D.flow.returnToLobby = function () {
        clearTimeout(D.state.botStartTimeout);
        D.state.botStartTimeout = null;

        for (const key in D.games) {
            if (D.games[key].cleanup) {
                try { D.games[key].cleanup(); } catch (e) { console.error(e); }
            }
        }

        D.state.currentGame = null;
        D.state.isRolling = false;

        D.dom.gameView.style.display = 'none';
        D.dom.lobbyView.style.display = 'block';
        D.dom.rollBtn.style.display = '';
        D.dom.rollBtn.classList.remove('bot-turn');
        D.dom.rollBtn.onclick = D.flow.onRollClick;
        D.dom.bjActionsEl.style.display = 'none';
        D.dom.cbPlayerActions.style.display = 'none';
        D.dom.duelMessage.textContent = '';
        D.dom.duelMessage.className = 'duel-message';
        D.dom.duelStatus.textContent = '';
        D.dom.duelStatus.style.color = '';

        D.lobby.startLobbySimulation();
        D.lobby.renderLobbies();
    };

    // ============ ОБРАБОТЧИКИ ============
    function attachHandlers() {
        document.querySelectorAll('.game-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.game-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                D.state.activeFilter = btn.dataset.game;
                D.lobby.renderLobbies();
            });
        });

        D.dom.createLobbyBtn.addEventListener('click', D.modals.openCreateModal);
        D.dom.cancelCreateBtn.addEventListener('click', D.modals.closeCreateModal);

        document.querySelectorAll('#create-game-pick .modal-game-pick-item').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('#create-game-pick .modal-game-pick-item').forEach(x => x.classList.remove('active'));
                el.classList.add('active');
                D.state.selectedCreateGame = el.dataset.game;
            });
        });

        D.dom.confirmCreateBtn.addEventListener('click', () => {
            let betValue;
            if (D.state.selectedCreateItem) betValue = D.state.selectedCreateItem.price;
            else betValue = parseFloat(D.dom.createBetInput.value) || 0;
            if (betValue <= 0) return;

            if (D.state.selectedCreateItem) {
                const inv = window.InventoryManager ? window.InventoryManager.getInventory() : [];
                if (!inv.some(i => i.id === D.state.selectedCreateItem.id)) return;
                window.InventoryManager.removeItem(D.state.selectedCreateItem.id);
                D.modals.startWaitingForOpponent({ value: betValue, item: D.state.selectedCreateItem, game: D.state.selectedCreateGame });
            } else {
                if (betValue > (window.globalBalance || 0)) { alert('Недостаточно средств!'); return; }
                window.globalBalance -= betValue;
                D.utils.saveBalance();
                D.utils.updateBalanceDisplay();
                D.modals.startWaitingForOpponent({ value: betValue, item: null, game: D.state.selectedCreateGame });
            }
            D.modals.closeCreateModal();
        });

        D.dom.cancelJoinBtn.addEventListener('click', D.modals.closeJoinModal);
        D.dom.joinBetInput.addEventListener('input', D.modals.updateJoinChancePreview);

        document.querySelectorAll('.bet-adjust-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!D.state.joiningLobby) return;
                const factor = parseFloat(btn.dataset.factor);
                const bounds = D.bet.getBetBounds(D.state.joiningLobby.bet);

                let target = Math.round(D.state.joiningLobby.bet * factor);
                target = Math.max(bounds.min, Math.min(bounds.max, target));
                target = Math.max(10, target);

                D.dom.joinBetInput.value = target;
                if (D.state.selectedJoinItem) {
                    D.state.selectedJoinItem = null;
                    D.dom.joinBetInput.disabled = false;
                    D.dom.joinBetInput.style.opacity = '1';
                    highlightSelectedInv(D.dom.joinInvList, null);
                }
                D.modals.updateJoinChancePreview();
            });
        });

        D.dom.confirmJoinBtn.addEventListener('click', () => {
            const S = D.state;
            if (!S.joiningLobby) return;
            let playerBetValue, playerItem = null;
            if (S.selectedJoinItem) {
                playerBetValue = S.selectedJoinItem.price;
                playerItem = S.selectedJoinItem;
            } else {
                playerBetValue = parseFloat(D.dom.joinBetInput.value) || 0;
            }
            if (playerBetValue <= 0) return;

            if (!D.bet.isBetWithinTolerance(playerBetValue, S.joiningLobby.bet)) {
                const b = D.bet.getBetBounds(S.joiningLobby.bet);
                alert(`Ставка должна быть в диапазоне ${b.min.toLocaleString('ru-RU')} – ${b.max.toLocaleString('ru-RU')} ₽`);
                return;
            }

            if (S.selectedJoinItem) {
                const inv = window.InventoryManager ? window.InventoryManager.getInventory() : [];
                if (!inv.some(i => i.id === S.selectedJoinItem.id)) return;
                window.InventoryManager.removeItem(S.selectedJoinItem.id);
            } else {
                if (playerBetValue > (window.globalBalance || 0)) { alert('Недостаточно средств!'); return; }
                window.globalBalance -= playerBetValue;
                D.utils.saveBalance();
                D.utils.updateBalanceDisplay();
            }

            const opponentName = S.joiningLobby.name;
            const opponentBet = S.joiningLobby.bet;
            const opponentItem = S.joiningLobby.item;
            const gameId = S.joiningLobby.game;

            S.lobbies = S.lobbies.filter(l => l.id !== S.joiningLobby.id);
            D.lobby.renderLobbies();
            D.modals.closeJoinModal();

            D.flow.startDuel({
                game: gameId,
                playerBet: { value: playerBetValue, item: playerItem },
                opponentName,
                opponentBet,
                opponentItem
            });
        });

        D.dom.leaveBtn.addEventListener('click', () => {
            if (D.state.currentGame) {
                if (!confirm('Выйти из дуэли? Ставка сгорит!')) return;
                D.state.currentGame = null;
            }
            D.flow.returnToLobby();
        });

        D.dom.rollBtn.onclick = D.flow.onRollClick;

        // Делегируем кнопки блэкджека и карточного боя играм
        D.dom.bjHitBtn.addEventListener('click', () => {
            const mod = D.games.blackjack;
            if (!D.state.currentGame || D.state.currentGame.game !== 'blackjack') return;
            if (mod && mod.onHit) mod.onHit();
        });
        D.dom.bjStandBtn.addEventListener('click', () => {
            const mod = D.games.blackjack;
            if (!D.state.currentGame || D.state.currentGame.game !== 'blackjack') return;
            if (mod && mod.onStand) mod.onStand();
        });
        D.dom.cbDrawBtn.addEventListener('click', () => {
            const mod = D.games.cardbattle;
            if (!D.state.currentGame || D.state.currentGame.game !== 'cardbattle') return;
            if (mod && mod.onDraw) mod.onDraw();
        });
        D.dom.cbPassBtn.addEventListener('click', () => {
            const mod = D.games.cardbattle;
            if (!D.state.currentGame || D.state.currentGame.game !== 'cardbattle') return;
            if (mod && mod.onPass) mod.onPass();
        });

        D.dom.cancelWaitingBtn.addEventListener('click', () => {
            if (window._waitingTimeout) {
                clearTimeout(window._waitingTimeout);
                window._waitingTimeout = null;
            }
            D.dom.waitingModal.style.display = 'none';
            if (window._waitingRefund) {
                if (window._waitingRefund.item) {
                    D.utils.returnItemToInventory(window._waitingRefund.item);
                } else {
                    window.globalBalance += window._waitingRefund.value;
                    D.utils.saveBalance();
                    D.utils.updateBalanceDisplay();
                }
                window._waitingRefund = null;
            }
        });
    }

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    function init() {
        collectDom();
        D.utils.initBalance();
        attachHandlers();

        D.lobby.startLobbySimulation();

        if (window.InventoryManager) {
            const origAdd = window.InventoryManager.addItem;
            window.InventoryManager.addItem = function (...args) {
                const r = origAdd.apply(this, args);
                if (D.dom.createModal.style.display === 'flex') {
                    renderInventoryList(D.dom.createInvList, () => {});
                }
                return r;
            };
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (D.dom.createModal.style.display === 'flex') D.modals.closeCreateModal();
                if (D.dom.joinModal.style.display === 'flex') D.modals.closeJoinModal();
            }
        });

        console.log('DUELS core: инициализирован. Игр:', Object.keys(D.games).length);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();