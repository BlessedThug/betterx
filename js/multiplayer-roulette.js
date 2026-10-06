/* ============================================================
   ONLINE PLAYERS для рулетки
   Синхронизируется с раундами через window.rouletteOnline.onGameStart/onNewRound
   ============================================================ */
(function () {
    const playersList = document.getElementById('players-list');
    const totalBetsEl = document.getElementById('total-bets-amount');
    const onlineCount = document.getElementById('online-count');
    const statsTotal = document.getElementById('stats-total');
    const statsHighBets = document.getElementById('stats-high-bets');
    const statsWinners = document.getElementById('stats-winners');

    if (!playersList) return;

    let players = [];
    let usedNames = new Set();
    let idCounter = 1;
    let spawnTimer = null;
    let currentRoundActive = false;
    let heartbeatInterval = null;

    // ============ НИКИ ============
    const NICKNAMES = [
        'Azure_Blade', 'Black_Storm', 'Crimson_Fury', 'Cyber_Wraith', 'Dark_Ember',
        'Dawn_Breaker', 'Deep_Blue', 'Demon_Slayer', 'Diamond_Edge', 'Doom_Bringer',
        'Double_Tap', 'Dragon_Fire', 'Elite_Sniper', 'Eternal_Flame', 'Fallen_Angel',
        'First_Blood', 'Frost_Giant', 'Ghost_Recon', 'Golden_Hawk', 'Hell_Fire_42',
        'High_Voltage', 'Holy_Knight', 'Horizon_Zero', 'Inferno_Blaze', 'Iron_Will',
        'Jade_Emperor', 'Jungle_King', 'Krypton_Force', 'Light_Bringer', 'Lone_Wolf_13',
        'Midnight_Raven', 'Mystic_Storm', 'Necro_Mancer', 'Night_Shadow', 'Ocean_Wave',
        'Phantom_Reaper', 'Platinum_Edge', 'Power_Player', 'Pure_Energy', 'Quick_Silver',
        'Red_Devil_07', 'Rocket_Man', 'Royal_Guard', 'ShadowMorph', 'SteelEagle',
        'PhantomStrike', 'MysticEcho', 'BlazeRunner', 'CrystalShard', 'DuskReaper',
        'EmberWolf', 'FangBlade', 'GlacialTide', 'HawkEye_99', 'IronSoul',
        'JadeDragon', 'KrakenRise', 'LunarFox', 'Maelstrom_7', 'Nebula_42',
        'OnyxFang', 'PrismLight', 'QuantumFox', 'RavenFrost', 'SableWind',
        'Tempest_88', 'Umbra_13', 'vlad_k26', 'shadow_reaper', 'katya.smirnova',
        'alex_gaming99', 'dark_knight_x', 'cyber_ghost', 'masha_fox', 'pixel_art',
        'dima.volkov', 'neon_pulse', 'anastasia_r', 'toxic_vibe', 'sergey.k',
        'alpha_wolf', 'lisa_sweet', 'night_walker', 'max_force_8', 'julia_dream',
        'frost_bite', 'pavel_pro', 'silent_assassin', 'olga_travel', 'iron_man_91',
        'kristina_m', 'storm_bringer', 'denis_d', 'moon_light', 'artem_k',
        'wild_cat', 'speed_demon', 'elena_s', 'matrix_cod', 'ivan_best',
        'angel_eyes', 'black_pearl', 'igor_v', 'cosmic_ray', 'natalia_p',
        'fire_starter', 'roma_g', 'golden_boy', 'starlight', 'andrey_b',
        'ice_queen', 'phantom_lord', 'anna_k', 'vortex_x', 'dmitry_l',
        'silver_surfer', 'ksenia_v', 'Valkyrie_6', 'Wraith_77', 'Xenon_5',
        'Yeti_27', 'Zenith_3', 'ApexHunter', 'Blitz_44', 'Cipher_9',
        'Delta_One', 'Echo_Zero', 'GammaRay', 'Helix_22', 'Inertia_4',
        'Joker_66', 'Karma_11', 'Lynx_88', 'Matrix_99', 'Nova_Star',
        'Orion_Belt', 'Phoenix_Ash', 'Quasar_77', 'Raptor_33', 'Sirius_12',
        'Titan_55', 'Vector_6', 'North_Wind', 'ShadowStalker', 'Iron_Falcon',
        'Last_Resort', 'Dark_Phoenix', 'Silent_Titan', 'Storm_Bringer', 'Grey_Wolf_77',
        'Night_Reaper', 'Omega_Force', 'RageQuit_No', 'Bloody_Mary', 'OneTap_King',
        'Berserker_Rage', 'NoMercy_01', 'Headshot_Harry', 'Mad_Max_88', 'Savage_Beast'
    ];

    // Возможные ставки: тип клетки, лейбл, множитель, вес
    const BET_TYPES = [
        { type: 'red',      label: '🔴',     x: 2,  w: 22 },
        { type: 'black',    label: '⚫',     x: 2,  w: 22 },
        { type: 'even',     label: 'EVEN',   x: 2,  w: 8  },
        { type: 'odd',      label: 'ODD',    x: 2,  w: 8  },
        { type: 'low',      label: '1-18',   x: 2,  w: 6  },
        { type: 'high',     label: '19-36',  x: 2,  w: 6  },
        { type: 'dozen',    label: '1st 12', x: 3,  dozen: 1, w: 5 },
        { type: 'dozen',    label: '2nd 12', x: 3,  dozen: 2, w: 5 },
        { type: 'dozen',    label: '3rd 12', x: 3,  dozen: 3, w: 5 },
        { type: 'column',   label: 'Кол. 1', x: 3,  col: 1, w: 3 },
        { type: 'column',   label: 'Кол. 2', x: 3,  col: 2, w: 3 },
        { type: 'column',   label: 'Кол. 3', x: 3,  col: 3, w: 3 },
        { type: 'straight', label: null,     x: 36, w: 4 }
    ];

    function pickWeightedBet() {
        const total = BET_TYPES.reduce((s, b) => s + b.w, 0);
        let r = Math.random() * total;
        for (const b of BET_TYPES) {
            r -= b.w;
            if (r <= 0) {
                if (b.type === 'straight') {
                    const num = Math.floor(Math.random() * 38);
                    const label = num === 37 ? '00' : `${num}`;
                    const x = (num === 0 || num === 37) ? 50 : 36;
                    return { type: 'straight', number: num, label, x };
                }
                return b;
            }
        }
        return BET_TYPES[0];
    }

    function generateBetAmount() {
        const r = Math.random() * 100;
        if (r < 40) return Math.floor(Math.random() * 450 + 50);
        if (r < 75) return Math.floor(Math.random() * 1500 + 500);
        if (r < 90) return Math.floor(Math.random() * 8000 + 2000);
        if (r < 97) return Math.floor(Math.random() * 40000 + 10000);
        return Math.floor(Math.random() * 100000 + 50000);
    }

    function pickNickname() {
        let available = NICKNAMES.filter(n => !usedNames.has(n));
        if (available.length === 0) {
            usedNames.clear();
            available = [...NICKNAMES];
        }
        const n = available[Math.floor(Math.random() * available.length)];
        usedNames.add(n);
        return n;
    }

    // ============ РЕНДЕР ============
    function createPlayerCard(p) {
        const div = document.createElement('div');
        div.className = 'ro-player';
        div.dataset.id = p.id;

        const high = p.amount >= 50000;
        const name = high ? `${p.name} ⭐` : p.name;

        div.innerHTML = `
            <div class="ro-player-name"><span>${name}</span></div>
            <div class="ro-player-bet">
                <span>Клетка:</span>
                <span class="cell">${p.bet.label}</span>
            </div>
            <div class="ro-player-bet">
                <span>Ставка:</span>
                <span class="val">${p.amount.toLocaleString()} ₽</span>
            </div>
            <div class="ro-player-bet">
                <span>Множитель:</span>
                <span class="val">x${p.bet.x}</span>
            </div>
        `;
        return div;
    }

    function appendPlayer(p) {
        playersList.appendChild(createPlayerCard(p));
        playersList.scrollTop = playersList.scrollHeight;
    }

    function updateTotals() {
        const total = players.reduce((s, p) => s + p.amount, 0);
        if (totalBetsEl) totalBetsEl.textContent = total.toLocaleString();
        if (onlineCount) onlineCount.textContent = players.length;
        if (statsTotal) statsTotal.textContent = players.length;
        if (statsHighBets) statsHighBets.textContent = players.filter(p => p.amount >= 50000).length;
        if (statsWinners) statsWinners.textContent = players.filter(p => p.result === 'win').length;
    }

    // ============ СПАВН ============
    function spawnPlayer() {
        const bet = pickWeightedBet();
        const p = {
            id: idCounter++,
            name: pickNickname(),
            amount: generateBetAmount(),
            bet: bet,
            result: null,
            winAmount: 0
        };
        players.push(p);
        appendPlayer(p);
        updateTotals();
    }

    function scheduleSpawns() {
        if (spawnTimer) {
            clearTimeout(spawnTimer);
            spawnTimer = null;
        }
        // Целевое количество новых игроков за раунд
        const targetCount = 8 + Math.floor(Math.random() * 12);
        let spawned = 0;

        function tick() {
            // ⛔ ГЛАВНАЯ ЗАЩИТА: не спавним во время игры
            if (currentRoundActive) return;
            if (spawned >= targetCount) return;

            if (Math.random() < 0.25) {
                spawnTimer = setTimeout(tick, 500 + Math.random() * 1500);
                return;
            }

            spawnPlayer();
            spawned++;
            spawnTimer = setTimeout(tick, 400 + Math.random() * 1800);
        }
        tick();
    }

    // ============ РЕЗОЛВ РАУНДА ============
    function resolveRound(outcome, checkWinFn) {
        players.forEach(p => {
            let won = false;
            const fake = { type: p.bet.type };
            if (p.bet.type === 'straight') fake.number = p.bet.number;
            if (p.bet.type === 'dozen')    fake.dozenIndex = p.bet.dozen;
            if (p.bet.type === 'column')   fake.colIndex = p.bet.col;

            won = checkWinFn(fake, outcome);

            if (won) {
                p.result = 'win';
                p.winAmount = p.amount * p.bet.x - p.amount;
            } else {
                p.result = 'lose';
                p.winAmount = -p.amount;
            }

            const el = playersList.querySelector(`.ro-player[data-id="${p.id}"]`);
            if (el) {
                const oldRes = el.querySelector('.ro-player-result');
                if (oldRes) oldRes.remove();

                const res = document.createElement('div');
                res.className = 'ro-player-result ' + (won ? 'win' : 'lose');
                res.textContent = won
                    ? `✅ +${p.winAmount.toLocaleString()} ₽`
                    : `❌ −${p.amount.toLocaleString()} ₽`;
                el.appendChild(res);
            }
        });

        updateTotals();
    }

    // ============ СИГНАЛЫ ОТ ОСНОВНОГО СКРИПТА ============
    function onGameStart() {
        // Немедленно останавливаем спавн — раунд начался
        currentRoundActive = true;
        if (spawnTimer) {
            clearTimeout(spawnTimer);
            spawnTimer = null;
        }

        // Все нерешённые игроки → статус «в игре»
        players.forEach(p => {
            if (p.result === null) {
                p.result = 'pending';
                const el = playersList.querySelector(`.ro-player[data-id="${p.id}"]`);
                if (el && !el.querySelector('.ro-player-result')) {
                    const res = document.createElement('div');
                    res.className = 'ro-player-result pending';
                    res.textContent = '⏳ В игре...';
                    el.appendChild(res);
                }
            }
        });
    }

    function onNewRound() {
        // Новый раунд: сбрасываем всех игроков и начинаем новый спавн
        currentRoundActive = false;
        players = [];
        usedNames.clear();
        playersList.innerHTML = '';
        updateTotals();
        scheduleSpawns();
    }

    // ============ FALLBACK: следим за таймером ============
    // Если по каким-то причинам сигналы не пришли — ловим по timer-value.
    const timerValueEl = document.getElementById('timer-value');
    if (timerValueEl) {
        let lastTime = null;
        setInterval(() => {
            const t = parseInt(timerValueEl.textContent);
            if (isNaN(t)) return;

            // Резкий скачок вверх (например, с 3 на 20) = новый раунд
            if (lastTime !== null && t > lastTime + 5 && lastTime < 5) {
                onNewRound();
            }
            lastTime = t;
        }, 300);
    }

    // ============ ПЕРИОДИЧЕСКОЕ ОБНОВЛЕНИЕ ============
    heartbeatInterval = setInterval(updateTotals, 1000);

    // Стартуем первый раунд сразу (основной скрипт тоже дёрнет onNewRound через 1.2с,
    // но подстрахуемся, чтобы спавн начался сразу при загрузке)
    scheduleSpawns();

    // ============ ЭКСПОРТ ============
    window.rouletteOnline = {
        resolveRound: resolveRound,
        onGameStart: onGameStart,
        onNewRound: onNewRound
    };
})();