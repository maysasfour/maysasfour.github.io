const root = document.getElementById('app') ?? document.body;

const index = document.createElement('div');
index.id = 'index';
index.textContent = 'TypeScript is loaded.';

root.appendChild(index);

