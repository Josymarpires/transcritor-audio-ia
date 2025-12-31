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

/* =========================
   IMPORTAR ARQUIVO
========================= */
audioInput.addEventListener("change", () => {
  if (!audioInput.files || !audioInput.files[0]) return;

  audioFile = audioInput.files[0];

  fileInfo.textContent =
    `Arquivo: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`;
  fileInfo.classList.remove("hidden");

  // habilita botão
  transcribeBtn.disabled = false;
  transcribeBtn.classList.remove("disabled");
});

/* =========================
   GRAVAÇÃO
========================= */
recordBtn.addEventListener("click", async () => {
  // PARAR gravação
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    recordBtn.textContent = "🎤 Gravar Áudio";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      audioFile = new File(chunks, "gravacao.webm", {
        type: "audio/webm"
      });

      fileInfo.textContent =
        `Gravação pronta (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`;
      fileInfo.classList.remove("hidden");

      // habilita botão
      transcribeBtn.disabled = false;
      transcribeBtn.classList.remove("disabled");

      // encerra microfone
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    recordBtn.textContent = "⏹️ Parar";

  } catch (err) {
    alert("Erro ao acessar o microfone. Verifique permissões.");
    console.error(err);
  }
});

/* =========================
   TRANSCRIÇÃO
========================= */
transcribeBtn.addEventListener("click", async () => {
  if (!audioFile) {
    alert("Nenhum áudio carregado");
    return;
  }

  transcribeBtn.disabled = true;
  transcribeBtn.classList.add("disabled");
  message.textContent = "Transcrevendo...";

  const formData = new FormData();
  formData.append("file", audioFile);

  try {
    const res = await fetch("/api/transcrever", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Erro ${res.status}`);
    }

    const data = await res.json();

    output.textContent = data.text || "Nenhum texto retornado";
    result.classList.remove("hidden");
    message.textContent = "";

  } catch (err) {
    console.error(err);
    message.textContent = "Erro ao transcrever";
    transcribeBtn.disabled = false;
    transcribeBtn.classList.remove("disabled");
  }
});

/* =========================
   COPIAR TEXTO
========================= */
copyBtn.addEventListener("click", () => {
  if (!output.textContent) return;
  navigator.clipboard.writeText(output.textContent);
  alert("Texto copiado!");
});