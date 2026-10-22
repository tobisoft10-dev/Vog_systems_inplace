const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const DEFAULT_MODEL = process.env.NEMOTRON_MODEL || 'nvidia/nemotron-3.5-lightning';

async function askNemotron(prompt, options = {}) {
  const model = options.model || DEFAULT_MODEL;
  const stream = options.stream !== false;
  const systemPrompt = options.systemPrompt || 
    "You are NVIDIA Nemotron 3.5, an advanced AI reasoning and software engineering model. " +
    "Collaborate closely with Antigravity and VOG Tekstil lead engineers. " +
    "Be precise, concise, and provide production-ready solutions, architectural reviews, and high-quality code. " +
    "Answer in Turkish unless requested otherwise.";

  const payload = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    stream: stream
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
        'X-Title': 'VOG System Antigravity - NVIDIA Nemotron 3.5'
      }
    }, (res) => {
      let fullContent = '';

      if (!stream) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const content = parsed.choices?.[0]?.message?.content || '';
            resolve(content);
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message} - Body: ${body}`));
          }
        });
        return;
      }

      res.on('data', (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                process.stdout.write(content);
                fullContent += content;
              }
            } catch (_) {}
          }
        }
      });

      res.on('end', () => {
        process.stdout.write('\n');
        resolve(fullContent);
      });
    });

    req.on('error', (err) => {
      console.error('[!] Nemotron Request Error:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const prompt = args.length > 0 
    ? args.join(' ') 
    : "Merhaba! Nvidia Nemotron 3.5 olarak VOG Tekstil sistem mimarisine hoş geldin. Antigravity ile nasıl birlikte çalışacağını kısaca özetle.";
  askNemotron(prompt).catch(err => {
    console.error('Execution failed:', err.message);
    process.exit(1);
  });
}

module.exports = { askNemotron };
