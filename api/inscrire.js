/**
 * ============================================================
 * SR Technologie — Serveur d'inscription Masterclass
 * Version Vercel Serverless (SANS busboy)
 * ============================================================
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration CORS manuelle
const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

const handler = async (req, res) => {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée' });
  }

  try {
    // Récupérer les données du formulaire (Vercel parse automatiquement)
    const { nom, prenom, niveau, whatsapp, email, website, preuve } = req.body;

    // Anti-spam honeypot
    if (website && website !== '') {
      return res.status(400).json({ success: false, message: 'Spam détecté.' });
    }

    /* Validation côté serveur */
    const errors = [];
    if (!nom || nom.trim().length < 2) errors.push('Nom invalide.');
    if (!prenom || prenom.trim().length < 2) errors.push('Prénom invalide.');
    if (!niveau || niveau.trim() === '') errors.push("Niveau d'étude requis.");
    if (!whatsapp || whatsapp.trim().length < 8) errors.push('Numéro WhatsApp invalide.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide.');

    if (errors.length > 0) {
      return res.status(422).json({ success: false, errors });
    }

    // Gérer la preuve de paiement (peut être une URL ou un base64)
    let fileBuffer = null;
    let fileName = 'preuve-paiement.jpg';
    let fileType = 'image/jpeg';

    if (preuve) {
      // Si preuve est un objet avec data (base64)
      if (typeof preuve === 'object' && preuve.data) {
        fileBuffer = Buffer.from(preuve.data, 'base64');
        fileName = preuve.filename || 'preuve-paiement.jpg';
        fileType = preuve.type || 'image/jpeg';
      }
      // Si preuve est directement une chaîne base64
      else if (typeof preuve === 'string' && preuve.length > 100) {
        // Supprimer le préfixe data:image/xxx;base64, si présent
        const base64Data = preuve.replace(/^data:image\/\w+;base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    // Si pas de fichier, erreur
    if (!fileBuffer) {
      return res.status(422).json({ 
        success: false, 
        errors: ['Preuve de paiement manquante. Veuillez joindre une capture d\'écran.'] 
      });
    }

    const ticketCode = genTicketCode();

    // Vérifier les variables d'environnement
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Variables SMTP manquantes');
      return res.status(500).json({ 
        success: false, 
        message: 'Configuration email incomplète' 
      });
    }

    /* Configuration Nodemailer */
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Vérifier la connexion SMTP
    try {
      await transporter.verify();
      console.log('SMTP connecté avec succès');
    } catch (verifyErr) {
      console.error('Erreur vérification SMTP:', verifyErr.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur de configuration email: ' + verifyErr.message 
      });
    }

    /* Email participant */
    const mailOptions = {
      from: `"SR Technologie" <${process.env.SMTP_USER}>`,
      to: email.trim(),
      subject: "Confirmation d'inscription – Masterclass SR Technologie",
      html: buildEmailHTML({ 
        nom: nom.trim(), 
        prenom: prenom.trim(), 
        ticketCode,
        email: email.trim(),
        whatsapp: whatsapp.trim()
      }),
      attachments: [{
        filename: fileName,
        content: fileBuffer,
        contentType: fileType,
      }],
    };

    /* Email admin */
    const adminMailOptions = {
      from: `"SR Technologie Bot" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `[Nouvelle inscription] ${prenom} ${nom} — Masterclass 18 Avril`,
      html: `
        <h2>✅ Nouvelle inscription</h2>
        <p><strong>Nom complet :</strong> ${prenom} ${nom}</p>
        <p><strong>Niveau d'étude :</strong> ${niveau}</p>
        <p><strong>WhatsApp :</strong> ${whatsapp}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Code ticket :</strong> <code style="background:#eee;padding:2px 6px;">${ticketCode}</code></p>
        <hr/>
        <p><strong>📅 Événement :</strong> Masterclass Fibre Optique</p>
        <p><strong>📆 Date :</strong> Samedi 18 Avril 2026</p>
        <p><strong>📍 Lieu :</strong> Cotonou Ste Rita, Immeuble ROSE</p>
        <p><strong>⏰ Heure :</strong> 9h00 - 17h00</p>
        <hr/>
        <p><em>La preuve de paiement est en pièce jointe.</em></p>
      `,
      attachments: [{
        filename: fileName,
        content: fileBuffer,
        contentType: fileType,
      }],
    };

    // Envoyer les emails
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(adminMailOptions);

    console.log('✅ Emails envoyés avec succès pour:', email);
    
    return res.json({
      success: true,
      message: 'Inscription confirmée. Email envoyé.',
      ticketCode,
    });

  } catch (err) {
    console.error('❌ Erreur détaillée:', err);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription. Réessayez.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
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
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation SR Technologie</title>
</head>
<body style="margin:0;padding:0;background:#07090f;font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #0c111d; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0a1628, #071020); padding: 30px; text-align: center;">
      <h1 style="color: #eef4ff; margin: 0;">SR <span style="color: #00aaff;">Technologie</span></h1>
      <p style="color: #7a9abf; margin: 10px 0 0;">Masterclass Fibre Optique</p>
    </div>
    
    <div style="padding: 30px;">
      <h2 style="color: #eef4ff; margin-top: 0;">🎉 Félicitations ${data.prenom} !</h2>
      <p style="color: #8ab0cc; line-height: 1.6;">Votre inscription à la <strong>Masterclass Fibre Optique</strong> du <strong>Samedi 18 Avril 2026</strong> est confirmée.</p>
      
      <div style="background: #0f1520; border: 2px solid rgba(0,230,118,0.3); border-radius: 12px; padding: 20px; margin: 25px 0;">
        <p style="color: #00e676; font-weight: bold; margin: 0 0 15px; text-align: center;">🎟️ VOTRE TICKET</p>
        <p style="color: #eef4ff; margin: 8px 0;"><strong>Nom :</strong> ${data.prenom} ${data.nom}</p>
        <p style="color: #eef4ff; margin: 8px 0;"><strong>Code ticket :</strong> <code style="background: #000; padding: 4px 8px; border-radius: 6px; color: #00aaff;">${data.ticketCode}</code></p>
        <p style="color: #eef4ff; margin: 8px 0;"><strong>Date :</strong> Samedi 18 Avril 2026</p>
        <p style="color: #eef4ff; margin: 8px 0;"><strong>Lieu :</strong> Cotonou Ste Rita, Immeuble ROSE</p>
        <p style="color: #eef4ff; margin: 8px 0;"><strong>Heure :</strong> 9h00 - 17h00</p>
      </div>
      
      <p style="color: #8ab0cc; margin: 20px 0 15px;">📱 Rejoignez notre communauté WhatsApp pour les informations pratiques :</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://chat.whatsapp.com/IIwCmOItZiYHEhgbBtn86v" style="display: inline-block; background: linear-gradient(135deg, #25d366, #128c7e); color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold;">
          💬 Rejoindre le groupe WhatsApp
        </a>
      </div>
      
      <p style="color: #7a9abf; font-size: 13px; border-top: 1px solid #1a2538; padding-top: 20px; margin-top: 20px;">
        📌 <strong>À conserver précieusement</strong><br>
        Ce ticket vous sera demandé à l'entrée. En cas de question, contactez-nous sur WhatsApp.
      </p>
    </div>
    
    <div style="background: #090d17; padding: 20px; text-align: center; color: #3d5470; font-size: 12px;">
      © 2026 SR Technologie · Cotonou, Bénin
    </div>
  </div>
</body>
</html>`;
}

// Exporter avec CORS
module.exports = allowCors(handler);
