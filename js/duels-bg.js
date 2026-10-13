(function () {
    function initDuelsBg() {
        const main = document.querySelector('main.duels-game-area');
        if (!main) return;

        // Один фиксированный слой для эффектов на всю страницу
        const layer = document.createElement('div');
        layer.className = 'duels-bg-layer';
        document.body.appendChild(layer);

        // Частицы
        const count = window.innerWidth < 700 ? 18 : 34;
        for (let i = 0; i < count; i++) {
            createParticle(layer);
        }

        // Орбы
        addOrb(layer, '12%', '18%', 340);
        addOrb(layer, '80%', '65%', 420);
        addOrb(layer, '55%', '5%', 260);
    }

    function createParticle(layer) {
        const p = document.createElement('div');
        p.className = 'duels-particle';

        const size     = 2 + Math.random() * 4;
        const left     = Math.random() * 100;
        const duration = 14 + Math.random() * 18;
        const delay    = Math.random() * duration;
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
        orb.className = 'duels-orb';
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
        document.addEventListener('DOMContentLoaded', initDuelsBg);
    } else {
        initDuelsBg();
    }
})();