const cartasEndpoint = 'https://eu-te-amo-spjs.onrender.com/api/cartas';
const cartaForm = document.querySelector('#carta-form');
const cartasLista = document.querySelector('#cartas-lista');
const cartaStatus = document.querySelector('#carta-status');

const cartaOptions = {
	'#carta-cor-carta': ['BRANCO', 'ROSA', 'AZUL', 'VERDE', 'AMARELO', 'ROXO', 'PRETO'],
	'#carta-cor-letra': ['PRETO', 'BRANCO', 'VERMELHO', 'AZUL', 'ROSA', 'VERDE'],
	'#carta-fonte': ['SERIF', 'SANS_SERIF', 'MONOSPACE', 'CURSIVA']
};

const colorMap = {
	BRANCO: '#ffffff',
	ROSA: '#f3b6c8',
	AZUL: '#b8d7f2',
	VERDE: '#b9dfc0',
	AMARELO: '#f5df9b',
	ROXO: '#d1bce8',
	PRETO: '#252329',
	VERMELHO: '#c85b5b'
};

function todayAsInputValue() {
	const now = new Date();
	const offset = now.getTimezoneOffset() * 60000;
	return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function setStatus(message, isError = false) {
	cartaStatus.textContent = message;
	cartaStatus.classList.toggle('is-error', isError);
}

function setupCartaForm() {
	document.querySelector('#carta-data').value = todayAsInputValue();

	Object.entries(cartaOptions).forEach(([selector, values]) => {
		const select = document.querySelector(selector);
		values.forEach(value => {
			const option = document.createElement('option');
			option.value = value;
			option.textContent = value.replaceAll('_', ' ');
			select.appendChild(option);
		});
	});
}

function createCartaElement(carta) {
	const article = document.createElement('article');
	article.className = 'carta-item';
	article.style.backgroundColor = colorMap[carta.corCarta] || '#ffffff';
	article.style.color = colorMap[carta.corLetra] || '#252329';

	const date = new Date(`${carta.data}T00:00:00`).toLocaleDateString('pt-BR');
	const fontFamily = carta.fonte === 'MONOSPACE'
		? 'monospace'
		: carta.fonte === 'SANS_SERIF'
			? 'sans-serif'
			: carta.fonte === 'CURSIVA'
				? 'cursive'
				: 'serif';
	article.style.fontFamily = fontFamily;

	const header = document.createElement('div');
	header.className = 'carta-item-header';
	const recipient = document.createElement('strong');
	recipient.textContent = `Para: ${carta.destinatario}`;
	const dateElement = document.createElement('time');
	dateElement.textContent = date;
	header.append(recipient, dateElement);

	const text = document.createElement('p');
	text.textContent = carta.text;

	const deleteButton = document.createElement('button');
	deleteButton.type = 'button';
	deleteButton.className = 'carta-delete';
	deleteButton.textContent = 'Excluir';
	deleteButton.addEventListener('click', () => deletarCarta(carta.id));

	article.append(header, text, deleteButton);
	return article;
}

function renderCartas(cartas) {
	cartasLista.replaceChildren();
	if (!cartas.length) {
		const empty = document.createElement('p');
		empty.className = 'carta-empty';
		empty.textContent = 'Nenhuma carta guardada ainda.';
		cartasLista.appendChild(empty);
		return;
	}
	cartas.forEach(carta => cartasLista.appendChild(createCartaElement(carta)));
}

async function carregarCartas() {
	try {
		const response = await fetch(cartasEndpoint);
		if (!response.ok) throw new Error('Não foi possível carregar as cartas.');
		renderCartas(await response.json());
	} catch (error) {
		setStatus(error.message, true);
	}
}

async function salvarCarta(event) {
	event.preventDefault();
	const formData = new FormData(cartaForm);
	const carta = Object.fromEntries(formData.entries());
	const submit = cartaForm.querySelector('button[type="submit"]');
	submit.disabled = true;
	setStatus('Guardando carta...');

	try {
		const response = await fetch(cartasEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(carta)
		});
		if (!response.ok) throw new Error('Não foi possível guardar a carta.');
		cartaForm.reset();
		document.querySelector('#carta-data').value = todayAsInputValue();
		setStatus('Carta guardada.');
		await carregarCartas();
	} catch (error) {
		setStatus(error.message, true);
	} finally {
		submit.disabled = false;
	}
}

async function deletarCarta(id) {
	if (!window.confirm('Excluir esta carta?')) return;
	try {
		const response = await fetch(`${cartasEndpoint}/${id}`, { method: 'DELETE' });
		if (!response.ok) throw new Error('Não foi possível excluir a carta.');
		await carregarCartas();
	} catch (error) {
		setStatus(error.message, true);
	}
}

if (cartaForm && cartasLista && cartaStatus) {
	setupCartaForm();
	cartaForm.addEventListener('submit', salvarCarta);
	carregarCartas();
}
