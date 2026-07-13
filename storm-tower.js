window.StormTower = (function() {
	'use strict';

	var scene, camera;
	var mainTower, towerGroup;
	var teslaCoils = [];
	var lightningArcs = [];
	var turbines = [];
	var stormClouds = [];
	var raindrops = [];
	var puddles = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		towerGroup = new THREE.Group();
		scene.add(towerGroup);

		buildMainTower();
		buildTeslaCoilArrays();
		buildLightningArcs();
		buildWindTurbineFarm();
		buildControlRoom();
		buildStormClouds();
		buildRainEffect();
		buildLightningRods();
		buildGeneratorBuilding();
		buildSafetyPerimeter();
		buildElectricalHazardPuddles();

		camera.position.set(0, 15, 30);
		camera.lookAt(0, 40, 0);
	}

	function buildMainTower() {
		var towerGeometry = new THREE.CylinderGeometry(8, 12, 100, 32);
		var towerMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.6,
			roughness: 0.4
		});
		mainTower = new THREE.Mesh(towerGeometry, towerMaterial);
		mainTower.position.y = 50;
		mainTower.castShadow = true;
		mainTower.receiveShadow = true;
		towerGroup.add(mainTower);

		// Tapering support rings
		for (var i = 0; i < 8; i++) {
			var ringGeometry = new THREE.CylinderGeometry(8 - i * 0.8, 8 - i * 0.8, 2, 32);
			var ringMaterial = new THREE.MeshStandardMaterial({
				color: 0x666666,
				metalness: 0.8,
				roughness: 0.3
			});
			var ring = new THREE.Mesh(ringGeometry, ringMaterial);
			ring.position.y = 30 + i * 8;
			ring.castShadow = true;
			towerGroup.add(ring);
		}
	}

	function buildTeslaCoilArrays() {
		var coilPositions = [
			{x: 20, z: 0},
			{x: -20, z: 0},
			{x: 0, z: 20},
			{x: 0, z: -20},
			{x: 14, z: 14},
			{x: -14, z: 14},
			{x: 14, z: -14},
			{x: -14, z: -14}
		];

		coilPositions.forEach(function(pos) {
			// Coil body
			var coilGeometry = new THREE.CylinderGeometry(3, 3.5, 18, 16);
			var coilMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a1a2e,
				metalness: 0.9,
				roughness: 0.1
			});
			var coil = new THREE.Mesh(coilGeometry, coilMaterial);
			coil.position.set(pos.x, 9, pos.z);
			coil.castShadow = true;
			coil.receiveShadow = true;
			towerGroup.add(coil);

			// Spherical cap (electrode)
			var capGeometry = new THREE.SphereGeometry(2.5, 16, 16);
			var capMaterial = new THREE.MeshStandardMaterial({
				color: 0xffaa00,
				metalness: 1.0,
				roughness: 0.0,
				emissive: 0xff6600,
				emissiveIntensity: 0.3
			});
			var cap = new THREE.Mesh(capGeometry, capMaterial);
			cap.position.set(pos.x, 20, pos.z);
			cap.castShadow = true;
			towerGroup.add(cap);

			teslaCoils.push({
				coil: coil,
				cap: cap,
				x: pos.x,
				z: pos.z,
				capY: 20
			});
		});
	}

	function buildLightningArcs() {
		for (var i = 0; i < teslaCoils.length; i++) {
			for (var j = i + 1; j < teslaCoils.length; j++) {
				var arc = createLightningArc(
					teslaCoils[i].x, teslaCoils[i].capY, teslaCoils[i].z,
					teslaCoils[j].x, teslaCoils[j].capY, teslaCoils[j].z
				);
				lightningArcs.push({
					geometry: arc.geometry,
					line: arc.line,
					startX: teslaCoils[i].x,
					startY: teslaCoils[i].capY,
					startZ: teslaCoils[i].z,
					endX: teslaCoils[j].x,
					endY: teslaCoils[j].capY,
					endZ: teslaCoils[j].z,
					active: false,
					activationTime: 0
				});
			}
		}
	}

	function createLightningArc(x1, y1, z1, x2, y2, z2) {
		var points = [];
		var segments = 8;

		for (var i = 0; i <= segments; i++) {
			var t = i / segments;
			var x = x1 + (x2 - x1) * t;
			var y = y1 + (y2 - y1) * t;
			var z = z1 + (z2 - z1) * t;
			var jitter = (Math.random() - 0.5) * 3;
			y += jitter;
			points.push(new THREE.Vector3(x, y, z));
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({
			color: 0x00ffff,
			linewidth: 2,
			emissive: 0x0088ff,
			transparent: true,
			opacity: 0
		});
		var line = new THREE.LineSegments(geometry, material);
		towerGroup.add(line);

		return {geometry: geometry, line: line};
	}

	function buildWindTurbineFarm() {
		var turbinePositions = [
			{x: -30, z: -30},
			{x: 30, z: -30},
			{x: -30, z: 30},
			{x: 30, z: 30},
			{x: 0, z: -40},
			{x: 0, z: 40}
		];

		turbinePositions.forEach(function(pos) {
			// Mast
			var mastGeometry = new THREE.CylinderGeometry(1, 1.2, 25, 12);
			var mastMaterial = new THREE.MeshStandardMaterial({
				color: 0xcccccc,
				metalness: 0.4,
				roughness: 0.6
			});
			var mast = new THREE.Mesh(mastGeometry, mastMaterial);
			mast.position.set(pos.x, 12.5, pos.z);
			mast.castShadow = true;
			mast.receiveShadow = true;
			towerGroup.add(mast);

			// Nacelle
			var nacelleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
			var nacelleMaterial = new THREE.MeshStandardMaterial({
				color: 0xffffff,
				metalness: 0.5,
				roughness: 0.5
			});
			var nacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
			nacelle.position.set(pos.x, 25, pos.z);
			nacelle.castShadow = true;
			towerGroup.add(nacelle);

			// Rotor (3 blades)
			var rotorGroup = new THREE.Group();
			rotorGroup.position.set(pos.x, 25, pos.z);

			for (var b = 0; b < 3; b++) {
				var bladeGeometry = new THREE.BoxGeometry(1.2, 10, 0.3);
				var bladeMaterial = new THREE.MeshStandardMaterial({
					color: 0xeeeeee,
					metalness: 0.3,
					roughness: 0.7
				});
				var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
				blade.position.z = 5;
				blade.rotation.z = (b / 3) * Math.PI * 2;
				blade.castShadow = true;
				rotorGroup.add(blade);
			}

			towerGroup.add(rotorGroup);

			turbines.push({
				group: rotorGroup,
				speed: 2 + Math.random() * 1
			});
		});
	}

	function buildControlRoom() {
		// Control pod near tower apex
		var podGeometry = new THREE.BoxGeometry(6, 6, 6);
		var podMaterial = new THREE.MeshStandardMaterial({
			color: 0x0a0a1a,
			metalness: 0.7,
			roughness: 0.3
		});
		var pod = new THREE.Mesh(podGeometry, podMaterial);
		pod.position.set(0, 85, 0);
		pod.castShadow = true;
		pod.receiveShadow = true;
		towerGroup.add(pod);

		// Control panels on pod
		for (var i = 0; i < 4; i++) {
			var panelGeometry = new THREE.BoxGeometry(4, 4, 0.5);
			var panelMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a3a2a,
				metalness: 0.8,
				roughness: 0.2,
				emissive: 0x00aa44,
				emissiveIntensity: 0.4
			});
			var panel = new THREE.Mesh(panelGeometry, panelMaterial);
			var angle = (i / 4) * Math.PI * 2;
			panel.position.set(
				Math.cos(angle) * 3.5,
				85,
				Math.sin(angle) * 3.5
			);
			panel.castShadow = true;
			towerGroup.add(panel);
		}
	}

	function buildStormClouds() {
		for (var i = 0; i < 4; i++) {
			var cloudGeometry = new THREE.SphereGeometry(15 + Math.random() * 8, 8, 8);
			var cloudMaterial = new THREE.MeshStandardMaterial({
				color: 0x222222,
				metalness: 0.1,
				roughness: 0.9,
				transparent: true,
				opacity: 0.7
			});
			var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
			cloud.position.set(
				(Math.random() - 0.5) * 100,
				110 + Math.random() * 20,
				(Math.random() - 0.5) * 100
			);
			cloud.castShadow = true;
			cloud.receiveShadow = true;
			towerGroup.add(cloud);

			stormClouds.push({
				mesh: cloud,
				orbitRadius: 40 + Math.random() * 20,
				orbitSpeed: 0.3 + Math.random() * 0.3,
				angle: Math.random() * Math.PI * 2,
				centerX: 0,
				centerZ: 0
			});
		}
	}

	function buildRainEffect() {
		for (var i = 0; i < 300; i++) {
			var rainGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.05);
			var rainMaterial = new THREE.MeshStandardMaterial({
				color: 0x4488ff,
				metalness: 0.8,
				roughness: 0.2,
				transparent: true,
				opacity: 0.6
			});
			var drop = new THREE.Mesh(rainGeometry, rainMaterial);
			drop.position.set(
				(Math.random() - 0.5) * 80,
				Math.random() * 140,
				(Math.random() - 0.5) * 80
			);
			drop.rotation.z = (Math.random() - 0.5) * 0.3;
			drop.castShadow = true;
			towerGroup.add(drop);

			raindrops.push({
				mesh: drop,
				startY: drop.position.y,
				speed: 30 + Math.random() * 20,
				resetY: 140
			});
		}
	}

	function buildLightningRods() {
		var rodPositions = [
			{x: 0, y: 100, z: 0},
			{x: 8, y: 50, z: 8},
			{x: -8, y: 50, z: -8},
			{x: 8, y: 50, z: -8},
			{x: -8, y: 50, z: 8}
		];

		rodPositions.forEach(function(pos) {
			var rodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
			var rodMaterial = new THREE.MeshStandardMaterial({
				color: 0xffcc00,
				metalness: 1.0,
				roughness: 0.1
			});
			var rod = new THREE.Mesh(rodGeometry, rodMaterial);
			rod.position.set(pos.x, pos.y + 4, pos.z);
			rod.castShadow = true;
			towerGroup.add(rod);
		});
	}

	function buildGeneratorBuilding() {
		var buildingGeometry = new THREE.BoxGeometry(12, 10, 15);
		var buildingMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.4,
			roughness: 0.6
		});
		var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
		building.position.set(-40, 5, -40);
		building.castShadow = true;
		building.receiveShadow = true;
		towerGroup.add(building);

		// Generator turbine inside
		var turbineGeometry = new THREE.CylinderGeometry(3, 3, 6, 16);
		var turbineMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.7,
			roughness: 0.3
		});
		var turbine = new THREE.Mesh(turbineGeometry, turbineMaterial);
		turbine.position.set(-40, 5, -40);
		turbine.castShadow = true;
		towerGroup.add(turbine);

		turbines.push({
			group: turbine,
			speed: 3
		});
	}

	function buildSafetyPerimeter() {
		// Chain-link fence using LineSegments
		var fenceRadius = 60;
		var fencePoints = [];
		var segments = 32;

		for (var i = 0; i <= segments; i++) {
			var angle = (i / segments) * Math.PI * 2;
			var x = Math.cos(angle) * fenceRadius;
			var z = Math.sin(angle) * fenceRadius;
			fencePoints.push(new THREE.Vector3(x, 0, z));
			fencePoints.push(new THREE.Vector3(x, 4, z));
		}

		var fenceGeometry = new THREE.BufferGeometry().setFromPoints(fencePoints);
		var fenceMaterial = new THREE.LineBasicMaterial({
			color: 0xffaa00,
			linewidth: 1
		});
		var fence = new THREE.LineSegments(fenceGeometry, fenceMaterial);
		towerGroup.add(fence);

		// Warning signs
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var x = Math.cos(angle) * 60;
			var z = Math.sin(angle) * 60;

			var signGeometry = new THREE.BoxGeometry(2, 3, 0.3);
			var signMaterial = new THREE.MeshStandardMaterial({
				color: 0xff0000,
				metalness: 0.3,
				roughness: 0.7
			});
			var sign = new THREE.Mesh(signGeometry, signMaterial);
			sign.position.set(x, 2, z);
			sign.rotation.y = angle;
			sign.castShadow = true;
			towerGroup.add(sign);
		}
	}

	function buildElectricalHazardPuddles() {
		var pudblePositions = [
			{x: 15, z: 15},
			{x: -15, z: 15},
			{x: 15, z: -15},
			{x: -15, z: -15},
			{x: 0, z: 0},
			{x: 25, z: 0},
			{x: -25, z: 0}
		];

		pudblePositions.forEach(function(pos) {
			var puddleGeometry = new THREE.BoxGeometry(4, 0.3, 4);
			var puddleMaterial = new THREE.MeshStandardMaterial({
				color: 0x0088ff,
				metalness: 0.9,
				roughness: 0.1,
				emissive: 0x0066ff,
				emissiveIntensity: 0.6
			});
			var puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
			puddle.position.set(pos.x, 0.15, pos.z);
			puddle.castShadow = true;
			puddle.receiveShadow = true;
			towerGroup.add(puddle);

			puddles.push({
				mesh: puddle,
				material: puddleMaterial,
				baseIntensity: 0.6
			});
		});
	}

	function update(delta) {
		time += delta;

		// Animate lightning arcs
		var lightningChance = 0.02;
		lightningArcs.forEach(function(arc) {
			if (Math.random() < lightningChance && !arc.active) {
				arc.active = true;
				arc.activationTime = 0.15;
				arc.line.material.opacity = 1.0;
			}

			if (arc.active) {
				arc.activationTime -= delta;
				if (arc.activationTime <= 0) {
					arc.active = false;
					arc.line.material.opacity = 0;
				} else {
					arc.line.material.opacity = Math.random() * 0.8 + 0.2;
				}
			}
		});

		// Rotate turbine rotors
		turbines.forEach(function(turbine) {
			if (turbine.group.isGroup) {
				turbine.group.rotation.z += delta * turbine.speed;
			} else {
				turbine.group.rotation.y += delta * turbine.speed;
			}
		});

		// Animate storm clouds
		stormClouds.forEach(function(cloud) {
			cloud.angle += delta * cloud.orbitSpeed;
			cloud.mesh.position.x = cloud.centerX + Math.cos(cloud.angle) * cloud.orbitRadius;
			cloud.mesh.position.z = cloud.centerZ + Math.sin(cloud.angle) * cloud.orbitRadius;
			cloud.mesh.rotation.x += delta * 0.1;
			cloud.mesh.rotation.y += delta * 0.15;
		});

		// Animate rain fall
		raindrops.forEach(function(drop) {
			drop.mesh.position.y -= drop.speed * delta;

			if (drop.mesh.position.y < -10) {
				drop.mesh.position.y = drop.resetY;
				drop.mesh.position.x = (Math.random() - 0.5) * 80;
				drop.mesh.position.z = (Math.random() - 0.5) * 80;
			}
		});

		// Pulse puddle glow
		puddles.forEach(function(puddle) {
			var pulse = Math.sin(time * 2) * 0.3 + 0.7;
			puddle.material.emissiveIntensity = puddle.baseIntensity * pulse;
		});

		// Animate Tesla coil caps with pulsing glow
		teslaCoils.forEach(function(coil) {
			var capPulse = Math.sin(time * 3 + Math.random()) * 0.3 + 0.3;
			coil.cap.material.emissiveIntensity = capPulse;
		});
	}

	function reset() {
		if (towerGroup) {
			scene.remove(towerGroup);
		}
		towerGroup = new THREE.Group();
		scene.add(towerGroup);
		teslaCoils = [];
		lightningArcs = [];
		turbines = [];
		stormClouds = [];
		raindrops = [];
		puddles = [];
		time = 0;

		buildMainTower();
		buildTeslaCoilArrays();
		buildLightningArcs();
		buildWindTurbineFarm();
		buildControlRoom();
		buildStormClouds();
		buildRainEffect();
		buildLightningRods();
		buildGeneratorBuilding();
		buildSafetyPerimeter();
		buildElectricalHazardPuddles();
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
