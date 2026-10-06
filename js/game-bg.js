/* ============================================================
   Game background — плавающие частицы + орбы.
   Автоматически находит игровые зоны на странице.
   ============================================================ */
(function () {
    function initGameBackground() {
        const targets = document.querySelectorAll(
            'main .wheel-game-area, main .roulette-game-area, main .slots-game-area'
        );

        if (!targets.length) return;

        targets.forEach(target => {
            // Контейнер для частиц
            const particlesLayer = document.createElement('div');
            particlesLayer.className = 'game-particles';
            target.appendChild(particlesLayer);

            // Создаём частицы (кол-во зависит от размера)
            const count = window.innerWidth < 700 ? 18 : 34;
            for (let i = 0; i < count; i++) {
                createParticle(particlesLayer);
            }

            // Добавляем 2-3 пульсирующих орба
            addOrb(target,  '12%', '18%', 340);
            addOrb(target,  '80%', '65%', 420);
            addOrb(target,  '55%',  '5%', 260);
        });
    }

    function createParticle(layer) {
        const p = document.createElement('div');
        p.className = 'game-particle';

        const size     = 2 + Math.random() * 4;            // 2–6 px
        const left     = Math.random() * 100;              // 0–100%
        const duration = 14 + Math.random() * 18;          // 14–32 s
        const delay    = Math.random() * duration;         // старт в разное время
        const opacity  = 0.35 + Math.random() * 0.55;

        p.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            animation-duration: ${duration}s;
            animation-delay: -${delay}s;
            opacity: ${opacity};
        `;

        layer.appendChild(p);
    }

    function addOrb(parent, left, top, size) {
        const orb = document.createElement('div');
        orb.className = 'game-orb';
        orb.style.cssText = `
            left: ${left};
            top: ${top};
            width: ${size}px;
            height: ${size}px;
            animation-delay: ${(Math.random() * 6).toFixed(1)}s;
        `;
        parent.appendChild(orb);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGameBackground);
    } else {
        initGameBackground();
    }
})();