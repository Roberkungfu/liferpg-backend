const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get('/', (req, res) => {
  res.json({ status: 'LifeRPG Backend activo' });
});

app.post('/validar-evidencia', async (req, res) => {
  const { imagenBase64, misionNombre } = req.body;

  if (!imagenBase64 || !misionNombre) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imagenBase64,
              },
            },
            {
              type: 'text',
              text: `Eres un validador de misiones para LifeRPG. El usuario completó: "${misionNombre}". Analiza la imagen. Responde ÚNICAMENTE con JSON válido sin markdown: {"valido":true,"confianza":85,"mensaje":"mensaje aquí"}`,
            },
          ],
        },
      ],
    });

    const texto = message.content[0].text.trim();
    console.log('Respuesta raw:', texto);
    const textoLimpio = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(textoLimpio);
    res.json(json);
  } catch (error) {
    console.error('Error:', error.message);
    res.json({
      valido: true,
      confianza: 70,
      mensaje: 'No pudimos analizar la imagen automáticamente, pero registramos tu evidencia.',
    });
  }
});

app.post('/mentor', async (req, res) => {
  const { clase, nivel, misionesCompletadas, racha, historial } = req.body;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Eres un mentor de desarrollo personal en una app llamada LifeRPG. Tu rol es ser directo, motivador y específico. No des consejos genéricos.

Datos del jugador:
- Clase: ${clase}
- Nivel: ${nivel}
- Misiones completadas: ${misionesCompletadas}
- Racha actual: ${racha} días
- Historial reciente: ${historial || 'Sin historial aún'}

Da un mensaje de mentor personalizado de máximo 3 párrafos cortos. Incluye:
1. Un reconocimiento específico de su progreso actual
2. Un desafío concreto para hoy basado en su clase
3. Una pregunta poderosa para que reflexione

Sé directo, como un mentor que te conoce bien. No uses frases genéricas.

Responde SOLO con JSON sin markdown: {"mensaje": "tu mensaje aquí", "desafio": "desafío específico de hoy", "pregunta": "pregunta poderosa"}`,
        },
      ],
    });

    const texto = message.content[0].text.trim();
    const textoLimpio = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(textoLimpio);
    res.json(json);
  } catch (error) {
    console.error('Error mentor:', error.message);
    res.json({
      mensaje: 'Sigue adelante. Cada misión que completas te acerca a la mejor versión de ti mismo.',
      desafio: 'Completa tus 3 misiones de hoy sin excusas.',
      pregunta: '¿Qué versión de ti mismo quieres ser en 90 días?',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LifeRPG Backend corriendo en puerto ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promise rechazada:', reason);
});