const Groq = require('groq-sdk');

async function main() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Add it to .env.local before running this test.');
  }

  const client = new Groq({ apiKey });
  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: 'Say hello to Company Brain.' }],
    temperature: 0.7,
  });

  const message = response.choices?.[0]?.message?.content ?? 'No content returned';
  console.log('Groq response:', message);
}

main().catch((error) => {
  console.error('Groq request failed.');
  console.error(error.message);
  process.exit(1);
});
