const audioInput = document.getElementById("audioInput");
const transcribeBtn = document.getElementById("transcribeBtn");
const output = document.getElementById("output");
const message = document.getElementById("message");
const result = document.getElementById("result");

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB (seguro para Vercel)

let selectedFile = null;

audioInput.addEventListener("change", () => {
  selectedFile = audioInput.files[0];
  message.textContent = "";
});

transcribeBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    message.textContent = "Selecione um áudio primeiro.";
    return;
  }

  transcribeBtn.disabled = true;
  transcribeBtn.textContent = "Transcrevendo...";
  output.textContent = "";

  const chunks = sliceFile(selectedFile);
  let textoFinal = "";

  for (let i = 0; i < chunks.length; i++) {
    message.textContent = `Enviando parte ${i + 1} de ${chunks.length}...`;

    const formData = new FormData();
    formData.append("audio", chunks[i]);

    const response = await fetch("/transcrever", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      message.textContent = "Erro durante a transcrição.";
      transcribeBtn.disabled = false;
      return;
    }

    const data = await response.json();
    textoFinal += data.texto + " ";
  }

  output.textContent = textoFinal.trim();
  result.classList.remove("hidden");
  message.textContent = "✅ Transcrição concluída!";
  transcribeBtn.textContent = "📝 Transcrever";
  transcribeBtn.disabled = false;
});

// =====================
// FUNÇÃO DE CORTE
// =====================
function sliceFile(file) {
  const chunks = [];
  let start = 0;

  while (start < file.size) {
    chunks.push(file.slice(start, start + CHUNK_SIZE));
    start += CHUNK_SIZE;
  }

  return chunks;
}