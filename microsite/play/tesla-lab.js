window.TeslaLab = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lightningArcs = [];
	var teslaCoilSpheres = [];
	var rotatingCoils = [];
	var oscilloscopeScreens = [];
	var sparkPoints = [];
	var vanDeGraaffSphere = null;

	function init(inputScene, inputCamera) {
		scene = inputScene;
		camera = inputCamera;
		objects = [];
		lightningArcs = [];
		teslaCoilSpheres = [];
		rotatingCoils = [];
		oscilloscopeScreens = [];
		sparkPoints = [];

		// Main Tesla Coils
		var teslaMaterial = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.8, roughness: 0.2 });
		var teslaCoil1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4, 32), teslaMaterial);
		teslaCoil1.position.set(-5, 2, -8);
		scene.add(teslaCoil1);
		objects.push(teslaCoil1);

		var teslaCoil2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4, 32), teslaMaterial);
		teslaCoil2.position.set(5, 2, -8);
		scene.add(teslaCoil2);
		objects.push(teslaCoil2);

		// Tesla Coil Toroid Spheres
		var toroidMaterial = new THREE.MeshStandardMaterial({ color: 0x6699BB, emissive: 0x3366FF, metalness: 0.9, roughness: 0.1 });
		var toroid1 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), toroidMaterial);
		toroid1.position.set(-5, 4.5, -8);
		scene.add(toroid1);
		objects.push(toroid1);
		teslaCoilSpheres.push({ mesh: toroid1, originalEmissive: 0x3366FF, time: 0 });

		var toroid2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), toroidMaterial);
		toroid2.position.set(5, 4.5, -8);
		scene.add(toroid2);
		objects.push(toroid2);
		teslaCoilSpheres.push({ mesh: toroid2, originalEmissive: 0x3366FF, time: 0 });

		// Lightning Arc Effects
		var lightningMaterial = new THREE.LineBasicMaterial({ color: 0xAABBFF, emissive: 0x6688FF, linewidth: 2 });
		var lightningGeom1 = new THREE.BufferGeometry();
		var positions1 = new Float32Array([
			-5, 3.8, -8,
			-4.5, 4.2, -7.5,
			-5.2, 4.5, -8.2,
			-5, 5.2, -8
		]);
		lightningGeom1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
		var lightningArc1 = new THREE.LineSegments(lightningGeom1, lightningMaterial);
		scene.add(lightningArc1);
		objects.push(lightningArc1);
		lightningArcs.push({ mesh: lightningArc1, time: 0, intensity: 0 });

		var lightningGeom2 = new THREE.BufferGeometry();
		var positions2 = new Float32Array([
			5, 3.8, -8,
			4.5, 4.2, -7.5,
			5.2, 4.5, -8.2,
			5, 5.2, -8
		]);
		lightningGeom2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
		var lightningArc2 = new THREE.LineSegments(lightningGeom2, lightningMaterial);
		scene.add(lightningArc2);
		objects.push(lightningArc2);
		lightningArcs.push({ mesh: lightningArc2, time: 0, intensity: 0 });

		// Van de Graaff Generator
		var poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 16);
		var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x554433, metalness: 0.6, roughness: 0.4 });
		var pole = new THREE.Mesh(poleGeom, poleMaterial);
		pole.position.set(-10, 1.25, 0);
		scene.add(pole);
		objects.push(pole);

		var sphereGeom = new THREE.SphereGeometry(0.8, 32, 32);
		var sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, emissive: 0x444444, metalness: 0.7, roughness: 0.3 });
		vanDeGraaffSphere = new THREE.Mesh(sphereGeom, sphereMaterial);
		vanDeGraaffSphere.position.set(-10, 3.5, 0);
		scene.add(vanDeGraaffSphere);
		objects.push(vanDeGraaffSphere);

		// Laboratory Workbench
		var benchGeom = new THREE.BoxGeometry(4, 0.8, 2);
		var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D1F, metalness: 0.2, roughness: 0.8 });
		var bench = new THREE.Mesh(benchGeom, benchMaterial);
		bench.position.set(0, 0.4, 5);
		scene.add(bench);
		objects.push(bench);

		// Equipment on bench
		var eqGeom1 = new THREE.BoxGeometry(0.4, 0.5, 0.3);
		var eqMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });
		var eq1 = new THREE.Mesh(eqGeom1, eqMaterial);
		eq1.position.set(-1.2, 1.2, 5);
		scene.add(eq1);
		objects.push(eq1);

		var eq2 = new THREE.Mesh(eqGeom1, eqMaterial);
		eq2.position.set(1.2, 1.2, 5);
		scene.add(eq2);
		objects.push(eq2);

		// High Voltage Capacitor Banks
		var capGeom = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 16);
		var capMaterial = new THREE.MeshStandardMaterial({ color: 0x884433, metalness: 0.6, roughness: 0.4 });
		for (var i = 0; i < 4; i++) {
			var cap = new THREE.Mesh(capGeom, capMaterial);
			cap.position.set(-8 + i * 1.2, 0.8, 5);
			scene.add(cap);
			objects.push(cap);
		}

		// Faraday Cage Enclosure
		var cageMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
		var cageGeom = new THREE.BufferGeometry();
		var cagePositions = new Float32Array([
			-3, 0, -3, 3, 0, -3,
			3, 0, -3, 3, 0, 3,
			3, 0, 3, -3, 0, 3,
			-3, 0, 3, -3, 0, -3,
			-3, 3, -3, 3, 3, -3,
			3, 3, -3, 3, 3, 3,
			3, 3, 3, -3, 3, 3,
			-3, 3, 3, -3, 3, -3,
			-3, 0, -3, -3, 3, -3,
			3, 0, -3, 3, 3, -3,
			3, 0, 3, 3, 3, 3,
			-3, 0, 3, -3, 3, 3
		]);
		cageGeom.setAttribute('position', new THREE.BufferAttribute(cagePositions, 3));
		var cage = new THREE.LineSegments(cageGeom, cageMaterial);
		cage.position.set(10, 0.5, -5);
		scene.add(cage);
		objects.push(cage);

		// Electrical Switchboard Wall
		var switchGeom = new THREE.BoxGeometry(3, 3, 0.2);
		var switchMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.4, roughness: 0.6 });
		var switchboard = new THREE.Mesh(switchGeom, switchMaterial);
		switchboard.position.set(-12, 1.5, 8);
		scene.add(switchboard);
		objects.push(switchboard);

		// Switchboard dials with emissive
		var dialGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
		var dialMaterial = new THREE.MeshStandardMaterial({ color: 0xFF2200, emissive: 0xFF2200, metalness: 0.5, roughness: 0.5 });
		for (var i = 0; i < 3; i++) {
			var dial = new THREE.Mesh(dialGeom, dialMaterial);
			dial.rotation.x = Math.PI / 2;
			dial.position.set(-12.5 + i * 1.5, 1.8, 7.9);
			scene.add(dial);
			objects.push(dial);
		}

		// Oscilloscope Screens
		var screenGeom = new THREE.BoxGeometry(1.2, 1, 0.15);
		var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x001133, emissive: 0x00FF44, metalness: 0.3, roughness: 0.7 });
		var screen1 = new THREE.Mesh(screenGeom, screenMaterial);
		screen1.position.set(10, 2, 5);
		scene.add(screen1);
		objects.push(screen1);
		oscilloscopeScreens.push({ mesh: screen1, time: 0 });

		var screen2 = new THREE.Mesh(screenGeom, screenMaterial);
		screen2.position.set(12, 2, 5);
		scene.add(screen2);
		objects.push(screen2);
		oscilloscopeScreens.push({ mesh: screen2, time: 0 });

		// Spark Gap Device
		var gapGeom = new THREE.BoxGeometry(0.5, 0.3, 0.2);
		var gapMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
		var gap = new THREE.Mesh(gapGeom, gapMaterial);
		gap.position.set(0, 0.6, -10);
		scene.add(gap);
		objects.push(gap);

		var elecGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
		var elecMaterial = new THREE.MeshStandardMaterial({ color: 0x666688, metalness: 0.7, roughness: 0.3 });
		var elec1 = new THREE.Mesh(elecGeom, elecMaterial);
		elec1.position.set(-0.15, 0.8, -10);
		scene.add(elec1);
		objects.push(elec1);

		var elec2 = new THREE.Mesh(elecGeom, elecMaterial);
		elec2.position.set(0.15, 0.8, -10);
		scene.add(elec2);
		objects.push(elec2);

		// Rotating Coil Experiment
		var coilGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
		var coilMaterial = new THREE.MeshStandardMaterial({ color: 0x886633, metalness: 0.4, roughness: 0.6 });
		var rotatingCoil = new THREE.Mesh(coilGeom, coilMaterial);
		rotatingCoil.position.set(8, 2, -3);
		scene.add(rotatingCoil);
		objects.push(rotatingCoil);
		rotatingCoils.push({ mesh: rotatingCoil, angularVelocity: 0 });

		// Burned Explosion Marks on Walls
		var scoreGeom = new THREE.BoxGeometry(0.8, 0.6, 0.1);
		var scoreMaterial = new THREE.MeshStandardMaterial({ color: 0x221111, metalness: 0.1, roughness: 0.9 });
		var score1 = new THREE.Mesh(scoreGeom, scoreMaterial);
		score1.position.set(12, 2.5, 8.05);
		scene.add(score1);
		objects.push(score1);

		var score2 = new THREE.Mesh(scoreGeom, scoreMaterial);
		score2.position.set(-12.05, 1, 8);
		scene.add(score2);
		objects.push(score2);

		// Underground Cable Conduits
		var conduitGeom = new THREE.CylinderGeometry(0.15, 0.15, 6, 16);
		var conduitMaterial = new THREE.MeshStandardMaterial({ color: 0x334433, emissive: 0x227722, metalness: 0.5, roughness: 0.5 });
		var conduit = new THREE.Mesh(conduitGeom, conduitMaterial);
		conduit.rotation.z = Math.PI / 2;
		conduit.position.set(0, -0.5, 0);
		scene.add(conduit);
		objects.push(conduit);

		// Mad Scientist Notes Pinboard
		var boardGeom = new THREE.BoxGeometry(2, 2.5, 0.1);
		var boardMaterial = new THREE.MeshStandardMaterial({ color: 0xDDCCAA, metalness: 0.1, roughness: 0.8 });
		var noteBoard = new THREE.Mesh(boardGeom, boardMaterial);
		noteBoard.position.set(-12, 1.5, -8);
		scene.add(noteBoard);
		objects.push(noteBoard);

		// Note diagrams (lines on board)
		var noteDiagMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
		var noteDiagGeom = new THREE.BufferGeometry();
		var noteDiagPos = new Float32Array([
			-11, 0, -7.95,
			-11, 0.5, -7.95,
			-11.5, 0.2, -7.95,
			-10.5, 0.2, -7.95,
			-12, 1, -7.95,
			-11, 2, -7.95
		]);
		noteDiagGeom.setAttribute('position', new THREE.BufferAttribute(noteDiagPos, 3));
		var noteDiag = new THREE.LineSegments(noteDiagGeom, noteDiagMaterial);
		scene.add(noteDiag);
		objects.push(noteDiag);

		// Security Tesla Fence
		var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x00AAFF, linewidth: 2 });
		var fenceGeom = new THREE.BufferGeometry();
		var fencePositions = new Float32Array([
			-15, 0.2, -15, 15, 0.2, -15,
			15, 0.2, -15, 15, 0.2, 15,
			15, 0.2, 15, -15, 0.2, 15,
			-15, 0.2, 15, -15, 0.2, -15,
			-15, 2, -15, 15, 2, -15,
			15, 2, -15, 15, 2, 15,
			15, 2, 15, -15, 2, 15,
			-15, 2, 15, -15, 2, -15,
			-15, 0.2, -15, -15, 2, -15,
			15, 0.2, -15, 15, 2, -15,
			15, 0.2, 15, 15, 2, 15,
			-15, 0.2, 15, -15, 2, 15
		]);
		fenceGeom.setAttribute('position', new THREE.BufferAttribute(fencePositions, 3));
		var fence = new THREE.LineSegments(fenceGeom, fenceMaterial);
		scene.add(fence);
		objects.push(fence);

		// Spark points on fence
		var sparkMaterial = new THREE.MeshStandardMaterial({ color: 0x00AAFF, emissive: 0x00AAFF, metalness: 0.8, roughness: 0.2 });
		var sparkGeom = new THREE.SphereGeometry(0.15, 16, 16);
		var sparkPositions = [
			[-15, 1, -15],
			[15, 1, -15],
			[15, 1, 15],
			[-15, 1, 15],
			[0, 1, -15],
			[0, 1, 15],
			[-15, 1, 0],
			[15, 1, 0]
		];
		for (var i = 0; i < sparkPositions.length; i++) {
			var spark = new THREE.Mesh(sparkGeom, sparkMaterial);
			spark.position.set(sparkPositions[i][0], sparkPositions[i][1], sparkPositions[i][2]);
			scene.add(spark);
			objects.push(spark);
			sparkPoints.push({ mesh: spark, time: 0 });
		}

		return objects.length;
	}

	function update(delta) {
		// Tesla coil sphere pulsing
		for (var i = 0; i < teslaCoilSpheres.length; i++) {
			var coilObj = teslaCoilSpheres[i];
			coilObj.time += delta * 2;
			var pulseIntensity = 0.3 + 0.7 * Math.sin(coilObj.time);
			coilObj.mesh.material.emissiveIntensity = pulseIntensity;
			var scale = 1 + 0.15 * Math.sin(coilObj.time);
			coilObj.mesh.scale.set(scale, scale, scale);
		}

		// Lightning arc flickering
		for (var i = 0; i < lightningArcs.length; i++) {
			var arc = lightningArcs[i];
			arc.time += delta * 3;
			var flicker = Math.random();
			arc.mesh.material.emissiveIntensity = flicker > 0.7 ? 1.0 : 0.3;
			arc.mesh.rotation.z += Math.sin(arc.time) * 0.05;
		}

		// Oscilloscope waveform scrolling
		for (var i = 0; i < oscilloscopeScreens.length; i++) {
			var screen = oscilloscopeScreens[i];
			screen.time += delta * 2;
			var waveIntensity = 0.3 + 0.7 * Math.sin(screen.time);
			screen.mesh.material.emissiveIntensity = waveIntensity;
		}

		// Spark points pulsing
		for (var i = 0; i < sparkPoints.length; i++) {
			var spark = sparkPoints[i];
			spark.time += delta * 8;
			var strobeIntensity = Math.sin(spark.time) > 0 ? 1.0 : 0.2;
			spark.mesh.material.emissiveIntensity = strobeIntensity;
		}

		// Rotating coil spinning
		for (var i = 0; i < rotatingCoils.length; i++) {
			var coil = rotatingCoils[i];
			coil.mesh.rotation.y += delta * 1.5;
		}

		// Van de Graaff sphere crackling
		if (vanDeGraaffSphere) {
			var crackle = Math.random() * 0.02;
			vanDeGraaffSphere.scale.set(1 + crackle, 1 + crackle, 1 + crackle);
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];
		lightningArcs = [];
		teslaCoilSpheres = [];
		rotatingCoils = [];
		oscilloscopeScreens = [];
		sparkPoints = [];
		vanDeGraaffSphere = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
