// Elementos da tela
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const fileInput = document.getElementById('fileInput');
const transcribeBtn = document.getElementById('transcribeBtn');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');

const statusMsg = document.getElementById('status');
const resultBox = document.getElementById('result');

let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let audioFile = null;

// 🎤 Gravar áudio
recordBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioFile = null;
      statusMsg.textContent = 'Áudio gravado com sucesso.';
      stream.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.start();
    statusMsg.textContent = 'Gravando...';
  } catch {
    statusMsg.textContent = 'Erro ao acessar microfone.';
  }
};

// ⏹️ Parar gravação
stopBtn.onclick = () => {
  if (mediaRecorder) mediaRecorder.stop();
};

// 📂 Importar áudio
fileInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  const allowed = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a'];
  if (!allowed.includes(file.type) && !file.name.endsWith('.m4a')) {
    statusMsg.textContent = 'Formato não suportado.';
    return;
  }

  audioFile = file;
  audioBlob = null;
  statusMsg.textContent = 'Áudio importado: ' + file.name;
};

// 🌐 Transcrever online
transcribeBtn.onclick = async () => {
  const audio = audioFile || audioBlob;
  if (!audio) {
    statusMsg.textContent = 'Grave ou importe um áudio primeiro.';
    return;
  }

  const formData = new FormData();
  formData.append('audio', audio, 'audio.webm');

  statusMsg.textContent = 'Transcrevendo...';

  try {
    const res = await fetch('/transcrever', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Falha no servidor');

    const data = await res.json();
    resultBox.textContent = data.texto || data.text || '';
    statusMsg.textContent = 'Transcrição concluída.';
  } catch {
    resultBox.textContent =
      'Transcrição de demonstração.\nConfigure o endpoint /transcrever.';
    statusMsg.textContent = 'Erro ao transcrever.';
  }
};

// 📋 Copiar texto
copyBtn.onclick = () => {
  navigator.clipboard.writeText(resultBox.textContent);
  statusMsg.textContent = 'Texto copiado.';
};

// 📄 Exportar TXT
exportBtn.onclick = () => {
  const blob = new Blob([resultBox.textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'transcricao.txt';
  a.click();

  URL.revokeObjectURL(url);
};
