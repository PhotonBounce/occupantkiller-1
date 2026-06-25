window.TorpedoFactory = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var sceneObjects = [];
	var hudCanvas = null;
	var hudVisible = true;
	var time = 0;
	var productionCount = 0;
	var guardsEliminated = 0;
	var lastTKeyTime = 0;
	var tKeyPressed = false;

	function init(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;
		sceneObjects = [];
		time = 0;
		productionCount = 0;
		guardsEliminated = 0;

		// Set scene background
		scene.background = new THREE.Color(0x1a1a1a);
		scene.fog = new THREE.Fog(0x1a1a1a, 100, 300);

		// FACTORY FLOOR - huge flat box, concrete grey
		var floorGeom = new THREE.BoxGeometry(120, 2, 150);
		var floorMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.y = -1;
		floor.castShadow = true;
		floor.receiveShadow = true;
		scene.add(floor);
		sceneObjects.push(floor);

		// ASSEMBLY LINE CONVEYOR - long flat box with cylinder rollers
		var conveyorGeom = new THREE.BoxGeometry(80, 0.5, 3);
		var conveyorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
		var conveyor = new THREE.Mesh(conveyorGeom, conveyorMat);
		conveyor.position.set(0, 1, -20);
		conveyor.castShadow = true;
		conveyor.receiveShadow = true;
		scene.add(conveyor);
		sceneObjects.push(conveyor);

		// Conveyor rollers (cylinders)
		for (var i = 0; i < 6; i++) {
			var rollerGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 16);
			var rollerMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
			var roller = new THREE.Mesh(rollerGeom, rollerMat);
			roller.rotation.z = Math.PI / 2;
			roller.position.set(-30 + i * 12, 0.8, -20);
			roller.castShadow = true;
			scene.add(roller);
			sceneObjects.push(roller);
		}

		// TORPEDO BODY FRAMES - 5 elongated boxes in row at various stages
		for (var i = 0; i < 5; i++) {
			var torpedoGeom = new THREE.BoxGeometry(2, 0.8, 8);
			var torpedoMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
			var torpedo = new THREE.Mesh(torpedoGeom, torpedoMat);
			torpedo.position.set(-30 + i * 15, 1.5, -20);
			torpedo.rotation.z = 0.2;
			torpedo.castShadow = true;
			torpedo.receiveShadow = true;
			scene.add(torpedo);
			sceneObjects.push(torpedo);
		}

		// WARHEAD MACHINING LATHE - box machine with cylinder chuck
		var latheBaseGeom = new THREE.BoxGeometry(6, 3, 6);
		var latheMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
		var latheBase = new THREE.Mesh(latheBaseGeom, latheMat);
		latheBase.position.set(40, 1.5, -30);
		latheBase.castShadow = true;
		latheBase.receiveShadow = true;
		scene.add(latheBase);
		sceneObjects.push(latheBase);

		// Lathe chuck (cylinder)
		var chuckGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
		var chuckMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
		var chuck = new THREE.Mesh(chuckGeom, chuckMat);
		chuck.rotation.z = Math.PI / 2;
		chuck.position.set(40, 3, -30);
		chuck.castShadow = true;
		scene.add(chuck);
		sceneObjects.push(chuck);

		// OVERHEAD CRANE GANTRY - box beam spanning width, LineSegments frame
		var gantryBeamGeom = new THREE.BoxGeometry(120, 1, 1);
		var gantryMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
		var gantryBeam = new THREE.Mesh(gantryBeamGeom, gantryMat);
		gantryBeam.position.set(0, 15, -20);
		gantryBeam.castShadow = true;
		scene.add(gantryBeam);
		sceneObjects.push(gantryBeam);

		// Gantry support legs
		for (var i = 0; i < 2; i++) {
			var legGeom = new THREE.BoxGeometry(1, 15, 1);
			var leg = new THREE.Mesh(legGeom, gantryMat);
			leg.position.set(-50 + i * 100, 7.5, -20);
			leg.castShadow = true;
			scene.add(leg);
			sceneObjects.push(leg);
		}

		// Gantry cable frame (LineSegments)
		var gantryFramePoints = [
			new THREE.Vector3(0, 15, -20),
			new THREE.Vector3(0, 10, -20),
			new THREE.Vector3(5, 15, -20),
			new THREE.Vector3(5, 10, -20)
		];
		var gantryFrameGeom = new THREE.BufferGeometry().setFromPoints(gantryFramePoints);
		var gantryLineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
		var gantryFrame = new THREE.LineSegments(gantryFrameGeom, gantryLineMat);
		scene.add(gantryFrame);
		sceneObjects.push(gantryFrame);

		// PARTS STORAGE SHELVING - 3 tall box racks
		for (var i = 0; i < 3; i++) {
			var rackGeom = new THREE.BoxGeometry(3, 12, 3);
			var rackMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
			var rack = new THREE.Mesh(rackGeom, rackMat);
			rack.position.set(-50 + i * 25, 6, 20);
			rack.castShadow = true;
			rack.receiveShadow = true;
			scene.add(rack);
			sceneObjects.push(rack);

			// Add shelves (thin boxes)
			for (var j = 0; j < 4; j++) {
				var shelfGeom = new THREE.BoxGeometry(3.5, 0.3, 3.5);
				var shelfMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
				var shelf = new THREE.Mesh(shelfGeom, shelfMat);
				shelf.position.set(-50 + i * 25, 2 + j * 3, 20);
				shelf.castShadow = true;
				scene.add(shelf);
				sceneObjects.push(shelf);
			}
		}

		// WELDING STATION - box table with emissive orange weld glow sphere
		var welderTableGeom = new THREE.BoxGeometry(6, 2, 6);
		var welderTableMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
		var welderTable = new THREE.Mesh(welderTableGeom, welderTableMat);
		welderTable.position.set(-30, 1, 30);
		welderTable.castShadow = true;
		welderTable.receiveShadow = true;
		scene.add(welderTable);
		sceneObjects.push(welderTable);

		// Weld glow sphere (emissive)
		var weldGlowGeom = new THREE.SphereGeometry(0.8, 16, 16);
		var weldGlowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, emissive: 0xff6600 });
		var weldGlow = new THREE.Mesh(weldGlowGeom, weldGlowMat);
		weldGlow.position.set(-30, 3.5, 30);
		scene.add(weldGlow);
		sceneObjects.push(weldGlow);

		// CHEMICAL PROPELLANT TANKS - 3 tall cylinders with hazard color
		for (var i = 0; i < 3; i++) {
			var tankGeom = new THREE.CylinderGeometry(1.2, 1.2, 10, 16);
			var tankMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 });
			var tank = new THREE.Mesh(tankGeom, tankMat);
			tank.position.set(50 + i * 12, 5, 0);
			tank.castShadow = true;
			tank.receiveShadow = true;
			scene.add(tank);
			sceneObjects.push(tank);

			// Hazard stripe (thin box)
			var stripeGeom = new THREE.BoxGeometry(3, 0.5, 0.2);
			var stripeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
			var stripe = new THREE.Mesh(stripeGeom, stripeMat);
			stripe.position.set(50 + i * 12, 5, 1.3);
			scene.add(stripe);
			sceneObjects.push(stripe);
		}

		// QUALITY CONTROL TESTING TUBE - horizontal cylinder fixture
		var testTubeGeom = new THREE.CylinderGeometry(0.4, 0.4, 12, 16);
		var testTubeMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4 });
		var testTube = new THREE.Mesh(testTubeGeom, testTubeMat);
		testTube.rotation.z = Math.PI / 2;
		testTube.position.set(0, 5, 45);
		testTube.castShadow = true;
		scene.add(testTube);
		sceneObjects.push(testTube);

		// Test tube fixture (box)
		var tubeFixtureGeom = new THREE.BoxGeometry(15, 2, 2);
		var tubeFixtureMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });
		var tubeFixture = new THREE.Mesh(tubeFixtureGeom, tubeFixtureMat);
		tubeFixture.position.set(0, 3, 45);
		tubeFixture.castShadow = true;
		scene.add(tubeFixture);
		sceneObjects.push(tubeFixture);

		// SHIPPING DOCK - box platform with loaded pallet boxes
		var dockPlatformGeom = new THREE.BoxGeometry(20, 1, 12);
		var dockMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5 });
		var dockPlatform = new THREE.Mesh(dockPlatformGeom, dockMat);
		dockPlatform.position.set(-40, 1, -50);
		dockPlatform.castShadow = true;
		scene.add(dockPlatform);
		sceneObjects.push(dockPlatform);

		// Pallet boxes (stacked)
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 2; j++) {
				var palletBoxGeom = new THREE.BoxGeometry(4, 3, 4);
				var palletMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 });
				var palletBox = new THREE.Mesh(palletBoxGeom, palletMat);
				palletBox.position.set(-50 + i * 8, 2.5 + j * 3.5, -50);
				palletBox.castShadow = true;
				scene.add(palletBox);
				sceneObjects.push(palletBox);
			}
		}

		// GUARD TOWER POST - elevated box cabin on cylinder legs
		// Tower legs (2 cylinders)
		for (var i = 0; i < 2; i++) {
			var legGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
			var legMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
			var leg = new THREE.Mesh(legGeom, legMat);
			leg.position.set(60 + i * 6, 4, -40);
			leg.castShadow = true;
			scene.add(leg);
			sceneObjects.push(leg);
		}

		// Tower cabin (box)
		var cabinGeom = new THREE.BoxGeometry(8, 4, 8);
		var cabinMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });
		var cabin = new THREE.Mesh(cabinGeom, cabinMat);
		cabin.position.set(63, 11, -40);
		cabin.castShadow = true;
		scene.add(cabin);
		sceneObjects.push(cabin);

		// Tower window (emissive box, glowing)
		var windowGeom = new THREE.BoxGeometry(2, 2, 0.2);
		var windowMat = new THREE.MeshBasicMaterial({ color: 0xffff00, emissive: 0xffff00 });
		var window = new THREE.Mesh(windowGeom, windowMat);
		window.position.set(68, 11, -43);
		scene.add(window);
		sceneObjects.push(window);

		// WORKER FIGURES - box + sphere human forms, 8 workers
		for (var i = 0; i < 8; i++) {
			// Worker body (box)
			var bodyGeom = new THREE.BoxGeometry(1, 2.5, 0.8);
			var bodyMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.5 });
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.set(-60 + i * 18, 1.5, 10);
			body.castShadow = true;
			scene.add(body);
			sceneObjects.push(body);

			// Worker head (sphere)
			var headGeom = new THREE.SphereGeometry(0.5, 16, 16);
			var headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
			var head = new THREE.Mesh(headGeom, headMat);
			head.position.set(-60 + i * 18, 3.5, 10);
			head.castShadow = true;
			scene.add(head);
			sceneObjects.push(head);
		}

		// FORKLIFT - box body + cylinder wheels + box fork arms
		var forkLiftBodyGeom = new THREE.BoxGeometry(3, 2.5, 5);
		var forkLiftMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6 });
		var forkLiftBody = new THREE.Mesh(forkLiftBodyGeom, forkLiftMat);
		forkLiftBody.position.set(20, 1.5, 0);
		forkLiftBody.castShadow = true;
		scene.add(forkLiftBody);
		sceneObjects.push(forkLiftBody);

		// Forklift wheels (4 cylinders)
		for (var i = 0; i < 4; i++) {
			var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
			var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
			var wheel = new THREE.Mesh(wheelGeom, wheelMat);
			wheel.rotation.z = Math.PI / 2;
			var xOff = i < 2 ? -1 : 1;
			var zOff = i % 2 === 0 ? -2 : 2;
			wheel.position.set(20 + xOff * 1.3, 0.6, 0 + zOff);
			scene.add(wheel);
			sceneObjects.push(wheel);
		}

		// Forklift forks (2 boxes)
		for (var i = 0; i < 2; i++) {
			var forkGeom = new THREE.BoxGeometry(0.3, 3, 0.5);
			var forkMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
			var fork = new THREE.Mesh(forkGeom, forkMat);
			fork.position.set(18.5 + i * 1.2, 2, 0);
			fork.castShadow = true;
			scene.add(fork);
			sceneObjects.push(fork);
		}

		// ELECTRICAL PANEL WALL - box cabinets with LineSegments conduit
		// Cabinet boxes
		for (var i = 0; i < 4; i++) {
			var cabinetGeom = new THREE.BoxGeometry(2, 4, 1);
			var cabinetMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
			var cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
			cabinet.position.set(-70 + i * 5, 2, 0);
			cabinet.castShadow = true;
			scene.add(cabinet);
			sceneObjects.push(cabinet);
		}

		// Electrical conduit (LineSegments)
		var conduitPoints = [
			new THREE.Vector3(-70, 4.5, 0.6),
			new THREE.Vector3(-70, 8, 0.6),
			new THREE.Vector3(-55, 8, 0.6),
			new THREE.Vector3(-55, 4.5, 0.6)
		];
		var conduitGeom = new THREE.BufferGeometry().setFromPoints(conduitPoints);
		var conduitMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
		var conduit = new THREE.LineSegments(conduitGeom, conduitMat);
		scene.add(conduit);
		sceneObjects.push(conduit);

		// EMERGENCY ALARM LIGHT - emissive red sphere on cylinder post, strobing
		// Post (cylinder)
		var alarmPostGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
		var alarmPostMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
		var alarmPost = new THREE.Mesh(alarmPostGeom, alarmPostMat);
		alarmPost.position.set(70, 3, 30);
		alarmPost.castShadow = true;
		scene.add(alarmPost);
		sceneObjects.push(alarmPost);

		// Alarm light (emissive sphere)
		var alarmGeom = new THREE.SphereGeometry(0.6, 16, 16);
		var alarmMat = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 });
		var alarm = new THREE.Mesh(alarmGeom, alarmMat);
		alarm.position.set(70, 6.5, 30);
		alarm.userData.isAlarm = true;
		scene.add(alarm);
		sceneObjects.push(alarm);

		// EXIT BLAST DOORS - two massive box halves
		for (var i = 0; i < 2; i++) {
			var doorGeom = new THREE.BoxGeometry(8, 12, 1);
			var doorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
			var door = new THREE.Mesh(doorGeom, doorMat);
			door.position.set(-25 + i * 50, 6, -70);
			door.castShadow = true;
			scene.add(door);
			sceneObjects.push(door);
		}

		// UNDERGROUND VENTILATION TUNNEL - box passage with cylinder fans
		var tunnelGeom = new THREE.BoxGeometry(15, 10, 30);
		var tunnelMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
		var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
		tunnel.position.set(0, 5, -85);
		tunnel.castShadow = true;
		scene.add(tunnel);
		sceneObjects.push(tunnel);

		// Tunnel fans (3 cylinders)
		for (var i = 0; i < 3; i++) {
			var fanGeom = new THREE.CylinderGeometry(2, 2, 0.5, 16);
			var fanMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
			var fan = new THREE.Mesh(fanGeom, fanMat);
			fan.rotation.x = Math.PI / 2;
			fan.position.set(-5 + i * 5, 5, -70);
			scene.add(fan);
			sceneObjects.push(fan);
		}

		// LIGHTING
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

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

		var pointLight1 = new THREE.PointLight(0xff6600, 1, 40);
		pointLight1.position.set(-30, 4, 30);
		pointLight1.castShadow = true;
		scene.add(pointLight1);

		var pointLight2 = new THREE.PointLight(0xffff00, 0.8, 30);
		pointLight2.position.set(63, 11, -40);
		scene.add(pointLight2);

		// Create HUD canvas
		createHUD();

		// Setup keyboard listener for HUD toggle
		window.addEventListener('keydown', handleKeyDown, false);
	}

	function createHUD() {
		hudCanvas = document.createElement('canvas');
		hudCanvas.width = window.innerWidth;
		hudCanvas.height = window.innerHeight;
		hudCanvas.style.position = 'absolute';
		hudCanvas.style.top = '0';
		hudCanvas.style.left = '0';
		hudCanvas.style.pointerEvents = 'none';
		document.body.appendChild(hudCanvas);
	}

	function drawHUD() {
		if (!hudCanvas) return;

		var ctx = hudCanvas.getContext('2d');
		ctx.fillStyle = 'rgba(0, 0, 0, 0)';
		ctx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

		if (!hudVisible) return;

		ctx.fillStyle = '#00ff00';
		ctx.font = '24px monospace';

		ctx.fillText('PRODUCTION LINE STATUS: ACTIVE', 20, 40);
		ctx.fillText('TORPEDOES NEUTRALIZED: ' + productionCount + '/5', 20, 80);
		ctx.fillText('GUARDS ELIMINATED: ' + guardsEliminated + '/8', 20, 120);
	}

	function handleKeyDown(event) {
		var now = Date.now();
		if (event.key === 't' || event.key === 'T') {
			if (!tKeyPressed) {
				lastTKeyTime = now;
				tKeyPressed = true;
			}
		}
		if (event.key === 'f' || event.key === 'F') {
			if (tKeyPressed && now - lastTKeyTime < 400) {
				hudVisible = !hudVisible;
				tKeyPressed = false;
			}
		}
	}

	function update(delta) {
		time += delta;

		// Conveyor belt oscillation
		var conveyorObjects = [];
		for (var i = 0; i < sceneObjects.length; i++) {
			if (sceneObjects[i].geometry && sceneObjects[i].geometry instanceof THREE.BoxGeometry) {
				if (sceneObjects[i].position.z === -20 && Math.abs(sceneObjects[i].scale.z - 3) < 0.1) {
					conveyorObjects.push(sceneObjects[i]);
				}
			}
		}
		var conveyorOscillation = Math.sin(time * 2) * 0.3;

		// Crane gantry slides back/forth slowly
		var gantryObjects = [];
		for (var i = 0; i < sceneObjects.length; i++) {
			if (sceneObjects[i].geometry && sceneObjects[i].geometry instanceof THREE.BoxGeometry) {
				if (sceneObjects[i].position.y === 15 && sceneObjects[i].position.z === -20) {
					gantryObjects.push(sceneObjects[i]);
				}
			}
		}
		var gantrySlide = Math.sin(time * 0.5) * 15;

		// Welding sparks pulse (weld sphere emissive intensity oscillates)
		for (var i = 0; i < sceneObjects.length; i++) {
			if (sceneObjects[i].userData && sceneObjects[i].userData.isAlarm) {
				// Alarm light strobes
				var strobeVal = Math.sin(time * 8) > 0 ? 1 : 0.2;
				sceneObjects[i].material.emissive.setScalar(strobeVal);
			}
		}

		// Forklift patrol
		for (var i = 0; i < sceneObjects.length; i++) {
			if (sceneObjects[i].position.x === 20 && sceneObjects[i].position.z === 0) {
				sceneObjects[i].position.x = 20 + Math.sin(time * 0.3) * 10;
				sceneObjects[i].position.z = Math.cos(time * 0.3) * 5;
			}
		}

		drawHUD();
	}

	function reset() {
		// Dispose all materials and geometries
		for (var i = 0; i < sceneObjects.length; i++) {
			var obj = sceneObjects[i];
			if (obj.geometry) {
				obj.geometry.dispose();
			}
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
		sceneObjects = [];

		// Remove HUD
		if (hudCanvas && hudCanvas.parentNode) {
			hudCanvas.parentNode.removeChild(hudCanvas);
		}
		hudCanvas = null;

		// Remove event listener
		window.removeEventListener('keydown', handleKeyDown, false);

		scene = null;
		camera = null;
		time = 0;
		productionCount = 0;
		guardsEliminated = 0;
		hudVisible = true;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
