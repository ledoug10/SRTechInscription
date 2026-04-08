/**
 * ============================================================
 * SR Technologie — Serveur d'inscription Masterclass
 * Backend Node.js + Express + Nodemailer
 * ============================================================
 * INSTALLATION :
 *   npm install express nodemailer multer cors dotenv
 * LANCEMENT :
 *   node server.js
 * ============================================================
 */

require('dotenv').config();
const express  = require('express');
const nodemailer = require('nodemailer');
const multer   = require('multer');
const cors     = require('cors');
const path     = require('path');
const crypto   = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─── Middlewares ─────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Servir le fichier HTML statiquement */
app.use(express.static(path.join(__dirname)));

/* ─── Multer : gestion des uploads ───────────────────── */
const storage = multer.memoryStorage(); /* stockage en mémoire (pas sur disque) */
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, /* 5 MB max */
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. JPG/PNG uniquement.'));
    }
  }
});

/* ─── Nodemailer : configuration SMTP ────────────────── */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,    /* ex: smtp.gmail.com */
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', /* true pour port 465 */
  auth: {
    user: process.env.SMTP_USER,    /* votre email */
    pass: process.env.SMTP_PASS,    /* mot de passe ou App Password */
  },
});

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
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Confirmation d'inscription — SR Technologie</title>
</head>
<body style="margin:0;padding:0;background:#07090f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- EN-TÊTE -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a1628,#071020);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border:1px solid rgba(0,160,255,0.15);border-bottom:none;">
              <div style="display:inline-block;background:linear-gradient(135deg,#00aaff,#0055cc);border-radius:10px;width:44px;height:44px;line-height:44px;text-align:center;margin-bottom:16px;">
                <span style="color:#fff;font-size:20px;">📡</span>
              </div>
              <div style="font-size:20px;font-weight:800;color:#eef4ff;margin-bottom:4px;">SR <span style="color:#00aaff;">Technologie</span></div>
              <div style="font-size:13px;color:#7a9abf;">Centre de Formation IT · Cotonou, Bénin</div>
            </td>
          </tr>

          <!-- CORPS PRINCIPAL -->
          <tr>
            <td style="background:#0c111d;padding:40px;border:1px solid rgba(0,160,255,0.13);border-top:none;border-bottom:none;">

              <p style="color:#7a9abf;font-size:14px;margin:0 0 8px;">Bonjour,</p>
              <h1 style="color:#eef4ff;font-size:22px;font-weight:800;margin:0 0 24px;line-height:1.3;">
                ${data.prenom} <strong style="color:#00aaff;">${data.nom}</strong>,<br/>
                votre inscription est confirmée !
              </h1>

              <p style="color:#8ab0cc;font-size:14px;line-height:1.7;margin:0 0 32px;">
                Nous avons bien reçu votre inscription à la <strong style="color:#eef4ff;">Masterclass Fibre Optique</strong>
                du <strong style="color:#eef4ff;">18 Avril 2026</strong>. Voici votre ticket de confirmation.
              </p>

              <!-- TICKET -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1520;border:2px solid rgba(0,230,118,0.25);border-radius:14px;overflow:hidden;margin-bottom:32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#081220,#060e1a);padding:24px 28px;border-bottom:2px dashed rgba(0,160,255,0.15);">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#3d5470;margin-bottom:8px;">Statut de votre inscription</div>
                    <div style="display:inline-block;background:rgba(0,230,118,0.1);border:2px solid rgba(0,230,118,0.35);border-radius:8px;padding:10px 20px;">
                      <span style="font-size:16px;font-weight:800;color:#00e676;letter-spacing:0.05em;">🎟️ PLACE RÉSERVÉE</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid rgba(0,160,255,0.08);">
                          <div style="font-size:11px;color:#3d5470;text-transform:uppercase;letter-spacing:0.08em;">Participant</div>
                          <div style="font-size:14px;color:#eef4ff;font-weight:600;margin-top:2px;">${data.prenom} ${data.nom}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(0,160,255,0.08);">
                          <div style="font-size:11px;color:#3d5470;text-transform:uppercase;letter-spacing:0.08em;">Événement</div>
                          <div style="font-size:14px;color:#eef4ff;font-weight:600;margin-top:2px;">Masterclass Fibre Optique</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(0,160,255,0.08);">
                          <div style="font-size:11px;color:#3d5470;text-transform:uppercase;letter-spacing:0.08em;">Date</div>
                          <div style="font-size:14px;color:#eef4ff;font-weight:600;margin-top:2px;">Samedi 18 Avril 2026</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(0,160,255,0.08);">
                          <div style="font-size:11px;color:#3d5470;text-transform:uppercase;letter-spacing:0.08em;">Lieu</div>
                          <div style="font-size:14px;color:#eef4ff;font-weight:600;margin-top:2px;">Cotonou, Bénin</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <div style="font-size:11px;color:#3d5470;text-transform:uppercase;letter-spacing:0.08em;">Code ticket</div>
                          <div style="font-family:'Courier New',monospace;font-size:13px;color:#00aaff;font-weight:600;margin-top:2px;letter-spacing:0.1em;">${data.ticketCode}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#8ab0cc;font-size:13px;line-height:1.7;margin:0 0 16px;">
                📱 Rejoignez notre communauté WhatsApp pour recevoir les informations pratiques (lieu exact, horaire, programme) :
              </p>
              <p style="text-align:center;margin:0 0 32px;">
                <a href="https://chat.whatsapp.com/IIwCmOItZiYHEhgbBtn86v"
                   style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  💬 Rejoindre la communauté WhatsApp
                </a>
              </p>

              <p style="color:#8ab0cc;font-size:13px;line-height:1.7;margin:0;">
                Conservez cet email comme justificatif. Il vous sera demandé à l'entrée.
                En cas de question, contactez-nous sur WhatsApp.
              </p>
            </td>
          </tr>

          <!-- PIED DE PAGE -->
          <tr>
            <td style="background:#090d17;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(0,160,255,0.13);border-top:none;">
              <p style="color:#3d5470;font-size:12px;margin:0 0 6px;">
                © 2026 SR Technologie · Cotonou, Bénin
              </p>
              <p style="color:#3d5470;font-size:11px;margin:0;">
                Cet email a été envoyé automatiquement suite à votre inscription.
              </p>
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

/* ─── Route principale : soumission du formulaire ────── */
app.post('/inscrire', upload.single('preuve'), async (req, res) => {

  /* Anti-spam honeypot */
  if (req.body.website && req.body.website !== '') {
    return res.status(400).json({ success: false, message: 'Spam détecté.' });
  }

  const { nom, prenom, niveau, whatsapp, email } = req.body;

  /* Validation côté serveur */
  const errors = [];
  if (!nom    || nom.trim().length < 2)      errors.push('Nom invalide.');
  if (!prenom || prenom.trim().length < 2)   errors.push('Prénom invalide.');
  if (!niveau || niveau.trim() === '')        errors.push('Niveau d\'étude requis.');
  if (!whatsapp || whatsapp.trim().length < 8) errors.push('Numéro WhatsApp invalide.');
  if (!email  || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide.');
  if (!req.file) errors.push('Preuve de paiement manquante.');

  if (errors.length > 0) {
    return res.status(422).json({ success: false, errors });
  }

  const ticketCode = genTicketCode();

  /* Options email */
  const mailOptions = {
    from:    `"SR Technologie" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: 'Confirmation d\'inscription – Masterclass SR Technologie',
    html:    buildEmailHTML({ nom: nom.trim(), prenom: prenom.trim(), ticketCode }),
    attachments: [
      {
        filename:    req.file.originalname,
        content:     req.file.buffer,
        contentType: req.file.mimetype,
      }
    ]
  };

  /* Email de copie interne (optionnel) */
  const adminMailOptions = {
    from:    `"SR Technologie Bot" <${process.env.SMTP_USER}>`,
    to:      process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: `[Nouvelle inscription] ${prenom} ${nom} — Masterclass 18 Avril`,
    html: `
      <p><strong>Nouvel inscrit :</strong></p>
      <ul>
        <li>Nom : ${prenom} ${nom}</li>
        <li>Niveau : ${niveau}</li>
        <li>WhatsApp : ${whatsapp}</li>
        <li>Email : ${email}</li>
        <li>Ticket : ${ticketCode}</li>
      </ul>
      <p>La preuve de paiement est en pièce jointe.</p>
    `,
    attachments: [
      {
        filename:    req.file.originalname,
        content:     req.file.buffer,
        contentType: req.file.mimetype,
      }
    ]
  };

  try {
    /* Envoi email participant */
    await transporter.sendMail(mailOptions);
    /* Envoi copie admin */
    await transporter.sendMail(adminMailOptions);

    return res.json({
      success: true,
      message: 'Inscription confirmée. Email envoyé.',
      ticketCode
    });

  } catch (err) {
    console.error('Erreur envoi email :', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email. Réessayez.'
    });
  }
});

/* ─── Gestion des erreurs Multer ─────────────────────── */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

/* ─── Démarrage du serveur ────────────────────────────── */
module.exports = app;
