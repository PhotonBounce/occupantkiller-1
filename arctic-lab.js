var ArcticLab = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var renderer = null;
	var time = 0;
	var envObjects = [];
	var dynamicLights = [];
	var particles = [];
	var blizzardParticles = null;

	var config = {
		width: 1024,
		height: 768,
		envSize: 80,
		fogColor: 0x4a7c9e,
		floorY: 0
	};

	function createFloor() {
		var floorGeom = new THREE.BoxGeometry(80, 0.5, 80);
		var floorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.y = -0.25;
		floor.receiveShadow = true;
		scene.add(floor);
		envObjects.push(floor);
		return floor;
	}

	function createWalls() {
		var materials = [
			new THREE.MeshStandardMaterial({ color: 0xffffff }),
			new THREE.MeshStandardMaterial({ color: 0xcccccc })
		];

		var northWall = new THREE.BoxGeometry(80, 12, 1);
		var northMesh = new THREE.Mesh(northWall, materials[0]);
		northMesh.position.set(0, 6, -40);
		northMesh.castShadow = true;
		northMesh.receiveShadow = true;
		scene.add(northMesh);
		envObjects.push(northMesh);

		var southWall = new THREE.BoxGeometry(80, 12, 1);
		var southMesh = new THREE.Mesh(southWall, materials[0]);
		southMesh.position.set(0, 6, 40);
		southMesh.castShadow = true;
		southMesh.receiveShadow = true;
		scene.add(southMesh);
		envObjects.push(southMesh);

		var eastWall = new THREE.BoxGeometry(1, 12, 80);
		var eastMesh = new THREE.Mesh(eastWall, materials[0]);
		eastMesh.position.set(40, 6, 0);
		eastMesh.castShadow = true;
		eastMesh.receiveShadow = true;
		scene.add(eastMesh);
		envObjects.push(eastMesh);

		var westWall = new THREE.BoxGeometry(1, 12, 80);
		var westMesh = new THREE.Mesh(westWall, materials[0]);
		westMesh.position.set(-40, 6, 0);
		westMesh.castShadow = true;
		westMesh.receiveShadow = true;
		scene.add(westMesh);
		envObjects.push(westMesh);
	}

	function createCryoPods() {
		var frostColor = 0x7dd3fc;
		var podMat = new THREE.MeshStandardMaterial({ color: frostColor, emissive: 0x4a9bbe });

		var pod1Geom = new THREE.CylinderGeometry(2, 2, 8, 16);
		var pod1 = new THREE.Mesh(pod1Geom, podMat);
		pod1.position.set(-20, 4, -15);
		pod1.castShadow = true;
		pod1.receiveShadow = true;
		scene.add(pod1);
		envObjects.push(pod1);

		var pod2Geom = new THREE.CylinderGeometry(2, 2, 8, 16);
		var pod2 = new THREE.Mesh(pod2Geom, podMat);
		pod2.position.set(-20, 4, 0);
		pod2.castShadow = true;
		pod2.receiveShadow = true;
		scene.add(pod2);
		envObjects.push(pod2);

		var pod3Geom = new THREE.CylinderGeometry(2, 2, 8, 16);
		var pod3 = new THREE.Mesh(pod3Geom, podMat);
		pod3.position.set(-20, 4, 15);
		pod3.castShadow = true;
		pod3.receiveShadow = true;
		scene.add(pod3);
		envObjects.push(pod3);
	}

	function createSpecimenTanks() {
		var tankMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.6 });
		var frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

		var tank1Geom = new THREE.BoxGeometry(4, 6, 4);
		var tank1 = new THREE.Mesh(tank1Geom, tankMat);
		tank1.position.set(15, 3, -20);
		tank1.castShadow = true;
		tank1.receiveShadow = true;
		scene.add(tank1);
		envObjects.push(tank1);

		var tank2Geom = new THREE.BoxGeometry(4, 6, 4);
		var tank2 = new THREE.Mesh(tank2Geom, tankMat);
		tank2.position.set(15, 3, 0);
		tank2.castShadow = true;
		tank2.receiveShadow = true;
		scene.add(tank2);
		envObjects.push(tank2);

		var tank3Geom = new THREE.BoxGeometry(4, 6, 4);
		var tank3 = new THREE.Mesh(tank3Geom, tankMat);
		tank3.position.set(15, 3, 20);
		tank3.castShadow = true;
		tank3.receiveShadow = true;
		scene.add(tank3);
		envObjects.push(tank3);
	}

	function createAirlock() {
		var airlockMat = new THREE.MeshStandardMaterial({ color: 0xfe6161 });
		var breachMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

		var doorGeom = new THREE.BoxGeometry(4, 8, 0.5);
		var door = new THREE.Mesh(doorGeom, airlockMat);
		door.position.set(-30, 4, 35);
		door.castShadow = true;
		door.receiveShadow = true;
		scene.add(door);
		envObjects.push(door);

		var breachGeom = new THREE.BoxGeometry(6, 6, 1);
		var breach = new THREE.Mesh(breachGeom, breachMat);
		breach.position.set(-30, 5, 38);
		breach.castShadow = true;
		breach.receiveShadow = true;
		scene.add(breach);
		envObjects.push(breach);
	}

	function createCorridor() {
		var corridorMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0 });

		var corridorGeom = new THREE.BoxGeometry(8, 5, 25);
		var corridor = new THREE.Mesh(corridorGeom, corridorMat);
		corridor.position.set(0, 2.5, -25);
		corridor.castShadow = true;
		corridor.receiveShadow = true;
		scene.add(corridor);
		envObjects.push(corridor);
	}

	function createMezzanine() {
		var mezzMat = new THREE.MeshStandardMaterial({ color: 0xa8a8a8 });

		var mezzGeom = new THREE.BoxGeometry(20, 0.8, 20);
		var mezz = new THREE.Mesh(mezzGeom, mezzMat);
		mezz.position.set(20, 8, -5);
		mezz.castShadow = true;
		mezz.receiveShadow = true;
		scene.add(mezz);
		envObjects.push(mezz);

		var railGeom = new THREE.BoxGeometry(20, 1.2, 0.5);
		var rail = new THREE.Mesh(railGeom, mezzMat);
		rail.position.set(20, 8.8, -15);
		rail.castShadow = true;
		rail.receiveShadow = true;
		scene.add(rail);
		envObjects.push(rail);
	}

	function createGenerator() {
		var genMat = new THREE.MeshStandardMaterial({ color: 0x404040 });
		var spareMat = new THREE.MeshStandardMaterial({ color: 0xfe6161 });

		var genGeom = new THREE.BoxGeometry(8, 6, 6);
		var gen = new THREE.Mesh(genGeom, genMat);
		gen.position.set(30, 3, 20);
		gen.castShadow = true;
		gen.receiveShadow = true;
		scene.add(gen);
		envObjects.push(gen);

		var cylinGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 12);
		var cyl1 = new THREE.Mesh(cylinGeom, genMat);
		cyl1.position.set(27, 6, 18);
		cyl1.castShadow = true;
		cyl1.receiveShadow = true;
		scene.add(cyl1);
		envObjects.push(cyl1);

		var failGeom = new THREE.BoxGeometry(2, 2, 2);
		var failBox = new THREE.Mesh(failGeom, spareMat);
		failBox.position.set(32, 4, 22);
		failBox.castShadow = true;
		failBox.receiveShadow = true;
		scene.add(failBox);
		envObjects.push(failBox);
	}

	function createEquipment() {
		var equipMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });

		var deskGeom = new THREE.BoxGeometry(6, 3, 3);
		var desk = new THREE.Mesh(deskGeom, equipMat);
		desk.position.set(-10, 1.5, 20);
		desk.castShadow = true;
		desk.receiveShadow = true;
		scene.add(desk);
		envObjects.push(desk);

		var sphGeom = new THREE.SphereGeometry(1.2, 12, 12);
		var sphere1 = new THREE.Mesh(sphGeom, equipMat);
		sphere1.position.set(-8, 4.5, 20);
		sphere1.castShadow = true;
		sphere1.receiveShadow = true;
		scene.add(sphere1);
		envObjects.push(sphere1);

		var sphere2 = new THREE.Mesh(sphGeom, equipMat);
		sphere2.position.set(-12, 4.5, 20);
		sphere2.castShadow = true;
		sphere2.receiveShadow = true;
		scene.add(sphere2);
		envObjects.push(sphere2);
	}

	function createCollapsedWing() {
		var debrisMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });

		var rubbleGeom = new THREE.BoxGeometry(15, 4, 8);
		var rubble = new THREE.Mesh(rubbleGeom, debrisMat);
		rubble.position.set(25, 2, -30);
		rubble.rotation.z = 0.3;
		rubble.castShadow = true;
		rubble.receiveShadow = true;
		scene.add(rubble);
		envObjects.push(rubble);

		var shardGeom = new THREE.ConeGeometry(1.5, 4, 8);
		var shard = new THREE.Mesh(shardGeom, debrisMat);
		shard.position.set(28, 2.5, -25);
		shard.rotation.x = 0.5;
		shard.castShadow = true;
		shard.receiveShadow = true;
		scene.add(shard);
		envObjects.push(shard);
	}

	function createEscapeTunnel() {
		var tunnelMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

		var tunnelGeom = new THREE.CylinderGeometry(3, 3, 30, 12);
		var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
		tunnel.rotation.z = Math.PI / 2;
		tunnel.position.set(35, 3, 10);
		tunnel.castShadow = true;
		tunnel.receiveShadow = true;
		scene.add(tunnel);
		envObjects.push(tunnel);
	}

	function createEmergencyLights() {
		var light1 = new THREE.PointLight(0xff3333, 1.5, 30);
		light1.position.set(-25, 10, -20);
		light1.castShadow = true;
		scene.add(light1);
		dynamicLights.push(light1);

		var light2 = new THREE.PointLight(0xff3333, 1.5, 30);
		light2.position.set(20, 10, 15);
		light2.castShadow = true;
		scene.add(light2);
		dynamicLights.push(light2);

		var light3 = new THREE.PointLight(0xff3333, 1.5, 30);
		light3.position.set(5, 9, -35);
		light3.castShadow = true;
		scene.add(light3);
		dynamicLights.push(light3);

		var ambientLight = new THREE.AmbientLight(0x6b7280, 0.4);
		scene.add(ambientLight);
	}

	function createBlizzardParticles() {
		var particleGeom = new THREE.BufferGeometry();
		var particleCount = 500;
		var posArray = new Float32Array(particleCount * 3);

		for (var i = 0; i < particleCount * 3; i += 3) {
			posArray[i] = (Math.random() - 0.5) * 60;
			posArray[i + 1] = Math.random() * 20;
			posArray[i + 2] = (Math.random() - 0.5) * 60;
		}

		particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

		var particleMat = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 0.3,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.6
		});

		blizzardParticles = new THREE.Points(particleGeom, particleMat);
		blizzardParticles.position.set(0, 0, 0);
		scene.add(blizzardParticles);
	}

	function updateBlizzard() {
		if (!blizzardParticles) return;

		var positions = blizzardParticles.geometry.attributes.position.array;

		for (var i = 0; i < positions.length; i += 3) {
			positions[i + 1] -= 0.15;
			positions[i] += Math.sin(time * 0.002 + i) * 0.08;
			positions[i + 2] -= 0.1;

			if (positions[i + 1] < -5) {
				positions[i + 1] = 20;
			}
			if (positions[i] > 40) {
				positions[i] = -40;
			}
			if (positions[i + 2] > 40) {
				positions[i + 2] = -40;
			}
		}

		blizzardParticles.geometry.attributes.position.needsUpdate = true;
	}

	function updateEmergencyLights() {
		for (var i = 0; i < dynamicLights.length; i++) {
			var light = dynamicLights[i];
			var flicker = 0.8 + Math.sin(time * 0.01 + i) * 0.2;
			light.intensity = 1.5 * flicker;
		}
	}

	function init(containerElement) {
		var container = containerElement || document.body;

		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1a3a52);
		scene.fog = new THREE.Fog(config.fogColor, 100, 200);

		camera = new THREE.PerspectiveCamera(
			75,
			config.width / config.height,
			0.1,
			1000
		);
		camera.position.set(0, 3, 10);
		camera.lookAt(0, 2, 0);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(config.width, config.height);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowShadowMap;
		container.appendChild(renderer.domElement);

		createFloor();
		createWalls();
		createCryoPods();
		createSpecimenTanks();
		createAirlock();
		createCorridor();
		createMezzanine();
		createGenerator();
		createEquipment();
		createCollapsedWing();
		createEscapeTunnel();
		createEmergencyLights();
		createBlizzardParticles();

		return renderer;
	}

	function update() {
		time += 1;
		updateBlizzard();
		updateEmergencyLights();

		if (renderer) {
			if (renderer) renderer.render(scene, camera);
		}
	}

	function reset() {
		time = 0;
		if (blizzardParticles) {
			var positions = blizzardParticles.geometry.attributes.position.array;
			for (var i = 0; i < positions.length; i += 3) {
				positions[i] = (Math.random() - 0.5) * 60;
				positions[i + 1] = Math.random() * 20;
				positions[i + 2] = (Math.random() - 0.5) * 60;
			}
			blizzardParticles.geometry.attributes.position.needsUpdate = true;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
