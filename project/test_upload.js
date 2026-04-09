const apiKey = process.env.GEMINI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
  method: 'POST',
  headers: {
    'X-Goog-Upload-Protocol': 'resumable',
    'X-Goog-Upload-Command': 'start',
    'X-Goog-Upload-Header-Content-Length': '100',
    'X-Goog-Upload-Header-Content-Type': 'text/plain',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ file: { display_name: 'test.txt' } })
}).then(res => {
  console.log(res.status);
  console.log(res.headers.get('x-goog-upload-url'));
});
