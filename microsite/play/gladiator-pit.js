window.GladiatorPit = (function() {
	'use strict';

	var scene, camera, renderer, canvas;
	var objects = [];
	var gladiators = [];
	var crowd = [];
	var torches = [];
	var portcullis;
	var fallenColumn;
	var beast;
	var hudCanvas;
	var hudContext;
	var hudVisible = false;
	var lastKeyTime = {};
	var gladiatorsDefeated = 0;
	var beastSlain = false;
	var crowdFavor = 'HOSTILE';
	var elapsedTime = 0;

	var keybindSequence = [];
	var keybindTimeout;

	function init(containerId) {
		var container = document.getElementById(containerId);
		if (!container) {
			console.error('Container not found: ' + containerId);
			return;
		}

		var width = container.clientWidth;
		var height = container.clientHeight;

		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x87ceeb);
		scene.fog = new THREE.Fog(0x87ceeb, 200, 500);

		camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
		camera.position.set(0, 40, 60);
		camera.lookAt(0, 10, 0);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(width, height);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowShadowMap;
		container.appendChild(renderer.domElement);

		canvas = renderer.domElement;

		var light = new THREE.DirectionalLight(0xffffff, 0.8);
		light.position.set(50, 80, 50);
		light.castShadow = true;
		light.shadow.camera.left = -150;
		light.shadow.camera.right = 150;
		light.shadow.camera.top = 150;
		light.shadow.camera.bottom = -150;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		scene.add(light);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		createArena();
		createGladiators();
		createBeast();
		createSpectators();
		createEnvironment();

		setupHUD(container);
		setupKeybindings();

		window.addEventListener('resize', function() {
			var newWidth = container.clientWidth;
			var newHeight = container.clientHeight;
			camera.aspect = newWidth / newHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(newWidth, newHeight);
		});

		animate();
	}

	function createArena() {
		var sandGeometry = new THREE.BoxGeometry(100, 2, 100);
		var sandMaterial = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
		var sandFloor = new THREE.Mesh(sandGeometry, sandMaterial);
		sandFloor.position.y = 0;
		sandFloor.receiveShadow = true;
		scene.add(sandFloor);
		objects.push(sandFloor);

		var wallHeight = 30;
		var wallThickness = 4;
		var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 });

		var walls = [
			{ pos: [0, wallHeight / 2, -52], size: [100, wallHeight, wallThickness] },
			{ pos: [0, wallHeight / 2, 52], size: [100, wallHeight, wallThickness] },
			{ pos: [-52, wallHeight / 2, 0], size: [wallThickness, wallHeight, 100] },
			{ pos: [52, wallHeight / 2, 0], size: [wallThickness, wallHeight, 100] }
		];

		for (var i = 0; i < walls.length; i++) {
			var wallGeo = new THREE.BoxGeometry(walls[i].size[0], walls[i].size[1], walls[i].size[2]);
			var wall = new THREE.Mesh(wallGeo, wallMaterial);
			wall.position.set(walls[i].pos[0], walls[i].pos[1], walls[i].pos[2]);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
			objects.push(wall);
		}

		createSpectatorStands();
		createEntryGate();
		createPortcullis();
		createWeaponRack();
		createShieldDisplay();
		createFountain();
		createFallenColumn();
	}

	function createSpectatorStands() {
		var standMaterial = new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.7 });
		var tiers = 5;
		var tierWidth = 80;
		var tierDepth = 12;

		for (var i = 0; i < tiers; i++) {
			var yPos = 5 + i * 8;
			var xPos = -52 - (i * 6);
			var zPos = 0;

			var tierGeo = new THREE.BoxGeometry(tierWidth - i * 8, 3, tierDepth);
			var tier = new THREE.Mesh(tierGeo, standMaterial);
			tier.position.set(xPos, yPos, zPos);
			tier.castShadow = true;
			tier.receiveShadow = true;
			scene.add(tier);
			objects.push(tier);
		}
	}

	function createEntryGate() {
		var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x708090 });
		var pillarGeo = new THREE.BoxGeometry(8, 35, 8);

		var pillar1 = new THREE.Mesh(pillarGeo, pillarMaterial);
		pillar1.position.set(-20, 17.5, 55);
		pillar1.castShadow = true;
		pillar1.receiveShadow = true;
		scene.add(pillar1);
		objects.push(pillar1);

		var pillar2 = new THREE.Mesh(pillarGeo, pillarMaterial);
		pillar2.position.set(20, 17.5, 55);
		pillar2.castShadow = true;
		pillar2.receiveShadow = true;
		scene.add(pillar2);
		objects.push(pillar2);

		var lintelGeo = new THREE.BoxGeometry(50, 6, 8);
		var lintel = new THREE.Mesh(lintelGeo, pillarMaterial);
		lintel.position.set(0, 36, 55);
		lintel.castShadow = true;
		lintel.receiveShadow = true;
		scene.add(lintel);
		objects.push(lintel);
	}

	function createPortcullis() {
		var points = [];
		var gridSize = 8;
		var gridCount = 6;

		for (var i = 0; i < gridCount; i++) {
			for (var j = 0; j < gridCount; j++) {
				var x = -15 + i * gridSize;
				var y = 5 + j * gridSize;
				points.push(new THREE.Vector3(x, y, 50));
				if (i < gridCount - 1) {
					points.push(new THREE.Vector3(x + gridSize, y, 50));
				}
				if (j < gridCount - 1) {
					points.push(new THREE.Vector3(x, y + gridSize, 50));
					points.push(new THREE.Vector3(x + gridSize, y + gridSize, 50));
				}
			}
		}

		var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x404040, linewidth: 2 });
		portcullis = new THREE.LineSegments(lineGeometry, lineMaterial);
		portcullis.position.z = 50;
		scene.add(portcullis);
		objects.push(portcullis);

		portcullis.userData.baseY = portcullis.position.y;
	}

	function createWeaponRack() {
		var frameColor = 0x8b4513;
		var frameMaterial = new THREE.MeshStandardMaterial({ color: frameColor });

		var frameGeo = new THREE.BoxGeometry(20, 30, 4);
		var frame = new THREE.Mesh(frameGeo, frameMaterial);
		frame.position.set(-60, 15, -50);
		frame.castShadow = true;
		frame.receiveShadow = true;
		scene.add(frame);
		objects.push(frame);

		var spearGeo = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
		var spearMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });

		for (var i = 0; i < 3; i++) {
			var spear = new THREE.Mesh(spearGeo, spearMaterial);
			spear.position.set(-60 + i * 5 - 5, 15, -50);
			spear.rotation.z = Math.PI / 6;
			spear.castShadow = true;
			scene.add(spear);
			objects.push(spear);
		}
	}

	function createShieldDisplay() {
		var shieldMaterial = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.6 });

		for (var i = 0; i < 4; i++) {
			var shieldGeo = new THREE.BoxGeometry(6, 12, 0.5);
			var shield = new THREE.Mesh(shieldGeo, shieldMaterial);
			shield.position.set(55, 5 + i * 8, -50);
			shield.rotation.z = 0.2;
			shield.castShadow = true;
			scene.add(shield);
			objects.push(shield);
		}
	}

	function createFountain() {
		var cylinderGeo = new THREE.CylinderGeometry(8, 8, 2, 16);
		var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var fountain = new THREE.Mesh(cylinderGeo, stoneMaterial);
		fountain.position.set(0, 1, 0);
		fountain.castShadow = true;
		fountain.receiveShadow = true;
		scene.add(fountain);
		objects.push(fountain);
	}

	function createFallenColumn() {
		var columnGeo = new THREE.CylinderGeometry(3, 3, 40, 16);
		var columnMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
		fallenColumn = new THREE.Mesh(columnGeo, columnMaterial);
		fallenColumn.rotation.z = Math.PI / 2;
		fallenColumn.position.set(-30, 5, 20);
		fallenColumn.castShadow = true;
		fallenColumn.receiveShadow = true;
		scene.add(fallenColumn);
		objects.push(fallenColumn);

		fallenColumn.userData.baseRotationZ = fallenColumn.rotation.z;
	}

	function createGladiators() {
		var gladiator1 = createGladiatorMesh(0xcc0000);
		gladiator1.position.set(-15, 5, 0);
		gladiator1.userData = {
			role: 'armed',
			angle: 0,
			speed: 0.02
		};
		scene.add(gladiator1);
		gladiators.push(gladiator1);
		objects.push(gladiator1);

		var gladiator2 = createGladiatorMesh(0x0066cc);
		gladiator2.position.set(15, 5, 0);
		gladiator2.userData = {
			role: 'net',
			angle: Math.PI,
			speed: 0.025
		};
		scene.add(gladiator2);
		gladiators.push(gladiator2);
		objects.push(gladiator2);
	}

	function createGladiatorMesh(color) {
		var group = new THREE.Group();

		var bodyGeo = new THREE.BoxGeometry(3, 8, 2);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
		var body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.y = 3;
		body.castShadow = true;
		group.add(body);

		var headGeo = new THREE.SphereGeometry(1.5, 8, 8);
		var headMat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
		var head = new THREE.Mesh(headGeo, headMat);
		head.position.y = 8;
		head.castShadow = true;
		group.add(head);

		var armorGeo = new THREE.BoxGeometry(3.5, 2, 1.5);
		var armorMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.7 });
		var armor = new THREE.Mesh(armorGeo, armorMat);
		armor.position.y = 5;
		armor.castShadow = true;
		group.add(armor);

		group.castShadow = true;
		group.receiveShadow = true;

		return group;
	}

	function createBeast() {
		beast = new THREE.Group();

		var bodyGeo = new THREE.BoxGeometry(6, 5, 12);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
		var body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.y = 4;
		body.castShadow = true;
		beast.add(body);

		var headGeo = new THREE.BoxGeometry(4, 4, 5);
		var headMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
		var head = new THREE.Mesh(headGeo, headMat);
		head.position.set(0, 7, 7);
		head.castShadow = true;
		beast.add(head);

		var legGeo = new THREE.CylinderGeometry(1, 1, 5, 8);
		for (var i = 0; i < 4; i++) {
			var leg = new THREE.Mesh(legGeo, bodyMat);
			var xOffset = i < 2 ? -2 : 2;
			var zOffset = i % 2 === 0 ? -3 : 3;
			leg.position.set(xOffset, 2.5, zOffset);
			leg.castShadow = true;
			beast.add(leg);
		}

		beast.position.set(0, 0, -25);
		beast.castShadow = true;
		beast.receiveShadow = true;
		scene.add(beast);
		objects.push(beast);

		beast.userData = {
			angle: 0,
			speed: 0.015
		};
	}

	function createSpectators() {
		var rows = 4;
		var cols = 8;

		for (var row = 0; row < rows; row++) {
			for (var col = 0; col < cols; col++) {
				var spec = createSpectatorMesh();
				var angle = (col / cols) * Math.PI * 2;
				var distance = 60 + row * 8;
				var x = Math.cos(angle) * distance;
				var z = Math.sin(angle) * distance;
				var y = 8 + row * 8;

				spec.position.set(x, y, z);
				spec.userData = {
					baseY: y,
					rowIndex: row
				};

				scene.add(spec);
				crowd.push(spec);
				objects.push(spec);
			}
		}
	}

	function createSpectatorMesh() {
		var group = new THREE.Group();

		var bodyGeo = new THREE.BoxGeometry(1, 2, 1);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
		var body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.y = 1;
		body.castShadow = true;
		group.add(body);

		var headGeo = new THREE.SphereGeometry(0.6, 6, 6);
		var head = new THREE.Mesh(headGeo, bodyMat);
		head.position.y = 2.5;
		head.castShadow = true;
		group.add(head);

		group.castShadow = true;
		group.receiveShadow = true;

		return group;
	}

	function createEnvironment() {
		createTorches();
		createBloodStains();
		createTrophySkulls();
		createEmperorBox();
	}

	function createTorches() {
		var positions = [
			[-40, 25, -40],
			[40, 25, -40],
			[-40, 25, 40],
			[40, 25, 40]
		];

		for (var i = 0; i < positions.length; i++) {
			var poleGeo = new THREE.CylinderGeometry(1, 1, 30, 8);
			var poleMat = new THREE.MeshStandardMaterial({ color: 0x404040 });
			var pole = new THREE.Mesh(poleGeo, poleMat);
			pole.position.set(positions[i][0], positions[i][1], positions[i][2]);
			pole.castShadow = true;
			scene.add(pole);
			objects.push(pole);

			var flameGeo = new THREE.SphereGeometry(2, 8, 8);
			var flameMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1.0 });
			var flame = new THREE.Mesh(flameGeo, flameMat);
			flame.position.set(positions[i][0], positions[i][1] + 10, positions[i][2]);
			flame.castShadow = true;
			scene.add(flame);
			objects.push(flame);

			flame.userData = {
				baseIntensity: 1.0,
				time: 0
			};

			torches.push(flame);
		}
	}

	function createBloodStains() {
		var stainColor = 0x660000;
		var stainMat = new THREE.MeshStandardMaterial({ color: stainColor });

		for (var i = 0; i < 4; i++) {
			var stainGeo = new THREE.BoxGeometry(8, 0.2, 8);
			var stain = new THREE.Mesh(stainGeo, stainMat);
			stain.position.set(-20 + i * 15, 2.1, -10 + i * 10);
			stain.receiveShadow = true;
			scene.add(stain);
			objects.push(stain);
		}
	}

	function createTrophySkulls() {
		var poleGeo = new THREE.BoxGeometry(2, 25, 2);
		var poleMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
		var pole = new THREE.Mesh(poleGeo, poleMat);
		pole.position.set(0, 12.5, -45);
		pole.castShadow = true;
		scene.add(pole);
		objects.push(pole);

		var skullMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });

		for (var i = 0; i < 4; i++) {
			var skullGeo = new THREE.SphereGeometry(1.5, 8, 8);
			var skull = new THREE.Mesh(skullGeo, skullMat);
			var angle = (i / 4) * Math.PI * 2;
			skull.position.set(
				Math.cos(angle) * 4,
				20 - i * 3,
				-45 + Math.sin(angle) * 4
			);
			skull.castShadow = true;
			scene.add(skull);
			objects.push(skull);
		}
	}

	function createEmperorBox() {
		var platformGeo = new THREE.BoxGeometry(20, 2, 15);
		var platformMat = new THREE.MeshStandardMaterial({ color: 0xb8860b });
		var platform = new THREE.Mesh(platformGeo, platformMat);
		platform.position.set(-50, 25, 0);
		platform.castShadow = true;
		platform.receiveShadow = true;
		scene.add(platform);
		objects.push(platform);

		var throneGeo = new THREE.BoxGeometry(6, 8, 6);
		var throneMat = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.8 });
		var throne = new THREE.Mesh(throneGeo, throneMat);
		throne.position.set(-50, 29, 0);
		throne.castShadow = true;
		scene.add(throne);
		objects.push(throne);
	}

	function setupHUD(container) {
		hudCanvas = document.createElement('canvas');
		hudCanvas.width = container.clientWidth;
		hudCanvas.height = container.clientHeight;
		hudCanvas.style.position = 'absolute';
		hudCanvas.style.top = '0';
		hudCanvas.style.left = '0';
		hudCanvas.style.pointerEvents = 'none';
		container.style.position = 'relative';
		container.appendChild(hudCanvas);

		hudContext = hudCanvas.getContext('2d');
		hudContext.font = 'bold 20px Arial';
		hudContext.fillStyle = '#ffffff';
		hudContext.strokeStyle = '#000000';
		hudContext.lineWidth = 3;
	}

	function updateHUD() {
		if (!hudVisible) return;

		hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

		var texts = [
			'GLADIATORS DEFEATED: ' + gladiatorsDefeated + '/2',
			'BEAST SLAIN: ' + (beastSlain ? 'YES' : 'NO'),
			'CROWD FAVOR: ' + crowdFavor
		];

		for (var i = 0; i < texts.length; i++) {
			var text = texts[i];
			hudContext.strokeText(text, 20, 40 + i * 35);
			hudContext.fillText(text, 20, 40 + i * 35);
		}
	}

	function setupKeybindings() {
		window.addEventListener('keydown', function(e) {
			var key = e.key.toUpperCase();

			if (key === 'G' || key === 'P') {
				keybindSequence.push(key);

				if (keybindTimeout) {
					clearTimeout(keybindTimeout);
				}

				if (keybindSequence.length === 2) {
					if (keybindSequence[0] === 'G' && keybindSequence[1] === 'P') {
						hudVisible = !hudVisible;
					}
					keybindSequence = [];
				} else {
					keybindTimeout = setTimeout(function() {
						keybindSequence = [];
					}, 400);
				}
			}
		});
	}

	function update(deltaTime) {
		elapsedTime += deltaTime;

		if (gladiators.length >= 2) {
			var g1 = gladiators[0];
			var g2 = gladiators[1];

			g1.userData.angle += g1.userData.speed;
			g2.userData.angle += g2.userData.speed;

			g1.position.x = Math.cos(g1.userData.angle) * 20;
			g1.position.z = Math.sin(g1.userData.angle) * 20;
			g1.rotation.y = g1.userData.angle + Math.PI / 2;

			g2.position.x = Math.cos(g2.userData.angle) * 20;
			g2.position.z = Math.sin(g2.userData.angle) * 20;
			g2.rotation.y = g2.userData.angle + Math.PI / 2;
		}

		if (beast) {
			beast.userData.angle += beast.userData.speed;
			var beastDistance = 25;
			beast.position.x = Math.cos(beast.userData.angle) * beastDistance;
			beast.position.z = Math.sin(beast.userData.angle) * beastDistance - 25;
			beast.rotation.y = beast.userData.angle;
		}

		for (var i = 0; i < crowd.length; i++) {
			var spectator = crowd[i];
			var baseY = spectator.userData.baseY;
			var rowIndex = spectator.userData.rowIndex;
			var offset = Math.sin(elapsedTime * 0.5 + rowIndex * 0.5) * 0.3;
			spectator.position.y = baseY + offset;
		}

		for (var j = 0; j < torches.length; j++) {
			var torch = torches[j];
			var flicker = 0.6 + Math.sin(elapsedTime * 3 + j * 0.5) * 0.4;
			torch.material.emissiveIntensity = flicker;
		}

		if (portcullis) {
			var portPos = Math.sin(elapsedTime * 0.3) * 15;
			portcullis.position.y = portPos;
		}

		if (fallenColumn) {
			var rockAngle = fallenColumn.userData.baseRotationZ + Math.sin(elapsedTime * 0.8) * 0.05;
			fallenColumn.rotation.z = rockAngle;
		}

		updateHUD();
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			if (obj.geometry) {
				obj.geometry.dispose();
			}
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					for (var m = 0; m < obj.material.length; m++) {
						obj.material[m].dispose();
					}
				} else {
					obj.material.dispose();
				}
			}
			if (obj.parent) {
				obj.parent.remove(obj);
			}
		}

		if (renderer && renderer.domElement && renderer.domElement.parentNode) {
			renderer.domElement.parentNode.removeChild(renderer.domElement);
		}

		if (hudCanvas && hudCanvas.parentNode) {
			hudCanvas.parentNode.removeChild(hudCanvas);
		}

		objects = [];
		gladiators = [];
		crowd = [];
		torches = [];
		scene = null;
		camera = null;
		renderer = null;
		portcullis = null;
		beast = null;
		fallenColumn = null;
		hudCanvas = null;
		hudContext = null;
	}

	function animate() {
		requestAnimationFrame(animate);
		update(0.016);
		renderer.render(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
