const QRCode = require('qrcode');

const url = 'http://192.168.11.100:8080';

QRCode.toFile(`./public/qr-code.png`, url, {
  width: 512,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  errorCorrectionLevel: 'H'
}, function (err) {
  if (err) throw err;
  console.log('✅ QR code généré : public/qr-code.png');
  console.log(`📱 URL: ${url}`);
});
