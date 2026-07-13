window.ChemPlant = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var lightsList = [];
	var rotatingFans = [];
	var bubbleEmitters = [];
	var flickeringLights = [];
	var time = 0;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		meshes = [];
		lightsList = [];
		rotatingFans = [];
		bubbleEmitters = [];
		flickeringLights = [];
		time = 0;

		buildStorageTanks();
		buildReactionTowers();
		buildPipelineNetwork();
		buildLoadingBay();
		buildControlRoom();
		buildFlareStacks();
		buildCatwalks();
		buildContainmentBerms();
		buildGuardCheckpoint();
		buildLighting();
	}

	function buildStorageTanks() {
		var tankPositions = [
			{ x: -30, z: -20, size: 8 },
			{ x: -15, z: -25, size: 7 },
			{ x: 0, z: -30, size: 9 },
			{ x: 20, z: -20, size: 7 }
		];

		for (var i = 0; i < tankPositions.length; i++) {
			var pos = tankPositions[i];
			var geometry = new THREE.CylinderGeometry(pos.size, pos.size, 25, 16);
			var material = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.7, roughness: 0.3 });
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(pos.x, 12.5, pos.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);

			var rimGeometry = new THREE.CylinderGeometry(pos.size + 0.5, pos.size, 1, 16);
			var rimMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
			var rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
			rimMesh.position.set(pos.x, 25.5, pos.z);
			rimMesh.castShadow = true;
			scene.add(rimMesh);
			meshes.push(rimMesh);

			var baseGeometry = new THREE.CylinderGeometry(pos.size + 1.5, pos.size + 1.5, 2, 16);
			var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
			baseMesh.position.set(pos.x, 1, pos.z);
			baseMesh.receiveShadow = true;
			scene.add(baseMesh);
			meshes.push(baseMesh);
		}
	}

	function buildReactionTowers() {
		var towerPositions = [
			{ x: 10, z: 15, radius: 4 },
			{ x: -25, z: 10, radius: 3.5 }
		];

		for (var i = 0; i < towerPositions.length; i++) {
			var pos = towerPositions[i];
			var geometry = new THREE.CylinderGeometry(pos.radius, pos.radius * 0.8, 35, 12);
			var material = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.6, roughness: 0.4 });
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(pos.x, 17.5, pos.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);

			var topGeometry = new THREE.ConeGeometry(pos.radius * 0.8, 6, 12);
			var topMaterial = new THREE.MeshStandardMaterial({ color: 0xff3300 });
			var topMesh = new THREE.Mesh(topGeometry, topMaterial);
			topMesh.position.set(pos.x, 34.5, pos.z);
			topMesh.castShadow = true;
			scene.add(topMesh);
			meshes.push(topMesh);

			bubbleEmitters.push({
				x: pos.x,
				z: pos.z,
				emissionRate: 2 + Math.random() * 1.5
			});
		}
	}

	function buildPipelineNetwork() {
		var pipeSegments = [
			{ x1: -30, z1: -20, x2: -15, z2: -25, y: 18 },
			{ x1: -15, z1: -25, x2: 0, z2: -30, y: 18 },
			{ x1: 0, z1: -30, x2: 20, z2: -20, y: 18 },
			{ x1: 10, z1: 15, x2: -25, z2: 10, y: 22 },
			{ x1: 20, z1: -20, x2: 30, z2: 0, y: 16 }
		];

		for (var i = 0; i < pipeSegments.length; i++) {
			var seg = pipeSegments[i];
			var dx = seg.x2 - seg.x1;
			var dz = seg.z2 - seg.z1;
			var distance = Math.sqrt(dx * dx + dz * dz);
			var angle = Math.atan2(dx, dz);

			var geometry = new THREE.CylinderGeometry(0.8, 0.8, distance, 8);
			var material = new THREE.MeshStandardMaterial({ color: 0x00aa00, metalness: 0.5, roughness: 0.5 });
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set((seg.x1 + seg.x2) / 2, seg.y, (seg.z1 + seg.z2) / 2);
			mesh.rotation.z = angle;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);

			for (var j = 0; j < 3; j++) {
				var valveGeometry = new THREE.SphereGeometry(1.2, 8, 8);
				var valveMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
				var valveMesh = new THREE.Mesh(valveGeometry, valveMaterial);
				var t = (j + 1) / 4;
				valveMesh.position.set(seg.x1 + dx * t, seg.y, seg.z1 + dz * t);
				valveMesh.castShadow = true;
				scene.add(valveMesh);
				meshes.push(valveMesh);
			}
		}
	}

	function buildLoadingBay() {
		var geometry = new THREE.BoxGeometry(25, 6, 15);
		var material = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.6 });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(35, 3, 30);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);
		meshes.push(mesh);

		var roofGeometry = new THREE.BoxGeometry(27, 1, 17);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
		var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
		roofMesh.position.set(35, 9.5, 30);
		roofMesh.castShadow = true;
		scene.add(roofMesh);
		meshes.push(roofMesh);

		var tankGeometry = new THREE.CylinderGeometry(5, 5, 18, 12);
		var tankMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
		var tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
		tankMesh.position.set(50, 9, 30);
		tankMesh.castShadow = true;
		scene.add(tankMesh);
		meshes.push(tankMesh);
	}

	function buildControlRoom() {
		var geometry = new THREE.BoxGeometry(15, 8, 12);
		var material = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(-35, 4, 25);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);
		meshes.push(mesh);

		var roofGeometry = new THREE.BoxGeometry(16, 1, 13);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x0f3460 });
		var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
		roofMesh.position.set(-35, 8.5, 25);
		roofMesh.castShadow = true;
		scene.add(roofMesh);
		meshes.push(roofMesh);

		var windowGeometry = new THREE.BoxGeometry(3, 3, 0.5);
		var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x0099ff, emissive: 0x0055aa });
		for (var i = 0; i < 3; i++) {
			var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
			windowMesh.position.set(-35 - 5 + i * 5, 5, 25 - 6.5);
			scene.add(windowMesh);
			meshes.push(windowMesh);
			flickeringLights.push(windowMesh);
		}
	}

	function buildFlareStacks() {
		var positions = [
			{ x: 25, z: -35 },
			{ x: -40, z: -15 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var stackGeometry = new THREE.CylinderGeometry(1.5, 2, 40, 8);
			var stackMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var stackMesh = new THREE.Mesh(stackGeometry, stackMaterial);
			stackMesh.position.set(pos.x, 20, pos.z);
			stackMesh.castShadow = true;
			stackMesh.receiveShadow = true;
			scene.add(stackMesh);
			meshes.push(stackMesh);

			var topGeometry = new THREE.ConeGeometry(1.5, 3, 8);
			var topMaterial = new THREE.MeshStandardMaterial({ color: 0xff3300 });
			var topMesh = new THREE.Mesh(topGeometry, topMaterial);
			topMesh.position.set(pos.x, 41.5, pos.z);
			topMesh.castShadow = true;
			scene.add(topMesh);
			meshes.push(topMesh);

			rotatingFans.push({
				x: pos.x,
				z: pos.z,
				rotationSpeed: 0.05 + Math.random() * 0.03
			});
		}
	}

	function buildCatwalks() {
		var walkPaths = [
			{ x1: -30, z1: -20, x2: -30, z2: 10, y: 20 },
			{ x1: 0, z1: -30, x2: 0, z2: 10, y: 18 },
			{ x1: 20, z1: -20, x2: 20, z2: 10, y: 17 }
		];

		for (var i = 0; i < walkPaths.length; i++) {
			var path = walkPaths[i];
			var dx = path.x2 - path.x1;
			var dz = path.z2 - path.z1;
			var distance = Math.sqrt(dx * dx + dz * dz);
			var angle = Math.atan2(dx, dz);

			var geometry = new THREE.BoxGeometry(2.5, 0.8, distance);
			var material = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.3 });
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set((path.x1 + path.x2) / 2, path.y, (path.z1 + path.z2) / 2);
			mesh.rotation.y = angle;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);

			var railGeometry = new THREE.BoxGeometry(0.3, 1.2, distance);
			var railMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
			var railMesh = new THREE.Mesh(railGeometry, railMaterial);
			railMesh.position.set((path.x1 + path.x2) / 2 + 1.3, path.y + 0.8, (path.z1 + path.z2) / 2);
			railMesh.rotation.y = angle;
			railMesh.castShadow = true;
			scene.add(railMesh);
			meshes.push(railMesh);
		}
	}

	function buildContainmentBerms() {
		var bermPositions = [
			{ x: -30, z: -20, length: 20, width: 4, height: 3 },
			{ x: 0, z: -30, length: 15, width: 4, height: 2.5 },
			{ x: 20, z: -20, length: 18, width: 4, height: 2.5 }
		];

		for (var i = 0; i < bermPositions.length; i++) {
			var berm = bermPositions[i];
			var geometry = new THREE.BoxGeometry(berm.width, berm.height, berm.length);
			var material = new THREE.MeshStandardMaterial({ color: 0x996633 });
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(berm.x, berm.height / 2, berm.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			meshes.push(mesh);
		}
	}

	function buildGuardCheckpoint() {
		var boothGeometry = new THREE.BoxGeometry(6, 4, 5);
		var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
		var boothMesh = new THREE.Mesh(boothGeometry, boothMaterial);
		boothMesh.position.set(-50, 2, 0);
		boothMesh.castShadow = true;
		boothMesh.receiveShadow = true;
		scene.add(boothMesh);
		meshes.push(boothMesh);

		var roofGeometry = new THREE.BoxGeometry(7, 0.8, 6);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
		var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
		roofMesh.position.set(-50, 4.4, 0);
		roofMesh.castShadow = true;
		scene.add(roofMesh);
		meshes.push(roofMesh);

		var barrier1Geometry = new THREE.BoxGeometry(4, 1.5, 0.8);
		var barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
		var barrier1Mesh = new THREE.Mesh(barrier1Geometry, barrierMaterial);
		barrier1Mesh.position.set(-42, 0.75, -8);
		barrier1Mesh.castShadow = true;
		scene.add(barrier1Mesh);
		meshes.push(barrier1Mesh);

		var barrier2Mesh = new THREE.Mesh(barrier1Geometry, barrierMaterial);
		barrier2Mesh.position.set(-42, 0.75, 8);
		barrier2Mesh.castShadow = true;
		scene.add(barrier2Mesh);
		meshes.push(barrier2Mesh);
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lightsList.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(30, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -80;
		directionalLight.shadow.camera.right = 80;
		directionalLight.shadow.camera.top = 80;
		directionalLight.shadow.camera.bottom = -80;
		directionalLight.shadow.camera.far = 100;
		scene.add(directionalLight);
		lightsList.push(directionalLight);

		var emergencyLight1 = new THREE.PointLight(0xff3300, 1.5, 30);
		emergencyLight1.position.set(10, 35, 15);
		emergencyLight1.castShadow = true;
		scene.add(emergencyLight1);
		lightsList.push(emergencyLight1);
		flickeringLights.push(emergencyLight1);

		var emergencyLight2 = new THREE.PointLight(0xff3300, 1.5, 30);
		emergencyLight2.position.set(-25, 35, 10);
		emergencyLight2.castShadow = true;
		scene.add(emergencyLight2);
		lightsList.push(emergencyLight2);
		flickeringLights.push(emergencyLight2);

		var chemLight1 = new THREE.PointLight(0x00ff00, 0.8, 25);
		chemLight1.position.set(10, 28, 15);
		scene.add(chemLight1);
		lightsList.push(chemLight1);

		var chemLight2 = new THREE.PointLight(0x0099ff, 0.7, 20);
		chemLight2.position.set(-35, 8, 25);
		scene.add(chemLight2);
		lightsList.push(chemLight2);
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < rotatingFans.length; i++) {
			var fan = rotatingFans[i];
		}

		for (var i = 0; i < flickeringLights.length; i++) {
			var light = flickeringLights[i];
			if (light.intensity !== undefined) {
				var baseIntensity = light instanceof THREE.PointLight ? 1.5 : 0.8;
				var flicker = Math.sin(time * 3 + i) * 0.3 + 0.7;
				light.intensity = baseIntensity * flicker;
			}
		}

		for (var i = 0; i < meshes.length; i++) {
			var mesh = meshes[i];
			if (mesh.userData.isBubble) {
				mesh.position.y += delta * 3;
				mesh.material.opacity -= delta * 0.5;
				if (mesh.material.opacity <= 0) {
					scene.remove(mesh);
					meshes.splice(i, 1);
					i--;
				}
			}
		}

		if (time % 0.3 < delta * 2) {
			for (var i = 0; i < bubbleEmitters.length; i++) {
				var emitter = bubbleEmitters[i];
				var bubblesThisFrame = Math.floor(emitter.emissionRate * delta);
				for (var j = 0; j < bubblesThisFrame; j++) {
					var bubbleGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 6);
					var bubbleMaterial = new THREE.MeshStandardMaterial({
						color: 0xff9900,
						transparent: true,
						opacity: 0.6,
						emissive: 0xff6600
					});
					var bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
					bubbleMesh.position.set(
						emitter.x + (Math.random() - 0.5) * 3,
						20 + Math.random() * 10,
						emitter.z + (Math.random() - 0.5) * 3
					);
					bubbleMesh.userData.isBubble = true;
					scene.add(bubbleMesh);
					meshes.push(bubbleMesh);
				}
			}
		}
	}

	function reset() {
		for (var i = meshes.length - 1; i >= 0; i--) {
			scene.remove(meshes[i]);
		}
		meshes = [];

		for (var i = lightsList.length - 1; i >= 0; i--) {
			scene.remove(lightsList[i]);
		}
		lightsList = [];

		rotatingFans = [];
		bubbleEmitters = [];
		flickeringLights = [];
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
