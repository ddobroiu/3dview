# 3D Generator - Platformă AI pentru Generarea de Modele 3D

Această platformă permite utilizatorilor să genereze modele 3D din imagini folosind inteligența artificială, cu un sistem complet de credite și plăți.

## 🚀 Funcționalități

### ✨ Generare 3D cu AI
- **Generare automată**: Transformă imagini 2D în modele 3D folosind AI
- **Calitate variabilă**: Standard (1 credit), High (2 credite), Ultra (5 credite)
- **Preview video**: Vedere panoramică a modelului generat
- **Download model**: Fișiere GLB/GLTF pentru utilizare în aplicații 3D
- **Procesare în timp real**: Monitorizare status și timp de procesare

### 💳 Sistem de credite
- **Credite gratuite**: 10 credite la înregistrare + refill zilnic
- **Planuri de subscripție**: FREE, BASIC, PRO, PREMIUM
- **Pachet de credite**: Cumpărare individuală de credite
- **Istoric complet**: Tracking pentru toate tranzacțiile
- **Credite bonus**: Bonus la cumpărare + refill zilnic

### 💰 Sistem de plăți
- **Stripe integration**: Plăți securizate cu carduri
- **Webhook processing**: Procesare automată a plăților
- **Suport multiple monede**: RON, EUR
- **Istoric cumpărături**: Track complet al achizițiilor
- **Refund automat**: În caz de eșec AI

## 🛠️ Stack Tehnologic

### Frontend
- **Next.js 15** - Framework React cu SSR/SSG
- **TypeScript** - Type safety și developer experience
- **TailwindCSS 4** - Styling utility-first
- **React Icons** - Set complet de icoane
- **Three.js** - Rendering 3D în browser

### Backend
- **Next.js API Routes** - Serverless functions
- **Prisma** - ORM pentru baza de date
- **PostgreSQL** - Baza de date relațională
- **JWT** - Autentificare stateless
- **Bcrypt** - Hash-uire parole

### Servicii externe
- **Replicate** - AI pentru generarea 3D
- **Stripe** - Procesare plăți
- **Resend** - Serviciu email

## 📦 Instalare și Configurare

### 1. Clonarea proiectului
```bash
git clone https://github.com/ddobroiu/3dview.git
cd 3dview
```

### 2. Instalarea dependențelor
```bash
pnpm install
```

### 3. Configurarea variabilelor de mediu
```bash
# Copiază fișierul exemplu
cp .env.example .env

# Editează .env cu valorile tale:
# - DATABASE_URL pentru PostgreSQL
# - JWT_SECRET pentru autentificare
# - REPLICATE_API_TOKEN pentru AI
# - STRIPE_SECRET_KEY pentru plăți
```

### 4. Setup baza de date
```bash
# Generează clientul Prisma
npx prisma generate

# Rulează migrațiile (după configurarea DATABASE_URL)
npx prisma migrate dev
```

### 5. Rularea în dezvoltare
```bash
pnpm dev
```

Aplicația va fi disponibilă pe `http://localhost:3000`

## 🏗️ Structura proiectului

```
3dview/
├── components/           # Componente React
│   ├── Header.tsx       # Header cu navigație
│   ├── Footer.tsx       # Footer
│   ├── AuthForm.tsx     # Formular login/register
│   ├── ModelViewer.tsx  # Viewer 3D pentru GLB
│   └── ImageUploader.tsx # Upload drag & drop
├── pages/               # Pages și API routes
│   ├── api/            # Backend API
│   │   ├── auth/       # Autentificare
│   │   ├── payments/   # Stripe plăți
│   │   ├── user/       # Date utilizator
│   │   └── generate-3d-image.ts # Generare AI
│   ├── index.tsx       # Homepage
│   ├── dashboard.tsx   # Dashboard utilizator
│   └── login.tsx       # Pagina login
├── lib/                # Utilități și logică business
│   ├── db.ts          # Configurare Prisma
│   ├── auth.ts        # Logică autentificare
│   ├── credits.ts     # Sistem credite
│   └── mail.ts        # Serviciu email
├── prisma/            # Schema și migrații
│   └── schema.prisma  # Definire tabele
└── public/            # Assets statice
```

## 📝 Funcționalități implementate

✅ **Sistem complet de credite**
- Gestionare credite utilizatori
- Refill zilnic automat
- Costuri diferențiate pe calitate

✅ **Generare 3D cu AI**
- Integrare Replicate API
- 3 niveluri de calitate
- Procesare asincronă

✅ **Plăți Stripe**
- Checkout securizat
- Webhook processing
- Istoric tranzacții

✅ **Dashboard utilizator**
- Upload imagini drag & drop
- Istoric generări
- Management credite

✅ **Autentificare JWT**
- Login/Register
- Verificare email
- Reset parolă

✅ **Design responsive**
- TailwindCSS 4
- Dark/Light mode
- Mobile-friendly

## 🔧 Configurare servicii

### PostgreSQL
Creează o bază de date PostgreSQL și adaugă URL-ul în `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/3dview"
```

### Replicate AI
1. Creează cont pe [Replicate.com](https://replicate.com)
2. Obține API token
3. Adaugă în `.env`: `REPLICATE_API_TOKEN="your-token"`

### Stripe
1. Creează cont pe [Stripe.com](https://stripe.com)
2. Obține cheile test
3. Configurează webhook pentru `/api/payments/webhook`
4. Adaugă cheile în `.env`

## 🚀 Deploy în producție

### Vercel (recomandat)
```bash
npm install -g vercel
vercel --prod
```

## 🆘 Suport

Pentru întrebări sau probleme:
- **GitHub Issues**: Pentru bug-uri și feature requests
- **Email**: Contact prin GitHub

---

**Dezvoltat pentru comunitatea 3D** 🎯
