const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const url = 'https://reputacija.verslomatika.lt/r/vilniaus-denta';
const outPng = path.join(__dirname, '../public/images/vilniaus-denta-qr.png');
const outSvg = path.join(__dirname, '../public/images/vilniaus-denta-qr.svg');
const brainPng = 'C:/Users/Lenovo/.gemini/antigravity/brain/0a0926f2-a607-4b37-bd5d-d7985138151c/vilniaus_denta_qr.png';

async function main() {
  await QRCode.toFile(outPng, url, {
    width: 600,
    margin: 3,
    color: { dark: '#163d35', light: '#ffffff' }
  });
  console.log('PNG QR generated at:', outPng);

  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: 600,
    margin: 3,
    color: { dark: '#163d35', light: '#ffffff' }
  });
  fs.writeFileSync(outSvg, svg);
  console.log('SVG QR generated at:', outSvg);

  fs.copyFileSync(outPng, brainPng);
  console.log('Brain PNG copied to:', brainPng);
}

main().catch(console.error);
