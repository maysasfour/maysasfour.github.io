(() => {
    const root = document.documentElement;
    const themeStorageKey = 'mays-portfolio-theme';
    const systemThemeMedia = window.matchMedia('(prefers-color-scheme: light)');

    const getSavedTheme = () => {
        try {
            const saved = localStorage.getItem(themeStorageKey);
            return saved === 'light' || saved === 'dark' ? saved : '';
        } catch { return ''; }
    };

    const getTheme = () => getSavedTheme() || (systemThemeMedia.matches ? 'light' : 'dark');

    const applyTheme = theme => {
        root.setAttribute('data-theme', theme);
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
            button.setAttribute('aria-pressed', String(theme === 'light'));
            button.innerHTML = theme === 'dark'
                ? '<span aria-hidden="true">☾</span>'
                : '<span aria-hidden="true">☀</span>';
        });
    };

    applyTheme(getTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
        button.addEventListener('click', () => {
            const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(themeStorageKey, next); } catch { /* Theme still works without storage. */ }
            applyTheme(next);
        });
    });

    systemThemeMedia.addEventListener('change', event => {
        if (!getSavedTheme()) applyTheme(event.matches ? 'light' : 'dark');
    });

    const revealItems = document.querySelectorAll('[data-reveal]');
    const reveal = element => element.classList.add('is-visible');
    if ('IntersectionObserver' in window) {
        root.classList.add('reveal-ready');
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    reveal(entry.target);
                    observer.unobserve(entry.target);
                }
            }
        }, { threshold: .05 });
        revealItems.forEach(item => observer.observe(item));
    } else {
        revealItems.forEach(reveal);
    }

    document.querySelectorAll('[data-year]').forEach(node => {
        node.textContent = String(new Date().getFullYear());
    });

    const openingScreen = document.querySelector('[data-opening-screen]');
    const enterButton = document.querySelector('[data-enter-site]');
    const soundToggle = document.querySelector('[data-sound-toggle]');
    const ambientAudio = document.querySelector('[data-ambient-audio]');
    let audioContext;
    let masterGain;
    let soundOn = false;
    let synthStarted = false;
    const siteNotice = document.createElement('p');
    siteNotice.className = 'site-notice';
    siteNotice.setAttribute('role', 'status');
    siteNotice.setAttribute('aria-live', 'polite');
    document.body.appendChild(siteNotice);
    const announce = message => {
        siteNotice.textContent = message;
        siteNotice.classList.add('is-visible');
        window.setTimeout(() => siteNotice.classList.remove('is-visible'), 5000);
    };
    const updateSoundButton = active => {
        if (!(soundToggle instanceof HTMLButtonElement)) return;
        soundToggle.textContent = active ? 'Ambient on' : 'Play ambience';
        soundToggle.setAttribute('aria-pressed', String(active));
    };
    const hideOpening = () => {
        if (openingScreen instanceof HTMLElement) openingScreen.classList.add('is-hidden');
        document.body.classList.add('site-entered');
    };
    const startSynth = async () => {
        if (!('AudioContext' in window || 'webkitAudioContext' in window)) throw new Error('Audio is unavailable');
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        audioContext = audioContext || new AudioCtor();
        if (audioContext.state === 'suspended') await audioContext.resume();
        masterGain = masterGain || audioContext.createGain();
        masterGain.gain.setValueAtTime(.06, audioContext.currentTime);
        masterGain.connect(audioContext.destination);
        if (synthStarted) return;
        [220, 277.18, 329.63, 440].forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = index === 0 ? 'sine' : 'triangle';
            oscillator.frequency.value = frequency;
            gain.gain.value = index === 0 ? 0.16 : 0.07;
            oscillator.connect(gain).connect(masterGain);
            oscillator.start();
        });
        synthStarted = true;
    };
    const startSoftSound = async () => {
        if (soundOn) return;
        if (ambientAudio instanceof HTMLAudioElement) {
            try {
                ambientAudio.volume = .42;
                await ambientAudio.play();
                soundOn = true;
                updateSoundButton(true);
                return;
            } catch { /* Fall back to a soft generated chord below. */ }
        }
        try {
            await startSynth();
        } catch {
            announce('Sound could not start in this browser. Use the music button after checking your device volume.');
            updateSoundButton(false);
            return;
        }
        soundOn = true;
        updateSoundButton(true);
    };
    const stopSoftSound = () => {
        if (ambientAudio instanceof HTMLAudioElement) ambientAudio.pause();
        if (masterGain && audioContext) masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.03);
        soundOn = false;
        updateSoundButton(false);
    };
    ambientAudio?.addEventListener('error', () => announce('The music file did not load. The site will use a soft sound fallback.'));
    document.querySelectorAll('img').forEach(image => {
        image.addEventListener('error', () => {
            image.hidden = true;
            image.closest('.tech-card')?.classList.add('has-missing-icon');
            announce('One visual could not load, but the page is still ready to use.');
        });
    });
    window.addEventListener('error', event => {
        if (event.target instanceof HTMLImageElement || event.target instanceof HTMLAudioElement) return;
        announce('A small part of the page did not load correctly. Please refresh and try again.');
    });
    window.addEventListener('unhandledrejection', () => {
        announce('Something did not finish correctly. Please try that action again.');
    });
    if (enterButton instanceof HTMLButtonElement) {
        enterButton.addEventListener('click', async () => {
            hideOpening();
            try { await startSoftSound(); } catch { stopSoftSound(); }
        });
    } else {
        hideOpening();
    }
    if (openingScreen instanceof HTMLElement) {
        window.setTimeout(hideOpening, 2600);
    }
    if (soundToggle instanceof HTMLButtonElement) {
        soundToggle.addEventListener('click', async () => {
            if (soundOn) stopSoftSound();
            else {
                try { await startSoftSound(); } catch { stopSoftSound(); }
            }
        });
    }
    document.addEventListener('pointerdown', () => {
        startSoftSound().catch(stopSoftSound);
    }, { once: true });

    const form = document.querySelector('[data-service-form]');
    const statusNode = document.querySelector('[data-form-status]');
    const serviceSelect = document.getElementById('serviceType');
    const setStatus = (message, isError) => {
        if (!(statusNode instanceof HTMLElement)) return;
        statusNode.textContent = message;
        statusNode.classList.toggle('is-error', isError);
        statusNode.classList.toggle('is-success', !isError && message.length > 0);
    };

    const selectService = service => {
        if (!(serviceSelect instanceof HTMLSelectElement)) return;
        const matchingOption = [...serviceSelect.options].find(option => option.value === service);
        if (matchingOption) serviceSelect.value = service;
    };

    document.querySelectorAll('[data-service-choice]').forEach(link => {
        link.addEventListener('click', event => {
            if (!(link instanceof HTMLElement)) return;
            const service = link.dataset.serviceChoice || '';
            selectService(service);
            const target = document.getElementById('service-form');
            if (target) {
                target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
                serviceSelect?.focus({ preventScroll: true });
            }
            event.preventDefault();
        });
    });

    const paramService = new URLSearchParams(window.location.search).get('service');
    if (paramService) selectService(paramService);

    if (form instanceof HTMLFormElement) {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const formData = new FormData(form);
            const fullName = (formData.get('fullName') || '').toString().trim();
            const email = (formData.get('email') || '').toString().trim();
            const serviceType = (formData.get('serviceType') || '').toString().trim();
            const timeline = (formData.get('timeline') || '').toString().trim();
            const budget = (formData.get('budget') || '').toString().trim();
            const websiteLink = (formData.get('websiteLink') || '').toString().trim();
            const message = (formData.get('message') || '').toString().trim();

            if (!fullName || !email || !serviceType || !message) {
                setStatus('Please fill full name, email, service, and project details.', true);
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                setStatus('Please enter a valid email address.', true);
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
            setStatus('Sending your request...', false);
            formData.set('_replyto', email);
            formData.set('_url', window.location.href);

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify(Object.fromEntries(formData.entries()))
                });

                if (!response.ok) throw new Error('Request failed');

                setStatus('Your service request was sent. I will reply by email soon.', false);
                form.reset();
            } catch {
                setStatus('The request could not be sent right now. Please email mays.suhail@gmail.com directly.', true);
            } finally {
                if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
            }
        });
    }

    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.nav');
    if (menuButton && navigation) {
        menuButton.hidden = false;
        navigation.classList.add('menu-ready');
        const closeMenu = () => {
            navigation.classList.remove('menu-open');
            menuButton.setAttribute('aria-expanded', 'false');
        };
        menuButton.addEventListener('click', () => {
            const open = navigation.classList.toggle('menu-open');
            menuButton.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && navigation.classList.contains('menu-open')) {
                closeMenu(); menuButton.focus();
            }
        });
        navigation.querySelectorAll('nav a').forEach(link => link.addEventListener('click', closeMenu));
    }

    const filters = document.querySelector('.project-filters');
    if (filters) {
        filters.hidden = false;
        const projects = [...document.querySelectorAll('[data-category]')];
        filters.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', () => {
                const selected = button.dataset.filter;
                filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
                let count = 0;
                projects.forEach(project => {
                    project.hidden = selected !== 'all' && !project.dataset.category.split(' ').includes(selected);
                    if (!project.hidden) { count++; project.classList.add('is-visible'); }
                });
                document.getElementById('project-count').textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
            });
        });
    }

    document.querySelector('.copy-email')?.addEventListener('click', async () => {
        const status = document.getElementById('copy-status');
        try {
            await navigator.clipboard.writeText('mays.suhail@gmail.com');
            status.textContent = 'Email address copied.';
        } catch { status.textContent = 'Copy this address: mays.suhail@gmail.com'; }
    });
})();
