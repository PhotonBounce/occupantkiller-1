window.HospitalSiege = (function() {
	'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

	var scene, camera, renderer, canvas;
	var hospitalObjects = [];
	var animationData = {};
	var hudCanvas, hudContext;
	var hudText = {
		staffFreed: 0,
		patientsEvacuated: 0,
		terroristsDown: 0
	};
	var hsState = { H: false, S: false, lastHTime: 0 };

	function init(containerElement) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

		// Scene setup
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x111111);

		// Camera
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.set(0, 3, 8);
		camera.lookAt(0, 1, 0);

		// Renderer
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = true;
		containerElement.appendChild(renderer.domElement);

		// Lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 10, 5);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);

		// Build 17+ scene objects
		buildCorridorFloor();
		buildNurseStationCounter();
		buildHospitalBeds();
		buildMedicalEquipment();
		buildOperatingRoomTable();
		buildSurgicalLight();
		buildVendingMachine();
		buildWheelchair();
		buildDoctorFigure();
		buildNurseFigure();
		buildTerroristFigure1();
		buildTerroristFigure2();
		buildSWATOperator();
		buildPatientOnGurney();
		buildMedicationCabinet();
		buildEmergencyExitDoor();
		buildBrokenGlassWindow();

		// HUD setup
		setupHUD();

		// Event listeners
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('resize', handleWindowResize);

		// Start animation loop
		animate();
	}

	function buildCorridorFloor() {
		var geometry = new THREE.BoxGeometry(20, 0.5, 15);
		var material = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
		var floor = new THREE.Mesh(geometry, material);
		floor.position.y = -0.25;
		floor.receiveShadow = true;
		scene.add(floor);
		hospitalObjects.push(floor);
	}

	function buildNurseStationCounter() {
		var geometry = new THREE.BoxGeometry(3, 1, 1.5);
		var material = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
		var counter = new THREE.Mesh(geometry, material);
		counter.position.set(-8, 0.5, -5);
		counter.castShadow = true;
		counter.receiveShadow = true;
		scene.add(counter);
		hospitalObjects.push(counter);

		// Emissive monitor
		var monitorGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.2);
		var monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
		var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
		monitor.position.set(-7.5, 1.2, -5);
		monitor.castShadow = true;
		scene.add(monitor);
		hospitalObjects.push(monitor);

		animationData.monitor = { mesh: monitor, intensity: 0.8, direction: 0.02 };
	}

	function buildHospitalBeds() {
		for (var i = 0; i < 4; i++) {
			var bedX = -6 + i * 3;
			var bedZ = 2;

			// Bed frame (flat box)
			var frameGeometry = new THREE.BoxGeometry(2, 0.3, 1.2);
			var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
			var frame = new THREE.Mesh(frameGeometry, frameMaterial);
			frame.position.set(bedX, 0.3, bedZ);
			frame.castShadow = true;
			frame.receiveShadow = true;
			scene.add(frame);
			hospitalObjects.push(frame);

			// Cylinder legs
			for (var j = 0; j < 4; j++) {
				var legX = bedX + (j % 2 === 0 ? -0.8 : 0.8);
				var legZ = bedZ + (j < 2 ? -0.5 : 0.5);
				var legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16);
				var legMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
				var leg = new THREE.Mesh(legGeometry, legMaterial);
				leg.position.set(legX, 0.15, legZ);
				leg.castShadow = true;
				scene.add(leg);
				hospitalObjects.push(leg);
			}

			// Patient box on bed
			var patientGeometry = new THREE.BoxGeometry(1.8, 0.4, 0.8);
			var patientMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 });
			var patient = new THREE.Mesh(patientGeometry, patientMaterial);
			patient.position.set(bedX, 0.65, bedZ);
			patient.castShadow = true;
			scene.add(patient);
			hospitalObjects.push(patient);
		}
	}

	function buildMedicalEquipment() {
		// IV stands - 3 total
		for (var i = 0; i < 3; i++) {
			var standX = -8 + i * 2;
			var standZ = 5;

			// Cylinder pole
			var poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16);
			var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
			var pole = new THREE.Mesh(poleGeometry, poleMaterial);
			pole.position.set(standX, 0.75, standZ);
			pole.castShadow = true;
			scene.add(pole);
			hospitalObjects.push(pole);

			// Box bag at top
			var bagGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
			var bagMaterial = new THREE.MeshStandardMaterial({ color: 0xffcccc });
			var bag = new THREE.Mesh(bagGeometry, bagMaterial);
			bag.position.set(standX, 1.5, standZ);
			bag.castShadow = true;
			scene.add(bag);
			hospitalObjects.push(bag);
		}

		// Monitors - 3 total (emissive)
		for (var i = 0; i < 3; i++) {
			var monX = -7 + i * 2.5;
			var monZ = 6;

			var monitorGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.15);
			var monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x00dd00, emissive: 0x00dd00, emissiveIntensity: 0.7 });
			var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
			monitor.position.set(monX, 1.2, monZ);
			monitor.castShadow = true;
			scene.add(monitor);
			hospitalObjects.push(monitor);

			animationData['monitor_' + i] = { mesh: monitor, intensity: 0.7, direction: 0.015 };
		}
	}

	function buildOperatingRoomTable() {
		var geometry = new THREE.BoxGeometry(2.2, 0.5, 1);
		var material = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 });
		var table = new THREE.Mesh(geometry, material);
		table.position.set(2, 0.25, -6);
		table.castShadow = true;
		table.receiveShadow = true;
		scene.add(table);
		hospitalObjects.push(table);

		// Equipment on table
		var eqGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.5);
		var eqMaterial = new THREE.MeshStandardMaterial({ color: 0xccccff });
		var equipment = new THREE.Mesh(eqGeometry, eqMaterial);
		equipment.position.set(2.5, 0.7, -6.2);
		equipment.castShadow = true;
		scene.add(equipment);
		hospitalObjects.push(equipment);
	}

	function buildSurgicalLight() {
		// Cylinder arm
		var armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 16);
		var armMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
		var arm = new THREE.Mesh(armGeometry, armMaterial);
		arm.position.set(3, 2.5, -6);
		arm.rotation.z = Math.PI / 6;
		arm.castShadow = true;
		scene.add(arm);
		hospitalObjects.push(arm);

		// Emissive sphere light
		var lightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
		var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffff99, emissive: 0xffff99, emissiveIntensity: 1 });
		var light = new THREE.Mesh(lightGeometry, lightMaterial);
		light.position.set(3.8, 3, -5.7);
		light.castShadow = true;
		scene.add(light);
		hospitalObjects.push(light);

		animationData.surgicalLight = { arm: arm, light: light, swingAmount: 0 };
	}

	function buildVendingMachine() {
		var geometry = new THREE.BoxGeometry(1, 2, 0.8);
		var material = new THREE.MeshStandardMaterial({ color: 0xaa4444, roughness: 0.6 });
		var machine = new THREE.Mesh(geometry, material);
		machine.position.set(8, 1, -5);
		machine.castShadow = true;
		machine.receiveShadow = true;
		scene.add(machine);
		hospitalObjects.push(machine);

		// Display (emissive)
		var displayGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.1);
		var displayMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.6 });
		var display = new THREE.Mesh(displayGeometry, displayMaterial);
		display.position.set(8, 1, -3.65);
		display.castShadow = true;
		scene.add(display);
		hospitalObjects.push(display);
	}

	function buildWheelchair() {
		// Seat box
		var seatGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
		var seatMaterial = new THREE.MeshStandardMaterial({ color: 0x2222ff, roughness: 0.5 });
		var seat = new THREE.Mesh(seatGeometry, seatMaterial);
		seat.position.set(6, 0.6, 3);
		seat.castShadow = true;
		scene.add(seat);
		hospitalObjects.push(seat);

		// Cylinder wheels
		for (var i = 0; i < 2; i++) {
			var wheelX = 6 + (i === 0 ? -0.5 : 0.5);
			var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
			var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
			var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel.position.set(wheelX, 0.4, 3);
			wheel.rotation.z = Math.PI / 2;
			wheel.castShadow = true;
			scene.add(wheel);
			hospitalObjects.push(wheel);
		}
	}

	function buildDoctorFigure() {
		// Body
		var bodyGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(-3, 0.8, -2);
		body.castShadow = true;
		scene.add(body);
		hospitalObjects.push(body);

		// Head (sphere)
		var headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(-3, 1.45, -2);
		head.castShadow = true;
		scene.add(head);
		hospitalObjects.push(head);

		animationData.doctor = { body: body, targetZ: -2 };
	}

	function buildNurseFigure() {
		// Body
		var bodyGeometry = new THREE.BoxGeometry(0.45, 0.75, 0.3);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(0, 0.75, -3);
		body.castShadow = true;
		scene.add(body);
		hospitalObjects.push(body);

		// Head (sphere)
		var headGeometry = new THREE.SphereGeometry(0.18, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(0, 1.4, -3);
		head.castShadow = true;
		scene.add(head);
		hospitalObjects.push(head);

		animationData.nurse = { body: body, targetX: 0 };
	}

	function buildTerroristFigure1() {
		// Body (darker)
		var bodyGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(-5, 0.8, 1);
		body.castShadow = true;
		scene.add(body);
		hospitalObjects.push(body);

		// Head (sphere)
		var headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(-5, 1.45, 1);
		head.castShadow = true;
		scene.add(head);
		hospitalObjects.push(head);

		// Weapon (small box)
		var weaponGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.08);
		var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
		weapon.position.set(-4.6, 0.9, 0.8);
		weapon.castShadow = true;
		scene.add(weapon);
		hospitalObjects.push(weapon);

		animationData.terrorist1 = { body: body, patrolX: -5, direction: 1 };
	}

	function buildTerroristFigure2() {
		// Body (darker)
		var bodyGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(4, 0.8, -1);
		body.castShadow = true;
		scene.add(body);
		hospitalObjects.push(body);

		// Head (sphere)
		var headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(4, 1.45, -1);
		head.castShadow = true;
		scene.add(head);
		hospitalObjects.push(head);

		// Weapon (small box)
		var weaponGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.08);
		var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
		weapon.position.set(4.4, 0.9, -1.2);
		weapon.castShadow = true;
		scene.add(weapon);
		hospitalObjects.push(weapon);

		animationData.terrorist2 = { body: body, patrolX: 4, direction: -1 };
	}

	function buildSWATOperator() {
		// Body
		var bodyGeometry = new THREE.BoxGeometry(0.55, 0.85, 0.35);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(7, 0.85, -2);
		body.castShadow = true;
		scene.add(body);
		hospitalObjects.push(body);

		// Head (sphere)
		var headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(7, 1.5, -2);
		head.castShadow = true;
		scene.add(head);
		hospitalObjects.push(head);

		animationData.swat = { body: body, creepX: 7 };
	}

	function buildPatientOnGurney() {
		// Gurney (flat box)
		var gurneyGeometry = new THREE.BoxGeometry(1.8, 0.3, 0.8);
		var gurneyMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
		var gurney = new THREE.Mesh(gurneyGeometry, gurneyMaterial);
		gurney.position.set(9, 0.3, 1);
		gurney.castShadow = true;
		gurney.receiveShadow = true;
		scene.add(gurney);
		hospitalObjects.push(gurney);

		// Patient figure
		var patientGeometry = new THREE.BoxGeometry(1.6, 0.5, 0.6);
		var patientMaterial = new THREE.MeshStandardMaterial({ color: 0xffccbb });
		var patient = new THREE.Mesh(patientGeometry, patientMaterial);
		patient.position.set(9, 0.75, 1);
		patient.castShadow = true;
		scene.add(patient);
		hospitalObjects.push(patient);

		animationData.gurney = { gurney: gurney, patient: patient, rollX: 9 };
	}

	function buildMedicationCabinet() {
		var geometry = new THREE.BoxGeometry(1.2, 1.8, 0.5);
		var material = new THREE.MeshStandardMaterial({ color: 0xddaa99, roughness: 0.4 });
		var cabinet = new THREE.Mesh(geometry, material);
		cabinet.position.set(5, 0.9, 6);
		cabinet.castShadow = true;
		cabinet.receiveShadow = true;
		scene.add(cabinet);
		hospitalObjects.push(cabinet);

		// Red cross marking with LineSegments
		var points = [
			new THREE.Vector3(5 - 0.3, 0.9, 6 - 0.26),
			new THREE.Vector3(5 + 0.3, 0.9, 6 - 0.26),
			new THREE.Vector3(5, 0.9 - 0.3, 6 - 0.26),
			new THREE.Vector3(5, 0.9 + 0.3, 6 - 0.26)
		];
		var crossGeometry = new THREE.BufferGeometry().setFromPoints(points);
		var crossMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
		var cross = new THREE.LineSegments(crossGeometry, crossMaterial);
		cross.position.z -= 0.01;
		scene.add(cross);
		hospitalObjects.push(cross);
	}

	function buildEmergencyExitDoor() {
		var geometry = new THREE.BoxGeometry(1.2, 2.2, 0.1);
		var material = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5 });
		var door = new THREE.Mesh(geometry, material);
		door.position.set(-9, 1.1, -7);
		door.castShadow = true;
		scene.add(door);
		hospitalObjects.push(door);

		// Green exit sign (emissive)
		var signGeometry = new THREE.BoxGeometry(1, 0.5, 0.05);
		var signMaterial = new THREE.MeshStandardMaterial({ color: 0x00aa00, emissive: 0x00aa00, emissiveIntensity: 0.9 });
		var sign = new THREE.Mesh(signGeometry, signMaterial);
		sign.position.set(-9, 2.1, -6.95);
		sign.castShadow = true;
		scene.add(sign);
		hospitalObjects.push(sign);
	}

	function buildBrokenGlassWindow() {
		// Multiple LineSegments to simulate scattered glass
		var glassPoints = [];
		for (var i = 0; i < 12; i++) {
			var x = 8 + Math.random() * 2 - 1;
			var y = 2 + Math.random() * 1.5;
			var z = -7.2;
			var x2 = x + (Math.random() * 0.3 - 0.15);
			var y2 = y + (Math.random() * 0.3 - 0.15);

			glassPoints.push(new THREE.Vector3(x, y, z));
			glassPoints.push(new THREE.Vector3(x2, y2, z));
		}

		var glassGeometry = new THREE.BufferGeometry().setFromPoints(glassPoints);
		var glassMaterial = new THREE.LineBasicMaterial({ color: 0x8899ff, linewidth: 1 });
		var glassShards = new THREE.LineSegments(glassGeometry, glassMaterial);
		scene.add(glassShards);
		hospitalObjects.push(glassShards);
	}

	function setupHUD() {
		hudCanvas = document.createElement('canvas');
		hudCanvas.width = window.innerWidth;
		hudCanvas.height = window.innerHeight;
		hudCanvas.style.position = 'absolute';
		hudCanvas.style.top = '0';
		hudCanvas.style.left = '0';
		hudCanvas.style.pointerEvents = 'none';
		hudCanvas.style.display = 'none';
		document.body.appendChild(hudCanvas);
		hudContext = hudCanvas.getContext('2d');
	}

	function drawHUD() {
		if (!hudCanvas || hudCanvas.style.display === 'none') return;

		hudContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
		hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

		hudContext.fillStyle = '#00ff00';
		hudContext.font = 'bold 24px monospace';
		hudContext.fillText('STAFF FREED: ' + hudText.staffFreed + '/3', 20, 50);
		hudContext.fillText('PATIENTS EVACUATED: ' + hudText.patientsEvacuated + '/4', 20, 90);
		hudContext.fillText('TERRORISTS DOWN: ' + hudText.terroristsDown + '/2', 20, 130);

		hudContext.fillStyle = '#ffff00';
		hudContext.font = '16px monospace';
		hudContext.fillText('[H+S] Toggle HUD', 20, hudCanvas.height - 20);
	}

	function handleKeyDown(event) {
		var now = Date.now();

		if (event.code === 'KeyH') {
			hsState.H = true;
			hsState.lastHTime = now;
		}

		if (event.code === 'KeyS' && hsState.H && (now - hsState.lastHTime) < 400) {
			hsState.H = false;
			if (hudCanvas.style.display === 'none') {
				hudCanvas.style.display = 'block';
			} else {
				hudCanvas.style.display = 'none';
			}
		}

		if (now - hsState.lastHTime > 400) {
			hsState.H = false;
		}
	}

	function handleWindowResize() {
		var w = window.innerWidth;
		var h = window.innerHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
		if (hudCanvas) {
			hudCanvas.width = w;
			hudCanvas.height = h;
		}
	}

	function update() {
		// Surgical light swing
		if (animationData.surgicalLight) {
			var data = animationData.surgicalLight;
			data.swingAmount += 0.02;
			data.arm.rotation.z = Math.PI / 6 + Math.sin(data.swingAmount) * 0.3;
		}

		// Monitors pulse
		for (var key in animationData) {
			if (key.indexOf('monitor') === 0) {
				var monData = animationData[key];
				monData.intensity += monData.direction;
				if (monData.intensity > 1.0) monData.direction = -0.015;
				if (monData.intensity < 0.5) monData.direction = 0.015;
				monData.mesh.material.emissiveIntensity = monData.intensity;
			}
		}

		// Terrorists patrol
		if (animationData.terrorist1) {
			var t1 = animationData.terrorist1;
			t1.body.position.x += t1.direction * 0.03;
			if (t1.body.position.x > -2 || t1.body.position.x < -8) {
				t1.direction *= -1;
			}
			t1.body.children = t1.body.children || [];
		}

		if (animationData.terrorist2) {
			var t2 = animationData.terrorist2;
			t2.body.position.x += t2.direction * 0.025;
			if (t2.body.position.x > 8 || t2.body.position.x < 0) {
				t2.direction *= -1;
			}
		}

		// SWAT operator creeps slowly
		if (animationData.swat) {
			animationData.swat.creepX += 0.005;
		}

		// Gurney rolls toward exit
		if (animationData.gurney) {
			animationData.gurney.rollX -= 0.02;
			animationData.gurney.gurney.position.x = animationData.gurney.rollX;
			animationData.gurney.patient.position.x = animationData.gurney.rollX;
		}

		drawHUD();
	}

	function reset() {
		// Clear all objects
		for (var i = 0; i < hospitalObjects.length; i++) {
			var obj = hospitalObjects[i];
			if (obj.geometry) obj.geometry.dispose();
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					for (var j = 0; j < obj.material.length; j++) {
						obj.material[j].dispose();
					}
				} else {
					obj.material.dispose();
				}
			}
			scene.remove(obj);
		}

		hospitalObjects = [];
		animationData = {};
		hsState = { H: false, S: false, lastHTime: 0 };
		hudText = { staffFreed: 0, patientsEvacuated: 0, terroristsDown: 0 };

		if (hudCanvas) {
			hudCanvas.style.display = 'none';
			hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
		}

		if (renderer) {
			renderer.dispose();
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
