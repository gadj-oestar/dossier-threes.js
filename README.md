# Chasse aux formes

Mini-jeu en 3D avec [three.js](https://threejs.org/) : quatre formes (capsule, cône, cylindre, octaèdre) sont cachées parmi 2000 objets. Il faut cliquer dessus avant la fin du chrono. Chaque forme trouvée rapporte 10 points et 10 secondes.

## Commandes

- Clic gauche glissé : se déplacer
- Clic droit glissé : pivoter
- Molette : zoomer
- Clic sur une forme : l'attraper

## Lancer le projet

three.js est chargé depuis un CDN, il n'y a rien à installer. Les modules JavaScript ne marchent pas en ouvrant le fichier directement : il faut un petit serveur local, par exemple :

```
npx http-server .
```

puis ouvrir l'adresse affichée.

## Structure

```
index.html     page, écran d'accueil, écran de fin
css/style.css  styles de l'interface
js/game.js     scène 3D et logique du jeu
```
