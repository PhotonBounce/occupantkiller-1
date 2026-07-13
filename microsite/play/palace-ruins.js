window.PalaceRuins = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var animatingRubble = [];

	function buildCrumblingWalls() {
		var wallPositions = [
			{ x: 0, z: -30, width: 60, height: 25 },
			{ x: 30, z: 0, width: 40, height: 28 },
			{ x: -30, z: 0, width: 40, height: 22 },
			{ x: 0, z: 30, width: 50, height: 20 }
		];

		for (var i = 0; i < wallPositions.length; i++) {
			var pos = wallPositions[i];
			var randomHeight = pos.height + Math.random() * 8 - 4;
			var geometry = new THREE.BoxGeometry(pos.width, randomHeight, 3);
			var material = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9, metalness: 0.1 });
			var wall = new THREE.Mesh(geometry, material);
			wall.position.set(pos.x, randomHeight / 2, pos.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
			objects.push(wall);
		}
	}

	function buildShatteredDome() {
		var sphereRadius = 35;
		var mainGeometry = new THREE.SphereGeometry(sphereRadius, 16, 12);
		var material = new THREE.MeshStandardMaterial({ color: 0xA0A0A0, roughness: 0.7, metalness: 0.3 });
		var mainDome = new THREE.Mesh(mainGeometry, material);
		mainDome.position.y = 32;
		mainDome.castShadow = true;
		mainDome.receiveShadow = true;
		scene.add(mainDome);
		objects.push(mainDome);

		for (var i = 0; i < 5; i++) {
			var debrisGeometry = new THREE.SphereGeometry(8 + Math.random() * 6, 8, 8);
			var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0xB0B0B0, roughness: 0.8 });
			var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
			debris.position.set(
				(Math.random() - 0.5) * 50,
				24 + Math.random() * 15,
				(Math.random() - 0.5) * 50
			);
			debris.castShadow = true;
			debris.receiveShadow = true;
			scene.add(debris);
			objects.push(debris);
		}
	}

	function buildMarbleColumns() {
		var columnPositions = [
			{ x: -15, z: -15, angle: 0 },
			{ x: 15, z: -15, angle: Math.PI * 0.3 },
			{ x: -15, z: 15, angle: 0 },
			{ x: 15, z: 15, angle: -Math.PI * 0.25 },
			{ x: 0, z: 0, angle: 0 }
		];

		for (var i = 0; i < columnPositions.length; i++) {
			var pos = columnPositions[i];
			var shaftGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 12);
			var columnMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.5, metalness: 0.2 });
			var shaft = new THREE.Mesh(shaftGeometry, columnMaterial);
			shaft.position.set(pos.x, 10, pos.z);
			shaft.rotation.z = pos.angle;
			shaft.castShadow = true;
			shaft.receiveShadow = true;
			scene.add(shaft);
			objects.push(shaft);

			var capitalGeometry = new THREE.BoxGeometry(3.5, 1.2, 3.5);
			var capital = new THREE.Mesh(capitalGeometry, columnMaterial);
			capital.position.set(pos.x + Math.sin(pos.angle) * 0.5, 20.6, pos.z + Math.cos(pos.angle) * 0.5);
			capital.castShadow = true;
			capital.receiveShadow = true;
			scene.add(capital);
			objects.push(capital);
		}
	}

	function buildRubblePiles() {
		var pilePositions = [
			{ x: -20, z: 20 },
			{ x: 25, z: -10 },
			{ x: -10, z: -25 },
			{ x: 20, z: 25 }
		];

		for (var i = 0; i < pilePositions.length; i++) {
			var pile = pilePositions[i];
			for (var j = 0; j < 4; j++) {
				var size = 2 + Math.random() * 3;
				var rubbleGeometry = new THREE.BoxGeometry(size, size, size);
				var rubbleMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.95, metalness: 0 });
				var chunk = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
				chunk.position.set(
					pile.x + (Math.random() - 0.5) * 6,
					0.5 + j * size * 0.8 + Math.random() * 1,
					pile.z + (Math.random() - 0.5) * 6
				);
				chunk.rotation.set(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI
				);
				chunk.castShadow = true;
				chunk.receiveShadow = true;
				scene.add(chunk);
				objects.push(chunk);
			}
		}
	}

	function buildArtilleryCraters() {
		var craterPositions = [
			{ x: -35, z: 0 },
			{ x: 35, z: 0 },
			{ x: 0, z: -35 }
		];

		for (var i = 0; i < craterPositions.length; i++) {
			var crater = craterPositions[i];
			var coneGeometry = new THREE.ConeGeometry(12, 6, 16);
			var craterMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.9, metalness: 0 });
			var cone = new THREE.Mesh(coneGeometry, craterMaterial);
			cone.position.set(crater.x, -2, crater.z);
			cone.scale.y = -1;
			cone.castShadow = true;
			cone.receiveShadow = true;
			scene.add(cone);
			objects.push(cone);

			for (var j = 0; j < 3; j++) {
				var debrisSize = 1.5 + Math.random() * 2;
				var debrisGeometry = new THREE.BoxGeometry(debrisSize, debrisSize, debrisSize);
				var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
				var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
				debris.position.set(
					crater.x + (Math.random() - 0.5) * 18,
					0.5 + Math.random() * 3,
					crater.z + (Math.random() - 0.5) * 18
				);
				debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
				debris.castShadow = true;
				debris.receiveShadow = true;
				scene.add(debris);
				objects.push(debris);
			}
		}
	}

	function buildDefensivePositions() {
		for (var i = 0; i < 3; i++) {
			var angle = (i / 3) * Math.PI * 2;
			var radius = 22;
			var posX = Math.cos(angle) * radius;
			var posZ = Math.sin(angle) * radius;

			var fortGeometry = new THREE.BoxGeometry(4, 2, 4);
			var fortMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.85 });
			var fort = new THREE.Mesh(fortGeometry, fortMaterial);
			fort.position.set(posX, 5, posZ);
			fort.castShadow = true;
			fort.receiveShadow = true;
			scene.add(fort);
			objects.push(fort);

			var barricadeGeometry = new THREE.BoxGeometry(1.5, 1.8, 3);
			var barricade = new THREE.Mesh(barricadeGeometry, fortMaterial);
			barricade.position.set(posX + 2, 5, posZ);
			barricade.castShadow = true;
			barricade.receiveShadow = true;
			scene.add(barricade);
			objects.push(barricade);
		}
	}

	function buildSniperNests() {
		for (var i = 0; i < 2; i++) {
			var angle = Math.PI * 0.5 + i * Math.PI;
			var radius = 28;
			var posX = Math.cos(angle) * radius;
			var posZ = Math.sin(angle) * radius;

			var towerGeometry = new THREE.BoxGeometry(3, 18, 3);
			var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6F47, roughness: 0.9 });
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(posX, 9, posZ);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			objects.push(tower);

			var platformGeometry = new THREE.BoxGeometry(5, 1, 5);
			var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.8 });
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(posX, 18, posZ);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);
		}
	}

	function buildThroneRoom() {
		var throneGeometry = new THREE.BoxGeometry(6, 4, 6);
		var goldMaterial = new THREE.MeshStandardMaterial({
			color: 0xFFD700,
			roughness: 0.4,
			metalness: 0.8,
			emissive: 0xAA8800,
			emissiveIntensity: 0.3
		});
		var throne = new THREE.Mesh(throneGeometry, goldMaterial);
		throne.position.set(0, 2, -20);
		throne.castShadow = true;
		throne.receiveShadow = true;
		scene.add(throne);
		objects.push(throne);

		for (var i = 0; i < 2; i++) {
			var armGeometry = new THREE.BoxGeometry(1, 3, 4);
			var arm = new THREE.Mesh(armGeometry, goldMaterial);
			arm.position.set((i === 0 ? -3.5 : 3.5), 3, -20);
			arm.castShadow = true;
			arm.receiveShadow = true;
			scene.add(arm);
			objects.push(arm);
		}
	}

	function init(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;
		objects = [];
		animatingRubble = [];

		buildCrumblingWalls();
		buildShatteredDome();
		buildMarbleColumns();
		buildRubblePiles();
		buildArtilleryCraters();
		buildDefensivePositions();
		buildSniperNests();
		buildThroneRoom();

		return true;
	}

	function update(delta) {
		for (var i = 0; i < objects.length; i++) {
			objects[i].rotation.x += Math.sin(objects[i].position.x * 0.01) * delta * 0.02;
			objects[i].rotation.y += Math.cos(objects[i].position.z * 0.01) * delta * 0.015;
		}
	}

	function reset() {
		for (var i = objects.length - 1; i >= 0; i--) {
			scene.remove(objects[i]);
		}
		objects = [];
		animatingRubble = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
