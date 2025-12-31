const recordBtn = document.getElementById("recordBtn");
const audioInput = document.getElementById("audioInput");
const transcribeBtn = document.getElementById("transcribeBtn");
const fileInfo = document.getElementById("fileInfo");
const output = document.getElementById("output");
const result = document.getElementById("result");
const message = document.getElementById("message");
const copyBtn = document.getElementById("copyBtn");

let audioFile = null;
let mediaRecorder;
let chunks = [];

// ---------- IMPORTAR ARQUIVO ----------
audioInput.addEventListener("change", () => {
  if (!audioInput.files.length) return;

  audioFile = audioInput.files[0];

  fileInfo.textContent = `Arquivo: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`;
  fileInfo.classList.remove("hidden");

  transcribeBtn.classList.remove("disabled");
});

// ---------- GRAVAR ----------
recordBtn.addEventListener("click", async () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    recordBtn.textContent = "🎤 Gravar Áudio";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    mediaRecorder.onstop = () => {
      audioFile = new File(chunks, "gravacao.webm", { type: "audio/webm" });

      fileInfo.textContent = `Gravação pronta (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`;
      fileInfo.classList.remove("hidden");

      transcribeBtn.classList.remove("disabled");
    };

    mediaRecorder.start();
    recordBtn.textContent = "⏹️ Parar";

  } catch (err) {
    alert("Permita o acesso ao microfone");
  }
});

// ---------- TRANSCRIÇÃO ----------
transcribeBtn.addEventListener("click", async () => {
  if (!audioFile) return;

  transcribeBtn.classList.add("disabled");
  message.textContent = "Transcrevendo...";

  const formData = new FormData();
  formData.append("file", audioFile);

  try {
    const res = await fetch("/api/transcrever", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    output.textContent = data.text || "Erro na transcrição";
    result.classList.remove("hidden");
    message.textContent = "";

  } catch (err) {
    message.textContent = "Erro ao transcrever";
  }
});

// ---------- COPIAR ----------
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(output.textContent);
  alert("Texto copiado!");
});