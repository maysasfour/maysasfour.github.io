const form = document.getElementById('contactForm') as HTMLFormElement | null;
const statusMessage = document.getElementById('statusMessage');

if (form && statusMessage) {
  form.addEventListener('submit', (event: Event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const fullName = (formData.get('fullName') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const subject = (formData.get('subject') as string || '').trim();
    const message = (formData.get('message') as string || '').trim();
    const consent = formData.get('consent') === 'on';

    if (!fullName || !email || !subject || !message || !consent) {
      statusMessage.textContent = 'Please complete all required fields and accept the consent checkbox.';
      statusMessage.className = 'status-error';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      statusMessage.textContent = 'Please enter a valid email address.';
      statusMessage.className = 'status-error';
      return;
    }

    statusMessage.textContent = 'Your message has been sent successfully!';
    statusMessage.className = 'status-success';
    form.reset();
  });
}

const revealItems = document.querySelectorAll('[data-animate]');
revealItems.forEach((item) => {
  item.classList.add('is-visible');
});
