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

Responde SOLO con un objeto JSON válido, sin markdown, sin backticks, sin texto adicional. Solo el JSON puro:
{"valido": true, "confianza": 85, "mensaje": "mensaje motivador aquí"}

Sé generoso con la validación.`,
            },
          ],
        },
      ],
    });

    const texto = message.content[0].text.trim();
    console.log('Respuesta IA:', texto);
    
    // Limpiar cualquier markdown
    const textoLimpio = texto
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    console.log('Texto limpio:', textoLimpio);
    const json = JSON.parse(textoLimpio);
    res.json(json);
  } catch (error) {
    console.error('Error completo:', error.message);
    res.json({
      valido: false,
      confianza: 0,
      mensaje: 'Error al analizar: ' + error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LifeRPG Backend corriendo en puerto ${PORT}`);
});