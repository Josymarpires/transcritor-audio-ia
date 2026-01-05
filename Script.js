const recordBtn = document.getElementById("recordBtn");
const audioInput = document.getElementById("audioInput");
const transcribeBtn = document.getElementById("transcribeBtn");
const fileInfo = document.getElementById("fileInfo");
const output = document.getElementById("output");
const result = document.getElementById("result");
const message = document.getElementById("message");
const copyBtn = document.getElementById("copyBtn");

let audioFile = null;
let mediaRecorder = null;
let chunks = [];

/* ================= IMPORTAR ARQUIVO ================= */
audioInput.addEventListener("change", () => {
  if (!audioInput.files || !audioInput.files.length) return;

  audioFile = audioInput.files[0];

  fileInfo.textContent =
    `Arquivo: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`;
  fileInfo.classList.remove("hidden");

  transcribeBtn.disabled = false;
});

/* ================= GRAVAR ÁUDIO ================= */
recordBtn.addEventListener("click", async () => {
  // Parar gravação
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    recordBtn.textContent = "🎤 Gravar Áudio";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      audioFile = new File(chunks, "gravacao.webm", {
        type: "audio/webm",
      });

      fileInfo.textContent =
        `Gravação pronta (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`;
      fileInfo.classList.remove("hidden");

      transcribeBtn.disabled = false;
    };

    mediaRecorder.start();
    recordBtn.textContent = "⏹️ Parar";

  } catch (err) {
    alert("Permita o acesso ao microfone para gravar áudio.");
  }
});

/* ================= TRANSCRIÇÃO ================= */
transcribeBtn.addEventListener("click", async () => {
  if (!audioFile) return;

  transcribeBtn.disabled = true;
  message.textContent = "Transcrevendo...";

  const formData = new FormData();
  formData.append("file", audioFile);

  try {
    const res = await fetch("/api/transcrever", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Erro no backend");
    }

    const data = await res.json();

    output.textContent = data.text || "Erro na transcrição.";
    result.classList.remove("hidden");
    message.textContent = "";

  } catch (err) {
  
    message.textContent = "Erro ao transcrever o áudio.";
    transcribeBtn.disabled = false;
  }
});

/* ================= COPIAR TEXTO ================= */
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(output.textContent);
  alert("Texto copiado!");
});