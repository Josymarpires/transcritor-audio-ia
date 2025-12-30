// ===============================
// ELEMENTOS
// ===============================
const recordBtn = document.getElementById("recordBtn");
const audioInput = document.getElementById("audioInput");
const transcribeBtn = document.getElementById("transcribeBtn");
const fileInfo = document.getElementById("fileInfo");
const output = document.getElementById("output");
const result = document.getElementById("result");
const message = document.getElementById("message");

let selectedFile = null;
let mediaRecorder = null;
let audioChunks = [];

// ===============================
// IMPORTAR ARQUIVO (FIX MOBILE)
// ===============================
audioInput.addEventListener("change", () => {
  if (!audioInput.files || !audioInput.files[0]) {
    showMessage("❌ Nenhum arquivo selecionado");
    return;
  }

  selectedFile = audioInput.files[0];

  fileInfo.classList.remove("hidden");
  fileInfo.innerHTML = `
    📁 <strong>${selectedFile.name}</strong><br>
    📏 ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB<br>
    🎧 ${selectedFile.type || "tipo desconhecido"}
  `;

  transcribeBtn.disabled = false;
  showMessage("✅ Arquivo carregado com sucesso");
});

// ===============================
// GRAVAÇÃO DE ÁUDIO (FIX MOBILE)
// ===============================
recordBtn.addEventListener("click", async () => {
  try {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      recordBtn.textContent = "🎤 Gravar Áudio";
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      selectedFile = new File([audioBlob], "gravacao.webm", {
        type: "audio/webm"
      });

      fileInfo.classList.remove("hidden");
      fileInfo.innerHTML = `
        🎤 <strong>Gravação concluída</strong><br>
        📏 ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB
      `;

      transcribeBtn.disabled = false;
      showMessage("✅ Gravação pronta para transcrição");
    };

    mediaRecorder.start();
    recordBtn.textContent = "⏹️ Parar Gravação";
    showMessage("🎙️ Gravando...");

  } catch (err) {
    console.error(err);
    showMessage("❌ Permissão de microfone negada ou não suportada");
  }
});

// ===============================
// ENVIAR PARA TRANSCRIÇÃO
// ===============================
transcribeBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    showMessage("❌ Nenhum áudio selecionado");
    return;
  }

  showMessage("⏳ Enviando para transcrição...");
  transcribeBtn.disabled = true;

  const formData = new FormData();
  formData.append("audio", selectedFile);

  try {
    const response = await fetch("/transcrever", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!data.texto) {
      throw new Error("Resposta inválida");
    }

    output.textContent = data.texto;
    result.classList.remove("hidden");
    showMessage("✅ Transcrição concluída");

  } catch (err) {
    console.error(err);
    showMessage("❌ Erro ao transcrever áudio");
  } finally {
    transcribeBtn.disabled = false;
  }
});

// ===============================
// MENSAGENS
// ===============================
function showMessage(msg) {
  message.textContent = msg;
}