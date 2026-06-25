window.LavaRiver = (function() {
	'use strict';

	var scene;
	var camera;
	var lavaObjects = [];
	var lights = [];
	var animatedObjects = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;
		lavaObjects = [];
		lights = [];
		animatedObjects = [];

		buildLavaRiver();
		buildLavaRocks();
		buildMilitaryBridge();
		buildObsidianFormations();
		buildFireGeysers();
		buildBunkerComplex();
		buildCollapsedStructures();
		buildLavaFalls();
		buildLighting();
	}

	function buildLavaRiver() {
		var material = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
		var darkMaterial = new THREE.MeshLambertMaterial({ color: 0xD32F2F });

		for (var i = 0; i < 40; i++) {
			var geometry = new THREE.BoxGeometry(8, 1.5, 12);
			var mesh = new THREE.Mesh(geometry, i % 2 === 0 ? material : darkMaterial);
			mesh.position.set(-100 + i * 5, 0, 0);
			mesh.rotation.z = Math.random() * 0.1 - 0.05;
			scene.add(mesh);
			lavaObjects.push(mesh);
			animatedObjects.push({
				object: mesh,
				type: 'lava',
				baseY: 0,
				speed: 0.5 + Math.random() * 0.3
			});
		}
	}

	function buildLavaRocks() {
		var material1 = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var material2 = new THREE.MeshLambertMaterial({ color: 0x654321 });

		for (var i = 0; i < 12; i++) {
			var geometry = new THREE.BoxGeometry(6 + Math.random() * 4, 3 + Math.random() * 2, 5);
			var mesh = new THREE.Mesh(geometry, Math.random() > 0.5 ? material1 : material2);
			mesh.position.set(-80 + Math.random() * 160, 4, -30 - Math.random() * 20);
			mesh.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
			scene.add(mesh);
			lavaObjects.push(mesh);
		}

		for (var j = 0; j < 8; j++) {
			var sphereGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 6, 6);
			var sphereMesh = new THREE.Mesh(sphereGeometry, material1);
			sphereMesh.position.set(-70 + Math.random() * 140, 5, -25 - Math.random() * 15);
			scene.add(sphereMesh);
			lavaObjects.push(sphereMesh);
		}
	}

	function buildMilitaryBridge() {
		var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
		var decayMaterial = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });

		var mainDeckGeometry = new THREE.BoxGeometry(35, 1.2, 8);
		var mainDeck = new THREE.Mesh(mainDeckGeometry, metalMaterial);
		mainDeck.position.set(0, 12, 0);
		scene.add(mainDeck);
		lavaObjects.push(mainDeck);

		for (var i = 0; i < 7; i++) {
			var supportGeometry = new THREE.CylinderGeometry(1.5, 2, 15, 8);
			var support = new THREE.Mesh(supportGeometry, metalMaterial);
			support.position.set(-15 + i * 5, 4.5, -5);
			scene.add(support);
			lavaObjects.push(support);

			var support2 = new THREE.Mesh(supportGeometry, metalMaterial);
			support2.position.set(-15 + i * 5, 4.5, 5);
			scene.add(support2);
			lavaObjects.push(support2);
		}

		for (var j = 0; j < 6; j++) {
			var railGeometry = new THREE.BoxGeometry(1, 4, 35);
			var rail = new THREE.Mesh(railGeometry, decayMaterial);
			rail.position.set(-17 + j * 7, 14, 0);
			scene.add(rail);
			lavaObjects.push(rail);
		}
	}

	function buildObsidianFormations() {
		var obsidianMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var darkRedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });

		for (var i = 0; i < 6; i++) {
			var coneGeometry = new THREE.ConeGeometry(4 + Math.random() * 3, 10 + Math.random() * 5, 8);
			var cone = new THREE.Mesh(coneGeometry, obsidianMaterial);
			cone.position.set(-90 + Math.random() * 40, 8, 35 + Math.random() * 20);
			cone.rotation.z = Math.random() * 0.2 - 0.1;
			scene.add(cone);
			lavaObjects.push(cone);
		}

		for (var j = 0; j < 5; j++) {
			var cylinderGeometry = new THREE.CylinderGeometry(2 + Math.random() * 2, 3 + Math.random() * 2, 8 + Math.random() * 5, 6);
			var cylinder = new THREE.Mesh(cylinderGeometry, darkRedMaterial);
			cylinder.position.set(50 + Math.random() * 40, 6, -40 + Math.random() * 30);
			cylinder.rotation.z = Math.random() * 0.4 - 0.2;
			scene.add(cylinder);
			lavaObjects.push(cylinder);
		}
	}

	function buildFireGeysers() {
		var geyserMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
		var coreMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

		for (var i = 0; i < 5; i++) {
			var baseGeometry = new THREE.CylinderGeometry(3, 4, 1, 8);
			var base = new THREE.Mesh(baseGeometry, geyserMaterial);
			var posX = -120 + Math.random() * 80;
			var posZ = 10 + Math.random() * 40;
			base.position.set(posX, 1, posZ);
			scene.add(base);
			lavaObjects.push(base);

			for (var j = 0; j < 3; j++) {
				var coneGeometry = new THREE.ConeGeometry(2 - j * 0.4, 5 + j * 1.5, 6);
				var cone = new THREE.Mesh(coneGeometry, j === 0 ? geyserMaterial : coreMaterial);
				cone.position.set(posX, 2 + j * 3, posZ);
				scene.add(cone);
				lavaObjects.push(cone);
				animatedObjects.push({
					object: cone,
					type: 'geyser',
					baseY: 2 + j * 3,
					baseZ: posZ,
					speed: 2 + j * 0.5,
					amplitude: 3 + j * 1.5
				});
			}
		}
	}

	function buildBunkerComplex() {
		var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
		var reinforcedMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });

		var mainBunkerGeometry = new THREE.BoxGeometry(25, 8, 20);
		var mainBunker = new THREE.Mesh(mainBunkerGeometry, concreteMaterial);
		mainBunker.position.set(100, 4, 0);
		scene.add(mainBunker);
		lavaObjects.push(mainBunker);

		var roofGeometry = new THREE.ConeGeometry(15, 5, 4);
		var roof = new THREE.Mesh(roofGeometry, reinforcedMaterial);
		roof.position.set(100, 13, 0);
		scene.add(roof);
		lavaObjects.push(roof);

		for (var i = 0; i < 4; i++) {
			var turretGeometry = new THREE.CylinderGeometry(2.5, 3, 6, 6);
			var turret = new THREE.Mesh(turretGeometry, reinforcedMaterial);
			turret.position.set(88 + i * 8, 14, 8);
			scene.add(turret);
			lavaObjects.push(turret);

			var gunGeometry = new THREE.CylinderGeometry(0.8, 1, 5, 6);
			var gun = new THREE.Mesh(gunGeometry, concreteMaterial);
			gun.position.set(88 + i * 8, 17, 12);
			gun.rotation.z = Math.PI * 0.3;
			scene.add(gun);
			lavaObjects.push(gun);
		}

		for (var j = 0; j < 6; j++) {
			var windowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
			var window = new THREE.Mesh(windowGeometry, reinforcedMaterial);
			window.position.set(90 + j * 3, 6, -10.5);
			scene.add(window);
			lavaObjects.push(window);
		}

		var entranceGeometry = new THREE.BoxGeometry(6, 7, 0.5);
		var entrance = new THREE.Mesh(entranceGeometry, reinforcedMaterial);
		entrance.position.set(75, 3.5, -10.5);
		scene.add(entrance);
		lavaObjects.push(entrance);
	}

	function buildCollapsedStructures() {
		var rustMaterial = new THREE.MeshLambertMaterial({ color: 0xB8860B });
		var meltedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });

		var crumblingWallGeometry = new THREE.BoxGeometry(12, 7, 1);
		var crumblingWall = new THREE.Mesh(crumblingWallGeometry, rustMaterial);
		crumblingWall.position.set(-50, 3.5, 50);
		crumblingWall.rotation.z = 0.3;
		scene.add(crumblingWall);
		lavaObjects.push(crumblingWall);

		var collapsedRoofGeometry = new THREE.BoxGeometry(18, 2, 15);
		var collapsedRoof = new THREE.Mesh(collapsedRoofGeometry, meltedMaterial);
		collapsedRoof.position.set(-30, 5, 40);
		collapsedRoof.rotation.z = 0.5;
		collapsedRoof.rotation.x = 0.2;
		scene.add(collapsedRoof);
		lavaObjects.push(collapsedRoof);

		for (var i = 0; i < 8; i++) {
			var debrisGeometry = new THREE.BoxGeometry(2 + Math.random() * 3, 1 + Math.random() * 2, 2 + Math.random() * 3);
			var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
			debris.position.set(-45 + Math.random() * 20, 7, 35 + Math.random() * 25);
			debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			scene.add(debris);
			lavaObjects.push(debris);
		}

		var melted = new THREE.Mesh(
			new THREE.SphereGeometry(5, 6, 6),
			meltedMaterial
		);
		melted.position.set(-20, 6, 55);
		melted.scale.set(1, 0.6, 1);
		scene.add(melted);
		lavaObjects.push(melted);
	}

	function buildLavaFalls() {
		var fallMaterial = new THREE.MeshLambertMaterial({ color: 0xFF3300 });
		var splashMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });

		for (var i = 0; i < 3; i++) {
			var fallPosX = -70 + i * 70;
			var fallHeight = 20 + Math.random() * 10;

			var fallGeometry = new THREE.BoxGeometry(8, fallHeight, 2);
			var fall = new THREE.Mesh(fallGeometry, fallMaterial);
			fall.position.set(fallPosX, fallHeight / 2 + 10, -60);
			scene.add(fall);
			lavaObjects.push(fall);

			for (var j = 0; j < 4; j++) {
				var splashGeometry = new THREE.SphereGeometry(2 + Math.random() * 1.5, 5, 5);
				var splash = new THREE.Mesh(splashGeometry, splashMaterial);
				splash.position.set(fallPosX + Math.random() * 4 - 2, 8 + Math.random() * 3, -58 + Math.random() * 4);
				scene.add(splash);
				lavaObjects.push(splash);
				animatedObjects.push({
					object: splash,
					type: 'splash',
					baseY: splash.position.y,
					speed: 1 + Math.random() * 0.5
				});
			}
		}

		var poolGeometry = new THREE.CylinderGeometry(12, 15, 2, 12);
		var pool = new THREE.Mesh(poolGeometry, fallMaterial);
		pool.position.set(-70, 6, -50);
		scene.add(pool);
		lavaObjects.push(pool);
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xFF6347, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xFFAA00, 0.8);
		directionalLight.position.set(50, 40, 30);
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xFF4500, 1.2, 100);
		pointLight1.position.set(0, 5, 0);
		scene.add(pointLight1);
		lights.push(pointLight1);
		animatedObjects.push({
			object: pointLight1,
			type: 'glow',
			baseIntensity: 1.2,
			speed: 2
		});

		var pointLight2 = new THREE.PointLight(0xFF6347, 1, 80);
		pointLight2.position.set(-50, 8, 50);
		scene.add(pointLight2);
		lights.push(pointLight2);
		animatedObjects.push({
			object: pointLight2,
			type: 'glow',
			baseIntensity: 1,
			speed: 1.8
		});

		var pointLight3 = new THREE.PointLight(0xFFD700, 0.8, 60);
		pointLight3.position.set(100, 15, 0);
		scene.add(pointLight3);
		lights.push(pointLight3);
		animatedObjects.push({
			object: pointLight3,
			type: 'glow',
			baseIntensity: 0.8,
			speed: 2.2
		});
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < animatedObjects.length; i++) {
			var anim = animatedObjects[i];

			if (anim.type === 'lava') {
				anim.object.position.y = anim.baseY + Math.sin(time * anim.speed) * 0.3;
				anim.object.position.x -= anim.speed * delta * 2;

				if (anim.object.position.x < -200) {
					anim.object.position.x = 200;
				}
			} else if (anim.type === 'geyser') {
				var geyserHeight = anim.amplitude * Math.sin(time * anim.speed);
				anim.object.position.y = anim.baseY + geyserHeight;
				anim.object.scale.y = 1 + (geyserHeight / anim.amplitude) * 0.3;
			} else if (anim.type === 'splash') {
				var splashWave = Math.sin(time * anim.speed) * 0.8;
				anim.object.position.y = anim.baseY + splashWave;
				anim.object.scale.set(1 + splashWave * 0.2, 1 + splashWave * 0.2, 1 + splashWave * 0.2);
			} else if (anim.type === 'glow') {
				var glowPulse = Math.sin(time * anim.speed) * 0.4 + 0.6;
				anim.object.intensity = anim.baseIntensity * glowPulse;
			}
		}
	}

	function reset() {
		for (var i = 0; i < lavaObjects.length; i++) {
			scene.remove(lavaObjects[i]);
		}

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}

		lavaObjects = [];
		lights = [];
		animatedObjects = [];
		scene = null;
		camera = null;
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
