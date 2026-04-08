# 📡 SR Technologie — Formulaire d'inscription Masterclass

Système complet d'inscription en ligne avec envoi automatique d'email de confirmation.

---

## 📁 Structure des fichiers

```
sr-inscription/
├── inscription.html   → Page web du formulaire (frontend)
├── server.js          → Serveur Node.js + envoi d'email (backend)
├── package.json       → Dépendances Node.js
├── .env.example       → Modèle de configuration (à renommer en .env)
└── README.md          → Ce fichier
```

---

## ⚙️ OPTION A — Avec serveur Node.js (recommandé)

Cette option permet l'envoi d'email **avec la pièce jointe** (preuve de paiement).
Vous recevez aussi une copie de chaque inscription avec la capture d'écran.

### Étape 1 — Prérequis
- Installer [Node.js](https://nodejs.org) (version 18+)
- Avoir un compte Gmail

### Étape 2 — Activer les "App Passwords" Gmail
1. Allez sur https://myaccount.google.com/security
2. Activez la **Vérification en deux étapes** si ce n'est pas fait
3. Cherchez **"Mots de passe des applications"**
4. Créez un mot de passe pour "Mail" → notez les 16 caractères générés

### Étape 3 — Configurer le fichier .env
```bash
# Copiez le fichier exemple
cp .env.example .env

# Éditez .env avec vos vraies valeurs :
SMTP_USER=votre.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop   ← les 16 caractères de l'App Password
ADMIN_EMAIL=sr.technologie@gmail.com
```

### Étape 4 — Installer et lancer
```bash
# Dans le dossier sr-inscription/
npm install
npm start
```

### Étape 5 — Connecter le formulaire au serveur
Dans `inscription.html`, modifiez l'action du formulaire.
Cherchez la ligne dans le JS :
```javascript
await emailjs.send(...)
```
Et remplacez par un appel à votre serveur :
```javascript
const formData = new FormData(form);
formData.append('preuve', selectedFile);
const response = await fetch('/inscrire', { method: 'POST', body: formData });
const result = await response.json();
if (result.success) { showSuccess(nom, prenom, email); }
```

---

## ⚡ OPTION B — Sans serveur (EmailJS, plus simple)

Parfait pour héberger sur GitHub Pages sans avoir de serveur.
**Limitation** : ne peut pas joindre la preuve de paiement à l'email.

### Étape 1 — Créer un compte EmailJS
1. Allez sur https://www.emailjs.com
2. Créez un compte gratuit (200 emails/mois offerts)

### Étape 2 — Configurer un service email
1. Dans le dashboard → **Email Services** → **Add New Service**
2. Choisissez **Gmail**
3. Connectez votre compte Gmail
4. Notez le **Service ID** (ex: `service_abc123`)

### Étape 3 — Créer un template d'email
1. **Email Templates** → **Create New Template**
2. Configurez :
   - **To Email** : `{{to_email}}`
   - **Subject** : `Confirmation d'inscription – Masterclass SR Technologie`
   - **Body** (HTML) :
```html
Bonjour {{to_name}},

Votre inscription à la Masterclass Fibre Optique du {{date_event}} est confirmée.

🎟️ TICKET : PLACE RÉSERVÉE
Code : {{ticket_code}}

Ceci est votre laisser-passer pour participer.

Rejoignez notre communauté WhatsApp :
https://chat.whatsapp.com/IIwCmOItZiYHEhgbBtn86v

Merci pour votre confiance,
SR Technologie
```
3. Notez le **Template ID** (ex: `template_xyz789`)

### Étape 4 — Récupérer la clé publique
- **Account** → **API Keys** → copiez la **Public Key**

### Étape 5 — Configurer inscription.html
En haut du `<script>` dans `inscription.html`, remplissez :
```javascript
const EMAILJS_PUBLIC_KEY  = 'votre_public_key';
const EMAILJS_SERVICE_ID  = 'service_abc123';
const EMAILJS_TEMPLATE_ID = 'template_xyz789';
```

---

## 🌐 Déploiement GitHub Pages (Option B uniquement)

```bash
# 1. Créez un repo GitHub nommé : sr-masterclass-inscription
# 2. Uploadez inscription.html (renommé index.html)
# 3. Settings > Pages > Source: main / root
# 4. Votre URL : https://votre-username.github.io/sr-masterclass-inscription/
```

---

## 🛡️ Sécurité en place

| Protection | Mécanisme |
|---|---|
| Anti-spam | Champ honeypot caché (bots remplissent ce champ, humains non) |
| Validation client | JS vérifie chaque champ avant envoi |
| Validation serveur | Node.js re-vérifie tout côté serveur |
| Type fichier | Seuls JPG/PNG acceptés (vérification MIME type) |
| Taille fichier | 5 MB maximum |
| Format email | Regex de validation |

---

## 📧 Ce que reçoit l'inscrit

**Objet** : Confirmation d'inscription – Masterclass SR Technologie

**Contenu** :
- Salutation personnalisée avec nom/prénom
- Ticket "PLACE RÉSERVÉE" avec code unique
- Détails de l'événement (date, lieu)
- Lien vers la communauté WhatsApp
- Instructions pour l'entrée

**Vous recevez également** (Option A serveur) :
- Une copie avec tous les détails de l'inscrit
- La preuve de paiement en pièce jointe

---

## 🔧 Personnalisation rapide

| Ce que vous voulez changer | Où le changer |
|---|---|
| Date de l'événement | `inscription.html` ligne avec "18 Avril 2026" + `server.js` dans `buildEmailHTML()` |
| Tarif affiché | `inscription.html` dans `.price-amount` |
| Lien WhatsApp | `inscription.html` dans le `href` des boutons |
| Nombre de places | `inscription.html` dans `.event-item-val` "13 places restantes" |
| Logo | Remplacez l'icône Font Awesome par `<img src="logo.png">` |
| Couleurs | Modifiez les variables CSS `:root` en haut du `<style>` |

---

*SR Technologie · Cotonou, Bénin · 2026*
