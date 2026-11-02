import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "AIzaSyDeH-PwgYwsxMfwwIgPt9jw6wQ35qlwurQ"; 
const genAI = new GoogleGenerativeAI(API_KEY);

let vozLigada = false;
const campoTexto = document.getElementById('pergunta');
const display = document.getElementById('resposta');
const btnEnviar = document.getElementById('btn-enviar-chat');
const btnVoz = document.getElementById('btn-voz');
const btnMic = document.getElementById('btn-mic');
const btnCamera = document.getElementById('btn-camera');
const inputFoto = document.getElementById('input-foto');

let idChatAtual = localStorage.getItem('idChatAtivo') || `chat-${Date.now()}`;

function carregarMensagensSalvas() {
    const historico = JSON.parse(localStorage.getItem('historicoArtemis')) || [];
    const conversaAtiva = historico.find(c => c.id === idChatAtual);
    
    if (conversaAtiva) {
        display.innerHTML = "";
        conversaAtiva.mensagens.forEach(msg => {
            adicionarBalao(msg.texto, msg.tipo, msg.isImage);
        });
    }
}

function adicionarBalao(conteudo, tipo, isImage = false) {
    const balao = document.createElement('div');
    balao.className = `balao msg-${tipo}`;
    
    if (isImage) {
        balao.innerHTML = `<img src="${conteudo}" style="max-width: 100%; border-radius: 10px;">`;
    } else {
        balao.innerText = conteudo;
        balao.oncontextmenu = (e) => {
            e.preventDefault();
            recitarFalaEspecifica(conteudo);
        };
    }
    
    display.appendChild(balao);
    display.scrollTop = display.scrollHeight;
}

function salvarNoHistorico(texto, tipo, isImage = false) {
    let historico = JSON.parse(localStorage.getItem('historicoArtemis')) || [];
    let index = historico.findIndex(c => c.id === idChatAtual);

    if (index === -1) {
        historico.push({
            id: idChatAtual,
            nome: tipo === 'usuario' ? texto.substring(0, 25) + "..." : "Nova Missão",
            fixada: false,
            mensagens: [{ texto, tipo, isImage }]
        });
    } else {
        historico[index].mensagens.push({ texto, tipo, isImage });
    }
    
    localStorage.setItem('historicoArtemis', JSON.stringify(historico));
    localStorage.setItem('idChatAtivo', idChatAtual);
}

function recitarFalaEspecifica(texto) {
    window.speechSynthesis.cancel();
    const textoLimpo = texto.replace(/\*/g, '').replace(/#/g, '');
    const mensagem = new SpeechSynthesisUtterance(textoLimpo);
    mensagem.lang = "pt-BR";
    mensagem.rate = 1.5;
    window.speechSynthesis.speak(mensagem);
}

async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

btnVoz.onclick = () => {
    vozLigada = !vozLigada;
    btnVoz.style.opacity = vozLigada ? "1" : "0.4";
    if (!vozLigada) window.speechSynthesis.cancel();
};

btnMic.onclick = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    btnMic.style.filter = "invert(40%) sepia(100%) saturate(1000%) hue-rotate(150deg)";

    recognition.onresult = (event) => {
        let textoProcessado = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            textoProcessado += event.results[i][0].transcript;
        }
        campoTexto.value = textoProcessado;
    };

    recognition.onend = () => { btnMic.style.filter = "none"; };
    recognition.start();
};

btnCamera.onclick = () => inputFoto.click();

inputFoto.onchange = () => {
    if (inputFoto.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            adicionarBalao(e.target.result, 'usuario', true);
        };
        reader.readAsDataURL(inputFoto.files[0]);
    }
};

async function executarChat() {
    const perguntaUsuario = campoTexto.value.trim();
    if (!perguntaUsuario && inputFoto.files.length === 0) return;

    if (perguntaUsuario === "/joppen5006/") {
        campoTexto.value = "";
        adicionarBalao("MODO DESENVOLVEDOR: Sistema Nominal.", 'artemis');
        return;
    }

    if (perguntaUsuario) {
        adicionarBalao(perguntaUsuario, 'usuario');
        salvarNoHistorico(perguntaUsuario, 'usuario');
    }
    
    const arquivoSendoEnviado = inputFoto.files[0];
    if (arquivoSendoEnviado) {
        const reader = new FileReader();
        reader.onload = (e) => salvarNoHistorico(e.target.result, 'usuario', true);
        reader.readAsDataURL(arquivoSendoEnviado);
    }

    campoTexto.value = "";

    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: `Seu nome é Artemis 1.1. MISSÃO: Você é uma inteligência rigorosa que combate fake news. REGRAS DE FORMATAÇÃO:
    1. É OBRIGATÓRIO citar fontes, nomes de jornais ou links ao final da resposta.
    2. PROIBIDO: Não use NENHUM asterisco (*) ou hashtags (#) para negrito ou títulos. Use apenas texto plano.
    3. Para listas, use hífens (-) ou números.
    4. Se a informação for incerta, avise que não encontrou fontes confiáveis.
    5. Não simplifique a resposta, fale claramente, mas de forma comum, mesmo que longa.`
    });

    try {
        let promptConfig = [perguntaUsuario || "Analise esta imagem."];
        if (arquivoSendoEnviado) {
            const imagePart = await fileToGenerativePart(arquivoSendoEnviado);
            promptConfig.push(imagePart);
        }

        const result = await model.generateContent(promptConfig);
        const respostaIA = result.response.text().replace(/\*/g, '');

        adicionarBalao(respostaIA, 'artemis');
        salvarNoHistorico(respostaIA, 'artemis');
        
        if (vozLigada) recitarFalaEspecifica(respostaIA);
        inputFoto.value = ""; 
    } catch (error) {
        adicionarBalao("Erro na conexão com Artemis.", 'artemis');
    }
}

btnEnviar.onclick = executarChat;
campoTexto.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        executarChat();
    }
};

window.onload = carregarMensagensSalvas;