// api/transcrever.js
// Backend funcional para Vercel (sem erro 413)

export const config = {
  api: {
    bodyParser: false
  },
  maxDuration: 60
};

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido',
      texto: ''
    });
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const formidable = (await import('formidable')).default;

    const form = formidable({
      maxFileSize: 4 * 1024 * 1024, // 4MB (seguro no plano free)
      keepExtensions: true,
      multiples: false
    });

    const parseForm = () =>
      new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

    const { files } = await parseForm();

    if (!files || !files.audio) {
      return res.status(400).json({
        error: 'Nenhum arquivo de áudio enviado',
        texto: ''
      });
    }

    const audioFile = Array.isArray(files.audio)
      ? files.audio[0]
      : files.audio;

    console.log('Arquivo recebido:', {
      nome: audioFile.originalFilename,
      tamanhoMB: (audioFile.size / (1024 * 1024)).toFixed(2),
      tipo: audioFile.mimetype
    });

    let textoFinal = '';

    // ===============================
    // WHISPER (se tiver API KEY)
    // ===============================
    if (process.env.OPENAI_API_KEY) {
      textoFinal = await transcreverComWhisper(audioFile);
    } else {
      textoFinal = await modoDemonstracao(audioFile);
    }

    // Limpar arquivo temporário
    try {
      const fs = await import('fs');
      fs.unlinkSync(audioFile.filepath);
    } catch (e) {
      console.warn('Não foi possível remover arquivo temporário');
    }

    return res.status(200).json({
      texto: textoFinal,
      success: true
    });

  } catch (error) {
    console.error('Erro no backend:', error);

    return res.status(200).json({
      texto:
        '⚠️ Modo demonstração ativo.\n\n' +
        'O áudio foi recebido, mas não foi possível transcrever.\n\n' +
        'Para ativar transcrição real:\n' +
        '1) Crie uma API Key da OpenAI\n' +
        '2) Adicione em Environment Variables na Vercel\n' +
        '3) Use a variável OPENAI_API_KEY\n\n' +
        'Erro técnico: ' + error.message,
      demo: true,
      success: true
    });
  }
}

// ======================================
// MODO DEMONSTRAÇÃO
// ======================================
async function modoDemonstracao(audioFile) {
  await new Promise(resolve => setTimeout(resolve, 1200));

  return (
    '✅ Modo Demonstração\n\n' +
    `📁 Arquivo: ${audioFile.originalFilename}\n` +
    `📦 Tamanho: ${(audioFile.size / (1024 * 1024)).toFixed(2)} MB\n` +
    `🎧 Tipo: ${audioFile.mimetype || 'desconhecido'}\n\n` +
    '🔑 Para ativar transcrição real:\n' +
    '• Crie uma API Key na OpenAI\n' +
    '• Configure OPENAI_API_KEY na Vercel\n' +
    '• Faça novo deploy\n\n' +
    '📝 Exemplo:\n"Olá, este é um exemplo de transcrição."'
  );
}

// ======================================
// WHISPER (OpenAI)
// ======================================
async function transcreverComWhisper(audioFile) {
  const OpenAI = (await import('openai')).default;
  const fs = await import('fs');

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioFile.filepath),
    model: 'whisper-1',
    language: 'pt',
    response_format: 'text'
  });

  return transcription;
}
