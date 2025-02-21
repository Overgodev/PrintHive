import QRCode from 'qrcode';
import qrcodeReader from 'qrcode-reader';
import Jimp from 'jimp';

// Define stock types
const stockTypes = {
    '1': 'Filament',
    '2': 'Parts',
    'F': 'Other'
};

// Function to generate a random 4-character hex code
function generateHexCode(length) {
    let hex = '';
    for (let i = 0; i < length; i++) {
        hex += Math.floor(Math.random() * 16).toString(16).toUpperCase();
    }
    return hex;
}

// Function to generate a QR code
async function generateQRCode(stockType) {
    if (!stockTypes[stockType]) {
        console.error('Invalid stock type!');
        return;
    }
    
    const hexCode = generateHexCode(4); // Generate 16-bit random hex (4 characters)
    const fullCode = stockType + hexCode;
    
    try {
        const qrDataURL = await QRCode.toDataURL(fullCode);
        console.log(`Generated QR Code for ${stockTypes[stockType]} (${fullCode}):`);
        console.log(qrDataURL);
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
}

// Function to read a QR code from an image file
async function readQRCode(imagePath) {
    try {
        const image = await Jimp.read(imagePath);
        const qr = new qrcodeReader();

        const decodedData = await new Promise((resolve, reject) => {
            qr.callback = (err, value) => err ? reject(err) : resolve(value.result);
            qr.decode(image.bitmap);
        });
        
        console.log(`Decoded QR Code: ${decodedData}`);
        return decodedData;
    } catch (err) {
        console.error('Error reading QR code:', err);
    }
}

// Example: Generate a QR code for Filament ('1')
generateQRCode('1');

// Example: Read a QR code from an image file
// readQRCode('path_to_qr_image.png');
