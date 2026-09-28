(() => {
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const cursor = document.createElement('div');
    cursor.className = 'cursor-shell';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
            <linearGradient id="wand-glow" x1="7" y1="27" x2="25" y2="7" gradientUnits="userSpaceOnUse">
                <stop stop-color="#9e6ee5"/><stop offset=".45" stop-color="#f7c5df"/><stop offset="1" stop-color="#fff9ec"/>
            </linearGradient>
        </defs>
        <path d="M7 27L24 10" stroke="#4d2a75" stroke-width="5" stroke-linecap="round"/>
        <path d="M7 27L24 10" stroke="url(#wand-glow)" stroke-width="2.7" stroke-linecap="round"/>
        <path class="cursor-glint" d="M25 3L26.7 7.3L31 9L26.7 10.7L25 15L23.3 10.7L19 9L23.3 7.3Z" fill="#fff8fc"/>
        <circle cx="7" cy="27" r="2.3" fill="#f9d4e9"/>
    </svg>`;
    document.body.appendChild(cursor);
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trail);
    let previousX = null;
    let tiltTimer;
    let lastMagicSpark = 0;
    const interactive = 'a, button, input, textarea, select, label, summary, [role="button"], [contenteditable="true"]';
    const hide = () => {
        root.classList.remove('has-custom-cursor');
        cursor.classList.remove('is-hovering', 'is-clicking', 'is-pulsing');
        previousX = null;
        clearTimeout(tiltTimer);
    };
    const update = event => {
        if (!finePointer.matches || event.pointerType !== 'mouse') { hide(); return false; }
        // Keep the arrow tip on the real pointer; animate the surface, not its position.
        cursor.style.transform = `translate3d(${event.clientX - 7}px, ${event.clientY - 27}px, 0)`;
        trail.style.transform = `translate3d(${event.clientX - 34}px, ${event.clientY - 34}px, 0)`;
        const tilt = motion.matches || previousX === null ? 0 : Math.max(-7, Math.min(7, (event.clientX - previousX) * .25));
        cursor.style.setProperty('--cursor-tilt', tilt + 'deg');
        previousX = event.clientX;
        clearTimeout(tiltTimer);
        tiltTimer = setTimeout(() => cursor.style.setProperty('--cursor-tilt', '0deg'), 100);
        const hovering = event.target instanceof Element && !!event.target.closest(interactive);
        cursor.classList.toggle('is-hovering', hovering);
        if (hovering && !motion.matches && performance.now() - lastMagicSpark > 130) {
            sparkle(event.clientX + 11, event.clientY - 5);
            lastMagicSpark = performance.now();
        }
        root.classList.add('has-custom-cursor');
        return true;
    };
    const sparkle = (x, y) => {
        if (motion.matches) return;
        const spark = document.createElement('span');
        spark.className = 'cursor-spark';
        spark.textContent = Math.random() > .5 ? '✦' : '✧';
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        document.body.appendChild(spark);
        window.setTimeout(() => spark.remove(), 720);
    };
    window.addEventListener('pointermove', update, { passive: true });
    window.addEventListener('pointerover', update, { passive: true });
    window.addEventListener('pointerdown', event => {
        if (!update(event)) return;
        cursor.classList.add('is-clicking');
        cursor.classList.remove('is-pulsing');
        void cursor.offsetWidth;
        cursor.classList.add('is-pulsing');
        sparkle(event.clientX, event.clientY);
    });
    window.addEventListener('pointerup', () => cursor.classList.remove('is-clicking'));
    window.addEventListener('pointercancel', hide);
    root.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    document.addEventListener('keydown', event => { if (event.key === 'Tab') hide(); });
    finePointer.addEventListener('change', hide);
})();
