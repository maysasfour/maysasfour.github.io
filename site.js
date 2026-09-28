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
