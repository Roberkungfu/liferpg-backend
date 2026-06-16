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
              text: `Eres un validador de misiones para una app de desarrollo personal llamada LifeRPG.

El usuario dice haber completado esta misión: "${misionNombre}"

Analiza la imagen y determina si es evidencia razonable de que completó la misión.

Responde SOLO en este formato JSON exacto sin ningún texto adicional:
{
  "valido": true o false,
  "confianza": número del 1 al 100,
  "mensaje": "mensaje corto y motivador de máximo 2 oraciones"
}

Sé generoso con la validación. Si hay alguna posibilidad razonable de que la imagen muestre la actividad, valídala. El objetivo es motivar, no juzgar.`,
            },
          ],
        },
      ],
    });

    const texto = message.content[0].text;
    const json = JSON.parse(texto);
    res.json(json);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      valido: true,
      confianza: 70,
      mensaje: 'No pudimos analizar la imagen automáticamente, pero registramos tu evidencia.',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LifeRPG Backend corriendo en puerto ${PORT}`);
});