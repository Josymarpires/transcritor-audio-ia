const audioInput = document.getElementById("audioInput");
const recordBtn = document.getElementById("recordBtn");
const transcribeBtn = document.getElementById("transcribeBtn");
const output = document.getElementById("output");
const result = document.getElementById("result");
const fileInfo = document.getElementById("fileInfo");
const message = document.getElementById("message");
const copyBtn = document.getElementById("copyBtn");

let selectedFile = null;

// ==============================
// CONFIGURAÇÕES IMPORTANTES
// ==============================

// Limite real seguro da Vercel
const MAX_UPLOAD_MB = 4; // NÃO aumente isso
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// ==============================
// IMPORTAÇÃO DE ARQUIVO
// ==============================
audioInput.addEventListener("change", () => {
  const file = audioInput.files[0];
  message.textContent = "";
  result.classList.add("hidden");

  if (!file) return;

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

  // Validação de tipo
  if (!file.type.startsWith("audio")) {
    showError("Arquivo inválido. Selecione um áudio.");
    audioInput.value = "";
    return;
  }

  // BLOQUEIO ANTES DO ERRO 413
  if (file.size > MAX_UPLOAD_BYTES) {
    showError(
      `Arquivo muito grande (${sizeMB} MB).\n\n` +
      `⚠️ Limite atual: ${MAX_UPLOAD_MB} MB.\n\n` +
      `Para áudios longos (ex: 8 horas), é necessário envio em partes (chunking).`
    );
    audioInput.value = "";
    return;
  }

  selectedFile = file;
  fileInfo.textContent = `📎 ${file.name} (${sizeMB} MB)`;
  fileInfo.classList.remove("hidden");
  transcribeBtn.disabled = false;
});

// ==============================
// TRANSCRIÇÃO ONLINE
// ==============================
transcribeBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    showError("Selecione um áudio primeiro.");
    return;
  }

  transcribeBtn.disabled = true;
  transcribeBtn.textContent = "Transcrevendo...";
  message.textContent = "";

  const formData = new FormData();
  formData.append("audio", selectedFile);

  try {
    const response = await fetch("/transcrever", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();

    output.textContent = data.texto || "Nenhum texto retornado.";
    result.classList.remove("hidden");

  } catch (err) {
    showError(
      "Erro ao transcrever.\n\n" +
      "Se o áudio for longo, use divisão em partes.\n\n" +
      `Detalhe técnico: ${err.message}`
    );
  } finally {
    transcribeBtn.disabled = false;
    transcribeBtn.textContent = "📝 Transcrever";
  }
});

// ==============================
// COPIAR TEXTO
// ==============================
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(output.textContent);
  showMessage("Texto copiado!");
});

// ==============================
// UTILITÁRIOS
// ==============================
function showError(msg) {
  message.textContent = msg;
  message.style.color = "red";
}

function showMessage(msg) {
  message.textContent = msg;
  message.style.color = "green";
}
