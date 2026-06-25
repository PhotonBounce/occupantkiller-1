window.QuantumBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var materials = {};
	var time = 0;
	var riftObjects = [];
	var pulsingObjects = [];
	var rotatingObjects = [];

	var init = function(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		time = 0;
		meshes = [];
		riftObjects = [];
		pulsingObjects = [];
		rotatingObjects = [];

		scene.fog = new THREE.Fog(0x0a0e27, 120, 200);
		scene.background = new THREE.Color(0x0a0e27);

		createMaterials();
		buildQuantumBase();
	};

	var createMaterials = function() {
		materials.whiteMetal = new THREE.MeshPhongMaterial({ color: 0xf0f0f0, metalness: 0.8, roughness: 0.2 });
		materials.darkSteel = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, metalness: 0.9, roughness: 0.1 });
		materials.cyan = new THREE.MeshPhongMaterial({ color: 0x00d4ff, emissive: 0x00a0cc, metalness: 0.6, roughness: 0.3 });
		materials.quantumGlow = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x0080ff, metalness: 0.5, roughness: 0.4 });
		materials.deepBlue = new THREE.MeshPhongMaterial({ color: 0x0d47a1, metalness: 0.7, roughness: 0.3 });
		materials.wireframe = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ff00, emissive: 0x00ff00 });
	};

	var buildQuantumBase = function() {
		createLighting();
		createMainCorridor();
		createServerBanks();
		createQuantumChambers();
		createAcceleratorRing();
		createDimensionalRifts();
		createObservationDeck();
		createBasementLabs();
		createControlCenter();
		createContainmentFields();
	};

	var createLighting = function() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(40, 50, 40);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);

		var blueLight = new THREE.PointLight(0x0080ff, 2, 100);
		blueLight.position.set(0, 15, 0);
		scene.add(blueLight);

		var cyanLight = new THREE.PointLight(0x00ffff, 1.5, 80);
		cyanLight.position.set(30, 20, 30);
		scene.add(cyanLight);
	};

	var createMainCorridor = function() {
		var floorGeometry = new THREE.BoxGeometry(80, 1, 80);
		var floor = new THREE.Mesh(floorGeometry, materials.darkSteel);
		floor.position.y = -0.5;
		scene.add(floor);
		meshes.push(floor);

		var ceilingGeometry = new THREE.BoxGeometry(80, 1, 80);
		var ceiling = new THREE.Mesh(ceilingGeometry, materials.whiteMetal);
		ceiling.position.y = 18;
		scene.add(ceiling);
		meshes.push(ceiling);

		var wallNorth = new THREE.Mesh(new THREE.BoxGeometry(80, 18, 1), materials.whiteMetal);
		wallNorth.position.set(0, 9, -40);
		scene.add(wallNorth);
		meshes.push(wallNorth);

		var wallSouth = new THREE.Mesh(new THREE.BoxGeometry(80, 18, 1), materials.whiteMetal);
		wallSouth.position.set(0, 9, 40);
		scene.add(wallSouth);
		meshes.push(wallSouth);

		var wallWest = new THREE.Mesh(new THREE.BoxGeometry(1, 18, 80), materials.whiteMetal);
		wallWest.position.set(-40, 9, 0);
		scene.add(wallWest);
		meshes.push(wallWest);

		var wallEast = new THREE.Mesh(new THREE.BoxGeometry(1, 18, 80), materials.whiteMetal);
		wallEast.position.set(40, 9, 0);
		scene.add(wallEast);
		meshes.push(wallEast);
	};

	var createServerBanks = function() {
		var positions = [
			{ x: -30, z: -25 },
			{ x: -30, z: 25 },
			{ x: 30, z: -25 },
			{ x: 30, z: 25 }
		];

		positions.forEach(function(pos) {
			var rackGeometry = new THREE.BoxGeometry(4, 12, 3);
			var rack = new THREE.Mesh(rackGeometry, materials.darkSteel);
			rack.position.set(pos.x, 6, pos.z);
			scene.add(rack);
			meshes.push(rack);
			pulsingObjects.push({ mesh: rack, speed: 0.5, originalEmissive: 0x1a1a2e });

			var cableGeometry = new THREE.BoxGeometry(0.2, 10, 0.2);
			var cable = new THREE.Mesh(cableGeometry, materials.cyan);
			cable.position.set(pos.x - 2.5, 6, pos.z);
			scene.add(cable);
			meshes.push(cable);

			var lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
			var light = new THREE.Mesh(lightGeometry, materials.quantumGlow);
			light.position.set(pos.x, 11, pos.z);
			scene.add(light);
			meshes.push(light);
			pulsingObjects.push({ mesh: light, speed: 1.2, originalEmissive: 0x0080ff });
		});
	};

	var createQuantumChambers = function() {
		var chamberPositions = [
			{ x: -15, z: 0 },
			{ x: 15, z: 0 },
			{ x: 0, z: -15 },
			{ x: 0, z: 15 }
		];

		chamberPositions.forEach(function(pos) {
			var chamberGeometry = new THREE.BoxGeometry(6, 10, 6);
			var chamber = new THREE.Mesh(chamberGeometry, materials.deepBlue);
			chamber.position.set(pos.x, 5, pos.z);
			scene.add(chamber);
			meshes.push(chamber);

			var sphereGeometry = new THREE.SphereGeometry(1.5, 16, 16);
			var sphere = new THREE.Mesh(sphereGeometry, materials.quantumGlow);
			sphere.position.set(pos.x, 5, pos.z);
			scene.add(sphere);
			meshes.push(sphere);
			pulsingObjects.push({ mesh: sphere, speed: 0.8, originalEmissive: 0x0080ff });
			rotatingObjects.push({ mesh: sphere, axis: 'y', speed: 0.003 });
		});
	};

	var createAcceleratorRing = function() {
		var ringSegments = 12;
		var ringRadius = 20;

		for (var i = 0; i < ringSegments; i++) {
			var angle = (i / ringSegments) * Math.PI * 2;
			var x = Math.cos(angle) * ringRadius;
			var z = Math.sin(angle) * ringRadius;

			var segmentGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
			var segment = new THREE.Mesh(segmentGeometry, materials.cyan);
			segment.position.set(x, 8, z);
			segment.rotation.z = angle;
			scene.add(segment);
			meshes.push(segment);
			rotatingObjects.push({ mesh: segment, axis: 'y', speed: 0.005, centerX: 0, centerZ: 0, radius: ringRadius });

			var sphereGeometry = new THREE.SphereGeometry(0.4, 8, 8);
			var nodeSphere = new THREE.Mesh(sphereGeometry, materials.quantumGlow);
			nodeSphere.position.set(x, 8, z);
			scene.add(nodeSphere);
			meshes.push(nodeSphere);
			rotatingObjects.push({ mesh: nodeSphere, axis: 'y', speed: 0.005, centerX: 0, centerZ: 0, radius: ringRadius });
		}

		var centerCoreGeometry = new THREE.CylinderGeometry(3, 3, 4, 12);
		var centerCore = new THREE.Mesh(centerCoreGeometry, materials.deepBlue);
		centerCore.position.set(0, 8, 0);
		scene.add(centerCore);
		meshes.push(centerCore);
		rotatingObjects.push({ mesh: centerCore, axis: 'y', speed: -0.004 });
	};

	var createDimensionalRifts = function() {
		var riftPositions = [
			{ x: -25, z: -25, y: 12 },
			{ x: 25, z: 25, y: 12 },
			{ x: -25, z: 25, y: 10 }
		];

		riftPositions.forEach(function(pos) {
			var riftGeometry = new THREE.SphereGeometry(1.2, 16, 16);
			var riftMat = new THREE.MeshBasicMaterial({ color: 0x0080ff, emissive: 0x0080ff });
			var rift = new THREE.Mesh(riftGeometry, riftMat);
			rift.position.set(pos.x, pos.y, pos.z);
			scene.add(rift);
			meshes.push(rift);
			riftObjects.push({ mesh: rift, originalRadius: 1.2, minRadius: 0.8, maxRadius: 1.6, speed: 0.01 });

			var pulseGeometry = new THREE.SphereGeometry(2, 12, 12);
			var pulseMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x00ffff, transparent: true, opacity: 0.3 });
			var pulse = new THREE.Mesh(pulseGeometry, pulseMat);
			pulse.position.set(pos.x, pos.y, pos.z);
			scene.add(pulse);
			meshes.push(pulse);
			riftObjects.push({ mesh: pulse, isPulse: true, speed: 0.015 });
		});
	};

	var createObservationDeck = function() {
		var platformGeometry = new THREE.BoxGeometry(20, 0.5, 20);
		var platform = new THREE.Mesh(platformGeometry, materials.whiteMetal);
		platform.position.set(0, 15, 0);
		scene.add(platform);
		meshes.push(platform);

		var railGeometry = new THREE.BoxGeometry(20, 1.5, 0.3);
		var railNorth = new THREE.Mesh(railGeometry, materials.cyan);
		railNorth.position.set(0, 16.25, -10);
		scene.add(railNorth);
		meshes.push(railNorth);

		var railSouth = new THREE.Mesh(railGeometry, materials.cyan);
		railSouth.position.set(0, 16.25, 10);
		scene.add(railSouth);
		meshes.push(railSouth);

		var railEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 20), materials.cyan);
		railEast.position.set(10, 16.25, 0);
		scene.add(railEast);
		meshes.push(railEast);

		var railWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 20), materials.cyan);
		railWest.position.set(-10, 16.25, 0);
		scene.add(railWest);
		meshes.push(railWest);
	};

	var createBasementLabs = function() {
		var lab1Geometry = new THREE.BoxGeometry(12, 6, 10);
		var lab1 = new THREE.Mesh(lab1Geometry, materials.deepBlue);
		lab1.position.set(-20, -3, 0);
		scene.add(lab1);
		meshes.push(lab1);

		var lab2Geometry = new THREE.BoxGeometry(12, 6, 10);
		var lab2 = new THREE.Mesh(lab2Geometry, materials.deepBlue);
		lab2.position.set(20, -3, 0);
		scene.add(lab2);
		meshes.push(lab2);

		var equipmentGeometry = new THREE.CylinderGeometry(1, 1, 4, 8);
		var equipment1 = new THREE.Mesh(equipmentGeometry, materials.whiteMetal);
		equipment1.position.set(-20, -1, 0);
		scene.add(equipment1);
		meshes.push(equipment1);
		rotatingObjects.push({ mesh: equipment1, axis: 'y', speed: 0.003 });

		var equipment2 = new THREE.Mesh(equipmentGeometry, materials.whiteMetal);
		equipment2.position.set(20, -1, 0);
		scene.add(equipment2);
		meshes.push(equipment2);
		rotatingObjects.push({ mesh: equipment2, axis: 'y', speed: 0.003 });
	};

	var createControlCenter = function() {
		var centerGeometry = new THREE.BoxGeometry(8, 8, 8);
		var center = new THREE.Mesh(centerGeometry, materials.darkSteel);
		center.position.set(0, 4, 0);
		scene.add(center);
		meshes.push(center);

		var domeGeometry = new THREE.SphereGeometry(4.5, 16, 16);
		var domeMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, wireframe: false, metalness: 0.8, roughness: 0.2 });
		var dome = new THREE.Mesh(domeGeometry, domeMat);
		dome.position.set(0, 10, 0);
		scene.add(dome);
		meshes.push(dome);

		var consoleGeometry = new THREE.BoxGeometry(2, 3, 2);
		var consolePositions = [
			{ x: -2, z: -2 },
			{ x: 2, z: -2 },
			{ x: -2, z: 2 },
			{ x: 2, z: 2 }
		];

		consolePositions.forEach(function(pos) {
			var console1 = new THREE.Mesh(consoleGeometry, materials.cyan);
			console1.position.set(pos.x, 3, pos.z);
			scene.add(console1);
			meshes.push(console1);
			pulsingObjects.push({ mesh: console1, speed: 0.6, originalEmissive: 0x0080ff });
		});
	};

	var createContainmentFields = function() {
		var fieldPositions = [
			{ x: -35, z: -30, size: 6 },
			{ x: 35, z: -30, size: 6 },
			{ x: -35, z: 30, size: 6 },
			{ x: 35, z: 30, size: 6 }
		];

		fieldPositions.forEach(function(pos) {
			var fieldGeometry = new THREE.BoxGeometry(pos.size, 10, pos.size);
			var fieldMat = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ff00, emissive: 0x00ff00 });
			var field = new THREE.Mesh(fieldGeometry, fieldMat);
			field.position.set(pos.x, 5, pos.z);
			scene.add(field);
			meshes.push(field);

			var innerSphereGeometry = new THREE.SphereGeometry(2, 12, 12);
			var innerSphereMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x0080ff, transparent: true, opacity: 0.4 });
			var innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMat);
			innerSphere.position.set(pos.x, 5, pos.z);
			scene.add(innerSphere);
			meshes.push(innerSphere);
			riftObjects.push({ mesh: innerSphere, originalRadius: 2, minRadius: 1.5, maxRadius: 2.8, speed: 0.012 });
		});
	};

	var update = function(delta) {
		time += delta;

		pulsingObjects.forEach(function(obj) {
			var pulse = Math.sin(time * obj.speed) * 0.5 + 0.5;
			obj.mesh.material.emissiveIntensity = pulse;
		});

		riftObjects.forEach(function(obj) {
			if (obj.isPulse) {
				var scale = 1 + Math.sin(time * obj.speed) * 0.3;
				obj.mesh.scale.set(scale, scale, scale);
				obj.mesh.material.opacity = 0.2 + Math.sin(time * obj.speed * 0.7) * 0.15;
			} else {
				var scale = obj.originalRadius + Math.sin(time * obj.speed) * (obj.maxRadius - obj.originalRadius) * 0.5;
				var scaleRatio = scale / obj.originalRadius;
				obj.mesh.scale.set(scaleRatio, scaleRatio, scaleRatio);
			}
		});

		rotatingObjects.forEach(function(obj) {
			if (obj.centerX !== undefined) {
				var angle = time * obj.speed;
				obj.mesh.position.x = obj.centerX + Math.cos(angle) * obj.radius;
				obj.mesh.position.z = obj.centerZ + Math.sin(angle) * obj.radius;
			}
			if (obj.axis === 'y') {
				obj.mesh.rotation.y += obj.speed;
			} else if (obj.axis === 'x') {
				obj.mesh.rotation.x += obj.speed;
			}
		});
	};

	var reset = function() {
		while (meshes.length > 0) {
			var mesh = meshes.pop();
			scene.remove(mesh);
			if (mesh.geometry) mesh.geometry.dispose();
			if (mesh.material) {
				if (Array.isArray(mesh.material)) {
					mesh.material.forEach(function(mat) { mat.dispose(); });
				} else {
					mesh.material.dispose();
				}
			}
		}
		riftObjects = [];
		pulsingObjects = [];
		rotatingObjects = [];
		time = 0;
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
