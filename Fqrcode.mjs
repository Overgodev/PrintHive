import QRCode from 'qrcode';
import qrcodeReader from 'qrcode-reader';
import * as Jimp from 'jimp';
import fs from 'fs';
import path from 'path';

// Define stock types
const stockTypes = {
    '1': 'Filament',
    '2': 'Parts',
    'F': 'Other'
};

// Ensure the destination folder exists
const outputDir = path.join(process.cwd(), 'qrcodes');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Track the last used hex code
const counterFile = path.join(outputDir, 'counter.json');
let counter = 0;

if (fs.existsSync(counterFile)) {
    try {
        const data = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
        counter = data.counter % 0x10000; // Ensure it wraps around after FFFF
    } catch (err) {
        console.error('Error reading counter file:', err);
    }
}

// Function to generate a sequential 4-character hex code
function generateHexCode() {
    const hex = counter.toString(16).toUpperCase().padStart(4, '0');
    counter = (counter + 1) % 0x10000; // Increment and wrap at 0xFFFF
    fs.writeFileSync(counterFile, JSON.stringify({ counter }), 'utf8');
    return hex;
}

// Function to generate a QR code and save as PNG
async function generateQRCode(stockType) {
    if (!stockTypes[stockType]) {
        console.error('Invalid stock type!');
        return;
    }
    
    const hexCode = generateHexCode(); // Generate sequential 16-bit hex (4 characters)
    const fullCode = stockType + hexCode;
    const outputDir = path.join('C:\\PrintHive\\qr_output');
    
    try {
        await QRCode.toFile(filePath, fullCode);
        console.log(`Generated QR Code for ${stockTypes[stockType]} (${fullCode}) and saved as ${filePath}`);
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
// readQRCode('qrcodes/10000.png');
