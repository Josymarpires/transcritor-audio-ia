import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao processar áudio" });
    }

    const audioFile = files.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: "Nenhum áudio enviado" });
    }

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFile.filepath),
        model: "gpt-4o-transcribe",
        language: "pt",
      });

      res.status(200).json({ texto: transcription.text });
    } catch (e) {
      res.status(500).json({ error: "Erro na transcrição" });
    }
  });
}
