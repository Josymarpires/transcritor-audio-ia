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

  const form = formidable({
    multiples: true,
    maxFileSize: 5 * 1024 * 1024 // 5MB por chunk
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Erro ao processar arquivo" });
    }

    try {
      const audioFiles = Array.isArray(files.audio)
        ? files.audio
        : [files.audio];

      let textoFinal = "";

      for (const file of audioFiles) {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(file.filepath),
          model: "whisper-1"
        });

        textoFinal += transcription.text + " ";
      }

      res.status(200).json({ texto: textoFinal.trim() });

    } catch (e) {
      res.status(500).json({ error: "Erro ao transcrever", detalhe: e.message });
    }
  });
}