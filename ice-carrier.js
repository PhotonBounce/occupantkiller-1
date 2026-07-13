window.IceCarrier = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var helicopters = [];
	var auroraLines = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		meshes = [];
		helicopters = [];
		auroraLines = [];
		time = 0;

		buildCarrierHull();
		buildIceFormations();
		buildAircraftAndSnow();
		buildHelicopters();
		buildAuroraLights();
		buildWaveSpray();
	}

	function buildCarrierHull() {
		var hullGeometry = new THREE.BoxGeometry(180, 35, 50);
		var hullMaterial = new THREE.MeshStandardMaterial({
			color: 0x2a5a8a,
			roughness: 0.7,
			metalness: 0.3
		});
		var hull = new THREE.Mesh(hullGeometry, hullMaterial);
		hull.position.set(0, 5, 0);
		scene.add(hull);
		meshes.push(hull);

		var bowGeometry = new THREE.ConeGeometry(25, 60, 8);
		var bowMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a3a5a,
			roughness: 0.6,
			metalness: 0.4
		});
		var bow = new THREE.Mesh(bowGeometry, bowMaterial);
		bow.rotation.z = Math.PI / 2;
		bow.position.set(-100, 15, 0);
		scene.add(bow);
		meshes.push(bow);

		var superstructureGeometry = new THREE.BoxGeometry(30, 50, 25);
		var superstructureMaterial = new THREE.MeshStandardMaterial({
			color: 0x3a6a9a,
			roughness: 0.5,
			metalness: 0.5
		});
		var superstructure = new THREE.Mesh(superstructureGeometry, superstructureMaterial);
		superstructure.position.set(30, 40, 0);
		scene.add(superstructure);
		meshes.push(superstructure);
	}

	function buildIceFormations() {
		var iceCount = 12;
		for (var i = 0; i < iceCount; i++) {
			var isMajor = i % 3 === 0;
			var iceGeometry = isMajor ?
				new THREE.SphereGeometry(8 + Math.random() * 6, 5, 5) :
				new THREE.BoxGeometry(6 + Math.random() * 4, 7 + Math.random() * 5, 5 + Math.random() * 3);

			var iceMaterial = new THREE.MeshStandardMaterial({
				color: 0x99ddff,
				roughness: 0.3,
				metalness: 0.1,
				transparent: true,
				opacity: 0.75,
				emissive: 0x4499ff,
				emissiveIntensity: 0.1
			});
			var ice = new THREE.Mesh(iceGeometry, iceMaterial);

			var side = Math.random() > 0.5 ? 1 : -1;
			ice.position.set(
				-80 + Math.random() * 160,
				8 + Math.random() * 12,
				side * (25 + Math.random() * 15)
			);
			ice.rotation.set(
				Math.random() * Math.PI * 0.3,
				Math.random() * Math.PI,
				Math.random() * Math.PI * 0.3
			);
			scene.add(ice);
			meshes.push(ice);
		}
	}

	function buildAircraftAndSnow() {
		var aircraftCount = 3;
		for (var i = 0; i < aircraftCount; i++) {
			var fuselageGeometry = new THREE.CylinderGeometry(3, 3, 25, 8);
			var aircraftMaterial = new THREE.MeshStandardMaterial({
				color: 0x888888,
				roughness: 0.4,
				metalness: 0.8
			});
			var fuselage = new THREE.Mesh(fuselageGeometry, aircraftMaterial);
			fuselage.position.set(-60 + i * 50, 10, 10 + Math.random() * 5);
			fuselage.rotation.z = Math.PI / 2;
			scene.add(fuselage);
			meshes.push(fuselage);

			var cockpitGeometry = new THREE.SphereGeometry(2, 5, 5);
			var cockpit = new THREE.Mesh(cockpitGeometry, aircraftMaterial);
			cockpit.position.set(-60 + i * 50, 13, 20);
			scene.add(cockpit);
			meshes.push(cockpit);

			buildSnowDrift(fuselage.position);
		}
	}

	function buildSnowDrift(position) {
		var driftCount = 2;
		for (var i = 0; i < driftCount; i++) {
			var driftGeometry = new THREE.BoxGeometry(
				10 + Math.random() * 8,
				4 + Math.random() * 3,
				6 + Math.random() * 4
			);
			var driftMaterial = new THREE.MeshStandardMaterial({
				color: 0xf0f8ff,
				roughness: 0.9,
				metalness: 0,
				emissive: 0xccddee,
				emissiveIntensity: 0.15
			});
			var drift = new THREE.Mesh(driftGeometry, driftMaterial);
			drift.position.set(
				position.x + (Math.random() - 0.5) * 15,
				3,
				position.z + (Math.random() - 0.5) * 10
			);
			drift.rotation.z = (Math.random() - 0.5) * 0.3;
			scene.add(drift);
			meshes.push(drift);
		}
	}

	function buildHelicopters() {
		var helloCount = 2;
		for (var i = 0; i < helloCount; i++) {
			var helloGroup = {
				fuselage: null,
				rotor: null,
				cable: null,
				baseX: -40 + i * 80,
				baseY: 50,
				baseZ: -30 + i * 60,
				swayPhase: Math.random() * Math.PI * 2
			};

			var fuselageGeometry = new THREE.BoxGeometry(8, 6, 12);
			var helloMaterial = new THREE.MeshStandardMaterial({
				color: 0xff6600,
				roughness: 0.5,
				metalness: 0.6
			});
			helloGroup.fuselage = new THREE.Mesh(fuselageGeometry, helloMaterial);
			helloGroup.fuselage.position.set(helloGroup.baseX, helloGroup.baseY, helloGroup.baseZ);
			scene.add(helloGroup.fuselage);
			meshes.push(helloGroup.fuselage);

			var rotorGeometry = new THREE.CylinderGeometry(12, 12, 0.5, 12);
			var rotorMaterial = new THREE.MeshStandardMaterial({
				color: 0x333333,
				roughness: 0.6
			});
			helloGroup.rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
			helloGroup.rotor.position.set(helloGroup.baseX, helloGroup.baseY + 5, helloGroup.baseZ);
			scene.add(helloGroup.rotor);
			meshes.push(helloGroup.rotor);

			helicopters.push(helloGroup);
		}
	}

	function buildWaveSpray() {
		var sprayCount = 5;
		for (var i = 0; i < sprayCount; i++) {
			var sprayGeometry = new THREE.SphereGeometry(2 + Math.random() * 2, 4, 4);
			var sprayMaterial = new THREE.MeshStandardMaterial({
				color: 0xeef5ff,
				roughness: 0.8,
				transparent: true,
				opacity: 0.6,
				emissive: 0x99bbff,
				emissiveIntensity: 0.2
			});
			var spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
			spray.position.set(-90 + Math.random() * 20, 15 + Math.random() * 10, 26 + Math.random() * 8);
			scene.add(spray);
			meshes.push(spray);
		}
	}

	function buildAuroraLights() {
		var arcCount = 3;
		for (var i = 0; i < arcCount; i++) {
			var points = [];
			var segments = 20;
			var radius = 100 + i * 50;
			var height = 80 + i * 30;

			for (var j = 0; j <= segments; j++) {
				var angle = (j / segments) * Math.PI;
				var x = Math.cos(angle) * radius;
				var y = height + Math.sin(angle) * 40;
				var z = (Math.random() - 0.5) * 80;
				points.push(new THREE.Vector3(x, y, z));
			}

			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var colors = [];
			var colorChoice = i % 3;
			var baseColor = colorChoice === 0 ?
				new THREE.Color(0x00ff88) :
				(colorChoice === 1 ? new THREE.Color(0xff00ff) : new THREE.Color(0x00aaff));

			for (var k = 0; k < points.length; k++) {
				colors.push(baseColor.r, baseColor.g, baseColor.b);
			}
			geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

			var lineMaterial = new THREE.LineBasicMaterial({
				linewidth: 3,
				vertexColors: true
			});
			var line = new THREE.Line(geometry, lineMaterial);
			scene.add(line);
			auroraLines.push(line);
		}
	}

	function updateHelicopters(delta) {
		for (var i = 0; i < helicopters.length; i++) {
			var hello = helicopters[i];
			var sway = Math.sin(time * 0.8 + hello.swayPhase) * 8;
			hello.fuselage.position.x = hello.baseX + sway;
			hello.fuselage.position.y = hello.baseY + Math.sin(time * 0.5) * 3;
			hello.rotor.position.x = hello.baseX + sway;
			hello.rotor.position.y = hello.baseY + 5 + Math.sin(time * 0.5) * 3;
			hello.rotor.rotation.z += delta * 15;
		}
	}

	function updateAurora(delta) {
		for (var i = 0; i < auroraLines.length; i++) {
			var line = auroraLines[i];
			line.material.opacity = 0.3 + Math.sin(time * 0.3 + i) * 0.2;
			if (!line.material.transparent) {
				line.material.transparent = true;
			}
			line.rotation.z += delta * 0.2;
		}
	}

	function updateEnvironment(delta) {
		var wobbleIntensity = 0.02;
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].userData.isIce !== false) {
				var wobbleX = Math.sin(time * 0.3 + i * 0.1) * wobbleIntensity;
				var wobbleY = Math.cos(time * 0.2 + i * 0.15) * wobbleIntensity;
				meshes[i].rotation.x += wobbleX;
				meshes[i].rotation.y += wobbleY;
			}
		}
	}

	function update(delta) {
		time += delta;
		updateHelicopters(delta);
		updateAurora(delta);
		updateEnvironment(delta);
	}

	function reset() {
		for (var i = meshes.length - 1; i >= 0; i--) {
			scene.remove(meshes[i]);
		}
		for (var j = auroraLines.length - 1; j >= 0; j--) {
			scene.remove(auroraLines[j]);
		}
		meshes = [];
		helicopters = [];
		auroraLines = [];
		time = 0;
		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
