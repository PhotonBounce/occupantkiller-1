window.RobotFactory = (function() {
	'use strict';

	var scene = null;
	var sceneObjects = [];
	var animationState = {
		robotArmRotation: 0,
		conveyorOffset: 0,
		pressHeight: 0,
		scannerRotation: 0,
		chargingPulse: 0,
		time: 0
	};

	function init(sceneParam) {
		scene = sceneParam;
		sceneObjects = [];

		var lightGray = 0xcccccc;
		var darkGray = 0x333333;
		var metalColor = 0x888888;
		var orangeWeld = 0xff8800;
		var redLaser = 0xff0000;
		var greenCharge = 0x00ff00;
		var blueElectric = 0x0088ff;

		// 1. Factory Floor Base Platform
		var floorGeometry = new THREE.BoxGeometry(50, 2, 50);
		var floorMaterial = new THREE.MeshStandardMaterial({ color: darkGray, metalness: 0.3, roughness: 0.8 });
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = -1;
		scene.add(floor);
		sceneObjects.push(floor);

		// 2. Conveyor Belt Structure - Main Frame
		var conveyorFrameGeometry = new THREE.BoxGeometry(30, 1, 6);
		var conveyorFrameMaterial = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.7 });
		var conveyorFrame = new THREE.Mesh(conveyorFrameGeometry, conveyorFrameMaterial);
		conveyorFrame.position.set(0, 2, 0);
		scene.add(conveyorFrame);
		sceneObjects.push(conveyorFrame);

		// 3. Conveyor Belt Rollers (two cylinders at ends)
		var rollerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
		var rollerMaterial = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.9 });
		var rollerLeft = new THREE.Mesh(rollerGeometry, rollerMaterial);
		rollerLeft.rotation.z = Math.PI / 2;
		rollerLeft.position.set(-14, 2.5, 0);
		scene.add(rollerLeft);
		sceneObjects.push(rollerLeft);

		var rollerRight = new THREE.Mesh(rollerGeometry, rollerMaterial);
		rollerRight.rotation.z = Math.PI / 2;
		rollerRight.position.set(14, 2.5, 0);
		scene.add(rollerRight);
		sceneObjects.push(rollerRight);

		// 4. Chassis Frames on Conveyor (cube shapes moving)
		for (var i = 0; i < 4; i++) {
			var chassisGeometry = new THREE.BoxGeometry(3, 2, 3);
			var chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
			var chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
			chassis.position.set(-10 + i * 7, 3.5, 0);
			chassis.userData.isMoving = true;
			chassis.userData.baseX = -10 + i * 7;
			scene.add(chassis);
			sceneObjects.push(chassis);
		}

		// 5. Robot Arm Assembly Unit 1 (left side)
		var baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
		var baseMaterial = new THREE.MeshStandardMaterial({ color: orangeWeld, metalness: 0.8 });
		var armBase1 = new THREE.Mesh(baseGeometry, baseMaterial);
		armBase1.position.set(-15, 5, 8);
		scene.add(armBase1);
		sceneObjects.push(armBase1);

		var upperArmGeometry = new THREE.BoxGeometry(1, 1, 6);
		var armMaterial = new THREE.MeshStandardMaterial({ color: orangeWeld });
		var upperArm1 = new THREE.Mesh(upperArmGeometry, armMaterial);
		upperArm1.position.set(-15, 7, 8);
		upperArm1.userData.isRotating = true;
		upperArm1.userData.basePosition = { x: -15, y: 7, z: 8 };
		armBase1.add(upperArm1);
		sceneObjects.push(upperArm1);

		var welderTip1Geometry = new THREE.SphereGeometry(0.3, 8, 8);
		var welderMaterial = new THREE.MeshStandardMaterial({ color: redLaser, emissive: redLaser, emissiveIntensity: 0.5 });
		var welderTip1 = new THREE.Mesh(welderTip1Geometry, welderMaterial);
		welderTip1.position.set(0, 2.5, 0);
		upperArm1.add(welderTip1);

		// 6. Robot Arm Assembly Unit 2 (right side)
		var armBase2 = new THREE.Mesh(baseGeometry.clone(), baseMaterial.clone());
		armBase2.position.set(15, 5, 8);
		scene.add(armBase2);
		sceneObjects.push(armBase2);

		var upperArm2 = new THREE.Mesh(upperArmGeometry.clone(), armMaterial.clone());
		upperArm2.position.set(15, 7, 8);
		upperArm2.userData.isRotating = true;
		upperArm2.userData.basePosition = { x: 15, y: 7, z: 8 };
		armBase2.add(upperArm2);
		sceneObjects.push(upperArm2);

		var welderTip2 = new THREE.Mesh(welderTip1Geometry.clone(), welderMaterial.clone());
		welderTip2.position.set(0, 2.5, 0);
		upperArm2.add(welderTip2);

		// 7. Hydraulic Press (main body)
		var pressBodyGeometry = new THREE.BoxGeometry(8, 2, 8);
		var pressMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
		var pressBody = new THREE.Mesh(pressBodyGeometry, pressMaterial);
		pressBody.position.set(0, 8, -15);
		scene.add(pressBody);
		sceneObjects.push(pressBody);

		// 8. Hydraulic Press Head (stamp part)
		var pressHeadGeometry = new THREE.BoxGeometry(7, 1, 7);
		var pressHeadMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });
		var pressHead = new THREE.Mesh(pressHeadGeometry, pressHeadMaterial);
		pressHead.position.set(0, 11, -15);
		pressHead.userData.baseY = 11;
		pressHead.userData.isStamping = true;
		scene.add(pressHead);
		sceneObjects.push(pressHead);

		// 9. Quality Control Laser Scanner (rotating)
		var scannerBaseGeometry = new THREE.BoxGeometry(3, 4, 3);
		var scannerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
		var scannerBase = new THREE.Mesh(scannerBaseGeometry, scannerMaterial);
		scannerBase.position.set(0, 5, 15);
		scene.add(scannerBase);
		sceneObjects.push(scannerBase);

		var scannerHeadGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
		var scannerHeadMaterial = new THREE.MeshStandardMaterial({ color: redLaser, emissive: redLaser, emissiveIntensity: 0.3 });
		var scannerHead = new THREE.Mesh(scannerHeadGeometry, scannerHeadMaterial);
		scannerHead.position.set(0, 7, 0);
		scannerHead.userData.isRotating = true;
		scannerBase.add(scannerHead);
		sceneObjects.push(scannerHead);

		// 10. Parts Bin Storage Tower 1 (left)
		var binGeometry = new THREE.BoxGeometry(4, 1.5, 4);
		var binMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.4 });
		for (var b = 0; b < 5; b++) {
			var bin = new THREE.Mesh(binGeometry, binMaterial);
			bin.position.set(-18, 2 + b * 2, -10);
			scene.add(bin);
			sceneObjects.push(bin);
		}

		// 11. Parts Bin Storage Tower 2 (right)
		for (var b2 = 0; b2 < 5; b2++) {
			var bin2 = new THREE.Mesh(binGeometry.clone(), binMaterial.clone());
			bin2.position.set(18, 2 + b2 * 2, -10);
			scene.add(bin2);
			sceneObjects.push(bin2);
		}

		// 12. AI Control Brain Tank (large sphere)
		var brainGeometry = new THREE.SphereGeometry(3, 32, 32);
		var brainMaterial = new THREE.MeshStandardMaterial({ color: blueElectric, emissive: blueElectric, emissiveIntensity: 0.3, metalness: 0.5 });
		var brainTank = new THREE.Mesh(brainGeometry, brainMaterial);
		brainTank.position.set(-20, 8, 0);
		scene.add(brainTank);
		sceneObjects.push(brainTank);

		// 13. Combat Robot Charging Bays (3 charging stations)
		for (var c = 0; c < 3; c++) {
			var bayGeometry = new THREE.BoxGeometry(3, 4, 3);
			var bayMaterial = new THREE.MeshStandardMaterial({ color: greenCharge, emissive: greenCharge, emissiveIntensity: 0.2, metalness: 0.6 });
			var bay = new THREE.Mesh(bayGeometry, bayMaterial);
			bay.position.set(20, 2, -5 + c * 6);
			bay.userData.isPulsing = true;
			bay.userData.baseScale = 1;
			scene.add(bay);
			sceneObjects.push(bay);
		}

		// 14. Scrap Recycler Crusher (large box with moving lid)
		var crusherBodyGeometry = new THREE.BoxGeometry(6, 6, 6);
		var crusherMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
		var crusherBody = new THREE.Mesh(crusherBodyGeometry, crusherMaterial);
		crusherBody.position.set(-8, 4, -20);
		scene.add(crusherBody);
		sceneObjects.push(crusherBody);

		var crusherLidGeometry = new THREE.BoxGeometry(6, 1, 6);
		var crusherLidMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
		var crusherLid = new THREE.Mesh(crusherLidGeometry, crusherLidMaterial);
		crusherLid.position.set(0, 3.5, 0);
		crusherLid.userData.baseY = 3.5;
		crusherLid.userData.isCrushing = true;
		crusherBody.add(crusherLid);
		sceneObjects.push(crusherLid);

		// 15. Security Bot Patrol Route Markers (cone pylons)
		var pylonGeometry = new THREE.ConeGeometry(0.8, 2, 8);
		var pylonMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5 });
		for (var p = 0; p < 4; p++) {
			var pylon = new THREE.Mesh(pylonGeometry, pylonMaterial);
			var angle = (p / 4) * Math.PI * 2;
			pylon.position.set(
				Math.cos(angle) * 20,
				1,
				Math.sin(angle) * 20
			);
			scene.add(pylon);
			sceneObjects.push(pylon);
		}

		// 16. Worker Override Console (control panel)
		var consoleGeometry = new THREE.BoxGeometry(4, 3, 1);
		var consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x333366, metalness: 0.5 });
		var console = new THREE.Mesh(consoleGeometry, consoleMaterial);
		console.position.set(8, 3, -22);
		console.rotation.z = 0.2;
		scene.add(console);
		sceneObjects.push(console);

		// Add console buttons
		var buttonGeometry = new THREE.SphereGeometry(0.3, 8, 8);
		var buttonMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.2 });
		for (var bt = 0; bt < 6; bt++) {
			var button = new THREE.Mesh(buttonGeometry, buttonMaterial);
			button.position.set(-1.5 + (bt % 3) * 1.5, 0.5 - Math.floor(bt / 3) * 1.5, 0.6);
			console.add(button);
		}

		return true;
	}

	function update(deltaTime) {
		if (!scene) return;

		animationState.time += deltaTime;

		// Animate conveyor belt and chassis movement
		for (var i = 0; i < sceneObjects.length; i++) {
			var obj = sceneObjects[i];

			if (obj.userData.isMoving) {
				var offset = (animationState.time * 2) % 28;
				obj.position.x = obj.userData.baseX - 14 + offset;
				if (obj.position.x > 14) {
					obj.position.x -= 28;
				}
			}

			// Rotate robot arms
			if (obj.userData.isRotating && obj.parent && obj.parent.userData.isRotating === undefined) {
				var rotationAngle = Math.sin(animationState.time * 2) * 0.8;
				obj.rotation.z = rotationAngle;
			}

			// Animate hydraulic press stamping
			if (obj.userData.isStamping) {
				var stampCycle = Math.sin(animationState.time * 1.5) * 0.5;
				var stampAmount = Math.max(0, stampCycle);
				obj.position.y = obj.userData.baseY - stampAmount * 2;
			}

			// Rotate scanner head
			if (obj.userData.isRotating && obj.parent && obj.parent.position.z === 15) {
				obj.rotation.y = animationState.time * 2;
			}

			// Pulse charging bays
			if (obj.userData.isPulsing) {
				var pulseAmount = 0.5 + Math.sin(animationState.time * 3) * 0.3;
				obj.scale.set(pulseAmount, pulseAmount, pulseAmount);
			}

			// Animate crusher lid
			if (obj.userData.isCrushing) {
				var crushCycle = (Math.sin(animationState.time * 1.2) + 1) / 2;
				obj.position.y = obj.userData.baseY - crushCycle * 1.5;
			}
		}
	}

	function reset() {
		if (scene) {
			for (var i = sceneObjects.length - 1; i >= 0; i--) {
				var obj = sceneObjects[i];
				if (obj.parent) {
					obj.parent.remove(obj);
				} else {
					scene.remove(obj);
				}
			}
		}
		sceneObjects = [];
		animationState = {
			robotArmRotation: 0,
			conveyorOffset: 0,
			pressHeight: 0,
			scannerRotation: 0,
			chargingPulse: 0,
			time: 0
		};
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
