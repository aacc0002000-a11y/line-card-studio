import QRCode from "qrcode";

export async function generateQrCodeDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
