window.WarShip = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var time = 0;
	var objects = [];
	var lights = [];

	var shipGroup = null;
	var pistonMesh = null;
	var sprayParticles = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;
		objects = [];
		lights = [];
		sprayParticles = [];

		shipGroup = new THREE.Group();
		scene.add(shipGroup);

		buildFlightDeck();
		buildIslandSuperstructure();
		buildAntiAircraftPositions();
		buildCatapultSystem();
		buildHangarBay();
		buildAmmunitionShafts();
		buildEngineRoom();
		buildFireSuppressionSystem();
		buildLights();
	}

	function buildFlightDeck() {
		var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var deckGeometry = new THREE.BoxGeometry(200, 2, 400);
		var deck = new THREE.Mesh(deckGeometry, deckMaterial);
		deck.position.y = 0;
		deck.castShadow = true;
		deck.receiveShadow = true;
		shipGroup.add(deck);
		objects.push(deck);

		var lineMarkings = buildDeckMarkings();
		for (var i = 0; i < lineMarkings.length; i++) {
			shipGroup.add(lineMarkings[i]);
			objects.push(lineMarkings[i]);
		}

		var parkedAircraft = buildParkedFighters();
		for (var j = 0; j < parkedAircraft.length; j++) {
			shipGroup.add(parkedAircraft[j]);
			objects.push(parkedAircraft[j]);
		}
	}

	function buildDeckMarkings() {
		var markings = [];
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });

		for (var i = -150; i <= 150; i += 50) {
			var points = [
				new THREE.Vector3(i, 1.1, -180),
				new THREE.Vector3(i, 1.1, 180)
			];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var line = new THREE.LineSegments(geometry, lineMaterial);
			markings.push(line);
		}

		for (var j = -180; j <= 180; j += 40) {
			var points2 = [
				new THREE.Vector3(-150, 1.1, j),
				new THREE.Vector3(150, 1.1, j)
			];
			var geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
			var line2 = new THREE.LineSegments(geometry2, lineMaterial);
			markings.push(line2);
		}

		return markings;
	}

	function buildParkedFighters() {
		var aircraft = [];
		var fuselageColor = 0x333333;
		var wingColor = 0x2a2a2a;

		var positions = [
			{ x: -60, z: -80 },
			{ x: -60, z: -40 },
			{ x: -60, z: 0 },
			{ x: -60, z: 40 },
			{ x: 60, z: -80 },
			{ x: 60, z: -40 },
			{ x: 60, z: 0 },
			{ x: 60, z: 40 }
		];

		for (var i = 0; i < positions.length; i++) {
			var planeGroup = new THREE.Group();

			var fuseMat = new THREE.MeshLambertMaterial({ color: fuselageColor });
			var fuselage = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 20, 8), fuseMat);
			fuselage.rotation.z = Math.PI / 2;
			fuselage.castShadow = true;
			planeGroup.add(fuselage);

			var wingMat = new THREE.MeshLambertMaterial({ color: wingColor });
			var wings = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 8), wingMat);
			wings.castShadow = true;
			planeGroup.add(wings);

			var tailMat = new THREE.MeshLambertMaterial({ color: fuselageColor });
			var tail = new THREE.Mesh(new THREE.ConeGeometry(1.5, 8, 8), tailMat);
			tail.position.z = -10;
			tail.rotation.z = Math.PI / 2;
			tail.castShadow = true;
			planeGroup.add(tail);

			planeGroup.position.set(positions[i].x, 2.5, positions[i].z);
			shipGroup.add(planeGroup);
			objects.push(planeGroup);
			aircraft.push(planeGroup);
		}

		return aircraft;
	}

	function buildIslandSuperstructure() {
		var steelMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var darkSteelMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

		var baseBox = new THREE.Mesh(new THREE.BoxGeometry(35, 8, 25), steelMaterial);
		baseBox.position.set(70, 4, 100);
		baseBox.castShadow = true;
		baseBox.receiveShadow = true;
		shipGroup.add(baseBox);
		objects.push(baseBox);

		var midSection = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 20), steelMaterial);
		midSection.position.set(70, 14, 100);
		midSection.castShadow = true;
		midSection.receiveShadow = true;
		shipGroup.add(midSection);
		objects.push(midSection);

		var topBridge = new THREE.Mesh(new THREE.BoxGeometry(28, 6, 18), darkSteelMaterial);
		topBridge.position.set(70, 24, 100);
		topBridge.castShadow = true;
		topBridge.receiveShadow = true;
		shipGroup.add(topBridge);
		objects.push(topBridge);

		var radarPole = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 25, 8), steelMaterial);
		radarPole.position.set(70, 35, 100);
		radarPole.castShadow = true;
		shipGroup.add(radarPole);
		objects.push(radarPole);

		var radarDome = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), darkSteelMaterial);
		radarDome.position.set(70, 48, 100);
		radarDome.castShadow = true;
		shipGroup.add(radarDome);
		objects.push(radarDome);

		var windows = buildBridgeWindows();
		for (var i = 0; i < windows.length; i++) {
			shipGroup.add(windows[i]);
			objects.push(windows[i]);
		}
	}

	function buildBridgeWindows() {
		var windows = [];
		var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var windowPositions = [
			{ x: 50, y: 23, z: 108 },
			{ x: 70, y: 23, z: 108 },
			{ x: 90, y: 23, z: 108 },
			{ x: 50, y: 23, z: 92 },
			{ x: 70, y: 23, z: 92 },
			{ x: 90, y: 23, z: 92 }
		];

		for (var i = 0; i < windowPositions.length; i++) {
			var windowBox = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.5), windowMaterial);
			windowBox.position.set(windowPositions[i].x, windowPositions[i].y, windowPositions[i].z);
			windows.push(windowBox);
		}

		return windows;
	}

	function buildAntiAircraftPositions() {
		var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var aaPositions = [
			{ x: -80, z: 120 },
			{ x: -80, z: -120 },
			{ x: 80, z: 120 },
			{ x: 80, z: -120 },
			{ x: -90, z: 80 },
			{ x: 90, z: 80 }
		];

		for (var i = 0; i < aaPositions.length; i++) {
			var gunGroup = new THREE.Group();

			var mount = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 1.5, 8), gunMaterial);
			mount.castShadow = true;
			gunGroup.add(mount);

			var barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 6), barrelMaterial);
			barrel1.rotation.z = Math.PI / 6;
			barrel1.position.set(-2, 1, 0);
			barrel1.castShadow = true;
			gunGroup.add(barrel1);

			var barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 6), barrelMaterial);
			barrel2.rotation.z = -Math.PI / 6;
			barrel2.position.set(2, 1, 0);
			barrel2.castShadow = true;
			gunGroup.add(barrel2);

			gunGroup.position.set(aaPositions[i].x, 3, aaPositions[i].z);
			shipGroup.add(gunGroup);
			objects.push(gunGroup);
		}
	}

	function buildCatapultSystem() {
		var trackMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
		var pistonMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

		var track1 = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 150), trackMaterial);
		track1.position.set(-12, 2.5, -80);
		track1.castShadow = true;
		track1.receiveShadow = true;
		shipGroup.add(track1);
		objects.push(track1);

		var track2 = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 150), trackMaterial);
		track2.position.set(12, 2.5, -80);
		track2.castShadow = true;
		track2.receiveShadow = true;
		shipGroup.add(track2);
		objects.push(track2);

		var pistonBase = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 2, 8), pistonMaterial);
		pistonBase.position.set(0, 3, -155);
		pistonBase.castShadow = true;
		shipGroup.add(pistonBase);
		objects.push(pistonBase);

		pistonMesh = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8, 8), pistonMaterial);
		pistonMesh.position.set(0, 6, -155);
		pistonMesh.castShadow = true;
		shipGroup.add(pistonMesh);
		objects.push(pistonMesh);

		var pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 15, 6), pistonMaterial);
		pistonRod.rotation.z = Math.PI / 2;
		pistonRod.position.set(0, 3.5, -155);
		pistonRod.castShadow = true;
		shipGroup.add(pistonRod);
		objects.push(pistonRod);
	}

	function buildHangarBay() {
		var hangarMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
		var liftMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });

		var hangarWall1 = new THREE.Mesh(new THREE.BoxGeometry(180, 12, 2), hangarMaterial);
		hangarWall1.position.set(0, 2, -200);
		hangarWall1.castShadow = true;
		shipGroup.add(hangarWall1);
		objects.push(hangarWall1);

		var hangarWall2 = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 80), hangarMaterial);
		hangarWall2.position.set(90, 2, -240);
		hangarWall2.castShadow = true;
		shipGroup.add(hangarWall2);
		objects.push(hangarWall2);

		var hangarWall3 = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 80), hangarMaterial);
		hangarWall3.position.set(-90, 2, -240);
		hangarWall3.castShadow = true;
		shipGroup.add(hangarWall3);
		objects.push(hangarWall3);

		var hangarFloor = new THREE.Mesh(new THREE.BoxGeometry(180, 0.5, 80), hangarMaterial);
		hangarFloor.position.set(0, -6, -240);
		hangarFloor.castShadow = true;
		hangarFloor.receiveShadow = true;
		shipGroup.add(hangarFloor);
		objects.push(hangarFloor);

		var lift1 = new THREE.Mesh(new THREE.BoxGeometry(25, 1.5, 30), liftMaterial);
		lift1.position.set(-40, -5.5, -240);
		lift1.castShadow = true;
		lift1.receiveShadow = true;
		shipGroup.add(lift1);
		objects.push(lift1);

		var lift2 = new THREE.Mesh(new THREE.BoxGeometry(25, 1.5, 30), liftMaterial);
		lift2.position.set(40, -5.5, -240);
		lift2.castShadow = true;
		lift2.receiveShadow = true;
		shipGroup.add(lift2);
		objects.push(lift2);

		var beams = buildHangarBeams();
		for (var i = 0; i < beams.length; i++) {
			shipGroup.add(beams[i]);
			objects.push(beams[i]);
		}
	}

	function buildHangarBeams() {
		var beams = [];
		var beamMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

		var beamPositions = [
			{ x: -60, y: 0, z: -240 },
			{ x: -20, y: 0, z: -240 },
			{ x: 20, y: 0, z: -240 },
			{ x: 60, y: 0, z: -240 }
		];

		for (var i = 0; i < beamPositions.length; i++) {
			var beam = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), beamMaterial);
			beam.position.set(beamPositions[i].x, beamPositions[i].y, beamPositions[i].z);
			beam.castShadow = true;
			beams.push(beam);
		}

		return beams;
	}

	function buildAmmunitionShafts() {
		var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

		var shaftPositions = [
			{ x: -70, z: 50 },
			{ x: -70, z: 0 },
			{ x: 70, z: 50 },
			{ x: 70, z: 0 }
		];

		for (var i = 0; i < shaftPositions.length; i++) {
			var shaftOuter = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30, 8), shaftMaterial);
			shaftOuter.position.set(shaftPositions[i].x, -10, shaftPositions[i].z);
			shaftOuter.castShadow = true;
			shipGroup.add(shaftOuter);
			objects.push(shaftOuter);

			var shaftInner = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 28, 8), doorMaterial);
			shaftInner.position.set(shaftPositions[i].x, -10, shaftPositions[i].z);
			shipGroup.add(shaftInner);
			objects.push(shaftInner);

			var access = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.5), doorMaterial);
			access.position.set(shaftPositions[i].x, -4, shaftPositions[i].z - 5.5);
			access.castShadow = true;
			shipGroup.add(access);
			objects.push(access);
		}
	}

	function buildEngineRoom() {
		var engineMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
		var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a5a });

		var engineBlock = new THREE.Mesh(new THREE.BoxGeometry(40, 15, 50), engineMaterial);
		engineBlock.position.set(0, -25, 200);
		engineBlock.castShadow = true;
		shipGroup.add(engineBlock);
		objects.push(engineBlock);

		var turbine1 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 6, 12), engineMaterial);
		turbine1.position.set(-15, -20, 200);
		turbine1.castShadow = true;
		shipGroup.add(turbine1);
		objects.push(turbine1);

		var turbine2 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 6, 12), engineMaterial);
		turbine2.position.set(15, -20, 200);
		turbine2.castShadow = true;
		shipGroup.add(turbine2);
		objects.push(turbine2);

		var pipes = buildEnginePipes();
		for (var i = 0; i < pipes.length; i++) {
			shipGroup.add(pipes[i]);
			objects.push(pipes[i]);
		}

		var floodWater = new THREE.Mesh(new THREE.BoxGeometry(38, 5, 48), waterMaterial);
		floodWater.position.set(0, -34, 200);
		floodWater.castShadow = true;
		floodWater.receiveShadow = true;
		shipGroup.add(floodWater);
		objects.push(floodWater);
	}

	function buildEnginePipes() {
		var pipes = [];
		var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });

		var pipePositions = [
			{ x: -10, y: -15, z: 180 },
			{ x: -10, y: -15, z: 220 },
			{ x: 10, y: -15, z: 180 },
			{ x: 10, y: -15, z: 220 },
			{ x: -20, y: -10, z: 200 },
			{ x: 20, y: -10, z: 200 }
		];

		for (var i = 0; i < pipePositions.length; i++) {
			var pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 25, 6), pipeMaterial);
			pipe.rotation.z = Math.PI / 2;
			pipe.position.set(pipePositions[i].x, pipePositions[i].y, pipePositions[i].z);
			pipe.castShadow = true;
			pipes.push(pipe);
		}

		return pipes;
	}

	function buildFireSuppressionSystem() {
		var nozzleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

		var nozzlePositions = [
			{ x: -50, y: -20, z: 180 },
			{ x: 0, y: -20, z: 180 },
			{ x: 50, y: -20, z: 180 },
			{ x: -50, y: -20, z: 220 },
			{ x: 0, y: -20, z: 220 },
			{ x: 50, y: -20, z: 220 }
		];

		for (var i = 0; i < nozzlePositions.length; i++) {
			var nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3, 6), nozzleMaterial);
			nozzle.position.set(nozzlePositions[i].x, nozzlePositions[i].y, nozzlePositions[i].z);
			nozzle.castShadow = true;
			shipGroup.add(nozzle);
			objects.push(nozzle);

			sprayParticles.push({
				nozzlePos: new THREE.Vector3(nozzlePositions[i].x, nozzlePositions[i].y, nozzlePositions[i].z),
				particles: []
			});
		}
	}

	function buildLights() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 80, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 500;
		directionalLight.shadow.camera.left = -200;
		directionalLight.shadow.camera.right = 200;
		directionalLight.shadow.camera.top = 200;
		directionalLight.shadow.camera.bottom = -200;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xffcc99, 0.5, 300);
		pointLight1.position.set(-80, 15, 100);
		pointLight1.castShadow = true;
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xffcc99, 0.5, 300);
		pointLight2.position.set(80, 15, 100);
		pointLight2.castShadow = true;
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function update(delta) {
		time += delta;

		shipRoll();
		pistonAnimation();
		sprayAnimation();
	}

	function shipRoll() {
		var rollAmount = Math.sin(time * 0.3) * 0.08;
		var bobAmount = Math.cos(time * 0.25) * 0.5;

		shipGroup.rotation.z = rollAmount;
		shipGroup.position.y = bobAmount;
	}

	function pistonAnimation() {
		var pistonExtension = Math.sin(time * 2) * 3;
		var baseZ = -155;

		if (pistonMesh) {
			pistonMesh.position.z = baseZ + pistonExtension;
		}
	}

	function sprayAnimation() {
		for (var i = 0; i < sprayParticles.length; i++) {
			var spray = sprayParticles[i];

			if (Math.random() < 0.15) {
				var angle = Math.random() * Math.PI * 2;
				var speed = 2 + Math.random() * 3;
				var particle = {
					pos: spray.nozzlePos.clone(),
					vel: new THREE.Vector3(
						Math.cos(angle) * speed,
						Math.random() * 4 + 1,
						Math.sin(angle) * speed
					),
					life: 1.5
				};
				spray.particles.push(particle);
			}

			for (var j = spray.particles.length - 1; j >= 0; j--) {
				var p = spray.particles[j];
				p.life -= 0.016;
				p.pos.add(p.vel);
				p.vel.y -= 0.1;

				if (p.life <= 0) {
					spray.particles.splice(j, 1);
				}
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			shipGroup.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		lights = [];

		if (shipGroup) {
			scene.remove(shipGroup);
			shipGroup = null;
		}

		scene = null;
		camera = null;
		pistonMesh = null;
		sprayParticles = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
