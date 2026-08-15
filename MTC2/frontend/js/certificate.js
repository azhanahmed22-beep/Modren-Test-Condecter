/* ==========================================================================
   MODREN QUIZ COUNDECTER - High-Res HTML5 Canvas Certificate Generator
   ========================================================================== */

class CertificateGenerator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
  }

  generateCertificate(data) {
    if (!this.canvas || !this.ctx) {
      this.canvas = document.getElementById('cert-canvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
      else return;
    }

    const W = 2400;
    const H = 1600;
    this.canvas.width = W;
    this.canvas.height = H;

    const ctx = this.ctx;

    // Background
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.8);
    bgGrad.addColorStop(0, '#0d1322');
    bgGrad.addColorStop(0.6, '#07090e');
    bgGrad.addColorStop(1, '#030407');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Luxury Borders
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#ffe259';
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00f2fe';
    ctx.strokeRect(60, 60, W - 120, H - 120);

    this.drawCornerDeco(ctx, 80, 80);
    this.drawCornerDeco(ctx, W - 80, 80, true, false);
    this.drawCornerDeco(ctx, 80, H - 80, false, true);
    this.drawCornerDeco(ctx, W - 80, H - 80, true, true);

    // Header Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillText('MODREN QUIZ COUNDECTER • OFFICIAL ACCREDITATION', W / 2, 160);

    ctx.fillStyle = '#ffe259';
    ctx.font = '900 84px "Outfit", sans-serif';
    ctx.shadowColor = 'rgba(255, 226, 89, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('CERTIFICATE OF EXCELLENCE', W / 2, 280);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 36px "Inter", sans-serif';
    ctx.fillText('THIS CERTIFICATE IS PROUDLY PRESENTED TO', W / 2, 380);

    // Candidate Name
    const name = (data.name || 'CANDIDATE NAME').toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px "Outfit", sans-serif';
    ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
    ctx.shadowBlur = 25;
    ctx.fillText(name, W / 2, 510);
    ctx.shadowBlur = 0;

    const nameWidth = ctx.measureText(name).width;
    const lineGrad = ctx.createLinearGradient(W / 2 - nameWidth / 2, 0, W / 2 + nameWidth / 2, 0);
    lineGrad.addColorStop(0, '#00f2fe');
    lineGrad.addColorStop(0.5, '#ffe259');
    lineGrad.addColorStop(1, '#00f2fe');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(W / 2 - nameWidth / 2, 540, nameWidth, 6);

    // Highlight Box message (Exact backend message)
    const levelStr = (data.level || 'Hard').toUpperCase();
    const rankStr = data.rank ? `TOP ${data.rank}` : 'TOP 1';
    
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '400 38px "Inter", sans-serif';
    ctx.fillText('For demonstrating outstanding intellectual mastery and achieving remarkable success:', W / 2, 650);

    const msgBoxY = 710;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = '#ffe259';
    ctx.lineWidth = 2;
    this.roundRect(ctx, W / 2 - 800, msgBoxY, 1600, 150, 20, true, true);

    ctx.fillStyle = '#ffe259';
    ctx.font = '800 48px "Outfit", sans-serif';
    const mainMsg = `You just passed ${levelStr} level with ${rankStr} position!`;
    ctx.fillText(mainMsg, W / 2, msgBoxY + 90);

    // Metadata Grid
    ctx.font = '600 32px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    
    const subject = data.subject || 'All Subjects';
    const score = `${data.score || 50} / 50 (${Math.round(((data.score || 50) / 50) * 100)}%)`;
    const certId = data.certificateId || `MQC-${Math.floor(100000 + Math.random() * 900000)}`;
    const date = data.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    ctx.textAlign = 'left';
    ctx.fillText(`SUBJECT: `, W / 2 - 600, 980);
    ctx.fillStyle = '#00f2fe';
    ctx.fillText(subject, W / 2 - 440, 980);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`SCORE: `, W / 2 + 100, 980);
    ctx.fillStyle = '#00f2fe';
    ctx.fillText(score, W / 2 + 240, 980);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ISSUE DATE: `, W / 2 - 600, 1050);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(date, W / 2 - 400, 1050);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`CERTIFICATE ID: `, W / 2 + 100, 1050);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(certId, W / 2 + 370, 1050);

    // Gold Badge
    this.drawGoldSeal(ctx, W / 2, 1280);

    // Signatures
    ctx.textAlign = 'center';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 600, 1360);
    ctx.lineTo(W / 2 - 250, 1360);
    ctx.stroke();

    ctx.fillStyle = '#00f2fe';
    ctx.font = 'italic bold 34px "Outfit", sans-serif';
    ctx.fillText('Dr. M. A. Rehman', W / 2 - 425, 1340);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillText('Chairman Board of Examiners', W / 2 - 425, 1400);

    ctx.beginPath();
    ctx.moveTo(W / 2 + 250, 1360);
    ctx.lineTo(W / 2 + 600, 1360);
    ctx.stroke();

    ctx.fillStyle = '#00f2fe';
    ctx.font = 'italic bold 34px "Outfit", sans-serif';
    ctx.fillText('Modern Quiz Council', W / 2 + 425, 1340);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillText('Verification Authority', W / 2 + 425, 1400);
  }

  drawCornerDeco(ctx, x, y, flipX = false, flipY = false) {
    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);

    ctx.strokeStyle = '#ffe259';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(0, 0);
    ctx.lineTo(40, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawGoldSeal(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#ffe259';
    ctx.shadowColor = 'rgba(255, 226, 89, 0.6)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI) / 12;
      const r = i % 2 === 0 ? 75 : 62;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#07090e';
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe259';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MQC', 0, 0);

    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  downloadPNG(filename = 'MQC_Certificate.png') {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

window.certificateGenerator = new CertificateGenerator('cert-canvas');
