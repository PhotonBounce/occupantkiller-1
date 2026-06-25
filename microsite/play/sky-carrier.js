window.SkyCarrier = (function() {
	'use strict';

	var scene = null;
	var camera = null;

	var flightDeck = null;
	var controlIsland = null;
	var radarDish = null;
	var fighterJets = [];
	var aaGunTurrets = [];
	var launchCatapult = null;
	var arrestingWires = null;
	var safetyNets = null;
	var engineNacelles = [];
	var cloudMasses = [];
	var elevatorPlatform = null;
	var hangarBayEntrance = null;
	var windParticles = [];

	var elevatorHeight = 0;
	var elevatorDirection = 1;
	var radarRotation = 0;
	var cloudDriftX = 0;
	var particleSpeed = 0;

	function init(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;

		buildFlightDeck();
		buildControlIsland();
		buildFighterJets();
		buildAAGunTurrets();
		buildLaunchCatapult();
		buildArrestingWires();
		buildSafetyNets();
		buildEnginePropulsion();
		buildCloudLayer();
		buildElevatorPlatform();
		buildHangarBayEntrance();
		buildWindParticles();

		return true;
	}

	function buildFlightDeck() {
		var deckGeometry = new THREE.BoxGeometry(220, 15, 320);
		var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
		flightDeck = new THREE.Mesh(deckGeometry, deckMaterial);
		flightDeck.position.set(0, 50, 0);
		flightDeck.castShadow = true;
		flightDeck.receiveShadow = true;
		scene.add(flightDeck);

		var hullGeometry = new THREE.BoxGeometry(200, 40, 280);
		var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: 0.5 });
		var hull = new THREE.Mesh(hullGeometry, hullMaterial);
		hull.position.set(0, 15, 0);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);

		var bowGeometry = new THREE.ConeGeometry(25, 30, 16);
		var bowMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var bow = new THREE.Mesh(bowGeometry, bowMaterial);
		bow.position.set(0, 20, 160);
		bow.castShadow = true;
		scene.add(bow);
	}

	function buildControlIsland() {
		var islandGeometry = new THREE.BoxGeometry(35, 50, 25);
		var islandMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.4 });
		controlIsland = new THREE.Mesh(islandGeometry, islandMaterial);
		controlIsland.position.set(85, 85, -80);
		controlIsland.castShadow = true;
		controlIsland.receiveShadow = true;
		scene.add(controlIsland);

		var radarGeometry = new THREE.CylinderGeometry(12, 12, 4, 32);
		var radarMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xff6600 });
		radarDish = new THREE.Mesh(radarGeometry, radarMaterial);
		radarDish.position.set(85, 140, -80);
		radarDish.castShadow = true;
		scene.add(radarDish);

		var antennaGeometry = new THREE.CylinderGeometry(1, 1, 20, 8);
		var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
		var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
		antenna.position.set(85, 155, -80);
		scene.add(antenna);

		var bridgeGeometry = new THREE.BoxGeometry(30, 12, 20);
		var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
		bridge.position.set(85, 125, -80);
		bridge.castShadow = true;
		scene.add(bridge);
	}

	function buildFighterJets() {
		var jetPositions = [
			{ x: -60, z: 20 },
			{ x: -60, z: 60 },
			{ x: 60, z: 20 },
			{ x: 60, z: 60 },
			{ x: -30, z: -40 },
			{ x: 30, z: -40 }
		];

		var jetCount = 0;
		for (var i = 0; i < jetPositions.length; i++) {
			if (jetCount >= 6) break;

			var jetGroup = new THREE.Group();
			jetGroup.position.set(jetPositions[i].x, 58, jetPositions[i].z);

			var fuselageGeometry = new THREE.BoxGeometry(3, 4, 12);
			var fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a52, metalness: 0.7 });
			var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
			fuselage.castShadow = true;
			jetGroup.add(fuselage);

			var noseGeometry = new THREE.ConeGeometry(1.5, 4, 16);
			var noseMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1f2d });
			var nose = new THREE.Mesh(noseGeometry, noseMaterial);
			nose.position.z = 6;
			nose.castShadow = true;
			jetGroup.add(nose);

			var engine1Geometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
			var engineMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
			var engine1 = new THREE.Mesh(engine1Geometry, engineMaterial);
			engine1.position.set(-1.5, -2, -2);
			engine1.castShadow = true;
			jetGroup.add(engine1);

			var engine2 = new THREE.Mesh(engine1Geometry, engineMaterial);
			engine2.position.set(1.5, -2, -2);
			engine2.castShadow = true;
			jetGroup.add(engine2);

			var wingGeometry = new THREE.BoxGeometry(10, 0.5, 2);
			var wingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a52 });
			var wings = new THREE.Mesh(wingGeometry, wingMaterial);
			wings.position.y = 0.5;
			wings.castShadow = true;
			jetGroup.add(wings);

			scene.add(jetGroup);
			fighterJets.push(jetGroup);
			jetCount++;
		}
	}

	function buildAAGunTurrets() {
		var turretPositions = [
			{ x: -90, z: 100 },
			{ x: 90, z: 100 },
			{ x: -90, z: -100 },
			{ x: 90, z: -100 },
			{ x: -70, z: 50 },
			{ x: 70, z: 50 }
		];

		for (var i = 0; i < turretPositions.length; i++) {
			var turretGroup = new THREE.Group();
			turretGroup.position.set(turretPositions[i].x, 62, turretPositions[i].z);

			var baseGeometry = new THREE.BoxGeometry(8, 4, 8);
			var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.castShadow = true;
			turretGroup.add(base);

			var crewGeometry = new THREE.CylinderGeometry(4, 4, 2, 16);
			var crewMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
			var crew = new THREE.Mesh(crewGeometry, crewMaterial);
			crew.position.y = 3;
			crew.castShadow = true;
			turretGroup.add(crew);

			var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 6, 16);
			var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
			var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
			barrel.position.set(0, 4.5, 0);
			barrel.rotation.z = Math.PI / 6;
			barrel.castShadow = true;
			turretGroup.add(barrel);

			turretGroup.rotationSpeed = Math.random() * 0.01 + 0.005;
			turretGroup.currentRotation = Math.random() * Math.PI * 2;

			scene.add(turretGroup);
			aaGunTurrets.push(turretGroup);
		}
	}

	function buildLaunchCatapult() {
		var railGeometry = new THREE.BoxGeometry(2, 0.8, 280);
		var railMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7 });
		var rail = new THREE.Mesh(railGeometry, railMaterial);
		rail.position.set(0, 51, 0);
		rail.castShadow = true;
		scene.add(rail);

		var points = [];
		points.push(new THREE.Vector3(-1, 51.5, -140));
		points.push(new THREE.Vector3(-1, 51.5, 140));

		var catapultGeometry = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(points),
			new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 })
		);
		launchCatapult = catapultGeometry;
		scene.add(launchCatapult);

		points = [];
		points.push(new THREE.Vector3(1, 51.5, -140));
		points.push(new THREE.Vector3(1, 51.5, 140));

		var catapult2Geometry = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(points),
			new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 })
		);
		scene.add(catapult2Geometry);
	}

	function buildArrestingWires() {
		var points = [];
		for (var i = 0; i < 5; i++) {
			var z = -140 + i * 30;
			points.push(new THREE.Vector3(-110, 51, z));
			points.push(new THREE.Vector3(110, 51, z));
		}

		arrestingWires = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(points),
			new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
		);
		scene.add(arrestingWires);
	}

	function buildSafetyNets() {
		var points = [];
		var spacing = 10;
		var height = 15;

		for (var i = 0; i < 35; i += spacing) {
			points.push(new THREE.Vector3(-110, 50, -140 + i));
			points.push(new THREE.Vector3(-110, 50 + height, -140 + i));
		}

		for (var i = 0; i < 35; i += spacing) {
			points.push(new THREE.Vector3(110, 50, -140 + i));
			points.push(new THREE.Vector3(110, 50 + height, -140 + i));
		}

		safetyNets = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints(points),
			new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 })
		);
		scene.add(safetyNets);
	}

	function buildEnginePropulsion() {
		var nacellePairPositions = [
			{ x: -50, z: -80 },
			{ x: 50, z: -80 }
		];

		for (var i = 0; i < nacellePairPositions.length; i++) {
			var nacelleGeometry = new THREE.CylinderGeometry(8, 8, 25, 16);
			var nacelleMount = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
			var nacelle = new THREE.Mesh(nacelleGeometry, nacelleMount);
			nacelle.position.set(nacellePairPositions[i].x, 5, nacellePairPositions[i].z);
			nacelle.castShadow = true;
			nacelle.receiveShadow = true;
			scene.add(nacelle);
			engineNacelles.push(nacelle);
		}
	}

	function buildCloudLayer() {
		var cloudCount = 12;
		for (var i = 0; i < cloudCount; i++) {
			var cloudGeometry = new THREE.SphereGeometry(15 + Math.random() * 15, 12, 8);
			var cloudMaterial = new THREE.MeshStandardMaterial({
				color: 0xcccccc,
				emissive: 0x666666,
				transparent: true,
				opacity: 0.7,
				metalness: 0
			});
			var cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);

			var cloudX = (Math.random() - 0.5) * 600;
			var cloudY = -80 + Math.random() * 40;
			var cloudZ = -200 + Math.random() * 400;

			cloudMesh.position.set(cloudX, cloudY, cloudZ);
			cloudMesh.castShadow = false;
			cloudMesh.receiveShadow = false;

			cloudMesh.driftSpeed = (Math.random() - 0.5) * 8;
			cloudMesh.baseX = cloudX;

			scene.add(cloudMesh);
			cloudMasses.push(cloudMesh);
		}
	}

	function buildElevatorPlatform() {
		var elevatorGeometry = new THREE.BoxGeometry(30, 2, 25);
		var elevatorMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6 });
		elevatorPlatform = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
		elevatorPlatform.position.set(-70, 51, 80);
		elevatorPlatform.castShadow = true;
		elevatorPlatform.receiveShadow = true;
		scene.add(elevatorPlatform);

		var elevatorShaftGeometry = new THREE.BoxGeometry(32, 40, 27);
		var shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.3 });
		var shaft = new THREE.Mesh(elevatorShaftGeometry, shaftMaterial);
		shaft.position.set(-70, 25, 80);
		shaft.castShadow = true;
		scene.add(shaft);
	}

	function buildHangarBayEntrance() {
		var entranceGeometry = new THREE.BoxGeometry(50, 25, 8);
		var entranceMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
		hangarBayEntrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
		hangarBayEntrance.position.set(0, 35, -145);
		hangarBayEntrance.castShadow = true;
		hangarBayEntrance.receiveShadow = true;
		scene.add(hangarBayEntrance);

		var hangarInteriorGeometry = new THREE.BoxGeometry(48, 23, 35);
		var hangarMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5 });
		var hangarInterior = new THREE.Mesh(hangarInteriorGeometry, hangarMaterial);
		hangarInterior.position.set(0, 35, -175);
		hangarInterior.castShadow = true;
		scene.add(hangarInterior);

		var hangarLightGeometry = new THREE.BoxGeometry(40, 2, 30);
		var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffff99, emissive: 0xffcc00 });
		var hangarLight = new THREE.Mesh(hangarLightGeometry, lightMaterial);
		hangarLight.position.set(0, 45, -175);
		hangarLight.castShadow = false;
		scene.add(hangarLight);
	}

	function buildWindParticles() {
		var particleCount = 30;
		for (var i = 0; i < particleCount; i++) {
			var particleGeometry = new THREE.SphereGeometry(0.5, 4, 4);
			var particleMaterial = new THREE.MeshStandardMaterial({
				color: 0xdddddd,
				emissive: 0x999999,
				transparent: true,
				opacity: 0.4
			});
			var particle = new THREE.Mesh(particleGeometry, particleMaterial);

			var px = Math.random() * 300 - 150;
			var py = 20 + Math.random() * 100;
			var pz = -200 + Math.random() * 400;

			particle.position.set(px, py, pz);
			particle.castShadow = false;
			particle.receiveShadow = false;

			particle.velocity = (Math.random() - 0.5) * 60 + 30;
			particle.baseY = py;

			scene.add(particle);
			windParticles.push(particle);
		}
	}

	function update(delta) {
		if (!scene) return;

		elevatorHeight += elevatorDirection * 20 * delta;
		if (elevatorHeight > 8 || elevatorHeight < 0) {
			elevatorDirection *= -1;
		}
		if (elevatorPlatform) {
			elevatorPlatform.position.y = 51 + elevatorHeight;
		}

		radarRotation += 0.5 * delta;
		if (radarDish) {
			radarDish.rotation.z = radarRotation;
		}

		for (var i = 0; i < aaGunTurrets.length; i++) {
			var turret = aaGunTurrets[i];
			turret.currentRotation += turret.rotationSpeed;
			turret.rotation.y = turret.currentRotation;
		}

		cloudDriftX += 8 * delta;
		for (var i = 0; i < cloudMasses.length; i++) {
			var cloud = cloudMasses[i];
			cloud.position.x = cloud.baseX + cloudDriftX + cloud.driftSpeed * cloudDriftX * 0.05;

			if (cloud.position.x > 350) {
				cloud.position.x = -350;
			}
			if (cloud.position.x < -350) {
				cloud.position.x = 350;
			}
		}

		particleSpeed = (particleSpeed + 60 * delta) % 600;
		for (var i = 0; i < windParticles.length; i++) {
			var p = windParticles[i];
			p.position.x += p.velocity * delta;

			if (p.position.x > 180) {
				p.position.x = -180;
			}
			if (p.position.x < -180) {
				p.position.x = 180;
			}

			var wobble = Math.sin(particleSpeed * 0.01 + i) * 2;
			p.position.y = p.baseY + wobble;
		}

		for (var i = 0; i < fighterJets.length; i++) {
			var jet = fighterJets[i];
			jet.rotation.z = Math.sin(Date.now() * 0.0001) * 0.05;
		}
	}

	function reset() {
		elevatorHeight = 0;
		elevatorDirection = 1;
		radarRotation = 0;
		cloudDriftX = 0;
		particleSpeed = 0;

		if (elevatorPlatform) {
			elevatorPlatform.position.y = 51;
		}

		for (var i = 0; i < cloudMasses.length; i++) {
			cloudMasses[i].position.x = cloudMasses[i].baseX;
		}

		for (var i = 0; i < windParticles.length; i++) {
			windParticles[i].position.x = (Math.random() - 0.5) * 360;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
