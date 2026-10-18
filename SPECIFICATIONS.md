# Spécifications — Orchard Snake

Dernière vérification documentaire : 18 octobre 2026.

## 1. Objectif

Montrer comment un comportement local et réactif peut produire un jeu lisible sans trajectoire codée à la main. Le joueur fournit une cible mouvante. Chaque agent calcule sa force depuis son propre état et son voisinage.

## 2. Règles fonctionnelles

- Une partie dure 60 secondes.
- La tête est guidée par souris ou toucher.
- Un fruit proche influence davantage la tête que le pointeur.
- Les fruits proches sont attirés vers la tête la plus proche.
- Une collision tête-fruit ajoute les points du fruit et le retire.
- Le jeu maintient neuf fruits actifs.
- Le score maximal persiste localement.
- Vitesse, longueur et largeur sont réglables.
- `Espace` ajoute jusqu’à huit serpents pendant une partie.
- `B` et `S` modifient la vitesse entre 1 et 12.
- Pause, reset et musique restent disponibles depuis l’interface.

## 3. États du jeu

```text
ready --START--> playing --HOLD--> paused
  ^                 |                 |
  |                 +----60 s--------+ reprise
  |                          |
  +--------PLAY AGAIN------- over
```

`ready` attend aussi la formation des textes. `playing` est seul état qui met à jour serpents, fruits, temps et score. `paused` et `over` conservent le rendu sans locomotion.

## 4. Modèle de mouvement

Pour toute entité :

```text
accélération += force
vitesse += accélération
vitesse limitée à maxSpeed
position += vitesse
accélération remise à zéro
```

Les comportements ne modifient jamais directement `position`. Ils retournent une force limitée, appliquée avec `applyForce` avant l’appel unique à `update`.

## 5. Algorithmes de pilotage

### 5.1 Tête

Entrées : position de la tête, pointeur, liste des fruits non mangés.

1. Filtrer les fruits situés à moins de 115 px.
2. Trier par distance.
3. Calculer `arrive(pointer)`.
4. Si fruit proche : calculer `0,3 × forcePointeur + 0,7 × arrive(fruitProche)`.
5. Limiter résultat à `head.maxForce`.

Complexité : filtrage + tri, soit `O(F log F)` pour `F` fruits. Avec neuf fruits, coût négligeable.

### 5.2 Anneaux

Chaque anneau suit la position réelle de son prédécesseur :

```text
force = ring.arrive(leader.pos, ringSpacing)
```

`ringSpacing = bodyWidth × 0,64`.

Paramètres stabilisateurs :

- `ring.maxSpeed = head.maxSpeed + 6` ;
- `ring.maxForce = 2` ;
- zone de freinage = 100 px.

L’anneau peut donc rattraper son leader, commencer à freiner suffisamment tôt et converger autour de l’espacement souhaité.

### 5.3 Fruits

Si distance tête-fruit ≤ 130 px, le fruit applique `arrive(head.pos)`. Sinon, il applique l’opposé de sa vitesse comme force de freinage, limité à `maxForce = 0,25`.

La tête utilisée est celle du serpent le plus proche. Pour `S` serpents, recherche `O(S)` par fruit.

### 5.4 Texte

Une table associe chaque caractère à sept lignes de cinq bits. Seuls les bits `1` produisent un `TextPixel`. Ainsi, le nombre de véhicules est exactement le nombre de pixels utiles du texte.

Chaque pixel possède :

- position cible du glyphe ;
- position de dispersion ;
- `maxSpeed = 11` ;
- `maxForce = 0,65` ;
- zone de freinage = 75 px.

Une répulsion locale remplace temporairement Arrival lorsque la souris est à moins de 72 px.

## 6. Paramètres

| Paramètre | Minimum | Défaut | Maximum | Effet |
|---|---:|---:|---:|---|
| Vitesse tête | 1 | 5 | 12 | Vitesse maximale du serpent |
| Longueur | 4 | 12 | 80 | Nombre d’anneaux |
| Largeur | 12 | 24 | 36 | Taille visuelle et espacement |
| Nombre serpents | 1 | 1 | 8 | Agents jouables simultanés |
| Fruits actifs | 9 | 9 | 9 | Objets à collecter |
| Durée | 60 s | 60 s | 60 s | Temps de manche |

## 7. Entités et héritage

```text
Vehicle
├── Snake
├── SnakeHead
├── AnneauSnake
├── Food
└── TextPixel
```

`Snake` sert de contrôleur/composite. Sa propre locomotion héritée n’est pas dupliquée ; tête et anneaux restent les agents effectivement mis à jour et dessinés.

## 8. Persistance

Seul meilleur score persiste. Lecture et écriture sont protégées par `try/catch` pour survivre à un stockage refusé ou indisponible. Une valeur négative, non numérique ou infinie est remplacée par zéro.

## 9. Audio

`GameMusic` crée une composition procédurale : mélodie, basse et ponctuation aiguë. Aucun fichier musical distant n’est requis. `WebAudiox.LineOut` fournit volume et mute.

Le contexte audio démarre ou reprend après clic, conformément aux règles navigateur. Le timer musical n’est créé qu’une fois.

## 10. Accessibilité et adaptation

- Contrôles HTML natifs avec `aria-label`.
- Région `role=status` pour état, score et temps.
- Interface adaptée sous 700 px.
- Pointeur tactile pris en charge.
- Boutons superposés au canvas mais actionnés par éléments HTML réels.

## 11. Stratégie de test

La suite Node charge scripts dans un contexte VM avec doubles de p5.Vector, DOM, stockage et audio. Elle teste unités de calcul, effets observables et boucle complète.

Critères principaux :

- direction correcte des forces ;
- force ≤ `maxForce` ;
- aucun déplacement direct dans un comportement ;
- convergence stable des anneaux ;
- cas proche/éloigné des fruits ;
- reproductibilité par RNG injecté pour l’apparition ;
- fonctionnement lorsque stockage ou audio échouent.

## 12. Déploiement GitHub Pages

Projet entièrement statique : aucun build requis. Le contenu reste dans son dossier local et devient la racine du repo `orchard-snake`. Tous les chemins sont relatifs et compatibles avec le sous-chemin GitHub Pages.

Les bibliothèques p5.js et WebAudiox sont fournies localement. Le site ne dépend donc pas d’un gestionnaire de paquets au chargement.

## 13. Invariants

- `vehicle.js` inchangé.
- Toute entité visible étend `Vehicle`.
- Une force est calculée avant locomotion.
- Une seule mise à jour par agent et par frame.
- Aucun chemin préprogrammé.
- Aléatoire injecté dans les tests qui en dépendent.
