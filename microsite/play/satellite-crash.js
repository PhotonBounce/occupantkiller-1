window.SatelliteCrash = (function() {
	'use strict';

	var meshes = [];
	var materials = [];
	var lights = [];
	var scene = null;
	var camera = null;
	var countdownValue = 120;
	var timeSinceLastBlink = 0;
	var hudElement = null;
	var intelSecured = false;
	var drones = [];
	var fireParticles = [];
	var countdownDisplay = null;
	var beaconSphere = null;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		countdownValue = 120;
		timeSinceLastBlink = 0;
		intelSecured = false;
		drones = [];
		fireParticles = [];

		// 1. Forest ground — dark green textured flat box (400×0.3×400)
		var groundGeom = new THREE.BoxGeometry(400, 0.3, 400);
		var groundMat = new THREE.MeshLambertMaterial({ color: 0x2d4a1e });
		var ground = new THREE.Mesh(groundGeom, groundMat);
		ground.position.y = -0.15;
		ground.receiveShadow = true;
		scene.add(ground);
		meshes.push(ground);
		materials.push(groundMat);

		// 2. Main satellite wreck — large metallic box (15×3×8) crumpled
		var satelliteGeom = new THREE.BoxGeometry(15, 3, 8);
		var satelliteMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
		var satellite = new THREE.Mesh(satelliteGeom, satelliteMat);
		satellite.position.set(0, 2, 0);
		satellite.rotation.z = 0.15;
		satellite.castShadow = true;
		satellite.receiveShadow = true;
		scene.add(satellite);
		meshes.push(satellite);
		materials.push(satelliteMat);

		// 3. Crater around crash site — circular depression effect
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var craterGeom = new THREE.BoxGeometry(8, 0.5, 8);
			var craterMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var craterSegment = new THREE.Mesh(craterGeom, craterMat);
			var radius = 25;
			craterSegment.position.set(Math.cos(angle) * radius, 0.2, Math.sin(angle) * radius);
			craterSegment.receiveShadow = true;
			scene.add(craterSegment);
			meshes.push(craterSegment);
			materials.push(craterMat);
		}

		// 4. Solar panels scattered — flat thin boxes (4×0.1×2)
		var panelPositions = [
			{ x: 20, z: 15, rotZ: 0.3, rotX: 0.1 },
			{ x: -18, z: 20, rotZ: -0.4, rotX: 0.2 },
			{ x: 15, z: -22, rotZ: 0.2, rotX: -0.15 },
			{ x: -25, z: -18, rotZ: -0.3, rotX: 0.25 }
		];
		for (var p = 0; p < panelPositions.length; p++) {
			var panelGeom = new THREE.BoxGeometry(4, 0.1, 2);
			var panelMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, metalness: 0.6, roughness: 0.2 });
			var panel = new THREE.Mesh(panelGeom, panelMat);
			var pos = panelPositions[p];
			panel.position.set(pos.x, 1.5, pos.z);
			panel.rotation.z = pos.rotZ;
			panel.rotation.x = pos.rotX;
			panel.castShadow = true;
			scene.add(panel);
			meshes.push(panel);
			materials.push(panelMat);
		}

		// 5. Pine trees — dark brown cylinder trunks + dark cone-shaped box tops
		var treePositions = [
			{ x: -60, z: -50 },
			{ x: 70, z: -60 },
			{ x: 80, z: 40 },
			{ x: -75, z: 65 },
			{ x: 55, z: 70 }
		];
		for (var t = 0; t < treePositions.length; t++) {
			var treePos = treePositions[t];
			// Trunk
			var trunkGeom = new THREE.CylinderGeometry(2, 2.5, 12, 8);
			var trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
			var trunk = new THREE.Mesh(trunkGeom, trunkMat);
			trunk.position.set(treePos.x, 6, treePos.z);
			trunk.castShadow = true;
			trunk.receiveShadow = true;
			scene.add(trunk);
			meshes.push(trunk);
			materials.push(trunkMat);

			// Canopy (cone shape using box)
			var canopyGeom = new THREE.BoxGeometry(8, 14, 8);
			var canopyMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a });
			var canopy = new THREE.Mesh(canopyGeom, canopyMat);
			canopy.position.set(treePos.x, 16, treePos.z);
			canopy.castShadow = true;
			canopy.receiveShadow = true;
			scene.add(canopy);
			meshes.push(canopy);
			materials.push(canopyMat);
		}

		// 6. Debris chunks — irregular small boxes of metal gray scattered 20-50 units
		var debrisCount = 6;
		for (var d = 0; d < debrisCount; d++) {
			var angle = (d / debrisCount) * Math.PI * 2;
			var distance = 25 + Math.random() * 25;
			var debrisGeom = new THREE.BoxGeometry(2 + Math.random() * 2, 1 + Math.random() * 1.5, 2 + Math.random() * 2);
			var debrisMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.4 });
			var debris = new THREE.Mesh(debrisGeom, debrisMat);
			debris.position.set(Math.cos(angle) * distance, 0.5 + Math.random() * 0.5, Math.sin(angle) * distance);
			debris.rotation.x = Math.random() * Math.PI;
			debris.rotation.y = Math.random() * Math.PI;
			debris.castShadow = true;
			debris.receiveShadow = true;
			scene.add(debris);
			meshes.push(debris);
			materials.push(debrisMat);
		}

		// 7. Radiation exclusion zone markers — yellow hazard boxes on poles
		var hazardRings = 2;
		var hazardsPerRing = 6;
		for (var hr = 0; hr < hazardRings; hr++) {
			var ringRadius = 35 + hr * 15;
			for (var h = 0; h < hazardsPerRing; h++) {
				var hazardAngle = (h / hazardsPerRing) * Math.PI * 2;
				// Pole
				var poleGeom = new THREE.BoxGeometry(0.5, 6, 0.5);
				var poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
				var pole = new THREE.Mesh(poleGeom, poleMat);
				pole.position.set(Math.cos(hazardAngle) * ringRadius, 3, Math.sin(hazardAngle) * ringRadius);
				pole.castShadow = true;
				scene.add(pole);
				meshes.push(pole);
				materials.push(poleMat);

				// Hazard box
				var hazardGeom = new THREE.BoxGeometry(2, 2, 0.3);
				var hazardMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.4 });
				var hazard = new THREE.Mesh(hazardGeom, hazardMat);
				hazard.position.set(Math.cos(hazardAngle) * ringRadius, 6.5, Math.sin(hazardAngle) * ringRadius);
				hazard.castShadow = true;
				scene.add(hazard);
				meshes.push(hazard);
				materials.push(hazardMat);
			}
		}

		// 8. Recovery team soldiers (blue) — approaching from north
		for (var b = 0; b < 4; b++) {
			var blueX = -15 + b * 10;
			var blueZ = -70;
			// Body
			var blueSoldierGeom = new THREE.BoxGeometry(1.5, 2, 1);
			var blueSoldierMat = new THREE.MeshLambertMaterial({ color: 0x0066ff });
			var blueSoldier = new THREE.Mesh(blueSoldierGeom, blueSoldierMat);
			blueSoldier.position.set(blueX, 1, blueZ);
			blueSoldier.castShadow = true;
			blueSoldier.receiveShadow = true;
			scene.add(blueSoldier);
			meshes.push(blueSoldier);
			materials.push(blueSoldierMat);

			// Equipment pack
			var packGeom = new THREE.BoxGeometry(1, 1.5, 0.5);
			var packMat = new THREE.MeshLambertMaterial({ color: 0x004499 });
			var pack = new THREE.Mesh(packGeom, packMat);
			pack.position.set(blueX, 2.5, blueZ - 0.5);
			pack.castShadow = true;
			scene.add(pack);
			meshes.push(pack);
			materials.push(packMat);
		}

		// 9. Rival mercenaries (gray) — approaching from south
		for (var g = 0; g < 4; g++) {
			var grayX = -15 + g * 10;
			var grayZ = 70;
			// Body
			var graySoldierGeom = new THREE.BoxGeometry(1.5, 2, 1);
			var graySoldierMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var graySoldier = new THREE.Mesh(graySoldierGeom, graySoldierMat);
			graySoldier.position.set(grayX, 1, grayZ);
			graySoldier.castShadow = true;
			graySoldier.receiveShadow = true;
			scene.add(graySoldier);
			meshes.push(graySoldier);
			materials.push(graySoldierMat);

			// Equipment pack
			var grayPackGeom = new THREE.BoxGeometry(1, 1.5, 0.5);
			var grayPackMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var grayPack = new THREE.Mesh(grayPackGeom, grayPackMat);
			grayPack.position.set(grayX, 2.5, grayZ + 0.5);
			grayPack.castShadow = true;
			scene.add(grayPack);
			meshes.push(grayPack);
			materials.push(grayPackMat);
		}

		// 10. Recovery drones — box body + 4 rotor arms + emissive camera sphere
		for (var dr = 0; dr < 2; dr++) {
			var droneAngle = dr * Math.PI;
			var droneDistance = 15;
			var droneX = Math.cos(droneAngle) * droneDistance;
			var droneZ = Math.sin(droneAngle) * droneDistance;

			// Body
			var droneBodyGeom = new THREE.BoxGeometry(2, 1.5, 2);
			var droneBodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
			var droneBody = new THREE.Mesh(droneBodyGeom, droneBodyMat);
			droneBody.position.set(droneX, 20, droneZ);
			droneBody.castShadow = true;
			scene.add(droneBody);
			meshes.push(droneBody);
			materials.push(droneBodyMat);

			// Rotor arms
			for (var arm = 0; arm < 4; arm++) {
				var armAngle = (arm / 4) * Math.PI * 2;
				var armRotGeom = new THREE.BoxGeometry(0.2, 0.2, 3);
				var armRotMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
				var armRot = new THREE.Mesh(armRotGeom, armRotMat);
				armRot.position.set(droneX + Math.cos(armAngle) * 1.5, 20, droneZ + Math.sin(armAngle) * 1.5);
				armRot.rotation.z = armAngle;
				armRot.castShadow = true;
				scene.add(armRot);
				meshes.push(armRot);
				materials.push(armRotMat);
			}

			// Camera sphere
			var cameraGeom = new THREE.SphereGeometry(0.4, 8, 8);
			var cameraMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.6 });
			var camera_sphere = new THREE.Mesh(cameraGeom, cameraMat);
			camera_sphere.position.set(droneX, 19, droneZ);
			camera_sphere.castShadow = true;
			scene.add(camera_sphere);
			meshes.push(camera_sphere);
			materials.push(cameraMat);

			// Store drone reference for animation
			drones.push({
				body: droneBody,
				baseY: 20,
				camera: camera_sphere,
				orbitAngle: droneAngle,
				orbitDistance: droneDistance
			});
		}

		// 11. Satellite electronics module — glowing blue emissive box
		var electronicsGeom = new THREE.BoxGeometry(3, 2, 3);
		var electronicsMat = new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 0.8 });
		var electronics = new THREE.Mesh(electronicsGeom, electronicsMat);
		electronics.position.set(0, 3, 0);
		electronics.castShadow = true;
		scene.add(electronics);
		meshes.push(electronics);
		materials.push(electronicsMat);

		// 12. Emergency beacon — tall thin pole + red blinking emissive sphere
		var beaconPoleGeom = new THREE.BoxGeometry(0.3, 15, 0.3);
		var beaconPoleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var beaconPole = new THREE.Mesh(beaconPoleGeom, beaconPoleMat);
		beaconPole.position.set(10, 7.5, 10);
		beaconPole.castShadow = true;
		scene.add(beaconPole);
		meshes.push(beaconPole);
		materials.push(beaconPoleMat);

		var beaconSphereGeom = new THREE.SphereGeometry(0.8, 16, 16);
		var beaconSphereMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
		beaconSphere = new THREE.Mesh(beaconSphereGeom, beaconSphereMat);
		beaconSphere.position.set(10, 15.5, 10);
		beaconSphere.castShadow = true;
		scene.add(beaconSphere);
		meshes.push(beaconSphere);
		materials.push(beaconSphereMat);

		// 13. Countdown display — box with red emissive glow
		var countdownGeom = new THREE.BoxGeometry(3, 2, 0.5);
		var countdownMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0xff0000, emissiveIntensity: 0.7 });
		countdownDisplay = new THREE.Mesh(countdownGeom, countdownMat);
		countdownDisplay.position.set(-10, 4, -15);
		countdownDisplay.castShadow = true;
		scene.add(countdownDisplay);
		meshes.push(countdownDisplay);
		materials.push(countdownMat);

		// 14. Forest fire patches — 3 clusters of orange/red emissive spheres
		var firePositions = [
			{ x: -80, z: 30 },
			{ x: 60, z: -80 },
			{ x: -70, z: -65 }
		];
		for (var f = 0; f < firePositions.length; f++) {
			var firePos = firePositions[f];
			for (var fcluster = 0; fcluster < 3; fcluster++) {
				var fireGeom = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
				var fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.8 });
				var fire = new THREE.Mesh(fireGeom, fireMat);
				var offsetX = (Math.random() - 0.5) * 8;
				var offsetZ = (Math.random() - 0.5) * 8;
				fire.position.set(firePos.x + offsetX, 3 + Math.random() * 2, firePos.z + offsetZ);
				fire.castShadow = true;
				scene.add(fire);
				meshes.push(fire);
				materials.push(fireMat);
				fireParticles.push({
					mesh: fire,
					baseIntensity: 0.8 + Math.random() * 0.2,
					flickerSpeed: 1 + Math.random() * 2
				});
			}
		}

		// 15. Extraction helicopter — parked at clearing
		var heloX = -50;
		var heloZ = -50;
		// Body
		var heloBodyGeom = new THREE.BoxGeometry(4, 2, 10);
		var heloBodyMat = new THREE.MeshLambertMaterial({ color: 0x1a5a1a });
		var heloBody = new THREE.Mesh(heloBodyGeom, heloBodyMat);
		heloBody.position.set(heloX, 2, heloZ);
		heloBody.castShadow = true;
		heloBody.receiveShadow = true;
		scene.add(heloBody);
		meshes.push(heloBody);
		materials.push(heloBodyMat);

		// Rotor disk
		var rotorGeom = new THREE.BoxGeometry(12, 0.2, 1);
		var rotorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var rotor = new THREE.Mesh(rotorGeom, rotorMat);
		rotor.position.set(heloX, 4.5, heloZ);
		rotor.castShadow = true;
		scene.add(rotor);
		meshes.push(rotor);
		materials.push(rotorMat);

		// Tail boom
		var tailGeom = new THREE.BoxGeometry(0.5, 0.8, 6);
		var tailMat = new THREE.MeshLambertMaterial({ color: 0x1a5a1a });
		var tail = new THREE.Mesh(tailGeom, tailMat);
		tail.position.set(heloX - 1, 2.5, heloZ + 7);
		tail.castShadow = true;
		scene.add(tail);
		meshes.push(tail);
		materials.push(tailMat);

		// 16. Hazmat containers — yellow box containers with black hazard markings
		var containerPositions = [
			{ x: -18, z: 5 },
			{ x: 8, z: -25 },
			{ x: -12, z: -8 }
		];
		for (var c = 0; c < containerPositions.length; c++) {
			var contPos = containerPositions[c];
			// Main container
			var contGeom = new THREE.BoxGeometry(2, 2.5, 2);
			var contMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var container = new THREE.Mesh(contGeom, contMat);
			container.position.set(contPos.x, 1.25, contPos.z);
			container.castShadow = true;
			container.receiveShadow = true;
			scene.add(container);
			meshes.push(container);
			materials.push(contMat);

			// Hazard stripe (black box on front)
			var stripeGeom = new THREE.BoxGeometry(1.5, 1.5, 0.2);
			var stripeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
			var stripe = new THREE.Mesh(stripeGeom, stripeMat);
			stripe.position.set(contPos.x, 1.5, contPos.z + 1.1);
			stripe.castShadow = true;
			scene.add(stripe);
			meshes.push(stripe);
			materials.push(stripeMat);
		}

		// Add lights
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 50, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 200;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);
		lights.push(directionalLight);

		// Create HUD
		createHUD();
	}

	function createHUD() {
		if (hudElement) {
			document.body.removeChild(hudElement);
		}

		hudElement = document.createElement('div');
		hudElement.id = 'satellite-crash-hud';
		hudElement.style.position = 'absolute';
		hudElement.style.top = '20px';
		hudElement.style.left = '20px';
		hudElement.style.fontFamily = 'monospace';
		hudElement.style.fontSize = '16px';
		hudElement.style.color = '#00ff00';
		hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		hudElement.style.padding = '15px';
		hudElement.style.border = '2px solid #00ff00';
		hudElement.style.zIndex = '1000';
		hudElement.style.textShadow = '0 0 10px #00ff00';

		hudElement.innerHTML = 'COUNTDOWN: 120s<br>INTEL SECURED: NO<br>TEAMS ON SITE: 2';
		document.body.appendChild(hudElement);
	}

	function updateHUD() {
		if (hudElement) {
			var intelStatus = intelSecured ? 'YES' : 'NO';
			hudElement.innerHTML = 'COUNTDOWN: ' + Math.max(0, Math.floor(countdownValue)) + 's<br>INTEL SECURED: ' + intelStatus + '<br>TEAMS ON SITE: 2';
		}
	}

	function update(delta) {
		if (!scene) return;

		// Decrement countdown
		countdownValue -= delta;
		if (countdownValue < 0) countdownValue = 0;

		// Pulse countdown display
		if (countdownDisplay) {
			var pulseIntensity = 0.5 + Math.abs(Math.sin(countdownValue * 3)) * 0.5;
			countdownDisplay.material.emissiveIntensity = pulseIntensity;
		}

		// Blink beacon
		if (beaconSphere) {
			timeSinceLastBlink += delta;
			if (timeSinceLastBlink > 0.5) {
				timeSinceLastBlink = 0;
				beaconSphere.material.opacity = beaconSphere.material.opacity < 0.5 ? 1.0 : 0.3;
			}
		}

		// Animate drones
		for (var d = 0; d < drones.length; d++) {
			var drone = drones[d];
			drone.body.position.y = drone.baseY + Math.sin(Date.now() * 0.001 + d) * 3;

			// Orbit around crash site
			drone.orbitAngle += delta * 0.5;
			var orbitX = Math.cos(drone.orbitAngle) * drone.orbitDistance;
			var orbitZ = Math.sin(drone.orbitAngle) * drone.orbitDistance;
			drone.body.position.x = orbitX;
			drone.body.position.z = orbitZ;

			drone.camera.position.copy(drone.body.position);
			drone.camera.position.y -= 1;
		}

		// Flicker fire
		for (var f = 0; f < fireParticles.length; f++) {
			var firePart = fireParticles[f];
			var flickerVal = Math.sin(Date.now() * firePart.flickerSpeed * 0.001) * 0.3;
			firePart.mesh.material.emissiveIntensity = firePart.baseIntensity + flickerVal;
		}

		// Rotate rotor blades
		for (var m = 0; m < meshes.length; m++) {
			if (meshes[m].geometry instanceof THREE.BoxGeometry &&
				meshes[m].position.length !== undefined &&
				(Math.abs(meshes[m].position.x - (-50)) < 0.1 &&
				 Math.abs(meshes[m].position.z - (-50)) < 0.1 &&
				 Math.abs(meshes[m].position.y - 4.5) < 0.1)) {
				meshes[m].rotation.x += delta * 5;
			}
		}

		updateHUD();
	}

	function reset() {
		// Dispose all geometry and materials
		for (var i = 0; i < meshes.length; i++) {
			scene.remove(meshes[i]);
			if (meshes[i].geometry) meshes[i].geometry.dispose();
			if (meshes[i].material) {
				if (Array.isArray(meshes[i].material)) {
					for (var j = 0; j < meshes[i].material.length; j++) {
						meshes[i].material[j].dispose();
					}
				} else {
					meshes[i].material.dispose();
				}
			}
		}

		for (var l = 0; l < lights.length; l++) {
			scene.remove(lights[l]);
		}

		meshes = [];
		materials = [];
		lights = [];
		drones = [];
		fireParticles = [];
		countdownValue = 120;
		timeSinceLastBlink = 0;
		beaconSphere = null;
		countdownDisplay = null;

		// Remove HUD
		if (hudElement && document.body.contains(hudElement)) {
			document.body.removeChild(hudElement);
			hudElement = null;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
