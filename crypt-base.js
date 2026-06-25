window.CryptBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var debrisParticles = [];
	var altarFires = [];
	var boats = [];
	var animationTime = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		debrisParticles = [];
		altarFires = [];
		boats = [];
		animationTime = 0;

		buildAmbient();
		buildCorridors();
		buildSarcophagi();
		buildWalls();
		buildWeaponCaches();
		buildAltarShrine();
		buildUndergroundLake();
		buildDebris();
		buildLights();
	}

	function buildAmbient() {
		var hemispheric = new THREE.HemisphereLight(0x333344, 0x1a1a22, 0.5);
		scene.add(hemispheric);
		lights.push(hemispheric);
	}

	function buildCorridors() {
		var corridorMat = new THREE.MeshLambertMaterial({ color: 0x4a4440, emissive: 0x2a2420 });
		var archwayMat = new THREE.MeshLambertMaterial({ color: 0x5a5450, emissive: 0x3a3430 });

		var mainCorridor = new THREE.BoxGeometry(15, 8, 40);
		var mainMesh = new THREE.Mesh(mainCorridor, corridorMat);
		mainMesh.position.set(0, 4, 0);
		mainMesh.castShadow = true;
		mainMesh.receiveShadow = true;
		scene.add(mainMesh);
		objects.push(mainMesh);

		var sideCorridor1 = new THREE.BoxGeometry(8, 8, 25);
		var sideMesh1 = new THREE.Mesh(sideCorridor1, corridorMat);
		sideMesh1.position.set(20, 4, 10);
		sideMesh1.castShadow = true;
		sideMesh1.receiveShadow = true;
		scene.add(sideMesh1);
		objects.push(sideMesh1);

		var sideCorridor2 = new THREE.BoxGeometry(8, 8, 25);
		var sideMesh2 = new THREE.Mesh(sideCorridor2, corridorMat);
		sideMesh2.position.set(-20, 4, 10);
		sideMesh2.castShadow = true;
		sideMesh2.receiveShadow = true;
		scene.add(sideMesh2);
		objects.push(sideMesh2);

		for (var i = 0; i < 5; i++) {
			var archway = new THREE.CylinderGeometry(5, 5, 2, 16);
			var archMesh = new THREE.Mesh(archway, archwayMat);
			archMesh.position.set(0, 6, -15 + i * 10);
			archMesh.rotation.z = Math.PI / 2;
			archMesh.castShadow = true;
			scene.add(archMesh);
			objects.push(archMesh);
		}
	}

	function buildSarcophagi() {
		var sarcophagus = new THREE.BoxGeometry(2, 2.5, 4.5);
		var sarcophagiMat = new THREE.MeshLambertMaterial({ color: 0x6a6860, emissive: 0x3a3430 });

		var positions = [
			[3, 1.25, -15],
			[-3, 1.25, -15],
			[3, 1.25, -5],
			[-3, 1.25, -5],
			[3, 1.25, 5],
			[-3, 1.25, 5],
			[25, 1.25, 0],
			[25, 1.25, 15],
			[-25, 1.25, 0],
			[-25, 1.25, 15]
		];

		for (var i = 0; i < positions.length; i++) {
			var mesh = new THREE.Mesh(sarcophagus, sarcophagiMat);
			mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			objects.push(mesh);
		}
	}

	function buildWalls() {
		var wallMat = new THREE.MeshLambertMaterial({ color: 0x3a3430, emissive: 0x1a1a10 });
		var boneMat = new THREE.MeshLambertMaterial({ color: 0x8a8480, emissive: 0x4a4440 });

		var wallThickness = 0.5;

		var northWall = new THREE.BoxGeometry(15, 8, wallThickness);
		var northMesh = new THREE.Mesh(northWall, wallMat);
		northMesh.position.set(0, 4, -20);
		northMesh.castShadow = true;
		northMesh.receiveShadow = true;
		scene.add(northMesh);
		objects.push(northMesh);

		var southWall = new THREE.BoxGeometry(15, 8, wallThickness);
		var southMesh = new THREE.Mesh(southWall, wallMat);
		southMesh.position.set(0, 4, 20);
		southMesh.castShadow = true;
		southMesh.receiveShadow = true;
		scene.add(southMesh);
		objects.push(southMesh);

		var eastWall = new THREE.BoxGeometry(wallThickness, 8, 40);
		var eastMesh = new THREE.Mesh(eastWall, wallMat);
		eastMesh.position.set(7.5, 4, 0);
		eastMesh.castShadow = true;
		eastMesh.receiveShadow = true;
		scene.add(eastMesh);
		objects.push(eastMesh);

		var westWall = new THREE.BoxGeometry(wallThickness, 8, 40);
		var westMesh = new THREE.Mesh(westWall, wallMat);
		westMesh.position.set(-7.5, 4, 0);
		westMesh.castShadow = true;
		westMesh.receiveShadow = true;
		scene.add(westMesh);
		objects.push(westMesh);

		for (var i = 0; i < 8; i++) {
			var skull = new THREE.SphereGeometry(0.4, 8, 8);
			var skullMesh = new THREE.Mesh(skull, boneMat);
			skullMesh.position.set(6, 5 + i * 0.8, -10 + i * 2);
			skullMesh.castShadow = true;
			scene.add(skullMesh);
			objects.push(skullMesh);
		}
	}

	function buildWeaponCaches() {
		var crateMat = new THREE.MeshLambertMaterial({ color: 0x4a4440, emissive: 0x2a2420 });
		var crateGeom = new THREE.BoxGeometry(2, 2, 2);

		var cachePositions = [
			[15, 1, -10],
			[15, 3, -10],
			[15, 5, -10],
			[-15, 1, -10],
			[-15, 3, -10],
			[-15, 5, -10],
			[22, 1, 5],
			[22, 3, 5],
			[-22, 1, 5],
			[-22, 3, 5]
		];

		for (var i = 0; i < cachePositions.length; i++) {
			var crate = new THREE.Mesh(crateGeom, crateMat);
			crate.position.set(cachePositions[i][0], cachePositions[i][1], cachePositions[i][2]);
			crate.castShadow = true;
			crate.receiveShadow = true;
			scene.add(crate);
			objects.push(crate);
		}

		var nicheDepth = 1.5;
		var niches = [
			[7, 5, -18],
			[-7, 5, -18],
			[7, 5, 18],
			[-7, 5, 18]
		];

		var niche = new THREE.BoxGeometry(1.5, 2, nicheDepth);
		var nicheMat = new THREE.MeshLambertMaterial({ color: 0x2a2420, emissive: 0x1a1410 });

		for (var j = 0; j < niches.length; j++) {
			var nicheMesh = new THREE.Mesh(niche, nicheMat);
			nicheMesh.position.set(niches[j][0], niches[j][1], niches[j][2]);
			nicheMesh.castShadow = true;
			scene.add(nicheMesh);
			objects.push(nicheMesh);
		}
	}

	function buildAltarShrine() {
		var altarBase = new THREE.CylinderGeometry(3, 4, 1, 8);
		var altarMat = new THREE.MeshLambertMaterial({ color: 0x3a3030, emissive: 0x1a1a10 });
		var altarMesh = new THREE.Mesh(altarBase, altarMat);
		altarMesh.position.set(0, 0.5, -15);
		altarMesh.castShadow = true;
		altarMesh.receiveShadow = true;
		scene.add(altarMesh);
		objects.push(altarMesh);

		var pillar1 = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
		var pillarMat = new THREE.MeshLambertMaterial({ color: 0x5a5450, emissive: 0x3a3430 });
		var pil1 = new THREE.Mesh(pillar1, pillarMat);
		pil1.position.set(-2, 2.5, -15);
		pil1.castShadow = true;
		scene.add(pil1);
		objects.push(pil1);

		var pil2 = new THREE.Mesh(pillar1, pillarMat);
		pil2.position.set(2, 2.5, -15);
		pil2.castShadow = true;
		scene.add(pil2);
		objects.push(pil2);

		var centerOrb = new THREE.SphereGeometry(0.8, 12, 12);
		var orbMat = new THREE.MeshLambertMaterial({ color: 0x8a4040, emissive: 0x4a2020 });
		var orbMesh = new THREE.Mesh(centerOrb, orbMat);
		orbMesh.position.set(0, 3, -15);
		orbMesh.castShadow = true;
		scene.add(orbMesh);
		objects.push(orbMesh);
		altarFires.push({ mesh: orbMesh, baseScale: 0.8, phase: 0 });

		var topStatue = new THREE.ConeGeometry(1, 3, 8);
		var statueMat = new THREE.MeshLambertMaterial({ color: 0x6a6860, emissive: 0x3a3430 });
		var statueMesh = new THREE.Mesh(topStatue, statueMat);
		statueMesh.position.set(0, 5, -15);
		statueMesh.castShadow = true;
		scene.add(statueMesh);
		objects.push(statueMesh);
	}

	function buildUndergroundLake() {
		var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a4a, emissive: 0x0a1a2a });
		var lakeBottom = new THREE.BoxGeometry(12, 0.5, 10);
		var lakeMesh = new THREE.Mesh(lakeBottom, waterMat);
		lakeMesh.position.set(0, -1, 15);
		lakeMesh.receiveShadow = true;
		scene.add(lakeMesh);
		objects.push(lakeMesh);

		var boatHull = new THREE.BoxGeometry(3, 1, 2);
		var boatMat = new THREE.MeshLambertMaterial({ color: 0x4a4440, emissive: 0x2a2420 });
		var boat1 = new THREE.Mesh(boatHull, boatMat);
		boat1.position.set(-3, -0.5, 15);
		boat1.castShadow = true;
		scene.add(boat1);
		objects.push(boat1);
		boats.push({ mesh: boat1, baseY: -0.5, phase: 0 });

		var boat2 = new THREE.Mesh(boatHull, boatMat);
		boat2.position.set(3, -0.5, 15);
		boat2.castShadow = true;
		scene.add(boat2);
		objects.push(boat2);
		boats.push({ mesh: boat2, baseY: -0.5, phase: Math.PI });

		var boatCanopy1 = new THREE.CylinderGeometry(1.2, 1.5, 0.3, 8);
		var canopyMat = new THREE.MeshLambertMaterial({ color: 0x3a3030, emissive: 0x1a1a10 });
		var canopy1 = new THREE.Mesh(boatCanopy1, canopyMat);
		canopy1.position.set(-3, 1.2, 15);
		canopy1.castShadow = true;
		scene.add(canopy1);
		objects.push(canopy1);

		var canopy2 = new THREE.Mesh(boatCanopy1, canopyMat);
		canopy2.position.set(3, 1.2, 15);
		canopy2.castShadow = true;
		scene.add(canopy2);
		objects.push(canopy2);
	}

	function buildDebris() {
		var debrisMat = new THREE.MeshLambertMaterial({ color: 0x5a5450, emissive: 0x2a2420 });

		for (var i = 0; i < 15; i++) {
			var debrisGeo = new THREE.BoxGeometry(
				0.3 + Math.random() * 0.5,
				0.2 + Math.random() * 0.3,
				0.3 + Math.random() * 0.5
			);
			var debrisMesh = new THREE.Mesh(debrisGeo, debrisMat);
			debrisMesh.position.set(
				(Math.random() - 0.5) * 12,
				7,
				(Math.random() - 0.5) * 30
			);
			debrisMesh.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);
			debrisMesh.castShadow = true;
			scene.add(debrisMesh);
			objects.push(debrisMesh);
			debrisParticles.push({
				mesh: debrisMesh,
				vx: (Math.random() - 0.5) * 2,
				vy: -2 - Math.random() * 2,
				vz: (Math.random() - 0.5) * 2,
				angularVx: (Math.random() - 0.5) * 4,
				angularVy: (Math.random() - 0.5) * 4,
				angularVz: (Math.random() - 0.5) * 4
			});
		}
	}

	function buildLights() {
		var sconceMat = new THREE.MeshLambertMaterial({ color: 0x2a2420, emissive: 0x1a1410 });

		var sconces = [
			[-6, 5, -12],
			[6, 5, -12],
			[-6, 5, 0],
			[6, 5, 0],
			[-6, 5, 12],
			[6, 5, 12],
			[15, 5, 5],
			[-15, 5, 5],
			[15, 5, -5],
			[-15, 5, -5]
		];

		for (var i = 0; i < sconces.length; i++) {
			var sconce = new THREE.BoxGeometry(0.4, 0.8, 0.3);
			var sconceMesh = new THREE.Mesh(sconce, sconceMat);
			sconceMesh.position.set(sconces[i][0], sconces[i][1], sconces[i][2]);
			sconceMesh.castShadow = true;
			scene.add(sconceMesh);
			objects.push(sconceMesh);

			var light = new THREE.PointLight(0xff9944, 0.8, 15);
			light.position.copy(sconceMesh.position);
			light.castShadow = true;
			scene.add(light);
			lights.push(light);
		}

		var altarLight = new THREE.PointLight(0xff6655, 1.2, 20);
		altarLight.position.set(0, 4, -15);
		altarLight.castShadow = true;
		scene.add(altarLight);
		lights.push(altarLight);

		var ceilingLight = new THREE.PointLight(0x6699ff, 0.6, 30);
		ceilingLight.position.set(0, 7.5, 0);
		ceilingLight.castShadow = true;
		scene.add(ceilingLight);
		lights.push(ceilingLight);
	}

	function update(delta) {
		animationTime += delta;

		for (var i = 0; i < debrisParticles.length; i++) {
			var particle = debrisParticles[i];
			particle.mesh.position.x += particle.vx * delta;
			particle.mesh.position.y += particle.vy * delta;
			particle.mesh.position.z += particle.vz * delta;

			particle.mesh.rotation.x += particle.angularVx * delta;
			particle.mesh.rotation.y += particle.angularVy * delta;
			particle.mesh.rotation.z += particle.angularVz * delta;

			if (particle.mesh.position.y < -3) {
				particle.mesh.position.y = 7;
				particle.mesh.position.x = (Math.random() - 0.5) * 12;
				particle.mesh.position.z = (Math.random() - 0.5) * 30;
			}
		}

		for (var j = 0; j < altarFires.length; j++) {
			var fire = altarFires[j];
			fire.phase += delta * 3;
			var flicker = fire.baseScale * (0.85 + 0.15 * Math.sin(fire.phase) + 0.1 * Math.random());
			fire.mesh.scale.set(flicker, flicker, flicker);
		}

		for (var k = 0; k < boats.length; k++) {
			var boat = boats[k];
			boat.phase += delta * 1.5;
			var rocking = 0.3 * Math.sin(boat.phase);
			boat.mesh.position.y = boat.baseY + rocking;
			boat.mesh.rotation.z = 0.1 * Math.sin(boat.phase);
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		lights = [];

		debrisParticles = [];
		altarFires = [];
		boats = [];
		scene = null;
		camera = null;
		animationTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
