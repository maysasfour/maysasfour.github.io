(() => {
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const cursor = document.createElement('div');
    cursor.className = 'cursor-shell';
    cursor.setAttribute('aria-hidden', 'true');
    const outline = 'M8 2 Q9 1 10 2.5 L22 18 Q23.5 21 20 20.5 L12.5 19 Q11.5 18.8 10.5 19.5 L3.5 24 Q1 25.5 2 22 L6.5 4 Q7 2.5 8 2Z';
    cursor.innerHTML = `<svg viewBox="0 0 24 26" fill="none" aria-hidden="true">
        <defs>
            <linearGradient id="cursor-silver" x1="3" y1="2" x2="19" y2="25" gradientUnits="userSpaceOnUse">
                <stop stop-color="#fff"/><stop offset=".2" stop-color="#e7e7eb"/><stop offset=".48" stop-color="#b5b8bf"/><stop offset=".75" stop-color="#d6d8de"/><stop offset="1" stop-color="#fafbff"/>
            </linearGradient>
            <linearGradient id="cursor-rim" x1="5" y1="2" x2="14" y2="25" gradientUnits="userSpaceOnUse">
                <stop stop-color="#fff"/><stop offset=".48" stop-color="#efeff4"/><stop offset="1" stop-color="#6f727b"/>
            </linearGradient>
            <clipPath id="cursor-clip"><path d="${outline}"/></clipPath>
        </defs>
        <path d="${outline}" fill="url(#cursor-silver)" stroke="url(#cursor-rim)" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M8 4 L3.5 21 M10 4 L20 17" stroke="white" stroke-opacity=".72" stroke-width=".65" stroke-linecap="round"/>
        <g clip-path="url(#cursor-clip)"><path class="cursor-glint" d="M-10 -5L-2 -5L22 31L14 31Z" fill="white" fill-opacity=".4"/></g>
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
        cursor.style.transform = `translate3d(${event.clientX - 6.667}px, ${event.clientY - 1.692}px, 0)`;
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
