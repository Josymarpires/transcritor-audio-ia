// ================================
// ELEMENTOS
// ================================
const recordBtn = document.getElementById('recordBtn');
const audioInput = document.getElementById('audioInput');
const transcribeBtn = document.getElementById('transcribeBtn');
const fileInfo = document.getElementById('fileInfo');
const output = document.getElementById('output');
const result = document.getElementById('result');
const message = document.getElementById('message');
const copyBtn = document.getElementById('copyBtn');

// ================================
// ESTADO
// ================================
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let audioFile = null;

// ================================
// UTIL
// ================================
function showMessage(text, error = false) {
  message.textContent = text;
  message.style.color = error ? 'red' : 'green';
}

// ================================
// GRAVAÇÃO
// ================================
recordBtn.addEventListener('click', async () => {
  try {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      recordBtn.textContent = '🎤 Gravar Áudio';
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioFile = null;
      fileInfo.textContent = `🎤 Áudio gravado (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB)`;
      fileInfo.classList.remove('hidden');
      transcribeBtn.disabled = false;
    };

    mediaRecorder.start();
    recordBtn.textContent = '⏹ Parar gravação';
    showMessage('Gravando áudio...');
  } catch (err) {
    console.error(err);
    showMessage('Erro ao acessar microfone', true);
  }
});

// ================================
// IMPORTAR ARQUIVO
// ================================
audioInput.addEventListener('change', () => {
  const file = audioInput.files[0];
  if (!file) return;

  const maxSize = 4 * 1024 * 1024; // 4MB (evita 413)
  if (file.size > maxSize) {
    showMessage('Arquivo muito grande (máx 4MB)', true);
    audioInput.value = '';
    return;
  }

  audioFile = file;
  audioBlob = null;

  fileInfo.textContent = `📂 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  fileInfo.classList.remove('hidden');
  transcribeBtn.disabled = false;
  showMessage('Arquivo carregado com sucesso');
});

// ================================
// TRANSCRIÇÃO
// ================================
transcribeBtn.addEventListener('click', async () => {
  const audio = audioFile || audioBlob;
  if (!audio) {
    showMessage('Nenhum áudio disponível', true);
    return;
  }

  const formData = new FormData();
  formData.append('audio', audio, 'audio.webm');

  transcribeBtn.disabled = true;
  showMessage('Transcrevendo...');

  try {
    const res = await fetch('/transcrever', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    output.textContent = data.texto || 'Sem retorno';
    result.classList.remove('hidden');
    showMessage('Transcrição concluída');
  } catch (err) {
    console.error(err);
    showMessage('Erro na transcrição', true);
  } finally {
    transcribeBtn.disabled = false;
  }
});

// ================================
// COPIAR TEXTO
// ================================
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(output.textContent);
  showMessage('Texto copiado!');
});