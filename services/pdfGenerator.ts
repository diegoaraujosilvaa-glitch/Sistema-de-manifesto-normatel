
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Manifest, LoadingManifest } from '../types';

export const generateManifestPDF = async (manifest: Manifest, isPreview: boolean = false): Promise<string | null> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= manifest.palletsCount; i++) {
    if (i > 1) doc.addPage();
    
    // Border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Header Tag
    doc.setFillColor(234, 88, 12); // Normatel Orange
    doc.rect(10, 10, pageWidth - 20, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('LOGÍSTICA NORMATEL - ETIQUETA DE CONFERÊNCIA', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(16);
    doc.text(manifest.conferenceType, pageWidth / 2, 28, { align: 'center' });

    // Manifesto Number
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MANIFESTO Nº:', pageWidth / 2, 45, { align: 'center' });
    doc.setFontSize(64);
    doc.text(manifest.manifestNumber, pageWidth / 2, 68, { align: 'center' });

    // Barcode
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, manifest.manifestNumber, { format: 'CODE128', width: 2, height: 60, displayValue: false });
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - 120) / 2, 75, 120, 25);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 105, pageWidth - 15, 105);

    // Info Grid
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('DESTINO:', 20, 115);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(manifest.branchName, 20, 130);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`ORIGEM: ${manifest.cdName}`, 20, 142);
    doc.text(`DATA: ${new Date(manifest.conferenceDate).toLocaleDateString('pt-BR')}`, 20, 152);
    doc.text(`CONFERENTE: ${manifest.checkerName}`, 20, 160);

    // Pallet Info
    doc.setFillColor(30, 41, 59);
    doc.rect(pageWidth - 85, 140, 70, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('PALETE / VOL:', pageWidth - 75, 152);
    doc.setFontSize(54);
    doc.text(`${i}/${manifest.palletsCount}`, pageWidth - 50, 178, { align: 'center' });

    // Special Products Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VOLUMES ESPECIAIS (FORA DO PALETE):', 20, 180);
    doc.line(20, 182, pageWidth - 100, 182);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (manifest.specialProducts && manifest.specialProducts.length > 0) {
      doc.setTextColor(234, 88, 12);
      const specialText = manifest.specialProducts.join(' • ');
      const splitSpecial = doc.splitTextToSize(specialText, pageWidth - 110);
      doc.text(splitSpecial, 20, 190);
    } else {
      doc.setTextColor(203, 213, 225);
      doc.text('NENHUM ITEM ESPECIAL DECLARADO', 20, 190);
    }

    // Orders List
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RELAÇÃO DE PEDIDOS / NOTAS:', 20, 210);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitOrders = doc.splitTextToSize(manifest.orders, pageWidth - 80);
    doc.text(splitOrders, 20, 218);

    // QR Code
    const qrContent = JSON.stringify({ m: manifest.manifestNumber, p: `${i}/${manifest.palletsCount}`, t: manifest.conferenceType });
    doc.addImage(await QRCode.toDataURL(qrContent), 'PNG', pageWidth - 55, 205, 40, 40);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`LOGÍSTICA NORMATEL - Impresso por ${manifest.createdBy} em ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  }

  if (isPreview) {
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  } else {
    doc.save(`Etiquetas_${manifest.manifestNumber}.pdf`);
    return null;
  }
};

export const generateLoadingManifestPDF = async (data: LoadingManifest, isPreview: boolean = false): Promise<string | null> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MANIFESTO DE CARGA / ROMANEIO', 15, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº MANIFESTO: ${data.manifestNumber}`, 15, 28);
  doc.text(`DATA EMISSÃO: ${new Date(data.createdAt).toLocaleString('pt-BR')}`, 15, 34);

  // QR Code Header
  const qrHeader = await QRCode.toDataURL(data.manifestNumber);
  doc.addImage(qrHeader, 'PNG', pageWidth - 45, 5, 30, 30);

  // Section 1: Origem e Destino
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. INFORMAÇÕES DA VIAGEM', 15, 50);
  doc.line(15, 52, pageWidth - 15, 52);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`UNIDADE ORIGEM: ${data.cdName}`, 15, 60);
  doc.text(`FILIAL DESTINO: ${data.branchName}`, 15, 66);
  doc.text(`DATA PREVISTA ENTREGA: ${new Date(data.deliveryDate).toLocaleDateString('pt-BR')}`, 15, 72);
  doc.text(`NÚMERO DO LACRE: ${data.sealNumber || 'NÃO INFORMADO'}`, 15, 78);
  doc.setFont('helvetica', 'bold');
  doc.text(`HORÁRIO DE SAÍDA: ${data.exitTime}`, pageWidth - 70, 60);

  // Section 2: Transporte
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DADOS DO TRANSPORTE', 15, 90);
  doc.line(15, 92, pageWidth - 15, 92);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`MOTORISTA: ${data.driverName}`, 15, 100);
  doc.text(`VEÍCULO (PLACA): ${data.vehiclePlate}`, 15, 106);
  doc.text(`EMITIDO POR: ${data.createdBy}`, 15, 112);

  // Section 3: Notas Fiscais (Table)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. RELAÇÃO DE NOTAS FISCAIS', 15, 125);
  doc.line(15, 127, pageWidth - 15, 127);

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 132, pageWidth - 30, 8, 'F');
  doc.setFontSize(9);
  doc.text('ÍNDICE', 20, 137);
  doc.text('NÚMERO NF', 40, 137);
  doc.text('CHAVE DE ACESSO', 70, 137);

  let y = 145;
  data.invoices.forEach((inv, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.text(`${index + 1}`, 20, y);
    doc.setFont('helvetica', 'bold');
    doc.text(inv.number, 40, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(inv.key, 70, y);
    doc.setFontSize(9);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;
  });

  // Footer / Signatures
  const footerY = 270;
  doc.line(20, footerY, 80, footerY);
  doc.text('ASSINATURA EXPEDIÇÃO', 30, footerY + 5);
  doc.line(pageWidth - 80, footerY, pageWidth - 20, footerY);
  doc.text('ASSINATURA MOTORISTA', pageWidth - 70, footerY + 5);

  if (isPreview) {
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  } else {
    doc.save(`Manifesto_Carga_${data.manifestNumber}.pdf`);
    return null;
  }
};
