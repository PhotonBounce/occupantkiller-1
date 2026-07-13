window.MoonGate = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];

		buildLighting();
		buildTerrain();
		buildDomeHabitats();
		buildAirlocks();
		buildCraterFortification();
		buildSolarPanels();
		buildRadioTelescope();
		buildMoonBuggies();
		buildDebrisField();
		buildEarthSky();
		buildMilitaryStructures();
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var sunLight = new THREE.DirectionalLight(0xffffee, 0.8);
		sunLight.position.set(50, 80, 50);
		sunLight.castShadow = true;
		scene.add(sunLight);
		lights.push(sunLight);

		var fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
		fillLight.position.set(-30, 20, -60);
		scene.add(fillLight);
		lights.push(fillLight);
	}

	function buildTerrain() {
		var greyMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var darkGreyMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var groundGeom = new THREE.BoxGeometry(400, 2, 400);
		var ground = new THREE.Mesh(groundGeom, greyMaterial);
		ground.position.y = -1;
		scene.add(ground);
		objects.push(ground);

		for (var i = 0; i < 35; i++) {
			var rockX = Math.random() * 300 - 150;
			var rockZ = Math.random() * 300 - 150;
			var rockSize = Math.random() * 4 + 1;
			var rockGeom = new THREE.BoxGeometry(rockSize, rockSize * 0.6, rockSize * 0.8);
			var rockMat = Math.random() > 0.5 ? greyMaterial : darkGreyMaterial;
			var rock = new THREE.Mesh(rockGeom, rockMat);
			rock.position.set(rockX, rockSize * 0.3, rockZ);
			rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			scene.add(rock);
			objects.push(rock);
		}

		for (var j = 0; j < 15; j++) {
			var boulderX = Math.random() * 350 - 175;
			var boulderZ = Math.random() * 350 - 175;
			var boulderSize = Math.random() * 6 + 3;
			var boulderGeom = new THREE.SphereGeometry(boulderSize * 0.5, 6, 6);
			var boulderMat = Math.random() > 0.4 ? darkGreyMaterial : greyMaterial;
			var boulder = new THREE.Mesh(boulderGeom, boulderMat);
			boulder.position.set(boulderX, boulderSize * 0.5, boulderZ);
			scene.add(boulder);
			objects.push(boulder);
		}
	}

	function buildDomeHabitats() {
		var domeMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, emissive: 0x333333 });

		for (var i = 0; i < 3; i++) {
			var domeX = i * 70 - 70;
			var domeZ = 60;

			var domeGeom = new THREE.SphereGeometry(15, 12, 12);
			var dome = new THREE.Mesh(domeGeom, domeMaterial);
			dome.position.set(domeX, 15, domeZ);
			scene.add(dome);
			objects.push(dome);

			var baseGeom = new THREE.CylinderGeometry(16, 18, 3, 16);
			var baseMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.set(domeX, 1.5, domeZ);
			scene.add(base);
			objects.push(base);
		}
	}

	function buildAirlocks() {
		var airlockMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

		for (var i = 0; i < 4; i++) {
			var lockX = Math.random() * 100 - 50;
			var lockZ = Math.random() * 80 - 40;

			var cylinderGeom = new THREE.CylinderGeometry(4, 4, 8, 8);
			var cylinder = new THREE.Mesh(cylinderGeom, airlockMaterial);
			cylinder.position.set(lockX, 4, lockZ);
			scene.add(cylinder);
			objects.push(cylinder);

			var doorGeom = new THREE.BoxGeometry(8, 8, 0.5);
			var door = new THREE.Mesh(doorGeom, doorMaterial);
			door.position.set(lockX, 4, lockZ - 4.25);
			scene.add(door);
			objects.push(door);
			animatedObjects.push({
				object: door,
				type: 'airlock',
				time: Math.random() * Math.PI * 2,
				axis: 'x'
			});
		}
	}

	function buildCraterFortification() {
		var craterGreyMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

		var craterDepth = 30;
		var craterRadius = 50;

		var craterGeom = new THREE.SphereGeometry(craterRadius, 20, 20, 0, Math.PI * 2, Math.PI * 0.5, Math.PI);
		var crater = new THREE.Mesh(craterGeom, craterGreyMaterial);
		crater.position.set(-80, -craterDepth, 0);
		scene.add(crater);
		objects.push(crater);

		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var fortX = -80 + Math.cos(angle) * craterRadius;
			var fortZ = Math.sin(angle) * craterRadius;

			var wallGeom = new THREE.BoxGeometry(8, 15, 4);
			var wall = new THREE.Mesh(wallGeom, darkMaterial);
			wall.position.set(fortX, 7.5, fortZ);
			wall.rotation.y = angle;
			scene.add(wall);
			objects.push(wall);
		}

		for (var j = 0; j < 6; j++) {
			var turretAngle = (j / 6) * Math.PI * 2;
			var turretX = -80 + Math.cos(turretAngle) * (craterRadius - 15);
			var turretZ = Math.sin(turretAngle) * (craterRadius - 15);

			var turretGeom = new THREE.CylinderGeometry(3, 3.5, 6, 8);
			var turret = new THREE.Mesh(turretGeom, darkMaterial);
			turret.position.set(turretX, 8, turretZ);
			scene.add(turret);
			objects.push(turret);

			var gunGeom = new THREE.CylinderGeometry(1, 1.2, 8, 6);
			var gun = new THREE.Mesh(gunGeom, craterGreyMaterial);
			gun.position.set(turretX + 4, 11, turretZ);
			gun.rotation.z = Math.PI * 0.3;
			scene.add(gun);
			objects.push(gun);
		}
	}

	function buildSolarPanels() {
		var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
		var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		for (var i = 0; i < 6; i++) {
			var panelX = i * 25 - 62.5;
			var panelZ = -100;

			var frameGeom = new THREE.CylinderGeometry(2, 2, 40, 8);
			var frame = new THREE.Mesh(frameGeom, frameMaterial);
			frame.position.set(panelX, 20, panelZ);
			frame.rotation.z = Math.PI * 0.5;
			scene.add(frame);
			objects.push(frame);

			var panelGeom = new THREE.BoxGeometry(20, 20, 0.3);
			var panel = new THREE.Mesh(panelGeom, panelMaterial);
			panel.position.set(panelX, 20, panelZ);
			scene.add(panel);
			objects.push(panel);
			animatedObjects.push({
				object: panel,
				type: 'solar',
				time: i * 0.5,
				axis: 'z'
			});
		}
	}

	function buildRadioTelescope() {
		var dishMaterial = new THREE.MeshLambertMaterial({ color: 0x777777, emissive: 0x111111 });
		var structureMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var basePoleGeom = new THREE.CylinderGeometry(3, 4, 25, 8);
		var basePole = new THREE.Mesh(basePoleGeom, structureMaterial);
		basePole.position.set(100, 12.5, 80);
		scene.add(basePole);
		objects.push(basePole);

		var supportGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 6);
		for (var i = 0; i < 3; i++) {
			var supportAngle = (i / 3) * Math.PI * 2;
			var supportX = 100 + Math.cos(supportAngle) * 8;
			var supportZ = 80 + Math.sin(supportAngle) * 8;

			var support = new THREE.Mesh(supportGeom, structureMaterial);
			support.position.set(supportX, 12.5, supportZ);
			support.rotation.z = supportAngle + Math.PI * 0.5;
			scene.add(support);
			objects.push(support);
		}

		var dishGeom = new THREE.SphereGeometry(18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
		var dish = new THREE.Mesh(dishGeom, dishMaterial);
		dish.position.set(100, 32, 80);
		scene.add(dish);
		objects.push(dish);

		var focalGeom = new THREE.CylinderGeometry(2, 2, 15, 6);
		var focal = new THREE.Mesh(focalGeom, structureMaterial);
		focal.position.set(100, 32, 95);
		focal.rotation.x = Math.PI * 0.4;
		scene.add(focal);
		objects.push(focal);
	}

	function buildMoonBuggies() {
		var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, emissive: 0x222222 });

		for (var i = 0; i < 2; i++) {
			var buggyX = i * 60 - 30;
			var buggyZ = -60;

			var bodyGeom = new THREE.BoxGeometry(8, 4, 16);
			var body = new THREE.Mesh(bodyGeom, bodyMaterial);
			body.position.set(buggyX, 2, buggyZ);
			scene.add(body);
			objects.push(body);

			var cabinGeom = new THREE.ConeGeometry(4, 6, 8);
			var cabin = new THREE.Mesh(cabinGeom, cabinMaterial);
			cabin.position.set(buggyX, 5, buggyZ - 2);
			scene.add(cabin);
			objects.push(cabin);

			for (var j = 0; j < 4; j++) {
				var wheelAngleX = j < 2 ? -4 : 4;
				var wheelAngleZ = j % 2 === 0 ? -8 : 8;

				var wheelGeom = new THREE.CylinderGeometry(2.5, 2.5, 3, 12);
				var wheel = new THREE.Mesh(wheelGeom, wheelMaterial);
				wheel.rotation.z = Math.PI * 0.5;
				wheel.position.set(buggyX + wheelAngleX, 2.5, buggyZ + wheelAngleZ);
				scene.add(wheel);
				objects.push(wheel);
			}

			var antennaGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 4);
			var antenna = new THREE.Mesh(antennaGeom, wheelMaterial);
			antenna.position.set(buggyX + 1, 8, buggyZ);
			scene.add(antenna);
			objects.push(antenna);
		}
	}

	function buildDebrisField() {
		var debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var charredMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var debrisX = 80;
		var debrisZ = -80;

		var mainWreckGeom = new THREE.BoxGeometry(20, 12, 30);
		var mainWreck = new THREE.Mesh(mainWreckGeom, debrisMaterial);
		mainWreck.position.set(debrisX, 6, debrisZ);
		mainWreck.rotation.set(0.3, 0.5, 0.2);
		scene.add(mainWreck);
		objects.push(mainWreck);
		animatedObjects.push({
			object: mainWreck,
			type: 'debris',
			time: 0,
			axis: 'xyz'
		});

		for (var i = 0; i < 12; i++) {
			var scrapX = debrisX + Math.random() * 40 - 20;
			var scrapY = Math.random() * 15 + 2;
			var scrapZ = debrisZ + Math.random() * 40 - 20;
			var scrapSize = Math.random() * 3 + 1;

			var scrapGeom = new THREE.BoxGeometry(scrapSize, scrapSize * 0.6, scrapSize * 1.2);
			var scrapMat = Math.random() > 0.6 ? charredMaterial : debrisMaterial;
			var scrap = new THREE.Mesh(scrapGeom, scrapMat);
			scrap.position.set(scrapX, scrapY, scrapZ);
			scrap.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			scene.add(scrap);
			objects.push(scrap);
			animatedObjects.push({
				object: scrap,
				type: 'debris',
				time: Math.random() * Math.PI * 2,
				axis: 'xyz'
			});
		}

		for (var j = 0; j < 8; j++) {
			var fragmentX = debrisX + Math.random() * 50 - 25;
			var fragmentY = Math.random() * 10 + 1;
			var fragmentZ = debrisZ + Math.random() * 50 - 25;

			var fragmentGeom = new THREE.SphereGeometry(Math.random() * 1.5 + 0.5, 5, 5);
			var fragment = new THREE.Mesh(fragmentGeom, charredMaterial);
			fragment.position.set(fragmentX, fragmentY, fragmentZ);
			scene.add(fragment);
			objects.push(fragment);
			animatedObjects.push({
				object: fragment,
				type: 'debris',
				time: Math.random() * Math.PI,
				axis: 'xy'
			});
		}
	}

	function buildEarthSky() {
		var earthMaterial = new THREE.MeshLambertMaterial({ color: 0x4488ff, emissive: 0x223366 });

		var earthGeom = new THREE.SphereGeometry(100, 32, 32);
		var earth = new THREE.Mesh(earthGeom, earthMaterial);
		earth.position.set(-300, 200, -300);
		scene.add(earth);
		objects.push(earth);

		var cloudsGeom = new THREE.SphereGeometry(101, 16, 16);
		var cloudsMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.4 });
		var clouds = new THREE.Mesh(cloudsGeom, cloudsMaterial);
		clouds.position.set(-300, 200, -300);
		scene.add(clouds);
		objects.push(clouds);
	}

	function buildMilitaryStructures() {
		var militaryMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var accentMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

		var radarBaseGeom = new THREE.CylinderGeometry(12, 14, 4, 16);
		var radarBase = new THREE.Mesh(radarBaseGeom, militaryMaterial);
		radarBase.position.set(-100, 2, 100);
		scene.add(radarBase);
		objects.push(radarBase);

		var radarTowerGeom = new THREE.CylinderGeometry(2, 3, 28, 8);
		var radarTower = new THREE.Mesh(radarTowerGeom, accentMaterial);
		radarTower.position.set(-100, 14, 100);
		scene.add(radarTower);
		objects.push(radarTower);

		var radarDishGeom = new THREE.SphereGeometry(8, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.3);
		var radarDish = new THREE.Mesh(radarDishGeom, militaryMaterial);
		radarDish.position.set(-100, 30, 100);
		scene.add(radarDish);
		objects.push(radarDish);

		for (var i = 0; i < 5; i++) {
			var bunkerX = Math.random() * 100 - 50;
			var bunkerZ = Math.random() * 100 - 50;

			var bunkerGeom = new THREE.BoxGeometry(20, 8, 12);
			var bunker = new THREE.Mesh(bunkerGeom, militaryMaterial);
			bunker.position.set(bunkerX, 4, bunkerZ);
			scene.add(bunker);
			objects.push(bunker);

			var roofGeom = new THREE.ConeGeometry(12, 4, 8);
			var roof = new THREE.Mesh(roofGeom, accentMaterial);
			roof.position.set(bunkerX, 12, bunkerZ);
			scene.add(roof);
			objects.push(roof);

			var gunPortGeom = new THREE.BoxGeometry(4, 3, 1);
			var gunPort = new THREE.Mesh(gunPortGeom, militaryMaterial);
			gunPort.position.set(bunkerX + 9, 6, bunkerZ);
			scene.add(gunPort);
			objects.push(gunPort);
		}

		var commandCenterGeom = new THREE.BoxGeometry(30, 10, 25);
		var commandCenter = new THREE.Mesh(commandCenterGeom, militaryMaterial);
		commandCenter.position.set(0, 5, 120);
		scene.add(commandCenter);
		objects.push(commandCenter);

		var antennaArrayGeom = new THREE.CylinderGeometry(1.5, 1.5, 5, 6);
		for (var j = 0; j < 4; j++) {
			var antennaX = j % 2 === 0 ? -8 : 8;
			var antennaZ = j < 2 ? -10 : 10;

			var antenna = new THREE.Mesh(antennaArrayGeom, accentMaterial);
			antenna.position.set(antennaX, 12, 120 + antennaZ);
			scene.add(antenna);
			objects.push(antenna);
		}

		for (var k = 0; k < 6; k++) {
			var pillboxX = -150 + k * 50;
			var pillboxGeom = new THREE.CylinderGeometry(5, 6, 3, 8);
			var pillbox = new THREE.Mesh(pillboxGeom, militaryMaterial);
			pillbox.position.set(pillboxX, 1.5, 150);
			scene.add(pillbox);
			objects.push(pillbox);

			var slitGeom = new THREE.BoxGeometry(2, 4, 0.5);
			var slit = new THREE.Mesh(slitGeom, militaryMaterial);
			slit.position.set(pillboxX, 2.5, 5.5);
			scene.add(slit);
			objects.push(slit);
		}
	}

	function update(delta) {
		for (var i = 0; i < animatedObjects.length; i++) {
			var animated = animatedObjects[i];
			animated.time += delta * 0.5;

			if (animated.type === 'solar') {
				animated.object.rotation.z = Math.sin(animated.time) * 0.3;
			} else if (animated.type === 'airlock') {
				animated.object.position.x += Math.sin(animated.time) * delta * 0.5;
			} else if (animated.type === 'debris') {
				animated.object.rotation.x += delta * 0.3;
				animated.object.rotation.y += delta * 0.4;
				animated.object.rotation.z += delta * 0.25;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		objects = [];
		lights = [];
		animatedObjects = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
