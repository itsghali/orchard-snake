# Problèmes rencontrés et solutions — Orchard Snake

Ce retour d’expérience est reconstruit depuis les échanges de développement, les tests et le code final. Il distingue symptôme, cause, correction et preuve.

## 1. Oscillation des anneaux

### Symptôme

Le corps ondulait fortement. Les anneaux dépassaient leur cible, repartaient en sens inverse et transmettaient l’erreur jusqu’à la queue. Le phénomène augmentait à grande vitesse.

### Causes

Première version : cible virtuelle calculée derrière le prédécesseur depuis sa vitesse. En virage ou à l’arrêt, cette cible changeait brutalement. L’anneau poursuivait donc un point instable.

Autres causes :

- même `maxSpeed` pour tête et anneaux, donc aucune réserve pour rattraper ;
- `maxForce = 0,75`, trop faible ;
- freinage à 30 px seulement, alors qu’à vitesse 12 la distance théorique `v²/(2a)` atteignait environ 96 px ;
- direction arbitraire lorsque vitesse du leader approchait zéro.

### Solution

- Suivre position réelle du prédécesseur.
- Utiliser second paramètre de `arrive` comme distance d’équilibre.
- Donner aux anneaux `maxSpeed = vitesseTête + 6`.
- Passer `maxForce` à 2.
- Commencer freinage à 100 px.

### Preuve

Test dynamique : anneau lancé à vitesse maximale, au plus une traversée de distance d’équilibre, puis stabilisation sans oscillations répétées.

## 2. Corps qui se désolidarise en virage

### Symptôme

La tête changeait rapidement de direction, mais certains anneaux restaient loin derrière.

### Cause

Un poursuivant limité à même vitesse que sa cible ne peut réduire son retard lorsque la cible roule déjà au maximum.

### Solution

Réserve de six unités de vitesse pour chaque anneau. Cette différence n’accélère pas arbitrairement la tête ; elle sert uniquement à corriger erreur de suivi.

## 3. Texte trop lent puis dispersion globale

### Symptôme

Formation initiale prenait trop longtemps. Le passage de souris perturbait tout le texte au lieu de la zone survolée.

### Cause

Paramètres de vitesse/force trop faibles et interaction non bornée spatialement.

### Solution

- `TextPixel.maxSpeed = 11` et `maxForce = 0,65`.
- Formation validée par distance réelle de chaque pixel à sa cible.
- Répulsion limitée à rayon 72 px.
- Après sortie du rayon, Arrival reprend automatiquement.

### Preuve

Tests : formation rapide, dispersion limitée aux pixels proches, retour vers cible après disparition du pointeur.

## 4. Mauvais ordre entre animation et début de partie

### Symptôme

Jeu pouvait commencer avant formation complète du texte, ou Start restait incohérent avec état visuel.

### Cause

Animation et état du jeu ne partageaient pas condition de fin explicite.

### Solution

`PixelText.isFormed()` vérifie chaque pixel actif avec tolérance de 8 px. Start reste désactivé tant que tous les textes actifs ne sont pas formés et délai minimum de 500 ms non écoulé.

## 5. Musique inaudible ou refusée

### Symptôme

Bouton musique semblait sans effet sur certains navigateurs.

### Causes

- `AudioContext` suspendu par politique autoplay ;
- notes lancées avant fin de `resume()` ;
- volume initial trop faible ;
- risque de timers multiples après plusieurs activations.

### Solution

- Démarrer audio après interaction.
- Attendre résolution de `AudioContext.resume()`.
- Programmer notes ensuite seulement.
- Utiliser `WebAudiox.LineOut`, volume 0,22.
- Réutiliser timer existant et gérer mute séparément.

### Preuve

Test asynchrone avec contexte suspendu : reprise, émission des notes et bascule mute.

## 6. Serpent trop abstrait

### Symptôme

Première apparence ne ressemblait pas assez à un serpent.

### Solution

Rendu composé : corps continu, anneaux fuselés, ventre, écailles, tête, yeux, pupilles, narines et langue fourchue. Rotation suit vitesse seulement au-dessus de 0,05 pour éviter tremblement visuel à l’arrêt.

## 7. Plusieurs serpents et commandes contradictoires

### Symptôme

Demandes ont évolué : espace accélérait d’abord, puis devait ajouter serpent ; touches additionnelles demandées pour vitesse.

### Solution finale

- `Espace` ajoute serpent ;
- `B` accélère ;
- `S` ralentit ;
- maximum huit serpents ;
- chaque fruit choisit tête la plus proche ;
- score agrège collecte de tous serpents.

Documentation et pied de page du jeu utilisent cette convention unique.

## 8. Fruit compté plusieurs fois

### Risque

Avec plusieurs serpents, deux têtes peuvent toucher même fruit dans même frame.

### Solution

Premier contact place `fruit.eaten = true`. Les passages suivants ignorent fruit. Test appelle collecte deux fois et vérifie seconde valeur zéro.

## 9. Stockage local indisponible ou corrompu

### Risque

Mode privé, quota ou politique navigateur peuvent faire échouer `localStorage`. Valeur peut aussi être invalide.

### Solution

Lecture/écriture protégées par `try/catch`. Valeur non finie ou négative devient zéro. Même si écriture échoue, meilleur score reste valide pour session courante.

## 10. Vérification finale

Commande :

```text
node --test tests/arrival-game.test.mjs
```

Suite actuelle : 11 tests couvrant steering, limites, oscillation, fruits, score, texte, audio, contrôles et boucle p5.

`vehicle.js` est resté inchangé pendant tous ces correctifs.
