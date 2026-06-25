window.LaboratoryRaid = (function() {
	'use strict';

	var scene, camera;
	var geometries = [];
	var materials = [];
	var meshes = [];
	var hudElement = null;
	var animationState = {
		centrifugeRotation: 0,
		breachLightToggle: 0,
		shutterPosition: 0,
		scientistsRescued: 0,
		infiltratorProgress: 0
	};

	function createGeometryAndMaterial(geometry, materialOptions) {
		geometries.push(geometry);
		var material = new THREE.MeshStandardMaterial(materialOptions);
		materials.push(material);
		return material;
	}

	function addMeshToScene(geometry, material, x, y, z) {
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		scene.add(mesh);
		meshes.push(mesh);
		return mesh;
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		// 1. Lab floor - sterile white flat box
		var floorGeometry = new THREE.BoxGeometry(400, 0.2, 400);
		var floorMaterial = createGeometryAndMaterial(floorGeometry, { color: 0xf0f0f0, roughness: 0.3 });
		addMeshToScene(floorGeometry, floorMaterial, 0, 0, 0);

		// 2. Main laboratory room - white wall boxes
		var northWall = new THREE.BoxGeometry(400, 12, 1);
		var wallMaterial = createGeometryAndMaterial(northWall, { color: 0xffffff, roughness: 0.4 });
		addMeshToScene(northWall, wallMaterial, 0, 6, -20);

		var southWall = new THREE.BoxGeometry(400, 12, 1);
		var southWallMaterial = createGeometryAndMaterial(southWall, { color: 0xffffff, roughness: 0.4 });
		addMeshToScene(southWall, southWallMaterial, 0, 6, 20);

		var eastWall = new THREE.BoxGeometry(1, 12, 40);
		var eastWallMaterial = createGeometryAndMaterial(eastWall, { color: 0xffffff, roughness: 0.4 });
		addMeshToScene(eastWall, eastWallMaterial, 200, 6, 0);

		var westWall = new THREE.BoxGeometry(1, 12, 40);
		var westWallMaterial = createGeometryAndMaterial(westWall, { color: 0xffffff, roughness: 0.4 });
		addMeshToScene(westWall, westWallMaterial, -200, 6, 0);

		// 3. Research benches - long white box tables in rows
		var benchGeometry = new THREE.BoxGeometry(80, 0.8, 3);
		var benchMaterial = createGeometryAndMaterial(benchGeometry, { color: 0xe8e8e8, roughness: 0.5 });
		for (var i = 0; i < 4; i++) {
			addMeshToScene(new THREE.BoxGeometry(80, 0.8, 3), benchMaterial, -60 + i * 40, 1, -8);
		}

		// Colored equipment on benches
		var equipmentGeometry = new THREE.BoxGeometry(8, 6, 4);
		var equipmentMaterials = [
			createGeometryAndMaterial(new THREE.BoxGeometry(8, 6, 4), { color: 0xff6b6b }),
			createGeometryAndMaterial(new THREE.BoxGeometry(8, 6, 4), { color: 0x4ecdc4 }),
			createGeometryAndMaterial(new THREE.BoxGeometry(8, 6, 4), { color: 0xffe66d }),
			createGeometryAndMaterial(new THREE.BoxGeometry(8, 6, 4), { color: 0x95e1d3 })
		];
		for (var j = 0; j < 8; j++) {
			addMeshToScene(
				new THREE.BoxGeometry(8, 6, 4),
				equipmentMaterials[j % 4],
				-70 + j * 18,
				4.5,
				-8
			);
		}

		// 4. Centrifuge machines - cylinder shapes with spinning rotor disc
		for (var c = 0; c < 4; c++) {
			var baseGeometry = new THREE.BoxGeometry(12, 8, 12);
			var baseMaterial = createGeometryAndMaterial(baseGeometry, { color: 0xcccccc });
			var centrifugeMesh = addMeshToScene(baseGeometry, baseMaterial, -80 + c * 50, 4, 10);
			centrifugeMesh.userData.type = 'centrifuge';

			var rotorGeometry = new THREE.BoxGeometry(10, 0.5, 10);
			var rotorMaterial = createGeometryAndMaterial(rotorGeometry, { color: 0x888888 });
			var rotorMesh = addMeshToScene(rotorGeometry, rotorMaterial, -80 + c * 50, 8.5, 10);
			rotorMesh.userData.type = 'rotor';
		}

		// 5. Specimen storage - 8 tall narrow box cabinets in cold blue
		var storageGeometry = new THREE.BoxGeometry(6, 10, 4);
		var storageMaterial = createGeometryAndMaterial(storageGeometry, {
			color: 0x1e90ff,
			emissive: 0x0047ab,
			emissiveIntensity: 0.3,
			roughness: 0.2
		});
		for (var s = 0; s < 8; s++) {
			addMeshToScene(new THREE.BoxGeometry(6, 10, 4), storageMaterial, -70 + s * 20, 5, 15);
		}

		// 6. Scientists - 5 white lab coat box figures with raised hands
		for (var sci = 0; sci < 5; sci++) {
			var coatGeometry = new THREE.BoxGeometry(2, 4, 1.5);
			var coatMaterial = createGeometryAndMaterial(coatGeometry, { color: 0xffffff });
			var scientist = addMeshToScene(coatGeometry, coatMaterial, -80 + sci * 30, 2, -12);
			scientist.userData.type = 'scientist';

			var headGeometry = new THREE.BoxGeometry(1, 1.2, 1);
			var headMaterial = createGeometryAndMaterial(headGeometry, { color: 0xe0c9a6 });
			addMeshToScene(headGeometry, headMaterial, -80 + sci * 30, 4.5, -12);

			var handGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
			var handMaterial = createGeometryAndMaterial(handGeometry, { color: 0xe0c9a6 });
			addMeshToScene(handGeometry, handMaterial, -82 + sci * 30, 4.5, -12);
			addMeshToScene(handGeometry, handMaterial, -78 + sci * 30, 4.5, -12);
		}

		// 7. Facility security guards - 4 black uniform box figures
		for (var g = 0; g < 4; g++) {
			var uniformGeometry = new THREE.BoxGeometry(2, 4, 1.5);
			var uniformMaterial = createGeometryAndMaterial(uniformGeometry, { color: 0x1a1a1a });
			var guard = addMeshToScene(uniformGeometry, uniformMaterial, -60 + g * 40, 2, 5);
			guard.userData.type = 'guard';

			var guardHeadGeometry = new THREE.BoxGeometry(1, 1.2, 1);
			var guardHeadMaterial = createGeometryAndMaterial(guardHeadGeometry, { color: 0x2d2d2d });
			addMeshToScene(guardHeadGeometry, guardHeadMaterial, -60 + g * 40, 4.5, 5);

			var gunGeometry = new THREE.BoxGeometry(0.4, 0.5, 2);
			var gunMaterial = createGeometryAndMaterial(gunGeometry, { color: 0x333333 });
			addMeshToScene(gunGeometry, gunMaterial, -59 + g * 40, 3, 4);
		}

		// 8. Special ops infiltrators - 4 dark gray box figures
		for (var inf = 0; inf < 4; inf++) {
			var tacticGeometry = new THREE.BoxGeometry(2, 4, 1.5);
			var tacticMaterial = createGeometryAndMaterial(tacticGeometry, { color: 0x333333 });
			var infiltrator = addMeshToScene(tacticGeometry, tacticMaterial, -150 + inf * 15, 2, -8);
			infiltrator.userData.type = 'infiltrator';
		}

		// 9. Biohazard containment unit - large sealed box room
		var containmentGeometry = new THREE.BoxGeometry(50, 10, 40);
		var containmentMaterial = createGeometryAndMaterial(containmentGeometry, {
			color: 0xffff00,
			emissive: 0xffaa00,
			emissiveIntensity: 0.2,
			roughness: 0.1
		});
		var containmentMesh = addMeshToScene(containmentGeometry, containmentMaterial, 120, 5, 0);
		containmentMesh.userData.type = 'containment';

		// Hazard markings - yellow and black stripes (box approximation)
		var hazardGeometry = new THREE.BoxGeometry(2, 10, 40);
		var hazardMaterial = createGeometryAndMaterial(hazardGeometry, { color: 0x000000 });
		addMeshToScene(hazardGeometry, hazardMaterial, 100, 5, 0);
		addMeshToScene(hazardGeometry, hazardMaterial, 140, 5, 0);

		// 10. Containment breach warning lights - 4 red emissive spheres at corners
		var lightGeometry = new THREE.IcosahedronGeometry(3, 2);
		var lightMaterial = createGeometryAndMaterial(lightGeometry, {
			color: 0xff0000,
			emissive: 0xff0000,
			emissiveIntensity: 0.8
		});
		addMeshToScene(lightGeometry, lightMaterial, -190, 11, -18);
		addMeshToScene(lightGeometry, lightMaterial, 190, 11, -18);
		addMeshToScene(lightGeometry, lightMaterial, -190, 11, 18);
		addMeshToScene(lightGeometry, lightMaterial, 190, 11, 18);

		// 11. Virus containment tubes - 12 small emissive green cylinder-box tubes
		var tubeGeometry = new THREE.BoxGeometry(1.5, 8, 1.5);
		var tubeMaterial = createGeometryAndMaterial(tubeGeometry, {
			color: 0x00ff00,
			emissive: 0x00aa00,
			emissiveIntensity: 0.6
		});
		for (var t = 0; t < 12; t++) {
			var tubeX = 90 + (t % 4) * 8;
			var tubeZ = -10 + Math.floor(t / 4) * 8;
			var tube = addMeshToScene(tubeGeometry, tubeMaterial, tubeX, 4, tubeZ);
			tube.userData.type = 'tube';
		}

		// One broken tube - different color
		var brokenTubeMaterial = createGeometryAndMaterial(new THREE.BoxGeometry(1.5, 8, 1.5), {
			color: 0xff6600,
			emissive: 0xff4400,
			emissiveIntensity: 0.7
		});
		addMeshToScene(new THREE.BoxGeometry(1.5, 8, 1.5), brokenTubeMaterial, 102, 4, 6);

		// 12. Emergency shutters - metal box panels sliding down
		for (var shutter = 0; shutter < 4; shutter++) {
			var shutterGeometry = new THREE.BoxGeometry(30, 10, 0.5);
			var shutterMaterial = createGeometryAndMaterial(shutterGeometry, { color: 0x808080 });
			var shutterMesh = addMeshToScene(shutterGeometry, shutterMaterial, -80 + shutter * 50, 6, -19.8);
			shutterMesh.userData.type = 'shutter';
		}

		// 13. Ventilation shaft access - rectangular opening in ceiling with grate
		var gateGeometry = new THREE.BoxGeometry(20, 0.5, 20);
		var gateMaterial = createGeometryAndMaterial(gateGeometry, { color: 0x404040 });
		addMeshToScene(gateGeometry, gateMaterial, -100, 11.5, -8);

		// 14. Chemical fire suppression - white box tanks + red sprinkler heads
		var tankGeometry = new THREE.BoxGeometry(15, 8, 8);
		var tankMaterial = createGeometryAndMaterial(tankGeometry, { color: 0xffffff });
		addMeshToScene(tankGeometry, tankMaterial, 140, 4, -15);

		var sprinklerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
		var sprinklerMaterial = createGeometryAndMaterial(sprinklerGeometry, { color: 0xff0000 });
		for (var sp = 0; sp < 6; sp++) {
			addMeshToScene(new THREE.BoxGeometry(0.8, 0.8, 0.8), sprinklerMaterial, 130 + sp * 8, 11.5, -15);
		}

		// 15. Overhead fluorescent lights - thin flat box light panels
		var lightPanelGeometry = new THREE.BoxGeometry(80, 0.2, 8);
		var lightPanelMaterial = createGeometryAndMaterial(lightPanelGeometry, {
			color: 0xffffff,
			emissive: 0xffffff,
			emissiveIntensity: 0.9
		});
		for (var lp = 0; lp < 5; lp++) {
			addMeshToScene(new THREE.BoxGeometry(80, 0.2, 8), lightPanelMaterial, -80 + lp * 80, 11.8, 0);
		}

		// 16. Decontamination shower stall - glass-colored box enclosure
		var showerGeometry = new THREE.BoxGeometry(8, 8, 8);
		var showerMaterial = createGeometryAndMaterial(showerGeometry, {
			color: 0x87ceeb,
			transparent: true,
			opacity: 0.3
		});
		addMeshToScene(showerGeometry, showerMaterial, 160, 4, 15);

		// Create HUD
		createHUD();
	}

	function createHUD() {
		hudElement = document.createElement('div');
		hudElement.id = 'laboratory-raid-hud';
		hudElement.style.position = 'fixed';
		hudElement.style.top = '20px';
		hudElement.style.left = '20px';
		hudElement.style.color = '#00ff00';
		hudElement.style.fontFamily = 'monospace';
		hudElement.style.fontSize = '14px';
		hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
		hudElement.style.padding = '10px';
		hudElement.style.zIndex = '1000';
		hudElement.innerHTML =
			'CONTAINMENT BREACH: YES<br/>' +
			'SCIENTISTS RESCUED: ' + animationState.scientistsRescued + '/5<br/>' +
			'BIOWEAPON STATUS: ACTIVE<br/>' +
			'<small>[H+L to toggle HUD]</small>';
		document.body.appendChild(hudElement);

		// HUD toggle listener
		var hPressed = false;
		var lPressed = false;
		var hTime = 0;
		var lTime = 0;

		document.addEventListener('keydown', function(event) {
			if (event.key.toLowerCase() === 'h') {
				hPressed = true;
				hTime = Date.now();
				if (lPressed && Date.now() - lTime < 400) {
					toggleHUD();
					hPressed = false;
					lPressed = false;
				}
			}
			if (event.key.toLowerCase() === 'l') {
				lPressed = true;
				lTime = Date.now();
				if (hPressed && Date.now() - hTime < 400) {
					toggleHUD();
					hPressed = false;
					lPressed = false;
				}
			}
		});

		document.addEventListener('keyup', function(event) {
			if (event.key.toLowerCase() === 'h') {
				hPressed = false;
			}
			if (event.key.toLowerCase() === 'l') {
				lPressed = false;
			}
		});
	}

	function toggleHUD() {
		if (hudElement) {
			hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
		}
	}

	function update(delta) {
		// Centrifuge rotor spin animation
		animationState.centrifugeRotation += delta * 10;
		for (var m = 0; m < meshes.length; m++) {
			if (meshes[m].userData.type === 'rotor') {
				meshes[m].rotation.y = animationState.centrifugeRotation;
			}
		}

		// Containment breach lights flash
		animationState.breachLightToggle += delta;
		var breachFlash = Math.sin(animationState.breachLightToggle * 4) > 0;
		for (var n = 0; n < meshes.length; n++) {
			if (meshes[n].geometry.type === 'IcosahedronGeometry') {
				meshes[n].material.emissiveIntensity = breachFlash ? 0.8 : 0.2;
			}
		}

		// Emergency shutters slowly lower
		animationState.shutterPosition += delta * 0.5;
		for (var s = 0; s < meshes.length; s++) {
			if (meshes[s].userData.type === 'shutter') {
				meshes[s].position.y = Math.max(1, 6 - animationState.shutterPosition);
			}
		}

		// Virus containment tubes pulse green glow
		animationState.tubeGlow = Math.sin(animationState.breachLightToggle * 3) * 0.3 + 0.3;
		for (var t = 0; t < meshes.length; t++) {
			if (meshes[t].userData.type === 'tube') {
				meshes[t].material.emissiveIntensity = animationState.tubeGlow;
			}
		}

		// Infiltrators advance toward biohazard room
		animationState.infiltratorProgress += delta * 5;
		var infiltratorIndex = 0;
		for (var inf = 0; inf < meshes.length; inf++) {
			if (meshes[inf].userData.type === 'infiltrator') {
				meshes[inf].position.x += delta * 10;
				infiltratorIndex++;
			}
		}

		// Scientists cower animation
		animationState.cowering = Math.sin(animationState.breachLightToggle * 2) * 0.2;
		for (var sci = 0; sci < meshes.length; sci++) {
			if (meshes[sci].userData.type === 'scientist') {
				meshes[sci].position.y = 2 + animationState.cowering;
			}
		}
	}

	function reset() {
		// Dispose all geometries
		for (var g = 0; g < geometries.length; g++) {
			geometries[g].dispose();
		}
		geometries = [];

		// Dispose all materials
		for (var m = 0; m < materials.length; m++) {
			materials[m].dispose();
		}
		materials = [];

		// Remove all meshes from scene
		for (var mesh = 0; mesh < meshes.length; mesh++) {
			scene.remove(meshes[mesh]);
		}
		meshes = [];

		// Remove HUD
		if (hudElement && hudElement.parentNode) {
			hudElement.parentNode.removeChild(hudElement);
		}
		hudElement = null;

		// Reset animation state
		animationState = {
			centrifugeRotation: 0,
			breachLightToggle: 0,
			shutterPosition: 0,
			scientistsRescued: 0,
			infiltratorProgress: 0
		};
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
