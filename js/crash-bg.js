/* ============================================================
   CRASH — плавающие частицы и орбы на игровом поле.
   ============================================================ */
(function () {
    function init() {
        // multiplayer.js пересобирает main — ждём немного, чтобы он успел
        const target = document.getElementById('game');
        if (!target) return;

        // Проверяем, что ещё не добавлено (на случай повторного вызова)
        if (target.querySelector('.crash-particles')) return;

        const particlesLayer = document.createElement('div');
        particlesLayer.className = 'crash-particles';
        target.appendChild(particlesLayer);

        const count = window.innerWidth < 700 ? 20 : 38;
        for (let i = 0; i < count; i++) createParticle(particlesLayer);

        addOrb(target, '10%', '20%', 360);
        addOrb(target, '78%', '60%', 440);
        addOrb(target, '50%',  '6%', 280);
    }

    function createParticle(layer) {
        const p = document.createElement('div');
        p.className = 'crash-particle';

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
        orb.className = 'crash-orb';
        orb.style.cssText = `
            left: ${left};
            top: ${top};
            width: ${size}px;
            height: ${size}px;
            animation-delay: ${(Math.random() * 6).toFixed(1)}s;
        `;
        parent.appendChild(orb);
    }

    // multiplayer.js пересобирает main — ждём завершения его работы
    // (он это делает на DOMContentLoaded). Поэтому запускаемся чуть позже.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 50);
        });
    } else {
        setTimeout(init, 50);
    }

    // На случай если multiplayer.js пересоберёт DOM позже
    setTimeout(init, 800);
})();