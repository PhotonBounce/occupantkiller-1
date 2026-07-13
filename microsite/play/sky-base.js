window.SkyBase = (function() {
	'use strict';

	var scene;
	var camera;
	var airshipBases = [];
	var propellers = [];
	var clouds = [];
	var windParticles = [];
	var searchLights = [];
	var balloonGroup;
	var commandBridge;
	var gunTurrets = [];
	var platformGroup;
	var driftOffset = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		airshipBases = [];
		propellers = [];
		clouds = [];
		windParticles = [];
		searchLights = [];
		gunTurrets = [];

		// Create main platform structure
		platformGroup = new THREE.Group();
		scene.add(platformGroup);

		createMainPlatform();
		createAirships();
		createCloudLayer();
		createCommandBridge();
		createGunDeck();
		createSupplyBay();
		createWeatherBalloon();
		createLightningRod();
		createSearchlights();
		createWindParticles();

		return true;
	}

	function createMainPlatform() {
		var platformGeometry = new THREE.BoxGeometry(200, 20, 200);
		var platformMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
		var platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
		platformMesh.position.y = 0;
		platformGroup.add(platformMesh);

		// Platform edge railings
		var railingGeometry = new THREE.BoxGeometry(200, 8, 4);
		var railingMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
		var railingFront = new THREE.Mesh(railingGeometry, railingMaterial);
		railingFront.position.set(0, 15, -98);
		platformGroup.add(railingFront);

		var railingBack = new THREE.Mesh(railingGeometry, railingMaterial);
		railingBack.position.set(0, 15, 98);
		platformGroup.add(railingBack);

		var railingLeft = new THREE.BoxGeometry(4, 8, 200);
		var railingLeftMesh = new THREE.Mesh(railingLeft, railingMaterial);
		railingLeftMesh.position.set(-98, 15, 0);
		platformGroup.add(railingLeftMesh);

		var railingRight = new THREE.Mesh(railingLeft, railingMaterial);
		railingRight.position.set(98, 15, 0);
		platformGroup.add(railingRight);
	}

	function createAirships() {
		var positions = [
			{ x: -80, z: -80 },
			{ x: 80, z: -80 },
			{ x: -80, z: 80 },
			{ x: 80, z: 80 }
		];

		positions.forEach(function(pos) {
			var airshipGroup = new THREE.Group();
			airshipGroup.position.set(pos.x, 150, pos.z);
			platformGroup.add(airshipGroup);

			// Massive envelope
			var envelopeGeometry = new THREE.SphereGeometry(35, 16, 16);
			var envelopeMaterial = new THREE.MeshPhongMaterial({
				color: 0xcccccc,
				emissive: 0x111111
			});
			var envelope = new THREE.Mesh(envelopeGeometry, envelopeMaterial);
			envelope.scale.z = 1.4;
			airshipGroup.add(envelope);

			// Gondola
			var gondolaGeometry = new THREE.BoxGeometry(30, 15, 40);
			var gondolaMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
			var gondola = new THREE.Mesh(gondolaGeometry, gondolaMaterial);
			gondola.position.y = -40;
			airshipGroup.add(gondola);

			// Engine nacelles
			var nacelleGeometry = new THREE.CylinderGeometry(12, 12, 30, 8);
			var nacelleMatLeft = new THREE.MeshPhongMaterial({ color: 0x444444 });
			var nacelleLeft = new THREE.Mesh(nacelleGeometry, nacelleMatLeft);
			nacelleLeft.position.set(-20, -30, -25);
			nacelleLeft.rotation.z = Math.PI / 2;
			airshipGroup.add(nacelleLeft);

			var nacelleRight = new THREE.Mesh(nacelleGeometry, nacelleMatLeft);
			nacelleRight.position.set(20, -30, -25);
			nacelleRight.rotation.z = Math.PI / 2;
			airshipGroup.add(nacelleRight);

			// Propeller discs
			var propGeometry = new THREE.BoxGeometry(3, 35, 35);
			var propMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
			var propLeft = new THREE.Mesh(propGeometry, propMaterial);
			propLeft.position.set(-20, -30, -42);
			airshipGroup.add(propLeft);
			propellers.push({
				mesh: propLeft,
				group: airshipGroup
			});

			var propRight = new THREE.Mesh(propGeometry, propMaterial);
			propRight.position.set(20, -30, -42);
			airshipGroup.add(propRight);
			propellers.push({
				mesh: propRight,
				group: airshipGroup
			});

			// Support cables to platform
			var cableGeometry = new THREE.BufferGeometry();
			var cablePoints = [
				new THREE.Vector3(0, 0, 0),
				new THREE.Vector3(pos.x, -145, pos.z)
			];
			cableGeometry.setFromPoints(cablePoints);
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
			var cableLine = new THREE.LineSegments(cableGeometry, lineMaterial);
			cableLine.position.copy(airshipGroup.position);
			platformGroup.add(cableLine);

			airshipBases.push(airshipGroup);
		});
	}

	function createCloudLayer() {
		var cloudPositions = [
			{ x: -100, y: -60, z: -100 },
			{ x: 50, y: -50, z: -80 },
			{ x: -60, y: -70, z: 60 },
			{ x: 90, y: -55, z: 40 },
			{ x: 0, y: -65, z: -40 },
			{ x: -120, y: -50, z: 0 }
		];

		cloudPositions.forEach(function(pos) {
			var cloudGeometry = new THREE.SphereGeometry(40, 8, 8);
			var cloudMaterial = new THREE.MeshPhongMaterial({
				color: 0xffffff,
				emissive: 0x333333
			});
			var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
			cloud.scale.set(1.2, 0.8, 1.5);
			cloud.position.copy(pos);
			platformGroup.add(cloud);
			clouds.push({
				mesh: cloud,
				baseX: pos.x,
				baseZ: pos.z
			});
		});
	}

	function createCommandBridge() {
		commandBridge = new THREE.Group();
		commandBridge.position.set(0, 40, 0);
		platformGroup.add(commandBridge);

		// Tower base
		var towerGeometry = new THREE.BoxGeometry(60, 50, 60);
		var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
		var tower = new THREE.Mesh(towerGeometry, towerMaterial);
		tower.position.y = 25;
		commandBridge.add(tower);

		// Panoramic window frames
		var windowFrameGeometry = new THREE.BoxGeometry(2, 30, 55);
		var windowFrameMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
		var windowFront = new THREE.Mesh(windowFrameGeometry, windowFrameMaterial);
		windowFront.position.set(0, 40, 28);
		commandBridge.add(windowFront);

		var windowBack = new THREE.Mesh(windowFrameGeometry, windowFrameMaterial);
		windowBack.position.set(0, 40, -28);
		commandBridge.add(windowBack);

		var windowLeft = new THREE.BoxGeometry(2, 30, 55);
		var windowLeftMesh = new THREE.Mesh(windowLeft, windowFrameMaterial);
		windowLeftMesh.position.set(-28, 40, 0);
		commandBridge.add(windowLeftMesh);

		var windowRight = new THREE.Mesh(windowLeft, windowFrameMaterial);
		windowRight.position.set(28, 40, 0);
		commandBridge.add(windowRight);

		// Spinning compass
		var compassGeometry = new THREE.CylinderGeometry(15, 15, 3, 16);
		var compassMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
		var compass = new THREE.Mesh(compassGeometry, compassMaterial);
		compass.position.set(0, 60, 0);
		compass.userData.isCompass = true;
		commandBridge.add(compass);
	}

	function createGunDeck() {
		var gunDeckGeometry = new THREE.BoxGeometry(180, 12, 180);
		var gunDeckMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
		var gunDeck = new THREE.Mesh(gunDeckGeometry, gunDeckMaterial);
		gunDeck.position.set(0, -30, 0);
		platformGroup.add(gunDeck);

		// Four gun turrets
		var turretPositions = [
			{ x: -70, z: -70 },
			{ x: 70, z: -70 },
			{ x: -70, z: 70 },
			{ x: 70, z: 70 }
		];

		turretPositions.forEach(function(pos) {
			var turretGroup = new THREE.Group();
			turretGroup.position.set(pos.x, -24, pos.z);
			platformGroup.add(turretGroup);

			// Turret base
			var baseGeometry = new THREE.CylinderGeometry(20, 25, 12, 8);
			var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			turretGroup.add(base);

			// Gun barrel
			var barrelGeometry = new THREE.CylinderGeometry(8, 8, 50, 8);
			var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
			var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
			barrel.position.z = 25;
			barrel.rotation.x = Math.PI / 6;
			turretGroup.add(barrel);

			gunTurrets.push({
				group: turretGroup,
				barrel: barrel
			});
		});
	}

	function createSupplyBay() {
		var bayGeometry = new THREE.BoxGeometry(80, 15, 80);
		var bayMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
		var bay = new THREE.Mesh(bayGeometry, bayMaterial);
		bay.position.set(0, -50, 0);
		platformGroup.add(bay);

		// Crane arm
		var craneGeometry = new THREE.BoxGeometry(8, 60, 8);
		var craneMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
		var crane = new THREE.Mesh(craneGeometry, craneMaterial);
		crane.position.set(-30, -20, 0);
		platformGroup.add(crane);

		// Crane hook cable
		var hookGeometry = new THREE.BufferGeometry();
		var hookPoints = [
			new THREE.Vector3(-30, -20, 0),
			new THREE.Vector3(-30, -80, 0)
		];
		hookGeometry.setFromPoints(hookPoints);
		var hookLineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 });
		var hookLine = new THREE.LineSegments(hookGeometry, hookLineMaterial);
		platformGroup.add(hookLine);
	}

	function createWeatherBalloon() {
		balloonGroup = new THREE.Group();
		balloonGroup.position.set(60, 120, -60);
		platformGroup.add(balloonGroup);

		// Balloon sphere
		var balloonGeometry = new THREE.SphereGeometry(20, 12, 12);
		var balloonMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 });
		var balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
		balloonGroup.add(balloon);

		// Tether cable
		var tetherGeometry = new THREE.BufferGeometry();
		var tetherPoints = [
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, -100, 0)
		];
		tetherGeometry.setFromPoints(tetherPoints);
		var tetherMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
		var tetherLine = new THREE.LineSegments(tetherGeometry, tetherMaterial);
		balloonGroup.add(tetherLine);
	}

	function createLightningRod() {
		var mastGeometry = new THREE.CylinderGeometry(4, 4, 100, 8);
		var mastMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
		var mast = new THREE.Mesh(mastGeometry, mastMaterial);
		mast.position.set(-90, 60, -90);
		platformGroup.add(mast);

		// Rod tip
		var tipGeometry = new THREE.SphereGeometry(8, 8, 8);
		var tipMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0x444400 });
		var tip = new THREE.Mesh(tipGeometry, tipMaterial);
		tip.position.set(-90, 110, -90);
		platformGroup.add(tip);
	}

	function createSearchlights() {
		var positions = [
			{ x: 80, z: -80 },
			{ x: -80, z: 80 }
		];

		positions.forEach(function(pos) {
			var lightGroup = new THREE.Group();
			lightGroup.position.set(pos.x, 30, pos.z);
			platformGroup.add(lightGroup);

			// Lamp body
			var lampGeometry = new THREE.CylinderGeometry(10, 12, 20, 8);
			var lampMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
			var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
			lightGroup.add(lamp);

			// Light cone
			var coneGeometry = new THREE.ConeGeometry(20, 60, 16);
			var coneMaterial = new THREE.MeshPhongMaterial({
				color: 0xffff99,
				emissive: 0x444400,
				transparent: true,
				opacity: 0.3
			});
			var cone = new THREE.Mesh(coneGeometry, coneMaterial);
			cone.position.y = -30;
			cone.rotation.x = Math.PI / 2;
			lightGroup.add(cone);

			searchLights.push({
				group: lightGroup,
				baseAngle: Math.random() * Math.PI * 2
			});
		});
	}

	function createWindParticles() {
		for (var i = 0; i < 40; i++) {
			var particleGeometry = new THREE.SphereGeometry(2, 4, 4);
			var particleMaterial = new THREE.MeshPhongMaterial({
				color: 0xaaaaaa,
				transparent: true,
				opacity: 0.6
			});
			var particle = new THREE.Mesh(particleGeometry, particleMaterial);
			particle.position.set(
				Math.random() * 300 - 150,
				Math.random() * 200 - 50,
				Math.random() * 300 - 150
			);
			platformGroup.add(particle);
			windParticles.push({
				mesh: particle,
				speed: Math.random() * 40 + 30,
				depth: Math.random() * 300 - 150
			});
		}
	}

	function update(delta) {
		if (!scene || !camera) return;

		// Spin propeller blades
		propellers.forEach(function(prop) {
			prop.mesh.rotation.z += delta * 15;
		});

		// Drift clouds
		driftOffset += delta * 5;
		clouds.forEach(function(cloud) {
			cloud.mesh.position.x = cloud.baseX + Math.sin(driftOffset * 0.3) * 30;
			cloud.mesh.position.z = cloud.baseZ + Math.cos(driftOffset * 0.2) * 20;
		});

		// Spin compass
		commandBridge.children.forEach(function(child) {
			if (child.userData.isCompass) {
				child.rotation.y += delta * 0.5;
			}
		});

		// Rotate gun turrets
		gunTurrets.forEach(function(turret, index) {
			turret.group.rotation.y += delta * (0.3 + index * 0.1);
			turret.barrel.rotation.x = Math.PI / 6 + Math.sin(driftOffset * 0.5) * 0.2;
		});

		// Sway weather balloon
		if (balloonGroup) {
			balloonGroup.position.y = 120 + Math.sin(driftOffset * 0.2) * 10;
			balloonGroup.position.x = 60 + Math.cos(driftOffset * 0.3) * 15;
		}

		// Sweep searchlights
		searchLights.forEach(function(light, index) {
			light.group.rotation.y = light.baseAngle + driftOffset * (0.4 + index * 0.2);
		});

		// Stream wind particles
		windParticles.forEach(function(particle) {
			particle.mesh.position.x -= particle.speed * delta;
			if (particle.mesh.position.x < -200) {
				particle.mesh.position.x = 200;
			}
		});
	}

	function reset() {
		if (scene) {
			if (platformGroup) {
				scene.remove(platformGroup);
			}
			airshipBases = [];
			propellers = [];
			clouds = [];
			windParticles = [];
			searchLights = [];
			gunTurrets = [];
			driftOffset = 0;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
