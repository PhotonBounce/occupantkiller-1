window.ShadowReef = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var elements = [];
	var lights = [];
	var animationTime = 0;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		scene.background = new THREE.Color(0x001a33);
		scene.fog = new THREE.FogExp2(0x001a33, 0.03);

		createSkybox();
		createCoralFormations();
		createEnemyBase();
		createSubmarineDocked();
		createBioluminescentCreatures();
		createMilitaryDivers();
		createDepthCharges();
		createSonarBuoys();
		createMinefield();
		createSunkenCargo();
		createLighting();
		createFPSCover();
	}

	function createSkybox() {
		var topLight = new THREE.HemisphereLight(0x1a4d6d, 0x000a14, 0.4);
		scene.add(topLight);
		lights.push(topLight);
	}

	function createCoralFormations() {
		var coralPositions = [
			{ x: -30, y: 5, z: -20, scale: 1.2 },
			{ x: 25, y: 8, z: -15, scale: 1.5 },
			{ x: -15, y: 3, z: 20, scale: 0.9 },
			{ x: 30, y: 6, z: 15, scale: 1.1 },
			{ x: 0, y: 4, z: -30, scale: 1.3 },
			{ x: 10, y: 5, z: 25, scale: 0.8 }
		];

		coralPositions.forEach(function(pos) {
			var coralCluster = createCoralCluster(pos.x, pos.y, pos.z, pos.scale);
			elements.push(coralCluster);
			scene.add(coralCluster);
		});
	}

	function createCoralCluster(x, y, z, scale) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var coneGeom = new THREE.ConeGeometry(1.5 * scale, 4 * scale, 8);
		var coneMat = new THREE.MeshPhongMaterial({ color: 0x8B4513, emissive: 0x2a1505 });
		var cone1 = new THREE.Mesh(coneGeom, coneMat);
		cone1.position.set(-1, 0, 0);
		group.add(cone1);

		var cone2 = new THREE.Mesh(coneGeom, coneMat);
		cone2.position.set(1, 1, 0);
		cone2.scale.set(0.8, 0.8, 0.8);
		group.add(cone2);

		var cylinderGeom = new THREE.CylinderGeometry(1 * scale, 1.2 * scale, 3 * scale, 8);
		var cylMat = new THREE.MeshPhongMaterial({ color: 0xA0522D, emissive: 0x3a2a1a });
		var cyl = new THREE.Mesh(cylinderGeom, cylMat);
		cyl.position.set(0, 2, -0.5);
		group.add(cyl);

		var cone3 = new THREE.Mesh(coneGeom, coneMat);
		cone3.position.set(0.5, 3, 0);
		cone3.scale.set(0.6, 0.6, 0.6);
		group.add(cone3);

		return group;
	}

	function createEnemyBase() {
		var baseGroup = new THREE.Group();
		baseGroup.position.set(15, 2, 0);

		var mainStructure = new THREE.BoxGeometry(12, 8, 10);
		var baseMat = new THREE.MeshPhongMaterial({ color: 0x2F4F4F, emissive: 0x0a0a0a });
		var mainMesh = new THREE.Mesh(mainStructure, baseMat);
		mainMesh.position.y = 2;
		baseGroup.add(mainMesh);

		var turretGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
		var turretMat = new THREE.MeshPhongMaterial({ color: 0x1C1C1C, emissive: 0x050505 });
		var turret1 = new THREE.Mesh(turretGeom, turretMat);
		turret1.position.set(4, 5, 3);
		baseGroup.add(turret1);

		var turret2 = new THREE.Mesh(turretGeom, turretMat);
		turret2.position.set(-4, 5, 3);
		baseGroup.add(turret2);

		var sphereGeom = new THREE.SphereGeometry(1, 8, 8);
		var sphereMat = new THREE.MeshPhongMaterial({ color: 0x003D3D, emissive: 0x001a1a });
		var radar = new THREE.Mesh(sphereGeom, sphereMat);
		radar.position.set(0, 6, -4);
		baseGroup.add(radar);

		elements.push(baseGroup);
		scene.add(baseGroup);
	}

	function createSubmarineDocked() {
		var subGroup = new THREE.Group();
		subGroup.position.set(-25, 0, 5);

		var hull = new THREE.CylinderGeometry(2, 2, 15, 16);
		var hullMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, emissive: 0x0a0a0f });
		var hullMesh = new THREE.Mesh(hull, hullMat);
		hullMesh.rotation.z = Math.PI / 2;
		subGroup.add(hullMesh);

		var coneTower = new THREE.ConeGeometry(1.2, 3, 8);
		var towerMat = new THREE.MeshPhongMaterial({ color: 0x0f0f0f, emissive: 0x050505 });
		var tower = new THREE.Mesh(coneTower, towerMat);
		tower.position.set(3, 2.5, 0);
		subGroup.add(tower);

		var hatchGeom = new THREE.SphereGeometry(1, 8, 8);
		var hatchMat = new THREE.MeshPhongMaterial({ color: 0x2a2a3a, emissive: 0x0f0f1a });
		var hatch = new THREE.Mesh(hatchGeom, hatchMat);
		hatch.position.set(-2, 3, 0);
		hatch.userData.isHatch = true;
		hatch.userData.baseY = 3;
		subGroup.add(hatch);

		elements.push(subGroup);
		scene.add(subGroup);
	}

	function createBioluminescentCreatures() {
		var creaturePositions = [
			{ x: -20, y: 15, z: 10, color: 0x00FF88 },
			{ x: 10, y: 12, z: -25, color: 0x00FFCC },
			{ x: 35, y: 10, z: 15, color: 0x0088FF },
			{ x: -35, y: 8, z: -10, color: 0xFF0088 },
			{ x: 0, y: 18, z: 20, color: 0x88FF00 }
		];

		creaturePositions.forEach(function(pos) {
			var creature = createBiolumCreature(pos.x, pos.y, pos.z, pos.color);
			elements.push(creature);
			scene.add(creature);
		});
	}

	function createBiolumCreature(x, y, z, color) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var bodyGeom = new THREE.SphereGeometry(0.4, 8, 8);
		var bodyMat = new THREE.MeshPhongMaterial({ color: 0x001a00, emissive: color, emissiveIntensity: 0.8 });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		group.add(body);

		var light = new THREE.PointLight(color, 2, 20);
		light.position.set(0, 0, 0);
		group.add(light);
		lights.push(light);

		group.userData.isPulsingLight = true;
		group.userData.lightColor = color;
		group.userData.lightIntensity = 2;

		return group;
	}

	function createMilitaryDivers() {
		var diverPositions = [
			{ x: -10, y: 3, z: 15 },
			{ x: 20, y: 4, z: -10 },
			{ x: 5, y: 2, z: -20 }
		];

		diverPositions.forEach(function(pos) {
			var diver = createDiver(pos.x, pos.y, pos.z);
			elements.push(diver);
			scene.add(diver);
		});
	}

	function createDiver(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var torsoGeom = new THREE.BoxGeometry(0.6, 1.2, 0.4);
		var diverMat = new THREE.MeshPhongMaterial({ color: 0x1a3a2e, emissive: 0x050a08 });
		var torso = new THREE.Mesh(torsoGeom, diverMat);
		torso.position.y = 0.6;
		group.add(torso);

		var headGeom = new THREE.SphereGeometry(0.35, 8, 8);
		var headMat = new THREE.MeshPhongMaterial({ color: 0x0f1f1a, emissive: 0x030505 });
		var head = new THREE.Mesh(headGeom, headMat);
		head.position.set(0, 1.6, 0);
		group.add(head);

		var tankGeom = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8);
		var tankMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
		var tank = new THREE.Mesh(tankGeom, tankMat);
		tank.position.set(0, 0.5, 0);
		group.add(tank);

		return group;
	}

	function createDepthCharges() {
		var chargePositions = [
			{ x: -15, y: 0.5, z: 0 },
			{ x: 0, y: 0.8, z: 10 },
			{ x: 10, y: 1, z: -5 },
			{ x: -25, y: 0.3, z: 20 }
		];

		chargePositions.forEach(function(pos) {
			var charge = createDepthCharge(pos.x, pos.y, pos.z);
			elements.push(charge);
			scene.add(charge);
		});
	}

	function createDepthCharge(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var bodyGeom = new THREE.SphereGeometry(0.8, 8, 8);
		var bodyMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x330000 });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		group.add(body);

		var ringGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
		var ringMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a, emissive: 0x1a0000 });
		var ring = new THREE.Mesh(ringGeom, ringMat);
		ring.position.y = 0.5;
		group.add(ring);

		var light = new THREE.PointLight(0xFF3300, 1.5, 15);
		light.position.set(0, 0, 0);
		group.add(light);
		lights.push(light);

		group.userData.isGlowing = true;

		return group;
	}

	function createSonarBuoys() {
		var buoyPositions = [
			{ x: 30, y: 5, z: -20 },
			{ x: -30, y: 4, z: 25 },
			{ x: 0, y: 6, z: 35 }
		];

		buoyPositions.forEach(function(pos) {
			var buoy = createSonarBuoy(pos.x, pos.y, pos.z);
			elements.push(buoy);
			scene.add(buoy);
		});
	}

	function createSonarBuoy(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
		var poleMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a, emissive: 0x0f0f0f });
		var pole = new THREE.Mesh(poleGeom, poleMat);
		group.add(pole);

		var sphereGeom = new THREE.SphereGeometry(0.6, 8, 8);
		var sphereMat = new THREE.MeshPhongMaterial({ color: 0x004d4d, emissive: 0x001a1a });
		var sphere = new THREE.Mesh(sphereGeom, sphereMat);
		sphere.position.y = 2;
		group.add(sphere);

		var light = new THREE.PointLight(0x0099FF, 1, 20);
		light.position.set(0, 2, 0);
		group.add(light);
		lights.push(light);

		group.userData.isSonar = true;

		return group;
	}

	function createMinefield() {
		var minePositions = [
			{ x: -35, y: 1, z: 0 },
			{ x: -30, y: 0.9, z: 10 },
			{ x: -28, y: 1.1, z: -8 },
			{ x: 35, y: 0.8, z: -15 },
			{ x: 32, y: 1.2, z: 5 },
			{ x: 25, y: 0.7, z: 20 }
		];

		minePositions.forEach(function(pos) {
			var mine = createMine(pos.x, pos.y, pos.z);
			elements.push(mine);
			scene.add(mine);
		});
	}

	function createMine(x, y, z) {
		var group = new THREE.Group();
		group.position.set(x, y, z);

		var mainGeom = new THREE.SphereGeometry(0.6, 8, 8);
		var mainMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x0a0a0a });
		var main = new THREE.Mesh(mainGeom, mainMat);
		group.add(main);

		var spikeGeom = new THREE.ConeGeometry(0.15, 0.8, 8);
		var spikeMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a, emissive: 0x050505 });

		for (var i = 0; i < 6; i++) {
			var angle = (i / 6) * Math.PI * 2;
			var spike = new THREE.Mesh(spikeGeom, spikeMat);
			spike.position.set(Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8);
			spike.lookAt(spike.position.clone().multiplyScalar(2));
			group.add(spike);
		}

		group.userData.isMine = true;

		return group;
	}

	function createSunkenCargo() {
		var cargoGroup = new THREE.Group();
		cargoGroup.position.set(50, -2, 0);

		var hullGeom = new THREE.BoxGeometry(8, 5, 20);
		var hullMat = new THREE.MeshPhongMaterial({ color: 0x4a3a2a, emissive: 0x1a0a00 });
		var hull = new THREE.Mesh(hullGeom, hullMat);
		hull.rotation.z = -0.3;
		cargoGroup.add(hull);

		var superGeom = new THREE.BoxGeometry(4, 3, 6);
		var superMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
		var super1 = new THREE.Mesh(superGeom, superMat);
		super1.position.set(0, 4, -6);
		cargoGroup.add(super1);

		var craneGeom = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
		var craneMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x050505 });
		var crane = new THREE.Mesh(craneGeom, craneMat);
		crane.rotation.z = 0.4;
		crane.position.set(2, 6, -2);
		cargoGroup.add(crane);

		elements.push(cargoGroup);
		scene.add(cargoGroup);
	}

	function createLighting() {
		var waterLight = new THREE.DirectionalLight(0x1a4d7f, 0.3);
		waterLight.position.set(20, 15, 20);
		scene.add(waterLight);
		lights.push(waterLight);

		var ambientGreen = new THREE.AmbientLight(0x0a2a1a, 0.25);
		scene.add(ambientGreen);
		lights.push(ambientGreen);
	}

	function createFPSCover() {
		var coverGroup = new THREE.Group();
		coverGroup.position.set(-35, 3, 15);

		var rockGeom = new THREE.BoxGeometry(4, 6, 3);
		var rockMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a, emissive: 0x0a0a0a });
		var rock1 = new THREE.Mesh(rockGeom, rockMat);
		rock1.rotation.z = 0.2;
		coverGroup.add(rock1);

		var rock2 = new THREE.Mesh(rockGeom, rockMat);
		rock2.position.set(5, 1, -1);
		rock2.rotation.z = -0.15;
		coverGroup.add(rock2);

		var shardGeom = new THREE.ConeGeometry(1, 3, 8);
		var shardMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x050505 });
		var shard = new THREE.Mesh(shardGeom, shardMat);
		shard.position.set(-2, 4, 0);
		shard.rotation.z = 0.5;
		coverGroup.add(shard);

		elements.push(coverGroup);
		scene.add(coverGroup);

		var coverGroup2 = new THREE.Group();
		coverGroup2.position.set(35, 2, -25);

		var blockGeom = new THREE.BoxGeometry(5, 5, 4);
		var blockMat = new THREE.MeshPhongMaterial({ color: 0x2F4F4F, emissive: 0x0f1f1f });
		var block = new THREE.Mesh(blockGeom, blockMat);
		coverGroup2.add(block);

		elements.push(coverGroup2);
		scene.add(coverGroup2);
	}

	function update(delta) {
		animationTime += delta;

		elements.forEach(function(element) {
			if (element.children) {
				element.children.forEach(function(child) {
					if (child.userData.isHatch) {
						var hatchBob = Math.sin(animationTime * 1.5) * 0.3;
						child.position.y = child.userData.baseY + hatchBob;
					}

					if (child.userData.isPulsingLight) {
						var intensityPulse = 2 + Math.sin(animationTime * 2.5) * 1;
						if (child.children) {
							child.children.forEach(function(light) {
								if (light instanceof THREE.Light) {
									light.intensity = intensityPulse;
								}
							});
						}
					}

					if (child.userData.isGlowing) {
						var glowPulse = 1.5 + Math.sin(animationTime * 2) * 0.8;
						if (child.children) {
							child.children.forEach(function(light) {
								if (light instanceof THREE.Light) {
									light.intensity = glowPulse;
								}
							});
						}
					}
				});
			}

			if (element.userData.isSonar) {
				var sonarBob = Math.sin(animationTime * 2.2) * 0.4;
				element.position.y += sonarBob * 0.01;
			}
		});

		lights.forEach(function(light) {
			if (light instanceof THREE.PointLight) {
				if (light.userData && light.userData.isBiolum) {
					var bioIntensity = 2 + Math.sin(animationTime * 2.8) * 1.2;
					light.intensity = bioIntensity;
				}
			}
		});
	}

	function reset() {
		animationTime = 0;
		elements.forEach(function(element) {
			if (element.children) {
				element.children.forEach(function(child) {
					if (child.userData.baseY !== undefined) {
						child.position.y = child.userData.baseY;
					}
				});
			}
		});
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
