/**
 * ============================================================
 * SR Technologie — Serveur d'inscription Masterclass
 * Version Vercel Serverless (corrigée)
 * ============================================================
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');

// Pour Vercel, on utilise le parser body raw
module.exports = async (req, res) => {
  // Activer CORS
  cors()(req, res, async () => {
    
    // Uniquement POST
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Méthode non autorisée' });
    }

    try {
      // Anti-spam honeypot
      if (req.body.website && req.body.website !== '') {
        return res.status(400).json({ success: false, message: 'Spam détecté.' });
      }

      // Récupérer les données du formulaire (Vercel les parse automatiquement)
      const { nom, prenom, niveau, whatsapp, email } = req.body;
      
      // Récupérer le fichier (Vercel le met dans req.files ou raw body)
      let fileBuffer = null;
      let fileName = null;
      let fileType = null;

      // Vercel peut envoyer le fichier de différentes manières
      if (req.files && req.files.preuve) {
        // Avec busboy/multipart
        fileBuffer = req.files.preuve.data || req.files.preuve.buffer;
        fileName = req.files.preuve.name;
        fileType = req.files.preuve.type;
      } else if (req.body.preuve && req.body.preuve.data) {
        // Encodé en base64
        fileBuffer = Buffer.from(req.body.preuve.data, 'base64');
        fileName = req.body.preuve.filename || 'preuve.png';
        fileType = req.body.preuve.type || 'image/png';
      }

      /* Validation côté serveur */
      const errors = [];
      if (!nom || nom.trim().length < 2) errors.push('Nom invalide.');
      if (!prenom || prenom.trim().length < 2) errors.push('Prénom invalide.');
      if (!niveau || niveau.trim() === '') errors.push("Niveau d'étude requis.");
      if (!whatsapp || whatsapp.trim().length < 8) errors.push('Numéro WhatsApp invalide.');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide.');
      if (!fileBuffer) errors.push('Preuve de paiement manquante.');

      if (errors.length > 0) {
        return res.status(422).json({ success: false, errors });
      }

      const ticketCode = genTicketCode();

      /* Configuration Nodemailer */
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      /* Email participant */
      const mailOptions = {
        from: `"SR Technologie" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Confirmation d'inscription – Masterclass SR Technologie",
        html: buildEmailHTML({ 
          nom: nom.trim(), 
          prenom: prenom.trim(), 
          ticketCode,
          email: email.trim(),
          whatsapp: whatsapp.trim()
        }),
        attachments: [
          {
            filename: fileName || 'preuve-paiement.jpg',
            content: fileBuffer,
            contentType: fileType || 'image/jpeg',
          }
        ],
      };

      /* Email admin */
      const adminMailOptions = {
        from: `"SR Technologie Bot" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `[Nouvelle inscription] ${prenom} ${nom} — Masterclass 18 Avril`,
        html: `
          <p><strong>Nouvel inscrit :</strong></p>
          <ul>
            <li>Nom complet : ${prenom} ${nom}</li>
            <li>Niveau d'étude : ${niveau}</li>
            <li>WhatsApp : ${whatsapp}</li>
            <li>Email : ${email}</li>
            <li>Code ticket : ${ticketCode}</li>
          </ul>
          <p>La preuve de paiement est en pièce jointe.</p>
          <hr/>
          <p><strong>📅 Événement :</strong> Masterclass Fibre Optique</p>
          <p><strong>📆 Date :</strong> Samedi 18 Avril 2026</p>
          <p><strong>📍 Lieu :</strong> Cotonou Ste Rita, Immeuble ROSE</p>
        `,
        attachments: [
          {
            filename: fileName || 'preuve-paiement.jpg',
            content: fileBuffer,
            contentType: fileType || 'image/jpeg',
          }
        ],
      };

      // Envoyer les emails
      await transporter.sendMail(mailOptions);
      await transporter.sendMail(adminMailOptions);

      return res.json({
        success: true,
        message: 'Inscription confirmée. Email envoyé.',
        ticketCode,
      });

    } catch (err) {
      console.error('Erreur détaillée:', err);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'inscription. Réessayez.",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  });
};

/* ─── Générateur de code ticket ──────────────────────── */
function genTicketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SRT-2026-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* ─── Template email HTML ────────────────────────────── */
function buildEmailHTML(data) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Confirmation d'inscription — SR Technologie</title>
</head>
<body style="margin:0;padding:0;background:#07090f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0a1628,#071020);border-radius:16px 16px 0 0;padding:30px;text-align:center;">
              <h1 style="color:#eef4ff;margin:0;">SR <span style="color:#00aaff;">Technologie</span></h1>
              <p style="color:#7a9abf;margin:10px 0 0;">Masterclass Fibre Optique</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0c111d;padding:30px;">
              <h2 style="color:#eef4ff;">🎉 Félicitations ${data.prenom} !</h2>
              <p style="color:#8ab0cc;">Votre inscription à la Masterclass Fibre Optique du <strong>18 Avril 2026</strong> est confirmée.</p>
              
              <div style="background:#0f1520;border:2px solid #00e67633;border-radius:10px;padding:20px;margin:20px 0;">
                <p style="color:#00e676;font-weight:bold;margin:0 0 15px;">🎟️ VOTRE TICKET</p>
                <p><strong>Nom :</strong> ${data.nom} ${data.prenom}</p>
                <p><strong>Code ticket :</strong> <code style="background:#000;padding:5px;border-radius:5px;">${data.ticketCode}</code></p>
                <p><strong>Date :</strong> Samedi 18 Avril 2026</p>
                <p><strong>Lieu :</strong> Cotonou Ste Rita, Immeuble ROSE</p>
              </div>
              
              <p style="color:#8ab0cc;">📱 Rejoignez notre communauté WhatsApp :</p>
              <p style="text-align:center;">
                <a href="https://chat.whatsapp.com/IIwCmOItZiYHEhgbBtn86v" style="background:#25d366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">💬 Rejoindre le groupe</a>
              </p>
             </td>
           </tr>
           <tr>
            <td style="background:#090d17;border-radius:0 0 16px 16px;padding:20px;text-align:center;color:#3d5470;font-size:12px;">
              © 2026 SR Technologie · Cotonou, Bénin
             </td>
           </tr>
         </table>
       </td>
     </tr>
   </table>
</body>
</html>
  `;
}
