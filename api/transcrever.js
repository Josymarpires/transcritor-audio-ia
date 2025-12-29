// api/transcrever.js
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS precisa vir primeiro
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido',
      texto: ''
    });
  }

  try {
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB
      keepExtensions: true,
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    if (!files || !files.audio) {
      return res.status(400).json({
        error: 'Nenhum arquivo de áudio enviado',
        texto: ''
      });
    }

    const audioFile = Array.isArray(files.audio)
      ? files.audio[0]
      : files.audio;

    const tamanhoMB = (audioFile.size / (1024 * 1024)).toFixed(2);
    const tipo = audioFile.mimetype || 'desconhecido';

    // Remove arquivo temporário com segurança
    if (fs.existsSync(audioFile.filepath)) {
      fs.unlinkSync(audioFile.filepath);
    }

    // MODO DEMONSTRAÇÃO
    return res.status(200).json({
      success: true,
      texto: `✅ Modo demonstração ativo

📁 Arquivo recebido com sucesso!
• Nome: ${audioFile.originalFilename}
• Tamanho: ${tamanhoMB} MB
• Tipo: ${tipo}

🔧 Para usar transcrição real:
1️⃣ Crie uma API key (OpenAI, AssemblyAI, etc.)
2️⃣ Adicione na Vercel (Environment Variables)
3️⃣ Ative a função de transcrição no backend`
    });

  } catch (error) {
    console.error('Erro real:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
