import * as THREE from "three";
import { MapControls } from "three/addons/controls/OrbitControls.js";

const DUREE_PARTIE = 60; // secondes
const BONUS_TEMPS = 10; // secondes gagnées par forme trouvée
const POINTS_PAR_FORME = 10;
const NB_DECORS = 2000;

// Utilitaires
function aleatoire(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function positionAleatoire(objet, etendue) {
  objet.position.set(
    aleatoire(-etendue, etendue),
    aleatoire(-etendue, etendue),
    aleatoire(-etendue, etendue)
  );
  objet.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
}

// Scène
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);
scene.fog = new THREE.Fog(0x0b1020, 120, 380);

scene.add(new THREE.HemisphereLight(0xdbeafe, 0x1e1b4b, 0.9));
const soleil = new THREE.DirectionalLight(0xffffff, 0.9);
soleil.position.set(60, 120, 80);
scene.add(soleil);

// Décor : 2000 objets répartis en trois familles qui partagent leur géométrie et leur matériau
const familles = [
  {
    geometrie: new THREE.BoxGeometry(5, 5, 6),
    materiau: new THREE.MeshStandardMaterial({ color: 0x2b9348, roughness: 0.6 }),
    etendue: 90,
  },
  {
    geometrie: new THREE.IcosahedronGeometry(2, 1),
    materiau: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4, flatShading: true }),
    etendue: 70,
  },
  {
    geometrie: new THREE.TorusKnotGeometry(2, 0.3, 64, 8),
    materiau: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.2 }),
    etendue: 70,
  },
];

for (let i = 0; i < NB_DECORS; i++) {
  const famille = familles[aleatoire(0, familles.length)];
  const objet = new THREE.Mesh(famille.geometrie, famille.materiau);
  positionAleatoire(objet, famille.etendue);
  scene.add(objet);
}

// Les quatre formes à trouver
const formes = [
  { nom: "Capsule", couleur: 0xf97316, geometrie: new THREE.CapsuleGeometry(3, 3, 10, 16) },
  { nom: "Cône", couleur: 0xec4899, geometrie: new THREE.ConeGeometry(3, 10, 32) },
  { nom: "Cylindre", couleur: 0xffd6e0, geometrie: new THREE.CylinderGeometry(3, 3, 4, 32) },
  { nom: "Octaèdre", couleur: 0xa855f7, geometrie: new THREE.OctahedronGeometry(3) },
];

const listeObjectifs = document.getElementById("objectifs");

for (const forme of formes) {
  const materiau = new THREE.MeshStandardMaterial({
    color: forme.couleur,
    emissive: forme.couleur,
    emissiveIntensity: 0.25,
    roughness: 0.35,
  });
  forme.mesh = new THREE.Mesh(forme.geometrie, materiau);
  forme.mesh.userData.forme = forme;
  positionAleatoire(forme.mesh, 70);
  scene.add(forme.mesh);

  forme.element = document.createElement("li");
  forme.element.innerHTML = `<span class="pastille"></span>${forme.nom}`;
  forme.element.querySelector(".pastille").style.background = `#${forme.couleur.toString(16).padStart(6, "0")}`;
  listeObjectifs.appendChild(forme.element);
}

// Caméra, rendu et contrôles
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 100, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.prepend(renderer.domElement);

const controls = new MapControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 300;
controls.enabled = false;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// État de la partie
const affichageTemps = document.getElementById("timer");
const affichageScore = document.getElementById("score");
let temps = DUREE_PARTIE;
let score = 0;
let enCours = false;
let minuteur = null;

function afficherTemps() {
  affichageTemps.textContent = `${temps} s`;
  affichageTemps.classList.toggle("urgent", temps <= 10);
}

function afficherScore() {
  affichageScore.textContent = `${score} / ${formes.length * POINTS_PAR_FORME}`;
}

function commencer() {
  document.getElementById("accueil").classList.add("cache");
  enCours = true;
  controls.enabled = true;

  minuteur = setInterval(() => {
    temps--;
    afficherTemps();
    if (temps <= 0) terminer(false);
  }, 1000);
}

function terminer(victoire) {
  enCours = false;
  controls.enabled = false;
  clearInterval(minuteur);

  document.getElementById("fin-titre").textContent = victoire ? "Bravo !" : "Temps écoulé";
  document.getElementById("fin-texte").textContent = victoire
    ? `Tu as trouvé les ${formes.length} formes avec ${temps} s d'avance.`
    : `Score final : ${score} / ${formes.length * POINTS_PAR_FORME}.`;
  document.getElementById("fin").classList.remove("cache");
}

function trouver(forme) {
  forme.trouvee = true;
  scene.remove(forme.mesh);
  forme.element.classList.add("trouve");

  score += POINTS_PAR_FORME;
  temps += BONUS_TEMPS;
  afficherScore();
  afficherTemps();

  if (formes.every((f) => f.trouvee)) terminer(true);
}

// Clic sur une forme (on ignore les clics qui servent à déplacer la caméra)
const raycaster = new THREE.Raycaster();
const pointeur = new THREE.Vector2();
let departClic = null;

renderer.domElement.addEventListener("pointerdown", (event) => {
  departClic = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (!enCours || !departClic) return;
  const deplacement = Math.hypot(event.clientX - departClic.x, event.clientY - departClic.y);
  if (deplacement > 5) return;

  pointeur.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(pointeur, camera);
  const [premier] = raycaster.intersectObjects(scene.children, false);
  const forme = premier?.object.userData.forme;
  if (forme && !forme.trouvee) trouver(forme);
});

document.getElementById("commencer").addEventListener("click", commencer);
document.getElementById("rejouer").addEventListener("click", () => window.location.reload());

// Boucle d'animation : les formes à trouver tournent sur elles-mêmes
function animer() {
  requestAnimationFrame(animer);
  for (const forme of formes) {
    if (!forme.trouvee) forme.mesh.rotation.y += 0.01;
  }
  controls.update();
  renderer.render(scene, camera);
}

afficherTemps();
afficherScore();
animer();
