import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Politique de Confidentialité</h1>
          <p className="text-indigo-300/70">Dernière mise à jour : 16 décembre 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Introduction</h2>
            <p className="text-indigo-100/80">
              Chez Allanic, nous prenons la protection de vos données personnelles au sérieux. Cette Politique de Confidentialité explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez Spicy vs Sweet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Responsable du Traitement</h2>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-indigo-100/80"><strong className="text-white">Société :</strong> Allanic</p>
              <p className="text-indigo-100/80"><strong className="text-white">Adresse :</strong> 4 rue du marché 63140 Châtel-Guyon</p>
              <p className="text-indigo-100/80"><strong className="text-white">Contact DPO :</strong> contact@spicy-vs-sweet.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Données Collectées</h2>
            <p className="text-indigo-100/80 mb-4">Nous collectons les données suivantes :</p>

            <div className="space-y-4">
              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <h3 className="font-semibold text-white mb-2">Données d'Authentification</h3>
                <ul className="list-disc list-inside text-indigo-100/80 space-y-1">
                  <li>Adresse email (via Google Authentication)</li>
                  <li>Identifiant unique Firebase</li>
                  <li>Photo de profil Google (si disponible)</li>
                </ul>
              </div>

              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <h3 className="font-semibold text-white mb-2">Données de Jeu</h3>
                <ul className="list-disc list-inside text-indigo-100/80 space-y-1">
                  <li>Pseudo choisi pour les parties</li>
                  <li>Avatar sélectionné</li>
                  <li>Équipe (Spicy ou Sweet)</li>
                  <li>Scores et réponses aux questions</li>
                  <li>Historique des questions vues (pour éviter les répétitions)</li>
                </ul>
              </div>

              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <h3 className="font-semibold text-white mb-2">Données Techniques</h3>
                <ul className="list-disc list-inside text-indigo-100/80 space-y-1">
                  <li>Adresse IP (pour la connexion en temps réel)</li>
                  <li>Type de navigateur et appareil</li>
                  <li>Données de connexion/déconnexion</li>
                </ul>
              </div>

              <div className="border border-pink-500/30 rounded-xl p-4 bg-pink-500/10">
                <h3 className="font-semibold text-white mb-2">Données de Paiement (si abonnement)</h3>
                <ul className="list-disc list-inside text-indigo-100/80 space-y-1">
                  <li>Identifiant client Stripe</li>
                  <li>Statut d'abonnement</li>
                  <li className="text-pink-300">Note : Vos données bancaires sont traitées exclusivement par Stripe et ne transitent jamais par nos serveurs</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Finalités du Traitement</h2>
            <p className="text-indigo-100/80 mb-2">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li><strong className="text-indigo-300">Fonctionnement du jeu :</strong> Créer et gérer les parties multijoueurs en temps réel</li>
              <li><strong className="text-indigo-300">Authentification :</strong> Vous identifier et sécuriser votre compte</li>
              <li><strong className="text-indigo-300">Personnalisation :</strong> Éviter de vous montrer les mêmes questions</li>
              <li><strong className="text-indigo-300">Paiements :</strong> Gérer les abonnements premium</li>
              <li><strong className="text-indigo-300">Amélioration :</strong> Analyser l'utilisation pour améliorer le service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Base Légale</h2>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li><strong className="text-indigo-300">Exécution du contrat :</strong> Données nécessaires au fonctionnement du jeu</li>
              <li><strong className="text-indigo-300">Consentement :</strong> Cookies et analytics (production uniquement)</li>
              <li><strong className="text-indigo-300">Intérêt légitime :</strong> Sécurité et prévention de la fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Destinataires des Données</h2>
            <p className="text-indigo-100/80 mb-4">Vos données peuvent être partagées avec :</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-2 px-4 text-white">Service</th>
                    <th className="py-2 px-4 text-white">Usage</th>
                    <th className="py-2 px-4 text-white">Localisation</th>
                  </tr>
                </thead>
                <tbody className="text-indigo-100/80">
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4">Firebase (Google)</td>
                    <td className="py-2 px-4">Auth, Database, Hosting</td>
                    <td className="py-2 px-4">USA (Privacy Shield)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4">Google Gemini</td>
                    <td className="py-2 px-4">Génération IA</td>
                    <td className="py-2 px-4">USA (Privacy Shield)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 px-4">Stripe</td>
                    <td className="py-2 px-4">Paiements</td>
                    <td className="py-2 px-4">USA (Privacy Shield)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Durée de Conservation</h2>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li><strong className="text-indigo-300">Données de compte :</strong> Conservées tant que le compte est actif, puis 3 ans après suppression</li>
              <li><strong className="text-indigo-300">Données de jeu (rooms) :</strong> Supprimées automatiquement après 24h d'inactivité</li>
              <li><strong className="text-indigo-300">Historique des questions :</strong> Conservé pour améliorer l'expérience de jeu</li>
              <li><strong className="text-indigo-300">Données de facturation :</strong> Conservées 10 ans (obligation légale)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">8. Vos Droits (RGPD)</h2>
            <p className="text-indigo-100/80 mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-1">Droit d'accès</h4>
                <p className="text-indigo-100/70 text-sm">Obtenir une copie de vos données</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-1">Droit de rectification</h4>
                <p className="text-indigo-100/70 text-sm">Corriger vos données inexactes</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-1">Droit à l'effacement</h4>
                <p className="text-indigo-100/70 text-sm">Supprimer vos données ("droit à l'oubli")</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-1">Droit à la portabilité</h4>
                <p className="text-indigo-100/70 text-sm">Recevoir vos données dans un format standard</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-1">Droit d'opposition</h4>
                <p className="text-indigo-100/70 text-sm">Vous opposer à certains traitements</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-1">Droit de limitation</h4>
                <p className="text-indigo-100/70 text-sm">Limiter l'utilisation de vos données</p>
              </div>
            </div>

            <p className="text-indigo-100/80 mt-4">
              Pour exercer vos droits, contactez-nous à : <span className="text-pink-400">contact@spicy-vs-sweet.com</span>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">9. Cookies</h2>
            <p className="text-indigo-100/80 mb-2">Nous utilisons des cookies pour :</p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li><strong className="text-indigo-300">Cookies essentiels :</strong> Authentification et session de jeu</li>
              <li><strong className="text-indigo-300">Cookies analytiques :</strong> Firebase Analytics (production uniquement, avec consentement)</li>
            </ul>
            <p className="text-indigo-100/80 mt-3">
              Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">10. Sécurité</h2>
            <p className="text-indigo-100/80 mb-2">
              Nous mettons en œuvre des mesures de sécurité appropriées :
            </p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Authentification sécurisée via Firebase Auth</li>
              <li>Règles de sécurité Firebase pour protéger les données</li>
              <li>Accès limité aux données selon le principe du moindre privilège</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">11. Mineurs</h2>
            <p className="text-indigo-100/80">
              Spicy vs Sweet n'est pas destiné aux enfants de moins de 13 ans. Nous ne collectons pas sciemment de données concernant des mineurs de moins de 13 ans. Si vous êtes parent et découvrez que votre enfant nous a fourni des données, contactez-nous pour les supprimer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">12. Réclamations</h2>
            <p className="text-indigo-100/80">
              Si vous estimez que le traitement de vos données n'est pas conforme au RGPD, vous pouvez déposer une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : {' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">
                www.cnil.fr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">13. Modifications</h2>
            <p className="text-indigo-100/80">
              Cette politique peut être mise à jour. Les modifications seront publiées sur cette page avec une nouvelle date de mise à jour. Nous vous encourageons à consulter régulièrement cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">14. Contact</h2>
            <p className="text-indigo-100/80 mb-2">
              Pour toute question concernant cette politique :
            </p>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-white font-semibold">Allanic - Protection des données</p>
              <p className="text-indigo-100/80">4 rue du marché 63140 Châtel-Guyon</p>
              <p className="text-indigo-100/80">contact@spicy-vs-sweet.com</p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-indigo-300/50">
          <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 underline transition-colors">
            Conditions Générales d'Utilisation
          </Link>
          {' • '}
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 underline transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
