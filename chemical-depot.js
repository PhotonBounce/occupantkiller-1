window.ChemicalDepot = (function() {
	'use strict';

	var meshes = [];
	var state = {
		pressureGauge: 0,
		valveRotation: 0,
		biohazardPhase: 0,
		deconActive: false,
		fanRotation: 0,
		vatBubbles: 0,
		detectorAlarm: false,
		pipelinePulse: 0,
		reliefVentActive: false
	};

	var spawnPoints = [
		{ x: 0, y: 2, z: 30 },
		{ x: -15, y: 2, z: 0 },
		{ x: 20, y: 2, z: -25 },
		{ x: -25, y: 2, z: 15 },
		{ x: 10, y: 2, z: 25 }
	];

	function createMesh(geometry, material, position, rotation, scale) {
		var mesh = new THREE.Mesh(geometry, material);
		if (position) mesh.position.set(position.x, position.y, position.z);
		if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
		if (scale) mesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
		meshes.push(mesh);
		return mesh;
	}

	function createLine(start, end, color) {
		var geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(
			new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]),
			3
		));
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		meshes.push(line);
		return line;
	}

	function init(scene, camera) {
		meshes = [];

		var yellowMat = new THREE.MeshPhongMaterial({ color: 0xFFCC00 });
		var orangeMat = new THREE.MeshPhongMaterial({ color: 0xFF6600 });
		var grayMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
		var whiteMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
		var silverMat = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
		var darkGrayMat = new THREE.MeshPhongMaterial({ color: 0x222222 });

		// Main storage building - large warehouse structure
		var wareGeometry = new THREE.BoxGeometry(40, 18, 35);
		var wareMesh = createMesh(wareGeometry, grayMat, { x: 0, y: 9, z: 0 });
		wareMesh.name = 'warehouse';

		// Large pressurized storage tanks (3 tanks)
		var tankGeometry = new THREE.CylinderGeometry(6, 6, 20, 16);
		createMesh(tankGeometry, silverMat, { x: -18, y: 10, z: -12 }).name = 'tank1';
		createMesh(tankGeometry, silverMat, { x: 0, y: 10, z: -15 }).name = 'tank2';
		createMesh(tankGeometry, silverMat, { x: 18, y: 10, z: -12 }).name = 'tank3';

		// Tank end caps (hemispheres using sphere geometry cut)
		var capGeometry = new THREE.SphereGeometry(6, 16, 8);
		createMesh(capGeometry, silverMat, { x: -18, y: 20, z: -12 }, null, { x: 1, y: 0.5, z: 1 }).name = 'cap1';
		createMesh(capGeometry, silverMat, { x: 0, y: 20, z: -15 }, null, { x: 1, y: 0.5, z: 1 }).name = 'cap2';
		createMesh(capGeometry, silverMat, { x: 18, y: 20, z: -12 }, null, { x: 1, y: 0.5, z: 1 }).name = 'cap3';

		// Chemical munitions storage racks (shelving with canisters)
		var rackGeometry = new THREE.BoxGeometry(12, 16, 8);
		createMesh(rackGeometry, grayMat, { x: -20, y: 8, z: 12 }).name = 'rack1';
		createMesh(rackGeometry, grayMat, { x: 20, y: 8, z: 12 }).name = 'rack2';

		// Canisters on racks (cylinder shapes)
		var canisterGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
		for (var i = 0; i < 6; i++) {
			var x = -20 + (i % 3) * 4;
			var z = 12 + Math.floor(i / 3) * 3;
			createMesh(canisterGeometry, orangeMat, { x: x, y: 6 + (i % 3) * 3, z: z }).name = 'canister' + i;
		}

		// Decontamination shower stations (2 booths)
		var boothGeometry = new THREE.BoxGeometry(4, 8, 4);
		createMesh(boothGeometry, whiteMat, { x: -12, y: 4, z: 20 }).name = 'deconBooth1';
		createMesh(boothGeometry, whiteMat, { x: 12, y: 4, z: 20 }).name = 'deconBooth2';

		// Shower heads (CylinderGeometry small)
		var showerHeadGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8);
		createMesh(showerHeadGeometry, silverMat, { x: -12, y: 7.5, z: 20 }).name = 'showerHead1';
		createMesh(showerHeadGeometry, silverMat, { x: 12, y: 7.5, z: 20 }).name = 'showerHead2';

		// Pressurized transfer pipeline system (horizontal runs)
		var pipeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 25, 8);
		createMesh(pipeGeometry, silverMat, { x: 0, y: 14, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 }).name = 'mainPipeline';

		// Pipe branches
		var branchGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
		createMesh(branchGeometry, silverMat, { x: -10, y: 16, z: 5 }, { x: 0, y: 0, z: Math.PI / 4 }).name = 'pipeBranch1';
		createMesh(branchGeometry, silverMat, { x: 10, y: 16, z: 5 }, { x: 0, y: 0, z: -Math.PI / 4 }).name = 'pipeBranch2';

		// Valve manifolds (small boxes on pipes)
		var valveGeometry = new THREE.BoxGeometry(2, 2, 2);
		createMesh(valveGeometry, orangeMat, { x: -8, y: 14, z: 8 }).name = 'valve1';
		createMesh(valveGeometry, orangeMat, { x: 8, y: 14, z: 8 }).name = 'valve2';
		createMesh(valveGeometry, orangeMat, { x: 0, y: 14, z: -10 }).name = 'valve3';

		// Containment berm (earthwork perimeter - large low wall)
		var bermGeometry = new THREE.BoxGeometry(60, 2, 50);
		var bermMesh = createMesh(bermGeometry, new THREE.MeshPhongMaterial({ color: 0x8B7355 }), { x: 0, y: 0.5, z: 5 });
		bermMesh.name = 'containmentBerm';

		// Loading dock bay (large platform)
		var dockGeometry = new THREE.BoxGeometry(25, 1.5, 15);
		createMesh(dockGeometry, new THREE.MeshPhongMaterial({ color: 0xFFCC00 }), { x: 0, y: 0.75, z: -28 }).name = 'loadingDock';

		// Dock shelter structure (roof)
		var shelterGeometry = new THREE.BoxGeometry(28, 6, 3);
		createMesh(shelterGeometry, grayMat, { x: 0, y: 4, z: -32 }).name = 'dockShelter';

		// Biohazard warning sign posts (yellow and black)
		var signGeometry = new THREE.BoxGeometry(2, 3, 0.3);
		var signMat = yellowMat;
		createMesh(signGeometry, signMat, { x: -25, y: 1.5, z: 20 }).name = 'biohazardSign1';
		createMesh(signGeometry, signMat, { x: 25, y: 1.5, z: 20 }).name = 'biohazardSign2';
		createMesh(signGeometry, signMat, { x: -25, y: 1.5, z: -20 }).name = 'biohazardSign3';
		createMesh(signGeometry, signMat, { x: 25, y: 1.5, z: -20 }).name = 'biohazardSign4';

		// Sign posts (vertical cylinders)
		var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
		createMesh(postGeometry, silverMat, { x: -25, y: 1, z: 20 }).name = 'post1';
		createMesh(postGeometry, silverMat, { x: 25, y: 1, z: 20 }).name = 'post2';
		createMesh(postGeometry, silverMat, { x: -25, y: 1, z: -20 }).name = 'post3';
		createMesh(postGeometry, silverMat, { x: 25, y: 1, z: -20 }).name = 'post4';

		// Air filtration tower (building + exhaust)
		var filterBuildGeometry = new THREE.BoxGeometry(6, 12, 6);
		createMesh(filterBuildGeometry, grayMat, { x: 28, y: 6, z: 15 }).name = 'filterBuilding';

		// Exhaust stack (tall cylinder)
		var exhaustGeometry = new THREE.CylinderGeometry(1.5, 1.5, 14, 8);
		createMesh(exhaustGeometry, silverMat, { x: 28, y: 13, z: 15 }).name = 'exhaustStack';

		// Chemical neutralization vat (large basin)
		var vatGeometry = new THREE.BoxGeometry(10, 6, 10);
		createMesh(vatGeometry, whiteMat, { x: -30, y: 3, z: -18 }).name = 'neutralizationVat';

		// Vat interior (darker color to show depth)
		var vatInteriorGeometry = new THREE.BoxGeometry(9, 5, 9);
		createMesh(vatInteriorGeometry, darkGrayMat, { x: -30, y: 3.5, z: -18 }).name = 'vatInterior';

		// Emergency eyewash station (pedestal + sphere eye cups)
		var pedestalGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 8);
		createMesh(pedestalGeometry, silverMat, { x: 15, y: 1, z: 25 }).name = 'eyewashPedestal';

		// Eye wash cups (small spheres)
		var cupGeometry = new THREE.SphereGeometry(0.5, 8, 8);
		createMesh(cupGeometry, whiteMat, { x: 14, y: 2.5, z: 25 }).name = 'eyewashCup1';
		createMesh(cupGeometry, whiteMat, { x: 16, y: 2.5, z: 25 }).name = 'eyewashCup2';

		// Gas detector probe arrays (sensor boxes)
		var sensorGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
		createMesh(sensorGeometry, orangeMat, { x: -15, y: 12, z: 18 }).name = 'detector1';
		createMesh(sensorGeometry, orangeMat, { x: 15, y: 12, z: 18 }).name = 'detector2';
		createMesh(sensorGeometry, orangeMat, { x: 0, y: 12, z: -25 }).name = 'detector3';

		// Security perimeter fence (lines and posts)
		var fencePostGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
		for (var j = 0; j < 8; j++) {
			var angle = (j / 8) * Math.PI * 2;
			var fx = Math.cos(angle) * 35;
			var fz = Math.sin(angle) * 35;
			createMesh(fencePostGeometry, darkGrayMat, { x: fx, y: 2, z: fz }).name = 'fencePost' + j;
		}

		// Fence lines
		for (var k = 0; k < 8; k++) {
			var angle1 = (k / 8) * Math.PI * 2;
			var angle2 = ((k + 1) / 8) * Math.PI * 2;
			var sx = Math.cos(angle1) * 35;
			var sz = Math.sin(angle1) * 35;
			var ex = Math.cos(angle2) * 35;
			var ez = Math.sin(angle2) * 35;
			createLine({ x: sx, y: 3, z: sz }, { x: ex, y: 3, z: ez }, 0x333333);
		}

		// Negative-pressure laboratory module (sealed lab building)
		var labGeometry = new THREE.BoxGeometry(12, 10, 12);
		createMesh(labGeometry, whiteMat, { x: -32, y: 5, z: 8 }).name = 'labModule';

		// Lab window (small box on side)
		var windowGeometry = new THREE.BoxGeometry(3, 3, 0.2);
		createMesh(windowGeometry, new THREE.MeshPhongMaterial({ color: 0x88CCFF }), { x: -38, y: 6, z: 8 }).name = 'labWindow';

		// Pressure gauge indicator (sphere that will pulse)
		var gaugeGeometry = new THREE.SphereGeometry(0.8, 8, 8);
		createMesh(gaugeGeometry, yellowMat, { x: -5, y: 6, z: 5 }).name = 'pressureGauge';

		// Add all meshes to scene
		for (var m = 0; m < meshes.length; m++) {
			scene.add(meshes[m]);
		}
	}

	function update(delta) {
		state.pressureGauge += delta * 1.5;
		state.valveRotation += delta * 0.8;
		state.biohazardPhase += delta * 2;
		state.fanRotation += delta * 3;
		state.vatBubbles += delta * 2;
		state.pipelinePulse += delta * 1.2;

		state.deconActive = (Math.sin(state.biohazardPhase * 0.5) > 0.7);
		state.detectorAlarm = (Math.sin(state.biohazardPhase * 0.3) > 0.5);
		state.reliefVentActive = (Math.sin(state.biohazardPhase * 0.4) > 0.6);

		// Update pressure gauge scale and rotation
		var pressureGaugeMesh = meshes.find(function(m) { return m.name === 'pressureGauge'; });
		if (pressureGaugeMesh) {
			var scale = 0.8 + Math.sin(state.pressureGauge) * 0.3;
			pressureGaugeMesh.scale.set(scale, scale, scale);
			pressureGaugeMesh.rotation.z = state.pressureGauge;
		}

		// Valve rotation animation
		var valve1 = meshes.find(function(m) { return m.name === 'valve1'; });
		var valve2 = meshes.find(function(m) { return m.name === 'valve2'; });
		var valve3 = meshes.find(function(m) { return m.name === 'valve3'; });
		if (valve1) valve1.rotation.z = state.valveRotation;
		if (valve2) valve2.rotation.z = state.valveRotation * 0.7;
		if (valve3) valve3.rotation.z = state.valveRotation * 0.5;

		// Biohazard sign lights flashing
		var signs = ['biohazardSign1', 'biohazardSign2', 'biohazardSign3', 'biohazardSign4'];
		signs.forEach(function(name) {
			var sign = meshes.find(function(m) { return m.name === name; });
			if (sign) {
				var opacity = 0.5 + Math.sin(state.biohazardPhase) * 0.5;
				sign.material.opacity = opacity;
			}
		});

		// Exhaust fan rotation
		var exhaust = meshes.find(function(m) { return m.name === 'exhaustStack'; });
		if (exhaust) {
			exhaust.rotation.y = state.fanRotation;
		}

		// Neutralization vat bubbling (scale oscillation)
		var vat = meshes.find(function(m) { return m.name === 'vatInterior'; });
		if (vat) {
			var bubbleScale = 0.95 + Math.sin(state.vatBubbles) * 0.15;
			vat.scale.y = bubbleScale;
		}

		// Gas detector alarm (color flash)
		var detectors = ['detector1', 'detector2', 'detector3'];
		detectors.forEach(function(name) {
			var detector = meshes.find(function(m) { return m.name === name; });
			if (detector && state.detectorAlarm) {
				detector.material.color.setHex(0xFF0000);
			} else if (detector) {
				detector.material.color.setHex(0xFF6600);
			}
		});

		// Pipeline pressure oscillation
		var mainPipe = meshes.find(function(m) { return m.name === 'mainPipeline'; });
		if (mainPipe) {
			var pipeScale = 1 + Math.sin(state.pipelinePulse) * 0.2;
			mainPipe.scale.y = pipeScale;
		}

		// Tank relief valve venting (sphere puffs)
		var caps = ['cap1', 'cap2', 'cap3'];
		caps.forEach(function(name) {
			var cap = meshes.find(function(m) { return m.name === name; });
			if (cap && state.reliefVentActive) {
				var ventScale = 1 + Math.sin(state.pipelinePulse * 2) * 0.3;
				cap.scale.set(ventScale, ventScale * 0.5, ventScale);
			}
		});

		// Decontamination shower activation
		if (state.deconActive) {
			var shower1 = meshes.find(function(m) { return m.name === 'showerHead1'; });
			var shower2 = meshes.find(function(m) { return m.name === 'showerHead2'; });
			if (shower1) {
				shower1.material.color.setHex(0x00DDFF);
				shower1.scale.y = 1.2 + Math.sin(state.biohazardPhase * 3) * 0.2;
			}
			if (shower2) {
				shower2.material.color.setHex(0x00DDFF);
				shower2.scale.y = 1.2 + Math.sin(state.biohazardPhase * 3) * 0.2;
			}
		} else {
			var shower1 = meshes.find(function(m) { return m.name === 'showerHead1'; });
			var shower2 = meshes.find(function(m) { return m.name === 'showerHead2'; });
			if (shower1) {
				shower1.material.color.setHex(0xCCCCCC);
				shower1.scale.y = 1;
			}
			if (shower2) {
				shower2.material.color.setHex(0xCCCCCC);
				shower2.scale.y = 1;
			}
		}
	}

	function reset() {
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].geometry) {
				meshes[i].geometry.dispose();
			}
			if (meshes[i].material) {
				meshes[i].material.dispose();
			}
		}
		meshes = [];
		state = {
			pressureGauge: 0,
			valveRotation: 0,
			biohazardPhase: 0,
			deconActive: false,
			fanRotation: 0,
			vatBubbles: 0,
			detectorAlarm: false,
			pipelinePulse: 0,
			reliefVentActive: false
		};
	}

	function getSpawnPoints() {
		return spawnPoints;
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getSpawnPoints: getSpawnPoints
	};
}());
