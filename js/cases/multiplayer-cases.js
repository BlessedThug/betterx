(function () {
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

    let usedNicknames = new Set();

    function getRandomNickname() {
        let available = nicknames.filter(n => !usedNicknames.has(n));
        if (available.length === 0) {
            usedNicknames.clear();
            available = [...nicknames];
        }
        const nick = available[Math.floor(Math.random() * available.length)];
        usedNicknames.add(nick);
        // 15% шанс добавить цифры
        if (Math.random() < 0.15 && !nick.includes('_')) {
            return nick + Math.floor(Math.random() * 100);
        }
        return nick;
    }

    // ========== СПИСОК ПРЕДМЕТОВ ДЛЯ ДРОПОВ ==========
    // Агрегируем данные из всех кейсов, чтобы не дублировать списки.
    // Требуется, чтобы все *-data.js были подключены до этого скрипта.
    const dropItems = [];

    function addDataSource(dataArr, source) {
        if (!Array.isArray(dataArr)) {
            console.warn(`multiplayer-cases.js: источник "${source}" не найден или пуст`);
            return;
        }
        dataArr.forEach(item => {
            dropItems.push({
                name: item.name,
                price: item.price,
                image: item.image,
                tier: item.tier,
                source: source
            });
        });
    }

    addDataSource(window.MONEY_CASE_DATA, 'money');
    addDataSource(window.ITEMS_CASE_DATA, 'items');
    addDataSource(window.CS2_SKINS,       'cs2');
    addDataSource(window.GAMES_CASE_DATA, 'games');

    console.log('multiplayer-cases.js: загружено дропов —', dropItems.length);

    function getRandomDrop() {
        const item = dropItems[Math.floor(Math.random() * dropItems.length)];
        const nick = getRandomNickname();
        return {
            nick: nick,
            item: item,
            timestamp: new Date()
        };
    }

    function formatTime(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return 'только что';
        if (diff < 3600) return Math.floor(diff / 60) + ' мин назад';
        if (diff < 86400) return Math.floor(diff / 3600) + ' ч назад';
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    // ========== СОЗДАНИЕ ПАНЕЛИ ==========
    function createLivePanel() {
        const main = document.querySelector('main');
        if (!main) return;

        // Обернуть существующий контент в .cases-main-wrapper
        let wrapper = document.querySelector('.cases-main-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'cases-main-wrapper';
            wrapper.style.cssText = 'flex:1; display:flex; flex-direction:column; overflow:hidden;';
            // Перемещаем всех детей main в wrapper
            while (main.firstChild) {
                wrapper.appendChild(main.firstChild);
            }
            main.appendChild(wrapper);
        }

        // Создаём панель
        const panel = document.createElement('div');
        panel.id = 'live-drop-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <span>🎁</span> ПОСЛЕДНИЕ ВЫИГРЫШИ
            </div>
            <div id="live-drop-list"></div>
        `;
        main.appendChild(panel);

        const list = document.getElementById('live-drop-list');
        let dropCount = 0;

        function addDrop() {
            const drop = getRandomDrop();
            const item = drop.item;
            const timeStr = formatTime(drop.timestamp);

            const div = document.createElement('div');
            div.className = `drop-item ${item.tier}`;
            div.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="drop-icon" onerror="this.src='../img/logo.png'">
                <div class="drop-info">
                    <div class="drop-nick">${drop.nick}</div>
                    <div class="drop-name">${item.name}</div>
                    <div class="drop-price">${item.price.toLocaleString()} ₽</div>
                </div>
                <div class="drop-time">${timeStr}</div>
                <div class="drop-tier" style="background:${getTierColor(item.tier)};"></div>
            `;

            // Вставляем в начало списка
            list.insertBefore(div, list.firstChild);
            dropCount++;

            // Удаляем старые, если больше 20
            while (list.children.length > 20) {
                list.removeChild(list.lastChild);
            }

            // Прокрутка вверх (показываем свежие)
            list.scrollTop = 0;
        }

        function getTierColor(tier) {
            const colors = {
                'tier1': '#3880ec',
                'tier2': '#7e1a7e',
                'tier3': '#f14df1',
                'tier4': '#dd3131',
                'tier5': '#f7f723'
            };
            return colors[tier] || '#888';
        }

        // Первоначальное заполнение (10 дропов)
        for (let i = 0; i < 10; i++) {
            // Добавляем с задержкой для анимации
            setTimeout(() => {
                addDrop();
            }, i * 150);
        }

        // Интервал добавления новых дропов (2–5 секунд)
        function scheduleNext() {
            const delay = Math.random() * 3000 + 2000; // 2-5 сек
            setTimeout(() => {
                addDrop();
                scheduleNext();
            }, delay);
        }
        scheduleNext();

        // Обновление времени каждую минуту (для отображения "только что" и т.п.)
        setInterval(() => {
            const items = list.querySelectorAll('.drop-item');
            items.forEach(el => {
                // Время не обновляем динамически, т.к. оно статическое, но можно пересчитать, если хранить дату. 
                // Оставим как есть.
            });
        }, 60000);
    }

    // Запуск при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createLivePanel);
    } else {
        createLivePanel();
    }
})();