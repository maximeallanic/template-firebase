# 🔒 Résumé des Règles de Sécurité Firestore

**Dernière mise à jour:** 2025-10-15 14:17 UTC
**Statut:** ✅ Déployé en production
**Niveau de sécurité:** 🟢 MAXIMUM

---

## 🎯 Principe de Sécurité Fondamental

**ZÉRO CONFIANCE (Zero Trust):** Les utilisateurs **NE PEUVENT RIEN ÉCRIRE** directement dans Firestore. Toutes les écritures passent par les Cloud Functions qui utilisent Firebase Admin SDK (bypass automatique des règles).

---

## 📋 Règles par Collection

### 1️⃣ Collection `users/{userId}`

#### **Lecture (Read):**
```javascript
allow read: if request.auth != null && request.auth.uid == userId;
```
- ✅ Utilisateurs peuvent lire **uniquement leurs propres données**
- ❌ Impossible de lire les données d'autres utilisateurs
- ❌ Impossible de lire sans authentification

#### **Écriture (Write):**
```javascript
allow write: if false;
```
- ❌ **AUCUNE écriture autorisée pour les clients**
- ✅ Seulement les Cloud Functions (Admin SDK) peuvent écrire

#### **Champs Protégés:**
Les utilisateurs **NE PEUVENT PAS modifier:**
- `email` - Email de l'utilisateur
- `subscriptionStatus` - Statut de l'abonnement (`'free'` ou `'active'`)
- `analysesUsedThisMonth` - Compteur d'utilisation mensuel
- `analysesLimit` - Limite mensuelle (5 pour free, 250 pour pro)
- `currentPeriodStart` - Début de la période de facturation
- `currentPeriodEnd` - Fin de la période de facturation
- `stripeCustomerId` - ID client Stripe
- `subscriptionId` - ID abonnement Stripe

---

### 2️⃣ Sous-collection `users/{userId}/analyses/{analysisId}`

#### **Lecture (Read):**
```javascript
allow read: if request.auth != null && request.auth.uid == userId;
```
- ✅ Utilisateurs peuvent lire **uniquement leur propre historique**

#### **Écriture (Write):**
```javascript
allow write: if false;
```
- ❌ **Impossible de créer/modifier/supprimer des analyses**
- ✅ Seulement les Cloud Functions peuvent enregistrer les analyses

**Justification:** Empêche les utilisateurs de fabriquer un faux historique d'analyses.

---

### 3️⃣ Collection `guestUsage/{fingerprint}`

#### **Lecture (Read):**
```javascript
allow read: if false;
```
- ❌ **Aucune lecture autorisée** (protection de la vie privée)
- ⚠️ Contient des hash d'IP et User-Agent

#### **Écriture (Write):**
```javascript
allow write: if false;
```
- ❌ **Aucune écriture autorisée pour les clients**
- ✅ Seulement les Cloud Functions peuvent enregistrer l'usage invité

**Justification:** Anti-abuse du free trial (1 analyse gratuite par visiteur unique).

---

### 4️⃣ Collection `emailSessions/{sessionId}`

#### **Lecture (Read) - Utilisateurs Authentifiés:**
```javascript
allow read: if request.auth != null && resource.data.userId == request.auth.uid;
```
- ✅ Utilisateurs peuvent lire **uniquement leurs propres sessions**

#### **Lecture (Read) - Invités:**
```javascript
allow read: if request.auth == null &&
               resource != null &&
               resource.data.fingerprint != null &&
               resource.id == sessionId;
```
- ✅ Invités peuvent lire **uniquement la session spécifique** pour laquelle ils connaissent le `sessionId`
- ❌ **Impossible de lister toutes les sessions** (énumération bloquée)
- 🔑 Le `sessionId` agit comme un **capability token**

#### **Écriture (Write):**
```javascript
allow write: if false;
```
- ❌ **Aucune écriture autorisée pour les clients**
- ✅ Seulement les Cloud Functions peuvent créer/mettre à jour les sessions

**Justification:** Empêche les invités de lire les emails analysés par d'autres utilisateurs.

---

### 5️⃣ Règle par Défaut (Catch-all)

```javascript
match /{document=**} {
  allow read, write: if false;
}
```
- ❌ **Tout accès non défini est BLOQUÉ**
- ⚠️ Principe de "deny by default" (sécurité par défaut)

---

## 🛡️ Comment les Cloud Functions Écrivent dans Firestore

### Firebase Admin SDK Bypass

Les Cloud Functions utilisent `firebase-admin` qui **bypass automatiquement** les règles de sécurité :

```typescript
// functions/src/config/firebase.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp(); // Admin SDK = accès total, bypass des règles
export const db = getFirestore();

// Dans les Cloud Functions
await db.collection('users').doc(userId).update({
  analysesUsedThisMonth: FieldValue.increment(1),
  // ✅ Fonctionne car Admin SDK bypass les règles
});
```

**Pourquoi c'est sécurisé ?**
- Les Cloud Functions s'exécutent **côté serveur** (pas dans le navigateur)
- Impossible pour un attaquant de contourner cette architecture
- Les fonctions valident l'authentification et les quotas **avant** d'écrire

---

## 🔐 Flux de Sécurité Complet

### Exemple: Analyse d'Email par un Utilisateur Authentifié

```
1. Client → appelle analyzeEmail() Cloud Function
   ├─ Firebase App Check valide le token (anti-bot)
   └─ Si valide, continue

2. Cloud Function → vérifie l'authentification
   ├─ if (!auth) → HttpsError('unauthenticated')
   └─ Si authentifié, continue

3. Cloud Function → vérifie le quota
   ├─ Lit users/{userId} (Admin SDK bypass règles)
   ├─ if (used >= limit) → HttpsError('resource-exhausted')
   └─ Si quota OK, continue

4. Cloud Function → appelle Vertex AI (Gemini)
   └─ Génère l'analyse

5. Cloud Function → écrit dans Firestore (Admin SDK)
   ├─ Incrémente analysesUsedThisMonth (atomique)
   ├─ Enregistre dans users/{userId}/analyses/
   └─ Retourne l'analyse au client

6. Client → reçoit l'analyse
   └─ Affiche dans l'interface
```

**Aucune étape ne permet au client d'écrire directement dans Firestore.**

---

## ⚠️ Ce que les Attaquants NE PEUVENT PAS Faire

### ❌ Bypass d'Authentification
```javascript
// Depuis la console DevTools du navigateur
await updateDoc(doc(db, 'users', 'VICTIM_ID'), {
  subscriptionStatus: 'active'
});
// ❌ ÉCHOUE: permission-denied
```

### ❌ Réinitialisation du Quota
```javascript
await updateDoc(doc(db, 'users', myUserId), {
  analysesUsedThisMonth: 0
});
// ❌ ÉCHOUE: permission-denied
```

### ❌ Augmentation de la Limite
```javascript
await updateDoc(doc(db, 'users', myUserId), {
  analysesLimit: 999999
});
// ❌ ÉCHOUE: permission-denied
```

### ❌ Lecture des Données d'Autres Utilisateurs
```javascript
const doc = await getDoc(doc(db, 'users', 'OTHER_USER_ID'));
// ❌ ÉCHOUE: permission-denied
```

### ❌ Énumération des Sessions Email
```javascript
const sessions = await getDocs(collection(db, 'emailSessions'));
// ❌ ÉCHOUE: permission-denied (ou retourne vide)
```

### ❌ Fabrication d'Historique d'Analyses
```javascript
await addDoc(collection(db, 'users', myUserId, 'analyses'), {
  emailContent: 'Fake analysis',
  analysis: { /* fake data */ }
});
// ❌ ÉCHOUE: permission-denied
```

---

## ✅ Ce que les Utilisateurs PEUVENT Faire

### ✅ Lire Leurs Propres Données
```javascript
const userDoc = await getDoc(doc(db, 'users', myUserId));
// ✅ SUCCÈS: peut lire ses propres informations
```

### ✅ Lire Leur Historique d'Analyses
```javascript
const analyses = await getDocs(collection(db, 'users', myUserId, 'analyses'));
// ✅ SUCCÈS: peut lire son propre historique
```

### ✅ Lire Leur Session Email (si sessionId connu)
```javascript
const session = await getDoc(doc(db, 'emailSessions', mySessionId));
// ✅ SUCCÈS: peut lire sa propre session
```

---

## 🧪 Comment Tester les Règles

### Test Manuel depuis la Console Firebase

1. Ouvrir [Firebase Console > Firestore > Rules Playground](https://console.firebase.google.com/project/{{PROJECT_ID}}/firestore/rules)
2. Simuler un utilisateur authentifié : `auth.uid = "test-user-123"`
3. Tenter d'écrire dans `users/test-user-123`
4. **Résultat attendu:** `permission-denied`

### Test depuis le Code Frontend

```typescript
// Dans votre application React
try {
  await updateDoc(doc(db, 'users', user.uid), {
    analysesLimit: 999999
  });
  console.log('❌ VULNÉRABILITÉ: Écriture réussie!');
} catch (error) {
  if (error.code === 'permission-denied') {
    console.log('✅ SÉCURISÉ: Écriture bloquée');
  }
}
```

---

## 📊 Comparaison Avant/Après

| Scénario | Avant | Après |
|----------|-------|-------|
| **Écriture directe users/** | ✅ Autorisée | ❌ Bloquée |
| **Modifier subscriptionStatus** | ✅ Possible | ❌ Impossible |
| **Modifier analysesLimit** | ✅ Possible | ❌ Impossible |
| **Réinitialiser quota** | ✅ Possible | ❌ Impossible |
| **Lire autres utilisateurs** | ❌ Bloquée | ❌ Bloquée |
| **Énumérer sessions email** | ✅ Possible | ❌ Bloquée |
| **Fabriquer analyses** | ✅ Possible | ❌ Bloquée |
| **Cloud Functions write** | ✅ Fonctionne | ✅ Fonctionne |

---

## 🎯 Résumé en 3 Points

1. **Les utilisateurs ne peuvent RIEN écrire** directement dans Firestore
2. **Toutes les écritures passent par Cloud Functions** avec validations
3. **Les lectures sont strictement isolées par utilisateur**

---

## 📞 Contact & Maintenance

**Fichier de règles:** `firestore.rules`
**Documentation complète:** `docs/security/firestore-security-audit-2025-10-15.md`
**Déploiement:** `firebase deploy --only firestore:rules`

**⚠️ IMPORTANT:** Ne jamais ajouter `allow write: if request.auth != null` ou `allow write: if request.auth == null` dans les règles. Toutes les écritures doivent passer par Cloud Functions.

---

**Statut:** 🟢 **PRODUCTION - SÉCURISÉ**
