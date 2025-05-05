import QRCode from 'qrcode';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const type = body.type;

  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const code = `${type}${hex}`;
  const url = await QRCode.toDataURL(code);

  return { code, url };
});
