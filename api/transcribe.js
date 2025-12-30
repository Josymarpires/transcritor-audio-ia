import formidable from "formidable";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegPath);

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== CONFIGURAÇÕES =====
const MAX_CHUNK_DURATION = 10 * 60; // 10 minutos por chunk

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const audioFile = files.file;
    if (!audioFile) {
      return res.status(400).json({ error: "Arquivo não recebido" });
    }

    const inputPath = audioFile.filepath;
    const tempDir = path.join("/tmp", "chunks");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // ---------- QUEBRAR EM CHUNKS ----------
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-f segment",
          `-segment_time ${MAX_CHUNK_DURATION}`,
          "-c copy",
        ])
        .output(path.join(tempDir, "chunk_%03d.webm"))
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    // ---------- TRANSCRIÇÃO ----------
    const chunkFiles = fs
      .readdirSync(tempDir)
      .filter((f) => f.startsWith("chunk_"));

    let finalText = "";

    for (const chunk of chunkFiles) {
      const chunkPath = path.join(tempDir, chunk);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(chunkPath),
        model: "whisper-1",
        response_format: "text",
        language: "pt",
      });

      finalText += transcription + "\n\n";
    }

    return res.status(200).json({ text: finalText.trim() });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao transcrever" });
  }
}