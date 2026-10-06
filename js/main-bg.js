/* ============================================================
   MAIN MENU — плавающие частицы и орбы.
   ============================================================ */
(function () {
    function init() {
        // Защита от повторного запуска
        if (document.querySelector('.main-particles')) return;

        // Слой частиц
        const layer = document.createElement('div');
        layer.className = 'main-particles';
        document.body.appendChild(layer);

        const count = window.innerWidth < 700 ? 22 : 44;
        for (let i = 0; i < count; i++) createParticle(layer);

        // Орбы в разных углах
        addOrb('10%',  '18%', 380);
        addOrb('82%',  '62%', 460);
        addOrb('50%',   '4%', 300);
        addOrb('30%',  '85%', 340);
    }

    function createParticle(layer) {
        const p = document.createElement('div');
        p.className = 'main-particle';

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

    function addOrb(left, top, size) {
        const orb = document.createElement('div');
        orb.className = 'main-orb';
        orb.style.cssText = `
            left: ${left};
            top: ${top};
            width: ${size}px;
            height: ${size}px;
            animation-delay: ${(Math.random() * 6).toFixed(1)}s;
        `;
        document.body.appendChild(orb);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();