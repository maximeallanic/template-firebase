import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-indigo-300/70">Dernière mise à jour : 16 décembre 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Informations Générales</h2>
            <p className="text-indigo-100/80 mb-2">
              Les présentes Conditions Générales d'Utilisation ("CGU") s'appliquent à l'utilisation du jeu Spicy vs Sweet. En utilisant notre service, vous acceptez ces CGU.
            </p>
            <div className="bg-white/5 p-4 rounded-xl mt-3 border border-white/10">
              <p className="text-indigo-100/80"><strong className="text-white">Éditeur :</strong> Allanic</p>
              <p className="text-indigo-100/80"><strong className="text-white">Adresse :</strong> 4 rue du marché 63140 Châtel-Guyon</p>
              <p className="text-indigo-100/80"><strong className="text-white">Contact :</strong> contact@spicy-vs-sweet.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Description du Service</h2>
            <p className="text-indigo-100/80 mb-3">
              Spicy vs Sweet est un jeu de quiz multijoueur en ligne inspiré des jeux TV de quiz. Les joueurs peuvent :
            </p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li>Créer des parties et inviter des amis via un code de room</li>
              <li>Rejoindre des parties existantes</li>
              <li>S'affronter en équipes (Spicy vs Sweet) à travers 5 épreuves</li>
              <li>Utiliser la génération de questions par IA (fonctionnalité premium)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Accès au Service</h2>
            <div className="space-y-4">
              <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                <h3 className="font-semibold text-lg text-white mb-2">Accès Gratuit</h3>
                <p className="text-indigo-100/80"><strong className="text-indigo-300">Prix :</strong> Gratuit</p>
                <p className="text-indigo-100/80"><strong className="text-indigo-300">Inclus :</strong> Accès complet au jeu multijoueur</p>
                <p className="text-indigo-100/80"><strong className="text-indigo-300">Prérequis :</strong> Connexion via Google Authentication</p>
              </div>

              <div className="border border-pink-500/30 rounded-xl p-4 bg-pink-500/10">
                <h3 className="font-semibold text-lg text-white mb-2">Fonctionnalités Premium (optionnel)</h3>
                <p className="text-indigo-100/80"><strong className="text-indigo-300">Prix :</strong> 5,00 $ USD par mois</p>
                <p className="text-indigo-100/80"><strong className="text-indigo-300">Inclus :</strong> Génération illimitée de questions personnalisées par IA</p>
                <p className="text-indigo-100/80"><strong className="text-indigo-300">Facturation :</strong> Mensuelle, renouvellement automatique via Stripe</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Comptes Utilisateurs</h2>
            <p className="text-indigo-100/80 mb-2">
              Pour jouer, vous devez créer un compte via Google Authentication. Vous êtes responsable de :
            </p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li>Maintenir la sécurité de votre compte</li>
              <li>Toutes les activités effectuées sous votre compte</li>
              <li>Nous signaler immédiatement toute utilisation non autorisée</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Règles de Conduite</h2>
            <p className="text-indigo-100/80 mb-2">En utilisant Spicy vs Sweet, vous vous engagez à NE PAS :</p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li>Utiliser un pseudo offensant, discriminatoire ou illégal</li>
              <li>Tricher ou exploiter des bugs du jeu</li>
              <li>Harceler, insulter ou menacer d'autres joueurs</li>
              <li>Tenter de perturber le service ou les serveurs</li>
              <li>Utiliser des outils automatisés ou bots</li>
              <li>Partager du contenu inapproprié via le système de chat</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Paiements et Abonnements</h2>
            <p className="text-indigo-100/80 mb-2">
              Les abonnements premium sont traités via Stripe :
            </p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li>Facturation mensuelle de 5,00 $ USD</li>
              <li>Renouvellement automatique sauf annulation</li>
              <li>Annulation possible à tout moment via les paramètres du compte</li>
              <li>L'annulation prend effet à la fin de la période en cours</li>
              <li>Pas de remboursement pour les mois partiels</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Droit de Rétractation (UE)</h2>
            <p className="text-indigo-100/80 mb-2">
              <strong className="text-white">Pour les consommateurs de l'UE :</strong> Vous disposez d'un droit de rétractation de 14 jours conformément à la directive 2011/83/UE.
            </p>
            <p className="text-indigo-100/80">
              En utilisant le service immédiatement après l'abonnement, vous reconnaissez perdre votre droit de rétractation dès l'utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">8. Propriété Intellectuelle</h2>
            <p className="text-indigo-100/80 mb-2">
              <strong className="text-white">Notre Propriété :</strong> Tous les droits sur Spicy vs Sweet, incluant le logiciel, le design, les logos et le contenu, appartiennent à Allanic.
            </p>
            <p className="text-indigo-100/80">
              <strong className="text-white">Contenu Généré :</strong> Les questions générées par l'IA sont destinées à un usage personnel dans le cadre du jeu uniquement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">9. Protection des Données</h2>
            <p className="text-indigo-100/80 mb-2">
              Nous traitons les données personnelles conformément au RGPD :
            </p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-2">
              <li>Les données de jeu sont stockées dans Firebase Realtime Database</li>
              <li>Les données utilisateurs sont stockées dans Firebase Firestore (Google Cloud)</li>
              <li>Les paiements sont traités par Stripe (aucune donnée bancaire stockée chez nous)</li>
              <li>La génération IA utilise Google Gemini (données non conservées)</li>
            </ul>
            <p className="text-indigo-100/80 mt-3">
              <strong className="text-white">Vos Droits :</strong> Vous pouvez accéder, rectifier, supprimer ou porter vos données en nous contactant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">10. Disponibilité du Service</h2>
            <p className="text-indigo-100/80">
              Nous nous efforçons de maintenir le service disponible mais ne garantissons pas un fonctionnement ininterrompu. Des maintenances et pannes peuvent survenir. Nous ne sommes pas responsables des interruptions temporaires.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">11. Limitation de Responsabilité</h2>
            <p className="text-indigo-100/80">
              Dans les limites autorisées par la loi, Allanic ne pourra être tenue responsable des dommages indirects, incidents ou consécutifs résultant de l'utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">12. Suspension et Résiliation</h2>
            <p className="text-indigo-100/80 mb-2">
              Nous pouvons suspendre ou résilier votre compte en cas de :
            </p>
            <ul className="list-disc list-inside text-indigo-100/80 ml-4 space-y-1">
              <li>Violation des présentes CGU</li>
              <li>Comportement abusif envers d'autres joueurs</li>
              <li>Tentative de triche ou d'exploitation</li>
              <li>Non-paiement des frais d'abonnement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">13. Résolution des Litiges</h2>
            <p className="text-indigo-100/80 mb-2">
              <strong className="text-white">Droit Applicable :</strong> Les présentes CGU sont soumises au droit français.
            </p>
            <p className="text-indigo-100/80 mb-2">
              <strong className="text-white">Médiation (UE) :</strong> Les consommateurs européens peuvent utiliser la plateforme de règlement des litiges en ligne : {' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">14. Contact</h2>
            <p className="text-indigo-100/80 mb-2">
              Pour toute question concernant ces CGU :
            </p>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-white font-semibold">Allanic</p>
              <p className="text-indigo-100/80">4 rue du marché 63140 Châtel-Guyon</p>
              <p className="text-indigo-100/80">contact@spicy-vs-sweet.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">15. Modifications des CGU</h2>
            <p className="text-indigo-100/80">
              Nous nous réservons le droit de modifier ces CGU. Les modifications significatives seront communiquées aux utilisateurs. L'utilisation continue du service après modifications vaut acceptation des nouvelles CGU.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-indigo-300/50">
          <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline transition-colors">
            Politique de Confidentialité
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

export default TermsAndConditions;
