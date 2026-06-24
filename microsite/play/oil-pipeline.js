window.OilPipeline = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var isActive = false;
	var lastOKeyTime = null;
	var allObjects = [];
	var gameState = {
		chargesDisarmed: 0,
		saboteursDowned: 0,
		pipelineIntegrity: 100
	};

	var pumpPistons = [];
	var pressureGauges = [];
	var pipelineSegments = [];
	var saboteurs = [];
	var supportStruts = [];

	function createPipeline() {
		var pipeGroup = new THREE.Group();
		var pipelineLength = 200;
		var segmentLength = 40;
		var segments = Math.floor(pipelineLength / segmentLength);

		for (var i = 0; i < segments; i++) {
			var x = -100 + i * segmentLength;
			var pipeGeometry = new THREE.CylinderGeometry(3, 3, segmentLength, 32);
			var pipeMaterial = new THREE.MeshStandardMaterial({
				color: 0x2a4a4a,
				roughness: 0.6,
				metalness: 0.3
			});
			var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
			pipe.rotation.z = Math.PI / 2;
			pipe.position.set(x, 2, 0);
			pipeGroup.add(pipe);
			allObjects.push(pipe);
			pipelineSegments.push(pipe);
		}

		scene.add(pipeGroup);
		allObjects.push(pipeGroup);
		return pipelineLength;
	}

	function createPumpStation(x, z) {
		var stationGroup = new THREE.Group();

		var buildingGeometry = new THREE.BoxGeometry(12, 8, 12);
		var buildingMaterial = new THREE.MeshStandardMaterial({
			color: 0x4a5a5a,
			roughness: 0.8,
			metalness: 0.1
		});
		var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
		building.position.y = 4;
		stationGroup.add(building);
		allObjects.push(building);

		var pumpGeometry = new THREE.CylinderGeometry(2, 2, 6, 16);
		var pumpMaterial = new THREE.MeshStandardMaterial({
			color: 0x3a3a3a,
			roughness: 0.5,
			metalness: 0.7
		});
		var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
		pump.position.set(0, 8, 0);
		stationGroup.add(pump);
		allObjects.push(pump);

		var pistonGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
		var pistonMaterial = new THREE.MeshStandardMaterial({
			color: 0x222222,
			roughness: 0.3,
			metalness: 0.9
		});
		var piston = new THREE.Mesh(pistonGeometry, pistonMaterial);
		piston.position.set(0, 10, 0);
		stationGroup.add(piston);
		allObjects.push(piston);

		pumpPistons.push({
			mesh: piston,
			baseY: 10,
			speed: 2,
			offset: Math.random() * Math.PI * 2
		});

		stationGroup.position.set(x, 0, z);
		scene.add(stationGroup);
		allObjects.push(stationGroup);
	}

	function createSupportStrut(x) {
		var strutGroup = new THREE.Group();

		var leftLegGeometry = new THREE.BoxGeometry(0.8, 6, 0.8);
		var legMaterial = new THREE.MeshStandardMaterial({
			color: 0x3a4a4a,
			roughness: 0.7,
			metalness: 0.4
		});
		var leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
		leftLeg.position.set(-4, 3, 0);
		strutGroup.add(leftLeg);
		allObjects.push(leftLeg);

		var rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
		rightLeg.position.set(4, 3, 0);
		strutGroup.add(rightLeg);
		allObjects.push(rightLeg);

		var bracingGeometry = new THREE.BoxGeometry(0.4, 0.4, 8);
		var brace = new THREE.Mesh(bracingGeometry, legMaterial);
		brace.position.set(0, 3, 0);
		brace.rotation.z = Math.PI / 4;
		strutGroup.add(brace);
		allObjects.push(brace);

		strutGroup.position.set(x, 0, 0);
		scene.add(strutGroup);
		allObjects.push(strutGroup);
		supportStruts.push(strutGroup);
	}

	function createValveJunction(x, z) {
		var junctionGroup = new THREE.Group();

		var boxGeometry = new THREE.BoxGeometry(6, 5, 6);
		var boxMaterial = new THREE.MeshStandardMaterial({
			color: 0x5a6a6a,
			roughness: 0.7,
			metalness: 0.2
		});
		var box = new THREE.Mesh(boxGeometry, boxMaterial);
		box.position.y = 2.5;
		junctionGroup.add(box);
		allObjects.push(box);

		var valveGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
		var valveMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6b2c,
			roughness: 0.4,
			metalness: 0.8
		});
		var valve = new THREE.Mesh(valveGeometry, valveMaterial);
		valve.position.set(0, 5.5, 0);
		junctionGroup.add(valve);
		allObjects.push(valve);

		junctionGroup.position.set(x, 0, z);
		scene.add(junctionGroup);
		allObjects.push(junctionGroup);
	}

	function createPressureGauge(x, z, offset) {
		var gaugeGroup = new THREE.Group();

		for (var i = 0; i < 3; i++) {
			var cylinderGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8);
			var cylinderMaterial = new THREE.MeshStandardMaterial({
				color: 0x4a6a6a,
				roughness: 0.6,
				metalness: 0.5
			});
			var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
			cylinder.position.set(i * 2.5 - 2.5, 0, 0);
			gaugeGroup.add(cylinder);
			allObjects.push(cylinder);

			var needleGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
			var needleMaterial = new THREE.MeshStandardMaterial({
				color: 0xff0000,
				roughness: 0.3,
				metalness: 0.9
			});
			var needle = new THREE.Mesh(needleGeometry, needleMaterial);
			needle.position.y = 0.5;
			cylinder.add(needle);
			allObjects.push(needle);

			pressureGauges.push({
				mesh: cylinder,
				needle: needle,
				speed: 1 + Math.random() * 0.5,
				offset: offset + i * Math.PI * 0.2
			});
		}

		gaugeGroup.position.set(x, 4, z);
		scene.add(gaugeGroup);
		allObjects.push(gaugeGroup);
	}

	function createPatrolRoad(length) {
		var roadGeometry = new THREE.BoxGeometry(15, 0.2, length);
		var roadMaterial = new THREE.MeshStandardMaterial({
			color: 0x5a5a5a,
			roughness: 0.9,
			metalness: 0.05
		});
		var road = new THREE.Mesh(roadGeometry, roadMaterial);
		road.position.set(0, 0.1, 0);
		scene.add(road);
		allObjects.push(road);
	}

	function createShutOffValve(x, z) {
		var valveGroup = new THREE.Group();

		var wheelGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 16);
		var wheelMaterial = new THREE.MeshStandardMaterial({
			color: 0xcc3333,
			roughness: 0.5,
			metalness: 0.7
		});
		var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
		wheel.position.y = 5;
		wheel.rotation.y = Math.random() * Math.PI * 2;
		valveGroup.add(wheel);
		allObjects.push(wheel);

		var sternGeometry = new THREE.CylinderGeometry(0.8, 0.8, 5, 12);
		var sternMaterial = new THREE.MeshStandardMaterial({
			color: 0x3a3a3a,
			roughness: 0.6,
			metalness: 0.6
		});
		var stern = new THREE.Mesh(sternGeometry, sternMaterial);
		stern.position.y = 2.5;
		valveGroup.add(stern);
		allObjects.push(stern);

		valveGroup.position.set(x, 0, z);
		scene.add(valveGroup);
		allObjects.push(valveGroup);
	}

	function createSaboteur(x, z) {
		var saboteurGroup = new THREE.Group();

		var bodyGeometry = new THREE.BoxGeometry(1.5, 3, 1);
		var bodyMaterial = new THREE.MeshStandardMaterial({
			color: 0x2d5a2d,
			roughness: 0.7,
			metalness: 0.1
		});
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 1.5;
		saboteurGroup.add(body);
		allObjects.push(body);

		var headGeometry = new THREE.SphereGeometry(0.6, 8, 8);
		var headMaterial = new THREE.MeshStandardMaterial({
			color: 0xa08070,
			roughness: 0.8,
			metalness: 0.05
		});
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.y = 3.3;
		saboteurGroup.add(head);
		allObjects.push(head);

		var leftArmGeometry = new THREE.BoxGeometry(0.6, 2, 0.6);
		var armMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a3a1a,
			roughness: 0.7,
			metalness: 0.1
		});
		var leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
		leftArm.position.set(-1.5, 2, 0);
		saboteurGroup.add(leftArm);
		allObjects.push(leftArm);

		var rightArm = new THREE.Mesh(leftArmGeometry, armMaterial);
		rightArm.position.set(1.5, 2, 0);
		saboteurGroup.add(rightArm);
		allObjects.push(rightArm);

		var leftLegGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
		var legMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			roughness: 0.8,
			metalness: 0.05
		});
		var leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
		leftLeg.position.set(-0.5, 0.75, 0);
		saboteurGroup.add(leftLeg);
		allObjects.push(leftLeg);

		var rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
		rightLeg.position.set(0.5, 0.75, 0);
		saboteurGroup.add(rightLeg);
		allObjects.push(rightLeg);

		saboteurGroup.position.set(x, 0, z);
		scene.add(saboteurGroup);
		allObjects.push(saboteurGroup);

		saboteurs.push({
			mesh: saboteurGroup,
			x: x,
			z: z,
			active: true
		});
	}

	function createEnvironment(pipelineLength) {
		var skyGeometry = new THREE.SphereGeometry(500, 32, 32);
		var skyMaterial = new THREE.MeshStandardMaterial({
			color: 0x7a8a9a,
			emissive: 0x5a6a7a,
			side: THREE.BackSide,
			roughness: 1,
			metalness: 0
		});
		var skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
		scene.add(skyMesh);
		allObjects.push(skyMesh);

		var groundGeometry = new THREE.BoxGeometry(400, 1, pipelineLength + 100);
		var groundMaterial = new THREE.MeshStandardMaterial({
			color: 0x5a6a5a,
			roughness: 0.9,
			metalness: 0.05
		});
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.y = -0.5;
		scene.add(ground);
		allObjects.push(ground);

		var fogColor = 0x8a9aaa;
		scene.fog = new THREE.Fog(fogColor, 150, 350);
		scene.background = new THREE.Color(fogColor);
	}

	function createHUD() {
		var hudDiv = document.getElementById('oil-pipeline-hud');
		if (!hudDiv) {
			hudDiv = document.createElement('div');
			hudDiv.id = 'oil-pipeline-hud';
			hudDiv.style.cssText = 'position:fixed;top:10px;left:10px;color:#0f0;font-family:monospace;font-size:14px;z-index:1000;text-shadow:0 0 5px #0f0;';
			document.body.appendChild(hudDiv);
			allObjects.push(hudDiv);
		}
		updateHUD();
	}

	function updateHUD() {
		var hudDiv = document.getElementById('oil-pipeline-hud');
		if (hudDiv) {
			hudDiv.innerHTML = 'CHARGES DISARMED: ' + gameState.chargesDisarmed + '/5<br>' +
				'SABOTEURS DOWN: ' + gameState.saboteursDowned + '<br>' +
				'PIPELINE INTEGRITY: ' + gameState.pipelineIntegrity + '%';
		}
	}

	function createToggleNotification(message) {
		var notifDiv = document.getElementById('oil-pipeline-notif');
		if (!notifDiv) {
			notifDiv = document.createElement('div');
			notifDiv.id = 'oil-pipeline-notif';
			notifDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
				'color:#0f0;font-family:monospace;font-size:24px;z-index:2000;' +
				'text-shadow:0 0 10px #0f0;background:rgba(0,0,0,0.7);padding:20px;border:2px solid #0f0;';
			document.body.appendChild(notifDiv);
		}
		notifDiv.textContent = message;
		notifDiv.style.display = 'block';
		setTimeout(function() {
			notifDiv.style.display = 'none';
		}, 2000);
	}

	function handleKeyDown(e) {
		if (e.key.toUpperCase() === 'O') {
			var now = Date.now();
			if (lastOKeyTime === null || now - lastOKeyTime > 400) {
				lastOKeyTime = now;
			}
		} else if (e.key.toUpperCase() === 'P' && lastOKeyTime !== null) {
			if (Date.now() - lastOKeyTime <= 400) {
				isActive = !isActive;
				var message = isActive ? 'PIPELINE DEFENSE ACTIVATED' : 'PIPELINE DEFENSE DEACTIVATED';
				createToggleNotification(message);
				lastOKeyTime = null;
			}
		}
	}

	var init = function(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		isActive = false;
		lastOKeyTime = null;
		gameState.chargesDisarmed = 0;
		gameState.saboteursDowned = 0;
		gameState.pipelineIntegrity = 100;
		allObjects = [];
		pumpPistons = [];
		pressureGauges = [];
		pipelineSegments = [];
		saboteurs = [];
		supportStruts = [];

		var pipelineLength = createPipeline();
		createPatrolRoad(pipelineLength);

		createPumpStation(-80, 15);
		createPumpStation(0, -20);
		createPumpStation(60, 15);

		for (var i = -80; i < 100; i += 8) {
			createSupportStrut(i);
		}

		createValveJunction(-50, 10);
		createValveJunction(30, -15);

		createPressureGauge(-60, 8, 0);
		createPressureGauge(-20, 8, Math.PI * 0.3);
		createPressureGauge(40, 8, Math.PI * 0.6);

		createShutOffValve(-90, -25);
		createShutOffValve(70, 25);

		createSaboteur(-40, 30);
		createSaboteur(20, -30);
		createSaboteur(80, 35);

		createEnvironment(pipelineLength);
		createHUD();

		document.addEventListener('keydown', handleKeyDown);
	};

	var update = function(delta) {
		if (!isActive) {
			return;
		}

		var time = Date.now() * 0.001;

		for (var i = 0; i < pumpPistons.length; i++) {
			var piston = pumpPistons[i];
			var displacement = Math.sin(time * piston.speed + piston.offset) * 0.8;
			piston.mesh.position.y = piston.baseY + displacement;
		}

		for (var j = 0; j < pressureGauges.length; j++) {
			var gauge = pressureGauges[j];
			var angle = Math.sin(time * gauge.speed + gauge.offset) * Math.PI * 0.3;
			gauge.needle.rotation.z = angle;
		}

		for (var k = 0; k < pipelineSegments.length; k++) {
			var segment = pipelineSegments[k];
			segment.position.y = 2 + Math.sin(time * 2 + k * 0.3) * 0.05;
		}
	};

	var reset = function() {
		document.removeEventListener('keydown', handleKeyDown);

		for (var i = 0; i < allObjects.length; i++) {
			var obj = allObjects[i];
			if (obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
				if (scene && obj.parent === scene) {
					scene.remove(obj);
				}
			} else if (obj.nodeType === 1 || obj.id) {
				if (obj.parentNode) {
					obj.parentNode.removeChild(obj);
				}
			}
		}

		allObjects = [];
		pumpPistons = [];
		pressureGauges = [];
		pipelineSegments = [];
		saboteurs = [];
		supportStruts = [];

		scene = null;
		camera = null;
		isActive = false;
		lastOKeyTime = null;
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
