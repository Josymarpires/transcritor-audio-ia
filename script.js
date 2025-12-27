let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let audioFile = null;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const fileInput = document.getElementById("fileInput");
const transcribeBtn = document.getElementById("transcribeBtn");
const offlineBtn = document.getElementById("offlineBtn");
const transcriptionEl = document.getElementById("transcription");
const resultSection = document.getElementById("resultSection");
const messages = document.getElementById("messages");

function showMessage(msg, error = false) {
  messages.innerHTML = `<p style="color:${error ? 'red' : 'green'}">${msg}</p>`;
}

startBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioFile = null;
      showMessage("Áudio gravado com sucesso");
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch {
    showMessage("Erro ao acessar microfone", true);
  }
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
};

fileInput.onchange = e => {
  audioFile = e.target.files[0];
  audioBlob = null;
  showMessage("Áudio importado");
};

transcribeBtn.onclick = async () => {
  const audio = audioFile || audioBlob;
  if (!audio) {
    showMessage("Grave ou importe um áudio", true);
    return;
  }

  const formData = new FormData();
  formData.append("audio", audio);

  try {
    const res = await fetch("/transcrever", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    transcriptionEl.textContent = data.texto || data.text;
    resultSection.hidden = false;
    showMessage("Transcrição concluída");
  } catch {
    showMessage("Erro ao transcrever", true);
  }
};

offlineBtn.onclick = () => {
  alert("Modo offline disponível em versão futura.");
};

document.getElementById("copyBtn").onclick = () => {
  navigator.clipboard.writeText(transcriptionEl.textContent);
  showMessage("Texto copiado");
};

document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([transcriptionEl.textContent], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "transcricao.txt";
  a.click();
};
