const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const DEFAULT_MODEL = process.env.NEMOTRON_MODEL || 'nvidia/nemotron-3.5-lightning';

/**
 * Sends a query to NVIDIA Nemotron 3.5 on OpenRouter
 * @param {string} prompt - The user prompt or question
 * @param {object} options - Optional config: model, systemPrompt, temperature, maxTokens
 */
async function queryNemotron(prompt, options = {}) {
  const model = options.model || DEFAULT_MODEL;
  const systemPrompt = options.systemPrompt || 
    "You are NVIDIA Nemotron 3.5, an enterprise-grade AI reasoning and software engineering model. " +
    "You assist VOG Tekstil engineers with RFID automation, garment ERP logic, and system architecture. " +
    "Be precise, concise, and provide production-ready solutions and high-quality code. " +
    "Answer in Turkish unless requested otherwise.";

  const payload = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: options.temperature || 0.3,
    max_tokens: options.maxTokens || 4096,
    stream: false
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://vogsystem.com',
        'X-Title': 'VOG System Enterprise - NVIDIA Nemotron 3.5'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            return reject(new Error(`OpenRouter Error: ${parsed.error.message || JSON.stringify(parsed.error)}`));
          }
          const choice = parsed.choices?.[0];
          const content = choice?.message?.content || '';
          const reasoning = choice?.message?.reasoning || null;
          resolve({
            success: true,
            model: parsed.model || model,
            content: content,
            reasoning: reasoning,
            usage: parsed.usage
          });
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message} - Body: ${body.substring(0, 300)}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Code Reviewer helper using Nemotron 3.5
 */
async function reviewCode(code, context = 'General VOG Code') {
  const prompt = `Lütfen aşağıdaki kodu VOG Tekstil kurallarına göre incele:\n\nBağlam: ${context}\n\nKod:\n\`\`\`\n${code}\n\`\`\`\n\nLütfen şunları değerlendir:\n1. Olası bug'lar ve edge case'ler\n2. Performans ve bellek yönetimi\n3. Güvenlik ve hata yönetimi\n4. İyileştirme önerileri`;
  return queryNemotron(prompt, {
    systemPrompt: "Sen kıdemli bir yazılım mimarısın. Kod incelemelerini maddeler halinde, net ve yapıcı şekilde Türkçe yap."
  });
}

/**
 * Checks connection status to OpenRouter Nemotron 3.5
 */
async function getNemotronStatus() {
  try {
    const result = await queryNemotron("Ping. Lütfen sadece 'OK' cevabı ver.", {
      temperature: 0.1,
      maxTokens: 20
    });
    return {
      connected: true,
      model: result.model,
      active: true,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  queryNemotron,
  reviewCode,
  getNemotronStatus
};
