import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB (limite Whisper)
      keepExtensions: true
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const audio = files.file;
    if (!audio) {
      return res.status(400).json({ error: "Arquivo não recebido" });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audio.filepath),
      model: "whisper-1",
      language: "pt",
      response_format: "text"
    });

    return res.status(200).json({
      text: transcription
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao transcrever"
    });
  }
}