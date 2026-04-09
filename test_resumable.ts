import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const fileContent = "hello world resumable";
const fileName = "test_resumable.txt";
const fileType = "text/plain";

async function testResumable() {
  const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey || '',
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': fileContent.length.toString(),
      'X-Goog-Upload-Header-Content-Type': fileType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: fileName } })
  });

  console.log("Init status:", initRes.status);
  if (!initRes.ok) {
    console.log(await initRes.text());
    return;
  }

  const uploadUrl = initRes.headers.get('x-goog-upload-url');
  console.log("Upload URL:", uploadUrl);

  if (uploadUrl) {
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey || '',
        'X-Goog-Upload-Command': 'upload, finalize',
        'X-Goog-Upload-Offset': '0',
      },
      body: fileContent
    });

    console.log("Upload status:", uploadRes.status);
    console.log(await uploadRes.text());
  }
}

testResumable();
