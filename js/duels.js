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
    const confirmJoinBtn  = document.getElementById('confirm-join-btn');
    const cancelJoinBtn   = document.getElementById('cancel-join-btn');

    const waitingModal    = document.getElementById('waiting-modal');
    const waitingGameEl   = document.getElementById('waiting-game');
    const waitingBetEl    = document.getElementById('waiting-bet');
    const cancelWaitingBtn= document.getElementById('cancel-waiting-btn');

    const leaveBtn        = document.getElementById('leave-btn');
    const rollBtn         = document.getElementById('roll-btn');

    const youDiceEl       = document.getElementById('you-dice');
    const oppDiceEl       = document.getElementById('opp-dice');
    const youNameEl       = document.getElementById('you-name');
    const oppNameEl       = document.getElementById('opp-name');
    const youBetDisplay   = document.getElementById('you-bet-display');
    const oppBetDisplay   = document.getElementById('opp-bet-display');
    const youChanceEl     = document.getElementById('you-chance');
    const oppChanceEl     = document.getElementById('opp-chance');
    const bankValueEl     = document.getElementById('bank-value');
    const duelMessage     = document.getElementById('duel-message');
    const duelStatus      = document.getElementById('duel-status');

    const balanceEl       = document.getElementById('bal-header');

    // ============ РЕЕСТР ИГР ============
    const GAME_TYPES = {
        dice: { icon: '🎲', name: 'Кости' }
        // coin:  { icon: '🪙', name: 'Монетка' },
        // rps:   { icon: '✊', name: 'КНБ' }
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
    let selectedJoinItem = null;
    let joiningLobby = null;
    let currentGame = null;
    let isRolling = false;

    const RAKE = 0.05;

    const DICE_FACE_MAP = {
        1: ['p5'],
        2: ['p1', 'p9'],
        3: ['p1', 'p5', 'p9'],
        4: ['p1', 'p3', 'p7', 'p9'],
        5: ['p1', 'p3', 'p5', 'p7', 'p9'],
        6: ['p1', 'p3', 'p4', 'p6', 'p7', 'p9']
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

    // ============ ДИЗАЙН КУБИКА ============
    function renderDiceFace(diceEl, value) {
        let html = '';
        for (let i = 1; i <= 9; i++) html += `<div class="dot p${i}"></div>`;
        diceEl.innerHTML = html;

        const active = DICE_FACE_MAP[value] || [];
        active.forEach(pos => {
            const dot = diceEl.querySelector('.' + pos);
            if (dot) dot.classList.add('on');
        });
    }

    function renderRandomDiceFace(diceEl) {
        renderDiceFace(diceEl, randomInt(1, 6));
    }

    // ============ НИКИ ============
    const NICKNAMES = [
        'Azure_Blade', 'Black_Storm', 'Crimson_Fury', 'Cyber_Wraith', 'Dark_Ember',
        'Dawn_Breaker', 'Death_Note_09', 'Deep_Blue', 'Demon_Slayer', 'Desert_Eagle',
        'Diamond_Edge', 'Doom_Bringer', 'Double_Tap', 'Dragon_Fire', 'Dread_Naught',
        'Dust_Devil', 'Elite_Sniper', 'Eternal_Flame', 'Fallen_Angel', 'First_Blood',
        'Flame_Thrower', 'Frost_Giant', 'Ghost_Recon', 'Golden_Hawk', 'Gravity_Shift',
        'Hell_Fire_42', 'High_Voltage', 'Holy_Knight', 'Horizon_Zero', 'Inferno_Blaze',
        'Iron_Will', 'Jade_Emperor', 'Jungle_King', 'Krypton_Force', 'Light_Bringer',
        'Lone_Wolf_13', 'Midnight_Raven', 'Mystic_Storm', 'Necro_Mancer', 'Night_Shadow',
        'Ocean_Wave', 'Phantom_Reaper', 'Platinum_Edge', 'Power_Player', 'Pure_Energy',
        'Quick_Silver', 'Red_Devil_07', 'Rocket_Man', 'Royal_Guard', 'Rusty_Nail',
        'FrostBite', 'ShadowMorph', 'SteelEagle', 'PhantomStrike', 'MysticEcho',
        'BlazeRunner', 'CrystalShard', 'DuskReaper', 'EmberWolf', 'FangBlade',
        'GlacialTide', 'HawkEye_99', 'IronSoul', 'JadeDragon', 'KrakenRise',
        'LunarFox', 'Maelstrom_7', 'Nebula_42', 'OnyxFang', 'PrismLight',
        'QuantumFox', 'RavenFrost', 'SableWind', 'Tempest_88', 'Umbra_13',
        'vlad_k26', 'shadow_reaper', 'katya.smirnova', 'alex_gaming99',
        'dark_knight_x', 'cyber_ghost', 'masha_fox', 'pixel_art', 'dima.volkov',
        'neon_pulse', 'anastasia_r', 'toxic_vibe', 'sergey.k', 'alpha_wolf',
        'lisa_sweet', 'night_walker', 'max_force_8', 'julia_dream', 'frost_bite',
        'pavel_pro', 'silent_assassin', 'olga_travel', 'iron_man_91', 'kristina_m',
        'storm_bringer', 'denis_d', 'moon_light', 'artem_k', 'wild_cat', 'speed_demon',
        'elena_s', 'matrix_cod', 'ivan_best', 'angel_eyes', 'black_pearl', 'igor_v', 'cosmic_ray',
        'natalia_p', 'fire_starter', 'roma_g', 'golden_boy', 'starlight', 'andrey_b',
        'ice_queen', 'phantom_lord', 'anna_k', 'vortex_x', 'dmitry_l', 'silver_surfer', 'ksenia_v',
        'Valkyrie_6', 'Wraith_77', 'Xenon_5', 'Yeti_27', 'Zenith_3',
        'ApexHunter', 'Blitz_44', 'Cipher_9', 'Delta_One', 'Echo_Zero',
        'GammaRay', 'Helix_22', 'Inertia_4', 'Joker_66', 'Karma_11',
        'Lynx_88', 'Matrix_99', 'Nova_Star', 'Orion_Belt', 'Phoenix_Ash',
        'Quasar_77', 'Raptor_33', 'Sirius_12', 'Titan_55', 'Vector_6',
        'North_Wind', 'ShadowStalker', 'Iron_Falcon', 'Last_Resort', 'Dark_Phoenix',
        'Silent_Titan', 'Storm_Bringer', 'Grey_Wolf_77', 'Night_Reaper', 'Omega_Force',
        'RageQuit_No', 'Bloody_Mary', 'Xx_Killer_xX', 'OneTap_King', 'Berserker_Rage',
        'NoMercy_01', 'Headshot_Harry', 'Mad_Max_88', 'Savage_Beast', 'Terminator_2K',
        'Fluffy_Kitten', 'Sleepy_Panda', 'Lazy_Dragon', 'Choco_Cookie', 'Bunny_Hop',
        'Fat_Cat_42', 'Tiny_Tank', 'Happy_Cloud', 'Pink_Unicorn', 'Dancing_Fox',
        'Ctrl_Z', 'Lag_Wizard', '0_Intelligence', 'Just_Luck', 'RNG_God',
        'AFK_Player', 'No_Aim_No_Problem', 'Potato_PC', 'Alt_F4_King', 'Theory_Crafter',
        'Alex_007', 'Max_Power', 'Jimmy_Knox', 'Tony_Snake', 'Leo_Thunder',
        'Sam_Fisher', 'Nick_Flash', 'Tom_Hawk', 'Dan_Wild', 'Zack_Zero',
        'Ghost_Rider', 'Venom_Strike', 'Crimson_Tide', 'Silver_Surfer', 'Golden_Eye',
        'Emerald_Dream', 'Sapphire_Sky', 'Onyx_Shadow', 'Ruby_Heart', 'Pearl_Whisper',
        'Neon_Ninja', 'Cyber_Samurai', 'Stealth_Reaper', 'Blitz_Krieg', 'Fury_Storm',
        'Ice_Cold', 'Fire_Storm', 'Thunder_Clap', 'Earth_Shaker', 'Wind_Walker',
        'Mega_Byte', 'Giga_Chad', 'Tera_Flop', 'Peta_Bit', 'Exa_Byte',
        'Pixel_Pusher', 'Frame_Drop', 'Low_FPS', 'High_Ping', 'Packet_Loss',
        'Solo_Queue', 'Duo_King', 'Squad_Leader', 'Clutch_God', 'Ace_Pilot',
        'Tank_You', 'Heal_Bot', 'DPS_Monster', 'Support_Hero', 'Flex_Player',
        'Noob_Slayer', 'Pro_Noob', 'Veteran_Noob', 'Grind_Master', 'Lore_Nerd',
        'RNGesus', 'Blessed_By_RNG', 'Cursed_By_RNG', 'Lucky_Seven', 'Unlucky_13',
        'Coffee_Addict', 'Tea_Sipper', 'Energy_Drink', 'Water_Bottle', 'Soda_Pop',
        'Midnight_Oil', 'Early_Riser', 'Night_Hawk', 'Day_Dreamer', 'Dusk_Till_Dawn',
        'CoffeeLover', 'NightOwl', 'EarlyBird', 'GymRat', 'YogaMaster',
        'FoodieExplorer', 'TravelAddict', 'BookWorm', 'MovieBuff', 'MusicFanatic',
        'ArtEnthusiast', 'NatureWalker', 'BeachLover', 'MountainHiker', 'CityExplorer',
        'FitnessFreak', 'MeditationGuru', 'PetLover', 'CatMom', 'DogDad',
        'HomeChef', 'BBQMaster', 'TeaConnoisseur', 'WineTaster', 'CraftBeerFan',
        'SunriseSeeker', 'SunsetChaser', 'StarGazer', 'MoonWalker', 'CloudWatcher',
        'RainDancer', 'SnowQueen', 'StormRider', 'ThunderBolt', 'LightningStrike',
        'PixelWarrior', 'RetroGamer', 'SpeedRunner', 'AchievementHunter', 'PlatinumTrophy',
        'RaidLeader', 'ClutchPlayer', 'HeadshotKing', 'StealthMaster', 'TankMain',
        'HealerMain', 'DamageDealer', 'SupportMain', 'ProPlayer', 'EsportsLegend',
        'NoobMaster', 'VeteranGamer', 'TheGrinder', 'TheoryCrafter', 'LoreMaster',
        'LuckyCharm', 'FortuneCookie', 'DiamondHands', 'GoldenEagle', 'SilverFox',
        'RainbowDash', 'ShadowHunter', 'PhoenixRising', 'DragonSoul', 'WolfPack',
        'NightRaven', 'StormBringer', 'FireFox', 'IceQueen', 'ThunderStrike',
        'CyberPunk', 'NeonRider', 'QuantumLeap', 'StarLord', 'IronFist',
        'DataDrifter', 'CodeCrusader', 'ByteMe', 'NullPointer', 'StackOverflow',
        'AngryCat', 'LazyDog', 'SlyFox', 'BraveLion', 'SwiftEagle',
        'CleverMonkey', 'ProudPeacock', 'GentleGiant', 'FierceTiger', 'WiseOwl',
        'ChaosTheory', 'ButterflyEffect', 'DarkMatter', 'BlackHole', 'WhiteDwarf',
        'SpicyNoodle', 'SweetTooth', 'SourPatch', 'BitterCoffee', 'SaltyPretzel',
        'RichDaddy', 'MoneyBags', 'GoldFinger', 'PlatinumCard', 'DiamondEyes',
        'CtrlAltDel', 'AltF4', 'BlueScreen', 'Error404', 'LoadingDot',
        'Crystal_Clear', 'Midnight_Star', 'Velvet_Rose', 'Silent_Echo', 'Broken_Dream',
        'Lost_Soul', 'Dark_Knight', 'White_Wizard', 'Red_Queen', 'Blue_King'
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
        return {
            id: lobbyIdCounter++,
            name: randomNickname(),
            bet: randomBetAmount(),
            item: null,
            game: 'dice'
        };
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
                        ${lobby.item ? `<div class="lobby-item-badge">🎒 ${lobby.item.name}</div>` : ''}
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
        if (lobbies.length >= 21) return;   // было 12
        lobbies.push(makeLobby());
        renderLobbies();
    }

    function removeRandomLobby() {
        if (lobbies.length <= 4) return;    // было 2
        const idx = Math.floor(Math.random() * lobbies.length);
        lobbies.splice(idx, 1);
        renderLobbies();
    }

    function startLobbySimulation() {
        if (lobbies.length === 0) {
            // Стартовое наполнение — 8–12 лобби
            const initial = randomInt(8, 12);
            for (let i = 0; i < initial; i++) {
                lobbies.push(makeLobby());
            }
            renderLobbies();
        }

        onlineCount = randomInt(180, 420);
        onlineCountEl.textContent = onlineCount.toString();

        if (lobbyAddInterval) clearInterval(lobbyAddInterval);
        lobbyAddInterval = setInterval(() => {
            if (Math.random() < 0.7) addRandomLobby();   // чаще добавляем
        }, 3500);                                        // было 4500

        if (lobbyRemoveInterval) clearInterval(lobbyRemoveInterval);
        lobbyRemoveInterval = setInterval(() => {
            if (Math.random() < 0.35) removeRandomLobby();  // реже удаляем
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

    // ============ МОДАЛКА: СОЗДАНИЕ ============
    function openCreateModal() {
        selectedCreateItem = null;
        createBetInput.value = '';
        createBetInput.disabled = false;
        createBetInput.style.opacity = '1';
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

    // ============ МОДАЛКА: JOIN ============
    function openJoinModal(lobby) {
        joiningLobby = lobby;
        selectedJoinItem = null;

        joinOppGameIcon.textContent = gameIcon(lobby.game);
        joinOppGameName.textContent = gameName(lobby.game);
        joinOppNameEl.textContent = lobby.name;
        joinOppBetEl.textContent = lobby.bet.toLocaleString('ru-RU') + ' ₽';
        joinBetInput.value = lobby.bet;
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

        if (playerBetValue <= 0) {
            joinChanceEl.textContent = '—';
            return;
        }

        const p = calcPlayerWinChance(playerBetValue, joiningLobby.bet);
        joinChanceEl.textContent = (p * 100).toFixed(1) + '%';
    }

    // ============ ЗНАЧЕНИЯ КУБИКОВ ============
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

    // ============ СТАРТ ДУЭЛИ ============
    function startDuel(config) {
        currentGame = {
            game: config.game || 'dice',
            playerBetValue: config.playerBet.value,
            playerItem: config.playerBet.item || null,
            opponentName: config.opponentName,
            opponentBetValue: config.opponentBet,
            opponentItem: config.opponentItem || null,
            phase: 'ready'
        };

        lobbyView.style.display = 'none';
        gameView.style.display = 'block';
        stopLobbySimulation();

        youNameEl.textContent = 'Вы';
        oppNameEl.textContent = currentGame.opponentName;
        youBetDisplay.textContent = config.playerBet.value.toLocaleString('ru-RU') + ' ₽' +
            (config.playerBet.item ? ` · 🎒 ${config.playerBet.item.name}` : '');
        oppBetDisplay.textContent = config.opponentBet.toLocaleString('ru-RU') + ' ₽';

        const p = calcPlayerWinChance(currentGame.playerBetValue, currentGame.opponentBetValue);
        youChanceEl.innerHTML = `Победа: <b>${(p * 100).toFixed(1)}%</b>`;
        oppChanceEl.innerHTML = `Победа: <b>${((1 - p) * 100).toFixed(1)}%</b>`;

        bankValueEl.textContent = (currentGame.playerBetValue + currentGame.opponentBetValue).toLocaleString('ru-RU') + ' ₽';

        renderDiceFace(youDiceEl, 1);
        renderDiceFace(oppDiceEl, 1);
        youDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));
        oppDiceEl.querySelectorAll('.dot').forEach(d => d.classList.remove('on'));

        duelMessage.textContent = '';
        duelMessage.className = 'duel-message';
        duelStatus.textContent = 'Готовы? Нажмите кнопку';
        duelStatus.style.color = '';

        document.querySelectorAll('.dice-side').forEach(el => el.classList.remove('winner', 'loser'));

        rollBtn.onclick = onRollClick;
        rollBtn.disabled = false;
        rollBtn.textContent = '🎲 БРОСИТЬ КУБИКИ';
        isRolling = false;
    }

    function onRollClick() {
        if (isRolling || !currentGame) return;
        rollDice();
    }

    // ============ БРОСОК ============
    function rollDice() {
        isRolling = true;
        rollBtn.disabled = true;
        rollBtn.textContent = '🎲 БРОСАЕМ...';
        duelStatus.textContent = 'Кубики в полёте...';
        duelMessage.textContent = '';
        duelMessage.className = 'duel-message';

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
            resolveDuel(playerWins);
        }, 450);
    }

    // ============ РАСЧЁТ ============
    function resolveDuel(playerWins) {
        const betValue = currentGame.playerBetValue;
        const oppValue = currentGame.opponentBetValue;

        if (playerWins) {
            const winFromOpp = oppValue * (1 - RAKE);

            if (currentGame.playerItem) {
                returnItemToInventory(currentGame.playerItem);
                window.globalBalance += winFromOpp;
            } else {
                window.globalBalance += betValue + winFromOpp;
            }

            saveBalance();
            updateBalanceDisplay();

            duelMessage.textContent = `🏆 ПОБЕДА! Вы забираете ${formatMoney(winFromOpp)} ₽ (своя ставка возвращена${currentGame.playerItem ? ', предмет возвращён' : ''})`;
            duelMessage.className = 'duel-message win';
            duelStatus.textContent = 'Раунд завершён';
            duelStatus.style.color = '#4CAF50';
        } else {
            duelMessage.textContent = `💀 ПРОИГРЫШ. Вы теряете ${betValue.toLocaleString('ru-RU')} ₽`;
            duelMessage.className = 'duel-message lose';
            duelStatus.textContent = 'Раунд завершён';
            duelStatus.style.color = '#ff5555';
        }

        rollBtn.textContent = '↩ ВЕРНУТЬСЯ В ЛОББИ';
        rollBtn.disabled = false;
        rollBtn.onclick = () => returnToLobby();
        isRolling = false;
    }

    function returnToLobby() {
        currentGame = null;
        isRolling = false;

        gameView.style.display = 'none';
        lobbyView.style.display = 'block';

        rollBtn.onclick = onRollClick;
        rollBtn.textContent = '🎲 БРОСИТЬ КУБИКИ';
        rollBtn.disabled = false;

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

        confirmCreateBtn.addEventListener('click', () => {
            let betValue;
            if (selectedCreateItem) betValue = selectedCreateItem.price;
            else betValue = parseFloat(createBetInput.value) || 0;

            if (betValue <= 0) return;

            if (selectedCreateItem) {
                const inv = getInventory();
                if (!inv.some(i => i.id === selectedCreateItem.id)) return;
                window.InventoryManager.removeItem(selectedCreateItem.id);
                startWaitingForOpponent({ value: betValue, item: selectedCreateItem, game: 'dice' });
            } else {
                if (betValue > (window.globalBalance || 0)) {
                    alert('Недостаточно средств!');
                    return;
                }
                window.globalBalance -= betValue;
                saveBalance();
                updateBalanceDisplay();
                startWaitingForOpponent({ value: betValue, item: null, game: 'dice' });
            }

            closeCreateModal();
        });

        cancelJoinBtn.addEventListener('click', closeJoinModal);
        joinBetInput.addEventListener('input', updateJoinChancePreview);

        document.querySelectorAll('.bet-adjust-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!joiningLobby) return;
                const factor = parseFloat(btn.dataset.factor);
                const target = Math.max(10, Math.round(joiningLobby.bet * factor));
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

            let playerBetValue;
            let playerItem = null;

            if (selectedJoinItem) {
                playerBetValue = selectedJoinItem.price;
                playerItem = selectedJoinItem;
            } else {
                playerBetValue = parseFloat(joinBetInput.value) || 0;
            }

            if (playerBetValue <= 0) return;

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
            const gameId = joiningLobby.game;

            lobbies = lobbies.filter(l => l.id !== joiningLobby.id);
            renderLobbies();

            closeJoinModal();

            startDuel({
                game: gameId,
                playerBet: { value: playerBetValue, item: playerItem },
                opponentName,
                opponentBet
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

    // ============ ВОЗВРАТ ПРЕДМЕТА В ИНВЕНТАРЬ ============
    // ВАЖНО: InventoryManager.addItem принимает позиционные аргументы:
    //   addItem(name, image, tier, price)
    // Поэтому нельзя передавать объект item целиком — иначе получится
    // предмет с именем "[object Object]" и дефолтной ценой 1000.
    function returnItemToInventory(item) {
        if (!item || !window.InventoryManager) return;
        try {
            window.InventoryManager.addItem(
                item.name,
                item.image,
                item.tier,
                item.price
            );
        } catch (e) {
            console.error('Не удалось вернуть предмет в инвентарь:', e);
        }
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
            const r = Math.random();
            if (r < 0.15) oppBet = Math.round(playerBet.value * 1.2);
            else if (r < 0.30) oppBet = Math.round(playerBet.value / 1.2);

            startDuel({
                game: playerBet.game,
                playerBet,
                opponentName: randomNickname(),
                opponentBet: oppBet
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

        console.log('DUELS: инициализирован. Игр в реестре:', Object.keys(GAME_TYPES).length);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
