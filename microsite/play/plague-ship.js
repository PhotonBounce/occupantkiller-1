window.PlagueShip = (function() {
	'use strict';

	var scene;
	var camera;
	var environmentObjects = [];
	var miasmaParticles = [];
	var ghostCreatures = [];
	var plagueDecayCounter = 0;
	var lightPulsePhase = 0;

	var shipMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
	var metalMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 60 });
	var woodMaterial = new THREE.MeshPhongMaterial({ color: 0x3d2817 });
	var quarantineMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00aa00 });
	var rustMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });

	function createMainHull() {
		var hullGeometry = new THREE.BoxGeometry(80, 25, 40);
		var hullMesh = new THREE.Mesh(hullGeometry, shipMaterial);
		hullMesh.position.set(0, 0, 0);
		hullMesh.castShadow = true;
		hullMesh.receiveShadow = true;
		scene.add(hullMesh);
		environmentObjects.push(hullMesh);
	}

	function createDeckPlatforms() {
		var lowerDeckGeometry = new THREE.BoxGeometry(78, 3, 38);
		var lowerDeck = new THREE.Mesh(lowerDeckGeometry, woodMaterial);
		lowerDeck.position.set(0, -8, 0);
		lowerDeck.castShadow = true;
		lowerDeck.receiveShadow = true;
		scene.add(lowerDeck);
		environmentObjects.push(lowerDeck);

		var upperDeckGeometry = new THREE.BoxGeometry(76, 3, 36);
		var upperDeck = new THREE.Mesh(upperDeckGeometry, metalMaterial);
		upperDeck.position.set(0, 8, 0);
		upperDeck.castShadow = true;
		upperDeck.receiveShadow = true;
		scene.add(upperDeck);
		environmentObjects.push(upperDeck);

		var midDeckGeometry = new THREE.BoxGeometry(74, 3, 34);
		var midDeck = new THREE.Mesh(midDeckGeometry, rustMaterial);
		midDeck.position.set(0, 0, 0);
		midDeck.castShadow = true;
		midDeck.receiveShadow = true;
		scene.add(midDeck);
		environmentObjects.push(midDeck);
	}

	function createBiohazardChambers() {
		var chamberPositions = [
			[-30, 10, -15],
			[-30, 10, 15],
			[0, 10, -15],
			[0, 10, 15],
			[30, 10, -15],
			[30, 10, 15]
		];

		for (var i = 0; i < chamberPositions.length; i++) {
			var chamberGeometry = new THREE.BoxGeometry(12, 8, 10);
			var chamberMesh = new THREE.Mesh(chamberGeometry, quarantineMaterial);
			chamberMesh.position.set(chamberPositions[i][0], chamberPositions[i][1], chamberPositions[i][2]);
			chamberMesh.castShadow = true;
			chamberMesh.receiveShadow = true;
			scene.add(chamberMesh);
			environmentObjects.push(chamberMesh);
		}
	}

	function createRatTraps() {
		var trapPositions = [
			[-35, -7, -18],
			[-35, -7, 0],
			[-35, -7, 18],
			[35, -7, -18],
			[35, -7, 0],
			[35, -7, 18]
		];

		for (var i = 0; i < trapPositions.length; i++) {
			var trapGeometry = new THREE.BoxGeometry(2, 0.5, 3);
			var trapMesh = new THREE.Mesh(trapGeometry, rustMaterial);
			trapMesh.position.set(trapPositions[i][0], trapPositions[i][1], trapPositions[i][2]);
			trapMesh.castShadow = true;
			trapMesh.receiveShadow = true;
			scene.add(trapMesh);
			environmentObjects.push(trapMesh);
		}
	}

	function createDecontaminationShowers() {
		var showerPositions = [
			[-25, -5, -20],
			[25, -5, -20],
			[-15, -5, 20],
			[15, -5, 20]
		];

		for (var i = 0; i < showerPositions.length; i++) {
			var pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
			var pipeMesh = new THREE.Mesh(pipeGeometry, metalMaterial);
			pipeMesh.position.set(showerPositions[i][0], showerPositions[i][1] + 3, showerPositions[i][2]);
			pipeMesh.castShadow = true;
			pipeMesh.receiveShadow = true;
			scene.add(pipeMesh);
			environmentObjects.push(pipeMesh);

			var showerHeadGeometry = new THREE.SphereGeometry(0.6, 6, 6);
			var showerHeadMesh = new THREE.Mesh(showerHeadGeometry, quarantineMaterial);
			showerHeadMesh.position.set(showerPositions[i][0], showerPositions[i][1] + 6, showerPositions[i][2]);
			showerHeadMesh.castShadow = true;
			showerHeadMesh.receiveShadow = true;
			scene.add(showerHeadMesh);
			environmentObjects.push(showerHeadMesh);
		}
	}

	function createCrowsNests() {
		var nestPositions = [
			[-30, 18, -20],
			[30, 18, 20]
		];

		for (var i = 0; i < nestPositions.length; i++) {
			var mastGeometry = new THREE.CylinderGeometry(1, 1, 20, 8);
			var mastMesh = new THREE.Mesh(mastGeometry, woodMaterial);
			mastMesh.position.set(nestPositions[i][0], 5, nestPositions[i][2]);
			mastMesh.castShadow = true;
			mastMesh.receiveShadow = true;
			scene.add(mastMesh);
			environmentObjects.push(mastMesh);

			var nestGeometry = new THREE.CylinderGeometry(4, 4, 2, 8);
			var nestMesh = new THREE.Mesh(nestGeometry, metalMaterial);
			nestMesh.position.set(nestPositions[i][0], nestPositions[i][1], nestPositions[i][2]);
			nestMesh.castShadow = true;
			nestMesh.receiveShadow = true;
			scene.add(nestMesh);
			environmentObjects.push(nestMesh);
		}
	}

	function createQuarantineBuoys() {
		var buoyPositions = [
			[-38, -15, -25],
			[-38, -15, 25],
			[38, -15, -25],
			[38, -15, 25]
		];

		for (var i = 0; i < buoyPositions.length; i++) {
			var chainGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 4);
			var chainMesh = new THREE.Mesh(chainGeometry, metalMaterial);
			chainMesh.position.set(buoyPositions[i][0], buoyPositions[i][1] + 7, buoyPositions[i][2]);
			chainMesh.castShadow = true;
			chainMesh.receiveShadow = true;
			scene.add(chainMesh);
			environmentObjects.push(chainMesh);

			var buoyGeometry = new THREE.SphereGeometry(2, 8, 8);
			var buoyMesh = new THREE.Mesh(buoyGeometry, quarantineMaterial);
			buoyMesh.position.set(buoyPositions[i][0], buoyPositions[i][1], buoyPositions[i][2]);
			buoyMesh.castShadow = true;
			buoyMesh.receiveShadow = true;
			scene.add(buoyMesh);
			environmentObjects.push(buoyMesh);
		}
	}

	function createPlagueWardBelowdecks() {
		var bedPositions = [
			[-20, -6, -10],
			[-20, -6, 0],
			[-20, -6, 10],
			[20, -6, -10],
			[20, -6, 0],
			[20, -6, 10]
		];

		for (var i = 0; i < bedPositions.length; i++) {
			var bedGeometry = new THREE.BoxGeometry(5, 1, 3);
			var bedMesh = new THREE.Mesh(bedGeometry, rustMaterial);
			bedMesh.position.set(bedPositions[i][0], bedPositions[i][1], bedPositions[i][2]);
			bedMesh.castShadow = true;
			bedMesh.receiveShadow = true;
			scene.add(bedMesh);
			environmentObjects.push(bedMesh);
		}
	}

	function createPlagueDoctorations() {
		var doctorPositions = [
			[-35, 5, 0],
			[35, 5, 0],
			[0, 5, -25]
		];

		for (var i = 0; i < doctorPositions.length; i++) {
			var doctorHeadGeometry = new THREE.SphereGeometry(1.2, 8, 8);
			var doctorHeadMesh = new THREE.Mesh(doctorHeadGeometry, rustMaterial);
			doctorHeadMesh.position.set(doctorPositions[i][0], doctorPositions[i][1] + 2, doctorPositions[i][2]);
			doctorHeadMesh.castShadow = true;
			doctorHeadMesh.receiveShadow = true;
			scene.add(doctorHeadMesh);
			environmentObjects.push(doctorHeadMesh);

			var doctorBodyGeometry = new THREE.BoxGeometry(2, 3, 1.5);
			var doctorBodyMesh = new THREE.Mesh(doctorBodyGeometry, metalMaterial);
			doctorBodyMesh.position.set(doctorPositions[i][0], doctorPositions[i][1], doctorPositions[i][2]);
			doctorBodyMesh.castShadow = true;
			doctorBodyMesh.receiveShadow = true;
			scene.add(doctorBodyMesh);
			environmentObjects.push(doctorBodyMesh);

			var coneGeometry = new THREE.ConeGeometry(1, 2.5, 8);
			var coneMesh = new THREE.Mesh(coneGeometry, quarantineMaterial);
			coneMesh.position.set(doctorPositions[i][0], doctorPositions[i][1] + 3, doctorPositions[i][2]);
			coneMesh.castShadow = true;
			coneMesh.receiveShadow = true;
			scene.add(coneMesh);
			environmentObjects.push(coneMesh);
		}
	}

	function createGhostCreatures() {
		var ghostPositions = [
			[-25, 12, -15],
			[25, 12, 15],
			[-15, 2, 20],
			[15, -8, -20],
			[0, 15, 0]
		];

		for (var i = 0; i < ghostPositions.length; i++) {
			var ghostMaterial = new THREE.MeshPhongMaterial({
				color: 0x00ff00,
				emissive: 0x00ff00,
				wireframe: false,
				opacity: 0.6,
				transparent: true
			});

			var ghostHeadGeometry = new THREE.BoxGeometry(1, 1.5, 1);
			var ghostHeadMesh = new THREE.Mesh(ghostHeadGeometry, ghostMaterial);
			ghostHeadMesh.position.set(ghostPositions[i][0], ghostPositions[i][1] + 1.5, ghostPositions[i][2]);
			ghostHeadMesh.castShadow = true;
			ghostHeadMesh.receiveShadow = true;
			scene.add(ghostHeadMesh);
			ghostCreatures.push({
				mesh: ghostHeadMesh,
				phase: Math.random() * Math.PI * 2,
				type: 'head'
			});

			var ghostBodyGeometry = new THREE.BoxGeometry(1.2, 2, 1);
			var ghostBodyMesh = new THREE.Mesh(ghostBodyGeometry, ghostMaterial);
			ghostBodyMesh.position.set(ghostPositions[i][0], ghostPositions[i][1], ghostPositions[i][2]);
			ghostBodyMesh.castShadow = true;
			ghostBodyMesh.receiveShadow = true;
			scene.add(ghostBodyMesh);
			ghostCreatures.push({
				mesh: ghostBodyMesh,
				phase: Math.random() * Math.PI * 2,
				type: 'body'
			});

			var ghostLimbGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
			var ghostLimbMesh = new THREE.Mesh(ghostLimbGeometry, ghostMaterial);
			ghostLimbMesh.position.set(ghostPositions[i][0] - 0.8, ghostPositions[i][1] - 1, ghostPositions[i][2]);
			ghostLimbMesh.castShadow = true;
			ghostLimbMesh.receiveShadow = true;
			scene.add(ghostLimbMesh);
			ghostCreatures.push({
				mesh: ghostLimbMesh,
				phase: Math.random() * Math.PI * 2,
				type: 'limb'
			});
		}
	}

	function createMiasmaParticles() {
		var miasmaPositions = [
			[-30, 5, -20],
			[30, 5, 20],
			[0, 0, 0],
			[-20, 10, 15],
			[20, -5, -15],
			[-35, 8, 0],
			[35, 8, 0]
		];

		for (var i = 0; i < miasmaPositions.length; i++) {
			var particleGeometry = new THREE.SphereGeometry(3, 6, 6);
			var particleMaterial = new THREE.MeshPhongMaterial({
				color: 0x00aa00,
				emissive: 0x005500,
				wireframe: false,
				opacity: 0.4,
				transparent: true
			});

			var particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
			particleMesh.position.set(miasmaPositions[i][0], miasmaPositions[i][1], miasmaPositions[i][2]);
			scene.add(particleMesh);
			miasmaParticles.push({
				mesh: particleMesh,
				baseX: miasmaPositions[i][0],
				baseY: miasmaPositions[i][1],
				baseZ: miasmaPositions[i][2],
				offset: Math.random() * Math.PI * 2,
				speed: 0.5 + Math.random() * 0.5
			});
		}
	}

	function createPlagueLights() {
		var lightPositions = [
			[-30, 10, -15],
			[30, 10, 15],
			[0, 15, -20],
			[-25, 5, 20],
			[25, 5, -20],
			[0, -5, 0]
		];

		for (var i = 0; i < lightPositions.length; i++) {
			var pointLight = new THREE.PointLight(0x00ff00, 0.6, 25);
			pointLight.position.set(lightPositions[i][0], lightPositions[i][1], lightPositions[i][2]);
			pointLight.castShadow = true;
			scene.add(pointLight);
			environmentObjects.push(pointLight);
		}
	}

	function createAnchorChains() {
		var chainStartPositions = [
			[-38, -8, -25],
			[38, -8, 25]
		];

		for (var i = 0; i < chainStartPositions.length; i++) {
			var chainSegments = [];
			chainSegments.push(new THREE.Vector3(chainStartPositions[i][0], chainStartPositions[i][1], chainStartPositions[i][2]));
			chainSegments.push(new THREE.Vector3(chainStartPositions[i][0], -25, chainStartPositions[i][2]));

			var chainGeometry = new THREE.BufferGeometry().setFromPoints(chainSegments);
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
			var chainLine = new THREE.LineSegments(chainGeometry, lineMaterial);
			scene.add(chainLine);
			environmentObjects.push(chainLine);
		}
	}

	function updateMiasmaSwirls(delta) {
		for (var i = 0; i < miasmaParticles.length; i++) {
			var particle = miasmaParticles[i];
			var swirlAmount = Math.sin(plagueDecayCounter * particle.speed + particle.offset) * 2;
			var verticalDrift = Math.cos(plagueDecayCounter * particle.speed * 0.5 + particle.offset) * 1;

			particle.mesh.position.x = particle.baseX + swirlAmount;
			particle.mesh.position.y = particle.baseY + verticalDrift;
			particle.mesh.position.z = particle.baseZ + Math.cos(plagueDecayCounter * particle.speed * 0.7 + particle.offset) * 1.5;
		}
	}

	function updateGhostFlickers(delta) {
		lightPulsePhase = lightPulsePhase + delta * 1.5;

		for (var i = 0; i < ghostCreatures.length; i++) {
			var ghost = ghostCreatures[i];
			var flicker = Math.sin(lightPulsePhase + ghost.phase) * 0.3 + 0.7;
			ghost.mesh.material.opacity = flicker * 0.6;
			ghost.mesh.material.emissiveIntensity = flicker * 0.5;
		}
	}

	function updatePlagueLights(delta) {
		lightPulsePhase = lightPulsePhase + delta * 0.8;
		var pulse = Math.sin(lightPulsePhase) * 0.4 + 0.8;

		for (var i = 0; i < environmentObjects.length; i++) {
			var obj = environmentObjects[i];
			if (obj instanceof THREE.PointLight) {
				obj.intensity = pulse * 0.6;
			}
		}
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		scene.background = new THREE.Color(0x0a0a0a);
		scene.fog = new THREE.Fog(0x1a3a1a, 100, 150);

		var ambientLight = new THREE.AmbientLight(0x001a00, 0.3);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0x00aa00, 0.4);
		directionalLight.position.set(40, 30, 40);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);

		createMainHull();
		createDeckPlatforms();
		createBiohazardChambers();
		createRatTraps();
		createDecontaminationShowers();
		createCrowsNests();
		createQuarantineBuoys();
		createPlagueWardBelowdecks();
		createPlagueDoctorations();
		createMiasmaParticles();
		createGhostCreatures();
		createPlagueLights();
		createAnchorChains();

		return environmentObjects.length + ghostCreatures.length + miasmaParticles.length;
	}

	function update(delta) {
		plagueDecayCounter = plagueDecayCounter + delta;

		updateMiasmaSwirls(delta);
		updateGhostFlickers(delta);
		updatePlagueLights(delta);
	}

	function reset() {
		for (var i = 0; i < environmentObjects.length; i++) {
			if (environmentObjects[i].geometry) {
				environmentObjects[i].geometry.dispose();
			}
			if (environmentObjects[i].material) {
				environmentObjects[i].material.dispose();
			}
			scene.remove(environmentObjects[i]);
		}

		for (var i = 0; i < ghostCreatures.length; i++) {
			if (ghostCreatures[i].mesh.geometry) {
				ghostCreatures[i].mesh.geometry.dispose();
			}
			if (ghostCreatures[i].mesh.material) {
				ghostCreatures[i].mesh.material.dispose();
			}
			scene.remove(ghostCreatures[i].mesh);
		}

		for (var i = 0; i < miasmaParticles.length; i++) {
			if (miasmaParticles[i].mesh.geometry) {
				miasmaParticles[i].mesh.geometry.dispose();
			}
			if (miasmaParticles[i].mesh.material) {
				miasmaParticles[i].mesh.material.dispose();
			}
			scene.remove(miasmaParticles[i].mesh);
		}

		environmentObjects = [];
		ghostCreatures = [];
		miasmaParticles = [];
		plagueDecayCounter = 0;
		lightPulsePhase = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
