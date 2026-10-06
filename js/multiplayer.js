(function () {
    // Находим контейнеры
    const mainContainer = document.querySelector('main');
    const betContainer = document.getElementById('bet');
    const gameContainer = document.getElementById('game');

    // Сохраняем оригинальные стили
    if (betContainer) {
        betContainer.style.width = '400px';
        betContainer.style.flexShrink = '0';
    }

    if (gameContainer) {
        gameContainer.style.flex = '1';
        gameContainer.style.minWidth = '0';
    }

    // Создаем контейнер для блока с игроками
    const playersContainer = document.createElement('div');
    playersContainer.id = 'players-container';
    playersContainer.style.cssText = `
        width: 340px;
        flex-shrink: 0;
        background: rgb(27, 27, 27);
        border-left: 3px solid orange;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: calc(100vh - 65px);
    `;

    // Заголовок блока
    const playersHeader = document.createElement('div');
    playersHeader.style.cssText = `
        background: linear-gradient(135deg, #ff7e33, #ffb400);
        padding: 15px;
        text-align: center;
        font-weight: bold;
        font-size: 20px;
        color: #1a1a1a;
        border-bottom: 2px solid rgba(255, 165, 0, 0.5);
        flex-shrink: 0;
    `;
    playersHeader.innerHTML = '👥 ИГРОКИ В ИГРЕ';

    // Общая сумма ставок
    const totalBetsDiv = document.createElement('div');
    totalBetsDiv.id = 'total-bets-container';
    totalBetsDiv.style.cssText = `
        background: rgb(20, 20, 20);
        padding: 15px;
        text-align: center;
        border-bottom: 2px solid orange;
        flex-shrink: 0;
    `;
    totalBetsDiv.innerHTML = `
        <div style="color: #888; font-size: 13px; margin-bottom: 5px;">ОБЩАЯ СУММА СТАВОК</div>
        <span id="total-bets-amount" style="color: #ffb400; font-weight: bold; font-size: 28px;">0</span> 
        <span style="color: #ffffff; font-size: 18px;">₽</span>
        <div id="game-result-stats" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); display: none;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <div style="color: #4CAF50;">✅ ВЫИГРАНО: <span id="total-won-amount" style="font-weight: bold;">0</span> ₽</div>
                <div style="color: #f44336;">❌ ПРОИГРАНО: <span id="total-lost-amount" style="font-weight: bold;">0</span> ₽</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px;">
                <div style="color: #888;">🏆 ПОБЕДИТЕЛИ: <span id="winners-count" style="color: #4CAF50; font-weight: bold;">0</span></div>
                <div style="color: #888;">💀 ПРОИГРАВШИЕ: <span id="losers-count" style="color: #f44336; font-weight: bold;">0</span></div>
            </div>
        </div>
    `;

    // Контейнер для списка игроков
    const playersList = document.createElement('div');
    playersList.id = 'players-list';
    playersList.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background: rgb(25, 25, 25);
        display: flex;
        flex-direction: column;
    `;

    // Статистика игроков
    const playersStats = document.createElement('div');
    playersStats.style.cssText = `
        background: rgb(20, 20, 20);
        padding: 12px;
        border-top: 2px solid orange;
        display: flex;
        justify-content: space-around;
        flex-shrink: 0;
    `;
    playersStats.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 12px; color: #888;">ВСЕГО</div>
            <div><span id="stats-total" style="color: #ffb400; font-size: 22px; font-weight: bold;">0</span></div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 12px; color: #888;">КРУПНЫЕ ⭐</div>
            <div><span id="stats-high-bets" style="color: #ff6b6b; font-size: 22px; font-weight: bold;">0</span></div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 12px; color: #888;">ВЫСОКИЕ 🔥</div>
            <div><span id="stats-high-mults" style="color: #ff6b6b; font-size: 22px; font-weight: bold;">0</span></div>
        </div>
    `;

    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        #players-list::-webkit-scrollbar {
            width: 8px;
        }
        #players-list::-webkit-scrollbar-track {
            background: rgb(20, 20, 20);
            border-radius: 4px;
        }
        #players-list::-webkit-scrollbar-thumb {
            background: orange;
            border-radius: 4px;
        }
        .player-item {
            background: rgb(30, 30, 30);
            margin-bottom: 10px;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid orange;
            transition: all 0.2s;
            font-size: 14px;
        }
        .player-item:hover {
            transform: translateX(-3px);
            background: rgb(35, 35, 35);
        }
        .player-name {
            font-weight: bold;
            color: orange;
            margin-bottom: 8px;
            font-size: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .player-badge {
            font-size: 10px;
            padding: 3px 8px;
            border-radius: 12px;
            background: linear-gradient(135deg, #ff7e33, #ffb400);
            color: #1a1a1a;
            font-weight: bold;
        }
        .player-bet-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            color: #aaa;
            font-size: 13px;
        }
        .player-bet-label {
            color: #777;
        }
        .player-bet-amount {
            color: #ffffff;
            font-weight: normal;
            font-size: 14px;
        }
        .player-mult-value {
            color: #ffffff;
            font-weight: normal;
            font-size: 14px;
        }
        .player-win {
            color: #4CAF50;
            font-weight: bold;
            font-size: 13px;
        }
        .player-lose {
            color: #f44336;
            font-weight: bold;
            font-size: 13px;
        }
        .player-result {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 13px;
            text-align: center;
        }
        .player-bet-high {
            color: #ff6b6b;
            font-weight: bold;
            font-size: 15px;
        }
        .player-mult-high {
            color: #ff6b6b;
            font-weight: bold;
            font-size: 15px;
        }
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .player-new {
            animation: slideInRight 0.3s ease-out;
        }
        @keyframes highlightRed {
            0% { background: rgba(255, 107, 107, 0.2); border-left-color: #ff6b6b; }
            100% { background: rgb(30, 30, 30); border-left-color: orange; }
        }
        .player-high-bet {
            animation: highlightRed 0.8s ease-out;
        }
        @keyframes pulseGold {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
        }
        .total-highlight {
            animation: pulseGold 0.3s ease-out;
            display: inline-block;
        }
        #bet, #game {
            height: 100%;
        }
        main > div {
            display: flex;
            height: calc(100vh - 65px);
        }
    `;
    document.head.appendChild(style);

    // Собираем блок
    playersContainer.appendChild(playersHeader);
    playersContainer.appendChild(totalBetsDiv);
    playersContainer.appendChild(playersList);
    playersContainer.appendChild(playersStats);

    // Перестраиваем структуру main
    if (mainContainer && betContainer && gameContainer) {
        mainContainer.innerHTML = '';

        const flexContainer = document.createElement('div');
        flexContainer.style.cssText = `
            display: flex;
            height: calc(100vh - 65px);
            width: 100%;
        `;

        betContainer.style.height = '100%';
        betContainer.style.width = '400px';
        betContainer.style.flexShrink = '0';
        betContainer.style.borderRight = '3px solid orange';

        gameContainer.style.height = '100%';
        gameContainer.style.flex = '1';
        gameContainer.style.minWidth = '0';
        gameContainer.style.borderRight = 'none';

        flexContainer.appendChild(betContainer);
        flexContainer.appendChild(gameContainer);
        flexContainer.appendChild(playersContainer);

        mainContainer.appendChild(flexContainer);
    }

    // Данные игроков
    let players = [];
    let isGameActive = false;
    let gameInterval = null;
    let playerIdCounter = 1;
    let lastStatus = '';
    let usedNicknamesInGame = new Set();

    // 200+ уникальных ников
    const nicknames = [
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

    function getRandomNickname() {
        let availableNicknames = nicknames.filter(n => !usedNicknamesInGame.has(n));

        if (availableNicknames.length === 0) {
            usedNicknamesInGame.clear();
            availableNicknames = [...nicknames];
        }

        const randomIndex = Math.floor(Math.random() * availableNicknames.length);
        const selectedNick = availableNicknames[randomIndex];

        usedNicknamesInGame.add(selectedNick);

        // Только 15% ников получают цифры
        if (Math.random() < 0.15 && !selectedNick.includes('_')) {
            const number = Math.floor(Math.random() * 100);
            return `${selectedNick}${number}`;
        }

        return selectedNick;
    }

    function resetUsedNicknames() {
        usedNicknamesInGame.clear();
    }

    function generateRandomBetAmount() {
        const random = Math.random() * 100;
        if (random < 45) {
            return Math.floor(Math.random() * (500 - 50 + 1) + 50);
        }
        else if (random < 75) {
            return Math.floor(Math.random() * (2000 - 501 + 1) + 501);
        }
        else if (random < 90) {
            return Math.floor(Math.random() * (10000 - 2001 + 1) + 2001);
        }
        else if (random < 97) {
            return Math.floor(Math.random() * (50000 - 10001 + 1) + 10001);
        }
        else {
            return Math.floor(Math.random() * (150000 - 50001 + 1) + 50001);
        }
    }

    function generateRandomMultiplier() {
        const random = Math.random() * 100;
        if (random < 50) {
            return parseFloat((Math.random() * (2.00 - 1.00) + 1.00).toFixed(2));
        }
        else if (random < 80) {
            return parseFloat((Math.random() * (5.00 - 2.01) + 2.01).toFixed(2));
        }
        else if (random < 92) {
            return parseFloat((Math.random() * (10.00 - 5.01) + 5.01).toFixed(2));
        }
        else if (random < 97) {
            return parseFloat((Math.random() * (25.00 - 10.01) + 10.01).toFixed(2));
        }
        else if (random < 99) {
            return parseFloat((Math.random() * (50.00 - 25.01) + 25.01).toFixed(2));
        }
        else if (random < 99.8) {
            return parseFloat((Math.random() * (100.00 - 50.01) + 50.01).toFixed(2));
        }
        else {
            return parseFloat((Math.random() * (250.00 - 100.00) + 100.00).toFixed(2));
        }
    }

    function createPlayerElement(player, withAnimation = false) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.setAttribute('data-id', player.id);

        if (withAnimation) {
            playerDiv.classList.add('player-new');
        }

        let betStatus = '';
        if (player.result === 'win') {
            betStatus = `<div class="player-result"><span class="player-win">✅ ВЫИГРЫШ! +${player.winAmount.toLocaleString()} ₽</span></div>`;
        } else if (player.result === 'lose') {
            betStatus = `<div class="player-result"><span class="player-lose">❌ ПРОИГРЫШ! -${player.betAmount.toLocaleString()} ₽</span></div>`;
        } else if (player.result === 'pending') {
            betStatus = `<div class="player-result"><span style="color: orange;">⏳ Ожидание...</span></div>`;
        }

        const betAmountClass = player.isHighBet ? 'player-bet-high' : 'player-bet-amount';
        const multClass = player.isHighMultiplier ? 'player-mult-high' : 'player-mult-value';
        const highBetStar = player.isHighBet ? ' ⭐' : '';
        const highMultStar = player.isHighMultiplier ? ' 🔥' : '';

        playerDiv.innerHTML = `
            <div class="player-name">
                <span>${player.name}${highBetStar}${highMultStar}</span>
                ${player.isHighBet || player.isHighMultiplier ? '<span class="player-badge">РЕДКАЯ</span>' : ''}
            </div>
            <div class="player-bet-info">
                <span class="player-bet-label">💰 Ставка:</span>
                <span class="${betAmountClass}">${player.betAmount.toLocaleString()} ₽</span>
            </div>
            <div class="player-bet-info">
                <span class="player-bet-label">🎯 Цель:</span>
                <span class="${multClass}">x${player.multiplier.toFixed(2)}</span>
            </div>
            ${betStatus}
        `;

        return playerDiv;
    }

    function updateStats() {
        const totalPlayers = players.length;
        const highBets = players.filter(p => p.betAmount >= 50000).length;
        const highMultipliers = players.filter(p => p.multiplier >= 25).length;

        const statsTotal = document.getElementById('stats-total');
        const statsHighBets = document.getElementById('stats-high-bets');
        const statsHighMults = document.getElementById('stats-high-mults');

        if (statsTotal) statsTotal.textContent = totalPlayers;
        if (statsHighBets) statsHighBets.textContent = highBets;
        if (statsHighMults) statsHighMults.textContent = highMultipliers;
    }

    function animateTotalBets() {
        const totalSpan = document.getElementById('total-bets-amount');
        if (totalSpan) {
            totalSpan.classList.add('total-highlight');
            setTimeout(() => {
                totalSpan.classList.remove('total-highlight');
            }, 300);
        }
    }

    function updateTotalBets() {
        const total = players.reduce((sum, player) => sum + player.betAmount, 0);
        const totalBetsSpan = document.getElementById('total-bets-amount');
        if (totalBetsSpan) {
            totalBetsSpan.textContent = total.toLocaleString();
        }
    }

    function addPlayerToBottom(player) {
        const playerElement = createPlayerElement(player, true);
        playersList.appendChild(playerElement);

        if (player.isHighBet) {
            setTimeout(() => {
                playerElement.classList.add('player-high-bet');
                setTimeout(() => {
                    playerElement.classList.remove('player-high-bet');
                }, 800);
            }, 50);
        }

        playersList.scrollTop = playersList.scrollHeight;
    }

    function addRandomPlayer() {
        if (isGameActive) return;

        const bet = generateRandomBetAmount();
        const multiplier = generateRandomMultiplier();
        const name = getRandomNickname();

        const player = {
            id: playerIdCounter++,
            name: name,
            betAmount: bet,
            multiplier: multiplier,
            result: null,
            winAmount: null,
            timestamp: Date.now(),
            isHighBet: bet >= 50000,
            isHighMultiplier: multiplier >= 25
        };

        players.push(player);
        addPlayerToBottom(player);
        updateTotalBets();
        updateStats();

        if (bet >= 10000) animateTotalBets();
    }

    function updateAllToPending() {
        players.forEach(player => {
            if (player.result === null) {
                player.result = 'pending';
                const existingElement = document.querySelector(`.player-item[data-id="${player.id}"]`);
                if (existingElement && !existingElement.querySelector('.player-result')) {
                    const newResultDiv = document.createElement('div');
                    newResultDiv.className = 'player-result';
                    newResultDiv.innerHTML = '<span style="color: orange;">⏳ Ожидание...</span>';
                    existingElement.appendChild(newResultDiv);
                }
            }
        });
    }

    function updateAllResults(finalMultiplier) {
        players.forEach(player => {
            if (player.multiplier <= finalMultiplier) {
                player.result = 'win';
                player.winAmount = player.betAmount * player.multiplier - player.betAmount;
            } else {
                player.result = 'lose';
                player.winAmount = null;
            }

            const existingElement = document.querySelector(`.player-item[data-id="${player.id}"]`);
            if (existingElement) {
                let resultDiv = existingElement.querySelector('.player-result');
                if (!resultDiv) {
                    resultDiv = document.createElement('div');
                    resultDiv.className = 'player-result';
                    existingElement.appendChild(resultDiv);
                }

                if (player.result === 'win') {
                    resultDiv.innerHTML = '<span class="player-win">✅ ВЫИГРЫШ! +' + player.winAmount.toLocaleString() + ' ₽</span>';
                } else {
                    resultDiv.innerHTML = '<span class="player-lose">❌ ПРОИГРЫШ! -' + player.betAmount.toLocaleString() + ' ₽</span>';
                }
            }
        });
    }

    function showGameResults() {
        let totalWon = 0;
        let totalLost = 0;
        let winners = 0;
        let losers = 0;

        players.forEach(player => {
            if (player.result === 'win') {
                totalWon += player.winAmount;
                winners++;
            } else if (player.result === 'lose') {
                totalLost += player.betAmount;
                losers++;
            }
        });

        const totalWonSpan = document.getElementById('total-won-amount');
        const totalLostSpan = document.getElementById('total-lost-amount');
        const winnersCountSpan = document.getElementById('winners-count');
        const losersCountSpan = document.getElementById('losers-count');
        const gameResultStats = document.getElementById('game-result-stats');

        if (totalWonSpan) totalWonSpan.textContent = totalWon.toLocaleString();
        if (totalLostSpan) totalLostSpan.textContent = totalLost.toLocaleString();
        if (winnersCountSpan) winnersCountSpan.textContent = winners;
        if (losersCountSpan) losersCountSpan.textContent = losers;

        if (gameResultStats) {
            gameResultStats.style.display = 'block';
            gameResultStats.style.animation = 'slideInUp 0.5s ease-out';
        }
    }

    function hideGameResults() {
        const gameResultStats = document.getElementById('game-result-stats');
        if (gameResultStats) {
            gameResultStats.style.display = 'none';
        }
    }

    function clearAllPlayers() {
        players = [];
        playersList.innerHTML = '';
        resetUsedNicknames();
        hideGameResults();
        updateTotalBets();
        updateStats();
    }

    function processGameResults(finalMultiplier) {
        isGameActive = false;
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        updateAllResults(finalMultiplier);
        showGameResults();
    }

    function getRandomPlayersCount() {
        const random = Math.random() * 100;
        if (random < 55) {
            return Math.floor(Math.random() * 5) + 2;
        } else if (random < 85) {
            return Math.floor(Math.random() * 6) + 7;
        } else {
            return Math.floor(Math.random() * 8) + 13;
        }
    }

    function startPlayersSimulation() {
        if (gameInterval) {
            clearInterval(gameInterval);
        }

        clearAllPlayers();

        const playersCount = getRandomPlayersCount();

        // Рекурсивная функция для добавления игроков с разбросом
        function addPlayersWithDelay(index) {
            if (index >= playersCount) return;

            const delay = Math.random() * 2200 + 300;

            setTimeout(() => {
                if (!isGameActive) {
                    addRandomPlayer();
                }
                addPlayersWithDelay(index + 1);
            }, delay);
        }

        addPlayersWithDelay(0);

        gameInterval = setInterval(() => {
            if (!isGameActive && players.length < 35) {
                if (Math.random() < 0.35) {
                    setTimeout(() => {
                        if (!isGameActive && players.length < 35) {
                            addRandomPlayer();
                        }
                    }, Math.random() * 2000 + 500);
                }
            }
        }, 4000);
    }

    function stopPlayersSimulation() {
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
    }

    // Инициализация
    document.addEventListener('DOMContentLoaded', function () {
        startPlayersSimulation();

        const statusElement = document.getElementById('status');

        if (statusElement) {
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        const status = statusElement.textContent;

                        if (status === lastStatus) return;
                        lastStatus = status;

                        if (status === 'Идёт игра') {
                            isGameActive = true;
                            stopPlayersSimulation();
                            updateAllToPending();
                        } else if (status === 'Игра завершена') {
                            const multiplierElement = document.getElementById('x');
                            if (multiplierElement) {
                                const finalMultiplier = parseFloat(multiplierElement.textContent);
                                if (!isNaN(finalMultiplier)) {
                                    processGameResults(finalMultiplier);
                                }
                            }
                        } else if (status === 'Ожидание') {
                            isGameActive = false;
                            startPlayersSimulation();
                        }
                    }
                });
            });

            observer.observe(statusElement, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }

        const updatePlayersCount = setInterval(() => {
            if (!isGameActive) {
                playersHeader.innerHTML = `👥 ИГРОКИ В ИГРЕ (${players.length})`;
            } else {
                playersHeader.innerHTML = `👥 ИГРОКИ В ИГРЕ (${players.length}) 🎮`;
            }
        }, 1000);
    });

    window.multiplayer = {
        getPlayers: () => players,
        clearAllPlayers: clearAllPlayers,
        processGameResults: processGameResults
    };
})();