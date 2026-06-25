window.RidgeBase = (function() {
	'use strict';

	var scene = null;
	var meshes = [];
	var ropes = [];
	var rotatingObjects = [];

	function buildTerrain() {
		var tierCount = 5;
		var tierHeight = 12;
		var tierWidth = 80;

		for (var i = 0; i < tierCount; i++) {
			var scale = 1 - (i * 0.15);
			var width = tierWidth * scale;
			var depth = tierWidth * scale;

			var geometry = new THREE.BoxGeometry(width, tierHeight, depth);
			var material = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
			var tier = new THREE.Mesh(geometry, material);

			tier.position.y = i * tierHeight + tierHeight / 2;
			tier.castShadow = true;
			tier.receiveShadow = true;
			scene.add(tier);
			meshes.push(tier);
		}
	}

	function buildArtillery() {
		var spacing = 25;
		var positions = [
			{ x: -30, z: -20 },
			{ x: 30, z: -15 },
			{ x: 0, z: -35 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];

			// Gun carriage (trail box)
			var trailGeometry = new THREE.BoxGeometry(8, 6, 16);
			var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
			var trail = new THREE.Mesh(trailGeometry, metalMaterial);
			trail.position.set(pos.x, 8, pos.z);
			trail.castShadow = true;
			scene.add(trail);
			meshes.push(trail);

			// Gun barrel (cylinder)
			var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 24, 8);
			var barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
			barrel.position.set(pos.x, 14, pos.z);
			barrel.rotation.z = 0.3 + (i * 0.15);
			barrel.castShadow = true;
			scene.add(barrel);
			meshes.push(barrel);
			rotatingObjects.push({ mesh: barrel, axis: 'z', speed: 0.01 });
		}
	}

	function buildAmmoBunkers() {
		var bunkerPositions = [
			{ x: -40, z: 15 },
			{ x: -15, z: 25 },
			{ x: 20, z: 20 }
		];

		for (var i = 0; i < bunkerPositions.length; i++) {
			var bpos = bunkerPositions[i];

			// Bunker box
			var bunkerGeometry = new THREE.BoxGeometry(18, 8, 12);
			var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
			var bunker = new THREE.Mesh(bunkerGeometry, concreteMaterial);
			bunker.position.set(bpos.x, 4, bpos.z);
			bunker.castShadow = true;
			bunker.receiveShadow = true;
			scene.add(bunker);
			meshes.push(bunker);

			// Earth cover cylinder on top
			var coverGeometry = new THREE.CylinderGeometry(10, 12, 6, 8);
			var earthMaterial = new THREE.MeshStandardMaterial({ color: 0x6B5344, roughness: 0.95 });
			var cover = new THREE.Mesh(coverGeometry, earthMaterial);
			cover.position.set(bpos.x, 10, bpos.z);
			cover.castShadow = true;
			scene.add(cover);
			meshes.push(cover);
		}
	}

	function buildObservationPost() {
		var peakX = 0;
		var peakY = 65;
		var peakZ = -45;

		// Tower (tall cylinder)
		var towerGeometry = new THREE.CylinderGeometry(3, 4, 18, 8);
		var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
		var tower = new THREE.Mesh(towerGeometry, metalMaterial);
		tower.position.set(peakX, peakY, peakZ);
		tower.castShadow = true;
		scene.add(tower);
		meshes.push(tower);

		// Observer platform (flat box)
		var platformGeometry = new THREE.BoxGeometry(12, 1.5, 12);
		var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
		var platform = new THREE.Mesh(platformGeometry, platformMaterial);
		platform.position.set(peakX, peakY + 10, peakZ);
		platform.castShadow = true;
		scene.add(platform);
		meshes.push(platform);

		// Binocular stand (small cone on platform)
		var standGeometry = new THREE.ConeGeometry(1.5, 2, 6);
		var stand = new THREE.Mesh(standGeometry, metalMaterial);
		stand.position.set(peakX + 3, peakY + 11.5, peakZ);
		stand.castShadow = true;
		scene.add(stand);
		meshes.push(stand);
		rotatingObjects.push({ mesh: stand, axis: 'y', speed: 0.02 });
	}

	function buildRappelPoints() {
		var rappelPositions = [
			{ x: -35, z: -50, length: 50 },
			{ x: 35, z: -50, length: 50 }
		];

		for (var i = 0; i < rappelPositions.length; i++) {
			var rpos = rappelPositions[i];

			// Rope anchor point (small box)
			var anchorGeometry = new THREE.BoxGeometry(2, 2, 2);
			var anchorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
			var anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
			anchor.position.set(rpos.x, 55, rpos.z);
			anchor.castShadow = true;
			scene.add(anchor);
			meshes.push(anchor);

			// Rope (LineSegments)
			var ropeGeometry = new THREE.BufferGeometry();
			var ropePositions = new Float32Array([
				0, 0, 0,
				0, -rpos.length, 0
			]);
			ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0xCCCCAA, linewidth: 2 });
			var rope = new THREE.LineSegments(ropeGeometry, lineMaterial);
			rope.position.set(rpos.x, 55, rpos.z);
			scene.add(rope);
			ropes.push(rope);
		}
	}

	function buildCommsDome() {
		var commX = 20;
		var commY = 50;
		var commZ = -15;

		// Pedestal (cylinder)
		var pedestalGeometry = new THREE.CylinderGeometry(3, 4, 8, 8);
		var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
		var pedestal = new THREE.Mesh(pedestalGeometry, metalMaterial);
		pedestal.position.set(commX, commY, commZ);
		pedestal.castShadow = true;
		scene.add(pedestal);
		meshes.push(pedestal);

		// Dome (sphere on top)
		var domeGeometry = new THREE.SphereGeometry(5, 16, 16);
		var domeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.3, roughness: 0.4 });
		var dome = new THREE.Mesh(domeGeometry, domeMaterial);
		dome.position.set(commX, commY + 9, commZ);
		dome.castShadow = true;
		scene.add(dome);
		meshes.push(dome);
		rotatingObjects.push({ mesh: dome, axis: 'y', speed: 0.005 });
	}

	function buildHelicopterPad() {
		var padX = -20;
		var padY = 20;
		var padZ = 35;

		// Pad cut-in (recessed box)
		var padGeometry = new THREE.BoxGeometry(28, 2, 28);
		var padMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
		var pad = new THREE.Mesh(padGeometry, padMaterial);
		pad.position.set(padX, padY, padZ);
		pad.castShadow = true;
		pad.receiveShadow = true;
		scene.add(pad);
		meshes.push(pad);

		// Landing circle guide (thin tall cylinder)
		var guideGeometry = new THREE.CylinderGeometry(14, 14, 0.5, 12);
		var guideMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0x444400, roughness: 0.6 });
		var guide = new THREE.Mesh(guideGeometry, guideMaterial);
		guide.position.set(padX, padY + 1.5, padZ);
		guide.castShadow = true;
		scene.add(guide);
		meshes.push(guide);
	}

	function init(newScene, camera) {
		scene = newScene;

		// Lighting
		var light = new THREE.DirectionalLight(0xFFFFFF, 0.8);
		light.position.set(50, 60, 40);
		light.castShadow = true;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		scene.add(light);

		var ambient = new THREE.AmbientLight(0xFFFFFF, 0.3);
		scene.add(ambient);

		// Build all structures
		buildTerrain();
		buildArtillery();
		buildAmmoBunkers();
		buildObservationPost();
		buildRappelPoints();
		buildCommsDome();
		buildHelicopterPad();

		return true;
	}

	function update(delta) {
		// Rotate dynamic elements
		for (var i = 0; i < rotatingObjects.length; i++) {
			var obj = rotatingObjects[i];
			var rotAmount = obj.speed * delta;

			if (obj.axis === 'y') {
				obj.mesh.rotation.y += rotAmount;
			} else if (obj.axis === 'z') {
				obj.mesh.rotation.z += rotAmount;
			}
		}
	}

	function reset() {
		// Remove all meshes
		for (var i = 0; i < meshes.length; i++) {
			scene.remove(meshes[i]);
		}
		meshes = [];

		// Remove all ropes
		for (var i = 0; i < ropes.length; i++) {
			scene.remove(ropes[i]);
		}
		ropes = [];

		rotatingObjects = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
