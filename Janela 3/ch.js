let conversaSelecionada = null;
const menu = document.getElementById('menu-contexto');

function carregarHistorico() {
    const lista = document.getElementById('lista-conversas');
    const historico = JSON.parse(localStorage.getItem('historicoArtemis')) || [];
    lista.innerHTML = "";
    historico.forEach((conversa, index) => {
        const card = document.createElement('div');
        card.className = `card-conversa ${conversa.fixada ? 'fixada' : ''}`;
        card.innerText = conversa.nome || `MISSÃO ${index + 1}`;
        card.onclick = () => {
            localStorage.setItem('conversaAtiva', JSON.stringify(conversa));
            window.location.href = "../Janela 2/index.html";
        };
        card.oncontextmenu = (e) => {
            e.preventDefault();
            conversaSelecionada = index;
            menu.style.display = 'block';
            menu.style.left = `${e.pageX}px`;
            menu.style.top = `${e.pageY}px`;
        };

        lista.appendChild(card);
    });
}
window.onclick = () => menu.style.display = 'none';

function renomearConversa() {
    const novoNome = prompt("Digite o novo nome da missão:");
    if (novoNome) {
        let historico = JSON.parse(localStorage.getItem('historicoArtemis'));
        historico[conversaSelecionada].nome = novoNome;
        localStorage.setItem('historicoArtemis', JSON.stringify(historico));
        carregarHistorico();
    }
}

function apagarConversa() {
    if (confirm("Deseja apagar este registro permanentemente?")) {
        let historico = JSON.parse(localStorage.getItem('historicoArtemis'));
        historico.splice(conversaSelecionada, 1);
        localStorage.setItem('historicoArtemis', JSON.stringify(historico));
        carregarHistorico();
    }
}

function fixarConversa() {
    let historico = JSON.parse(localStorage.getItem('historicoArtemis'));
    const fixados = historico.filter(c => c.fixada).length;
    
    if (!historico[conversaSelecionada].fixada && fixados >= 10) {
        alert("Limite de 10 conversas fixadas atingido!");
        return;
    }

    historico[conversaSelecionada].fixada = !historico[conversaSelecionada].fixada;
    localStorage.setItem('historicoArtemis', JSON.stringify(historico));
    carregarHistorico();
}

carregarHistorico();