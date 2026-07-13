window.MunitionsDepot = (function() {
	'use strict';

	var scene, camera;
	var objects = [];
	var animations = [];
	var igloosDestroyed = 0;
	var guardsNeutralized = 0;
	var detonationPlaced = false;
	var hudVisible = false;
	var hudCanvas, hudContext;
	var lastKeyPress = null;
	var keyPressTime = 0;

	function init(sceneArg, cameraArg) {
		scene = sceneArg;
		camera = cameraArg;
		objects = [];
		animations = [];
		igloosDestroyed = 0;
		guardsNeutralized = 0;
		detonationPlaced = false;
		hudVisible = false;
		lastKeyPress = null;
		keyPressTime = 0;

		buildScene();
		setupHUD();
		setupControls();
	}

	function buildScene() {
		var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
		var groundGeo = new THREE.BoxGeometry(500, 1, 500);
		var ground = new THREE.Mesh(groundGeo, groundMaterial);
		ground.position.y = -0.5;
		scene.add(ground);
		objects.push(ground);

		// Ammo storage igloos (6 half-sphere domes)
		var iglooMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
		var igloPositions = [
			[-60, 0, -80],
			[-20, 0, -80],
			[20, 0, -80],
			[-60, 0, -140],
			[-20, 0, -140],
			[20, 0, -140]
		];
		igloPositions.forEach(function(pos, idx) {
			var conGeo = new THREE.ConeGeometry(15, 20, 32);
			var cone = new THREE.Mesh(conGeo, iglooMaterial);
			cone.position.set(pos[0], pos[1] + 10, pos[2]);
			cone.userData.isIgloo = true;
			cone.userData.iglooIndex = idx;
			scene.add(cone);
			objects.push(cone);
		});

		// Bomb revetment walls (3 U-shaped box arrangements)
		var revetMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var revetPositions = [
			[70, 0, -70],
			[70, 0, 0],
			[70, 0, 70]
		];
		revetPositions.forEach(function(pos) {
			var wall1 = new THREE.Mesh(new THREE.BoxGeometry(50, 20, 5), revetMaterial);
			wall1.position.set(pos[0], pos[1] + 10, pos[2] - 25);
			scene.add(wall1);
			objects.push(wall1);

			var wall2 = new THREE.Mesh(new THREE.BoxGeometry(5, 20, 50), revetMaterial);
			wall2.position.set(pos[0] - 25, pos[1] + 10, pos[2]);
			scene.add(wall2);
			objects.push(wall2);

			var wall3 = new THREE.Mesh(new THREE.BoxGeometry(5, 20, 50), revetMaterial);
			wall3.position.set(pos[0] + 25, pos[1] + 10, pos[2]);
			scene.add(wall3);
			objects.push(wall3);
		});

		// Artillery shell stack (stacked cylinders in pyramid)
		var shellMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
		var shellStartPos = [-100, 0, 50];
		for (var row = 0; row < 4; row++) {
			for (var col = 0; col < 4 - row; col++) {
				var shellGeo = new THREE.CylinderGeometry(3, 3, 15, 16);
				var shell = new THREE.Mesh(shellGeo, shellMaterial);
				shell.position.set(
					shellStartPos[0] + col * 8 + row * 4,
					shellStartPos[1] + row * 15 + 8,
					shellStartPos[2]
				);
				shell.rotation.z = Math.PI / 2;
				scene.add(shell);
				objects.push(shell);
			}
		}

		// Loading crane
		var craneBodyMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
		var craneBase = new THREE.Mesh(new THREE.BoxGeometry(8, 40, 8), craneBodyMat);
		craneBase.position.set(0, 20, -40);
		scene.add(craneBase);
		objects.push(craneBase);

		var craneArm = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 3), craneBodyMat);
		craneArm.position.set(30, 40, -40);
		scene.add(craneArm);
		objects.push(craneArm);

		var winchCyl = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 10, 16), craneBodyMat);
		winchCyl.position.set(0, 35, -40);
		winchCyl.rotation.z = Math.PI / 2;
		scene.add(winchCyl);
		objects.push(winchCyl);

		animations.push({
			object: craneArm,
			type: 'rotation',
			axis: 'y',
			speed: 0.3,
			center: [0, 40, -40]
		});

		// Military truck
		var truckCabMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
		var truckCab = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 6), truckCabMat);
		truckCab.position.set(0, 4, 120);
		scene.add(truckCab);
		objects.push(truckCab);

		var truckTrailer = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 20), truckCabMat);
		truckTrailer.position.set(0, 4, 130);
		scene.add(truckTrailer);
		objects.push(truckTrailer);

		var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
		for (var w = 0; w < 4; w++) {
			var wheel = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 2, 16), wheelMat);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(-5 + w * 3, 2, 120 + w * 5);
			scene.add(wheel);
			objects.push(wheel);
		}

		animations.push({
			object: truckCab,
			type: 'circuit',
			points: [[0, 4, 120], [0, 4, 150], [50, 4, 150], [50, 4, 120]],
			speed: 0.02
		});

		// Perimeter fence
		var fenceMat = new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 2 });
		var fenceGeo = new THREE.BufferGeometry();
		var fencePoints = [
			[-250, 5, -250], [250, 5, -250],
			[250, 5, -250], [250, 5, 250],
			[250, 5, 250], [-250, 5, 250],
			[-250, 5, 250], [-250, 5, -250]
		];
		fenceGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePoints.flat()), 3));
		var fence = new THREE.LineSegments(fenceGeo, fenceMat);
		scene.add(fence);
		objects.push(fence);

		// Guard tower
		var towerLegMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
		for (var leg = 0; leg < 4; leg++) {
			var legGeo = new THREE.BoxGeometry(3, 30, 3);
			var legMesh = new THREE.Mesh(legGeo, towerLegMat);
			legMesh.position.set([-15, 15, -15, 15][leg], 15, [-15, -15, 15, 15][leg]);
			scene.add(legMesh);
			objects.push(legMesh);
		}

		var towerCabin = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 15), towerLegMat);
		towerCabin.position.set(0, 35, -200);
		scene.add(towerCabin);
		objects.push(towerCabin);

		// Fuel bowser
		var bowserTankGeo = new THREE.CylinderGeometry(6, 6, 20, 16);
		var bowserMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
		var bowserTank = new THREE.Mesh(bowserTankGeo, bowserMat);
		bowserTank.position.set(-150, 6, 100);
		bowserTank.rotation.z = Math.PI / 2;
		scene.add(bowserTank);
		objects.push(bowserTank);

		var bowserWheels = new THREE.MeshStandardMaterial({ color: 0x000000 });
		for (var bw = 0; bw < 2; bw++) {
			var bwheel = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 2, 16), bowserWheels);
			bwheel.rotation.z = Math.PI / 2;
			bwheel.position.set(-150 + bw * 8, 2, 100);
			scene.add(bwheel);
			objects.push(bwheel);
		}

		// Fire suppression trailer
		var suppMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
		var suppBody = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 10), suppMat);
		suppBody.position.set(150, 3, -100);
		scene.add(suppBody);
		objects.push(suppBody);

		var suppTank = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 10, 16), suppMat);
		suppTank.position.set(150, 6, -100);
		suppTank.rotation.z = Math.PI / 2;
		scene.add(suppTank);
		objects.push(suppTank);

		// Command post building
		var cmdMat = new THREE.MeshStandardMaterial({ color: 0x4682B4 });
		var cmdBuilding = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 20), cmdMat);
		cmdBuilding.position.set(-180, 7.5, 0);
		scene.add(cmdBuilding);
		objects.push(cmdBuilding);

		var antennaCylGeo = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
		var antennaMat = new THREE.MeshStandardMaterial({ color: 0x696969 });
		var antenna = new THREE.Mesh(antennaCylGeo, antennaMat);
		antenna.position.set(-180, 30, 0);
		scene.add(antenna);
		objects.push(antenna);

		// Bomb disposal robot
		var robotBodyMat = new THREE.MeshStandardMaterial({ color: 0x32CD32 });
		var robotBody = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 6), robotBodyMat);
		robotBody.position.set(50, 4, 50);
		scene.add(robotBody);
		objects.push(robotBody);

		var robotArm = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 12, 8), robotBodyMat);
		robotArm.position.set(50, 12, 50);
		robotArm.rotation.z = Math.PI / 3;
		scene.add(robotArm);
		objects.push(robotArm);

		animations.push({
			object: robotArm,
			type: 'rotation',
			axis: 'z',
			speed: 0.5,
			center: [50, 12, 50]
		});

		// Crate pallets (4 groups)
		var crateMat = new THREE.MeshStandardMaterial({ color: 0xA0522D });
		var cratePositions = [
			[100, 0, -50],
			[-100, 0, 80],
			[80, 0, 100],
			[-150, 0, -150]
		];
		cratePositions.forEach(function(pos) {
			for (var c = 0; c < 3; c++) {
				var crate = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), crateMat);
				crate.position.set(pos[0] + c * 10, pos[1] + c * 8, pos[2]);
				scene.add(crate);
				objects.push(crate);
			}
		});

		// Warning signs (5 signs, red emissive)
		var signMat = new THREE.MeshStandardMaterial({
			color: 0xFF0000,
			emissive: 0xFF0000,
			emissiveIntensity: 0.5
		});
		var signPositions = [
			[-200, 10, -200],
			[200, 10, -200],
			[200, 10, 200],
			[-200, 10, 200],
			[0, 10, -220]
		];
		signPositions.forEach(function(pos) {
			var sign = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.5), signMat);
			sign.position.set(pos[0], pos[1], pos[2]);
			sign.userData.isSign = true;
			scene.add(sign);
			objects.push(sign);
		});

		animations.push({
			object: 'allSigns',
			type: 'pulse',
			speed: 0.05
		});

		// Forklift
		var forkMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
		var forkBody = new THREE.Mesh(new THREE.BoxGeometry(5, 6, 8), forkMat);
		forkBody.position.set(-50, 3, 0);
		scene.add(forkBody);
		objects.push(forkBody);

		var forkTine1 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 15), forkMat);
		forkTine1.position.set(-52, 3, 0);
		scene.add(forkTine1);
		objects.push(forkTine1);

		var forkTine2 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 15), forkMat);
		forkTine2.position.set(-48, 3, 0);
		scene.add(forkTine2);
		objects.push(forkTine2);

		// Blast doors (two large box halves)
		var blastMat = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
		var blastDoor1 = new THREE.Mesh(new THREE.BoxGeometry(15, 25, 2), blastMat);
		blastDoor1.position.set(-8, 12.5, -200);
		scene.add(blastDoor1);
		objects.push(blastDoor1);

		var blastDoor2 = new THREE.Mesh(new THREE.BoxGeometry(15, 25, 2), blastMat);
		blastDoor2.position.set(8, 12.5, -200);
		scene.add(blastDoor2);
		objects.push(blastDoor2);

		// Sentry guards (5 box+sphere figures)
		var guardMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
		var guardSkinMat = new THREE.MeshStandardMaterial({ color: 0xF4A460 });
		var guardPatrolPath = [
			[-250, 0, 0],
			[-250, 0, 250],
			[250, 0, 250],
			[250, 0, -250]
		];

		for (var g = 0; g < 5; g++) {
			var guardBody = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 3), guardMat);
			guardBody.position.set(-250 + g * 100, 4, 0);
			guardBody.userData.isGuard = true;
			guardBody.userData.guardIndex = g;
			scene.add(guardBody);
			objects.push(guardBody);

			var guardHead = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), guardSkinMat);
			guardHead.position.set(-250 + g * 100, 10, 0);
			scene.add(guardHead);
			objects.push(guardHead);

			animations.push({
				object: guardBody,
				type: 'patrol',
				points: guardPatrolPath,
				speed: 0.01,
				guardIndex: g
			});
		}
	}

	function setupHUD() {
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 150;
		canvas.style.position = 'fixed';
		canvas.style.top = '20px';
		canvas.style.left = '20px';
		canvas.style.zIndex = '1000';
		canvas.style.display = 'none';
		canvas.style.fontFamily = 'monospace';

		document.body.appendChild(canvas);
		hudCanvas = canvas;
		hudContext = canvas.getContext('2d');
	}

	function updateHUD() {
		if (!hudVisible || !hudContext) return;

		hudContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
		hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

		hudContext.fillStyle = '#00FF00';
		hudContext.font = '14px monospace';
		hudContext.fillText('MUNITIONS DESTROYED: ' + igloosDestroyed + '/6 IGLOOS', 10, 30);
		hudContext.fillText('DETONATION CHARGE: ' + (detonationPlaced ? 'PLACED' : 'NOT PLACED'), 10, 60);
		hudContext.fillText('GUARDS NEUTRALIZED: ' + guardsNeutralized + '/5', 10, 90);
	}

	function setupControls() {
		document.addEventListener('keydown', function(e) {
			var now = Date.now();
			var key = e.key.toUpperCase();

			if (key === 'M') {
				if (lastKeyPress === 'M' && now - keyPressTime < 400) {
					lastKeyPress = 'M';
					keyPressTime = now;
				} else {
					lastKeyPress = 'M';
					keyPressTime = now;
				}
			} else if (key === 'D' && lastKeyPress === 'M' && now - keyPressTime < 400) {
				hudVisible = !hudVisible;
				if (hudCanvas) {
					hudCanvas.style.display = hudVisible ? 'block' : 'none';
				}
				lastKeyPress = null;
			} else {
				lastKeyPress = null;
			}
		});
	}

	function update(delta) {
		updateHUD();

		animations.forEach(function(anim) {
			if (anim.type === 'rotation' && anim.object) {
				if (anim.axis === 'y') {
					anim.object.rotation.y += anim.speed * delta;
				} else if (anim.axis === 'z') {
					anim.object.rotation.z += anim.speed * delta;
				}
			} else if (anim.type === 'circuit' && anim.object) {
				anim.progress = (anim.progress || 0) + anim.speed * delta;
				if (anim.progress >= 1) anim.progress = 0;

				var pathIdx = Math.floor(anim.progress * 4);
				var nextIdx = (pathIdx + 1) % 4;
				var t = (anim.progress * 4) % 1;

				var p1 = anim.points[pathIdx];
				var p2 = anim.points[nextIdx];

				anim.object.position.x = p1[0] + (p2[0] - p1[0]) * t;
				anim.object.position.y = p1[1] + (p2[1] - p1[1]) * t;
				anim.object.position.z = p1[2] + (p2[2] - p1[2]) * t;
			} else if (anim.type === 'patrol' && anim.object) {
				anim.progress = (anim.progress || 0) + anim.speed * delta;
				if (anim.progress >= 1) anim.progress = 0;

				var pIdx = Math.floor(anim.progress * 4);
				var pNextIdx = (pIdx + 1) % 4;
				var pt = (anim.progress * 4) % 1;

				var pp1 = anim.points[pIdx];
				var pp2 = anim.points[pNextIdx];

				anim.object.position.x = pp1[0] + (pp2[0] - pp1[0]) * pt;
				anim.object.position.z = pp1[2] + (pp2[2] - pp1[2]) * pt;
			} else if (anim.type === 'pulse') {
				objects.forEach(function(obj) {
					if (obj.userData && obj.userData.isSign) {
						var intensity = 0.5 + 0.3 * Math.sin(Date.now() * 0.005);
						obj.material.emissiveIntensity = intensity;
					}
				});
			}
		});
	}

	function reset() {
		// Dispose geometries and materials
		objects.forEach(function(obj) {
			if (obj.geometry) obj.geometry.dispose();
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					obj.material.forEach(function(m) { m.dispose(); });
				} else {
					obj.material.dispose();
				}
			}
			if (scene) scene.remove(obj);
		});

		objects = [];
		animations = [];
		igloosDestroyed = 0;
		guardsNeutralized = 0;
		detonationPlaced = false;
		hudVisible = false;

		if (hudCanvas) {
			hudCanvas.remove();
			hudCanvas = null;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
