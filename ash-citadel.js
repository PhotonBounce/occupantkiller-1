window.AshCitadel = (function() {
	'use strict';

	var scene;
	var camera;
	var ashParticles = [];
	var magmaVents = [];
	var ashDrifts = [];

	var ashColor = 0x8B8680;
	var obsidianColor = 0x1a1a2e;
	var lavaMat = new THREE.MeshBasicMaterial({ color: 0xFF6B35, emissive: 0xFF4500 });
	var ashMat = new THREE.MeshStandardMaterial({ color: ashColor, roughness: 0.9, metalness: 0.1 });
	var obsidianMat = new THREE.MeshStandardMaterial({ color: obsidianColor, roughness: 0.3, metalness: 0.8 });
	var voidMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });

	function buildWalls() {
		var walls = new THREE.Group();

		// Perimeter battlements rising from ash drifts
		var wallGeom = new THREE.BoxGeometry(2, 3, 0.4);
		var positions = [
			[-8, 1.5, -8], [8, 1.5, -8],
			[8, 1.5, 8], [-8, 1.5, 8],
			[-8, 1.5, 0], [8, 1.5, 0],
			[0, 1.5, -8], [0, 1.5, 8]
		];

		for (var i = 0; i < positions.length; i++) {
			var wall = new THREE.Mesh(wallGeom, ashMat);
			wall.position.set(positions[i][0], positions[i][1], positions[i][2]);
			walls.add(wall);
		}

		return walls;
	}

	function buildColumns() {
		var columns = new THREE.Group();
		var colGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);

		var positions = [
			[-6, 2, -6], [6, 2, -6],
			[6, 2, 6], [-6, 2, 6],
			[0, 2, -3], [0, 2, 3]
		];

		for (var i = 0; i < positions.length; i++) {
			var col = new THREE.Mesh(colGeom, obsidianMat);
			col.position.set(positions[i][0], positions[i][1], positions[i][2]);

			// Add fracture cracks with line segments
			var crackGeom = new THREE.BufferGeometry();
			var crackPts = [
				new THREE.Vector3(-0.2, 0, 0),
				new THREE.Vector3(0.2, 1.5, 0),
				new THREE.Vector3(0, 0.5, 0.3),
				new THREE.Vector3(0, 2, -0.2)
			];
			crackGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(crackPts.flatMap(p => [p.x, p.y, p.z])), 3));
			var cracks = new THREE.LineSegments(crackGeom, new THREE.LineBasicMaterial({ color: 0x2a2a2a }));
			col.add(cracks);

			columns.add(col);
		}

		return columns;
	}

	function buildAshDrifts() {
		var drifts = new THREE.Group();
		var driftGeom = new THREE.BoxGeometry(4, 1.2, 3);

		var positions = [
			[-7, 0.6, 5], [5, 0.6, -6],
			[-5, 0.5, 0], [7, 0.7, 4],
			[0, 0.5, -5], [-6, 0.6, -3]
		];

		for (var i = 0; i < positions.length; i++) {
			var drift = new THREE.Mesh(driftGeom, ashMat);
			drift.position.set(positions[i][0], positions[i][1], positions[i][2]);
			drift.rotation.z = (Math.random() - 0.5) * 0.3;
			drift.scale.y = 0.6 + Math.random() * 0.4;
			drifts.add(drift);
			ashDrifts.push({ mesh: drift, baseY: positions[i][1] });
		}

		return drifts;
	}

	function buildLavaChannels() {
		var channels = new THREE.Group();
		var channelGeom = new THREE.BoxGeometry(1, 0.3, 8);

		var ch1 = new THREE.Mesh(channelGeom, lavaMat);
		ch1.position.set(-5, -0.15, 0);
		channels.add(ch1);

		var ch2 = new THREE.Mesh(channelGeom, lavaMat);
		ch2.position.set(5, -0.15, 0);
		ch2.rotation.z = Math.PI / 4;
		channels.add(ch2);

		return channels;
	}

	function buildThroneRoom() {
		var throne = new THREE.Group();

		// Throne seat base
		var seatGeom = new THREE.BoxGeometry(2, 0.5, 2);
		var seat = new THREE.Mesh(seatGeom, obsidianMat);
		seat.position.y = 0.25;
		throne.add(seat);

		// Backrest pillars
		var pillarGeom = new THREE.CylinderGeometry(0.25, 0.25, 2, 6);
		var left = new THREE.Mesh(pillarGeom, obsidianMat);
		left.position.set(-1.2, 1.5, 0);
		throne.add(left);

		var right = new THREE.Mesh(pillarGeom, obsidianMat);
		right.position.set(1.2, 1.5, 0);
		throne.add(right);

		// Crown finial sphere
		var crownGeom = new THREE.SphereGeometry(0.4, 8, 8);
		var crown = new THREE.Mesh(crownGeom, new THREE.MeshBasicMaterial({ color: 0xCCCCCC, emissive: 0x444444 }));
		crown.position.y = 2.8;
		throne.add(crown);

		throne.position.set(0, 0.5, 5);
		return throne;
	}

	function spawnAshParticle() {
		var pGeom = new THREE.SphereGeometry(0.08, 4, 4);
		var pMat = new THREE.MeshBasicMaterial({ color: ashColor, opacity: 0.7, transparent: true });
		var p = new THREE.Mesh(pGeom, pMat);

		p.position.set(
			(Math.random() - 0.5) * 16,
			8 + Math.random() * 2,
			(Math.random() - 0.5) * 12
		);

		var life = 0;
		var maxLife = 6 + Math.random() * 4;
		var vx = (Math.random() - 0.5) * 0.5;
		var vy = -0.8 - Math.random() * 0.3;
		var vz = (Math.random() - 0.5) * 0.3;

		ashParticles.push({ mesh: p, life: life, maxLife: maxLife, vx: vx, vy: vy, vz: vz });
		return p;
	}

	function spawnMagmaVent() {
		var flameGroup = new THREE.Group();

		// Vent opening
		var ventGeom = new THREE.CylinderGeometry(0.6, 0.8, 0.2, 8);
		var vent = new THREE.Mesh(ventGeom, new THREE.MeshBasicMaterial({ color: 0x442200 }));
		flameGroup.add(vent);

		// Cone flames bursting up
		var flameGeom = new THREE.ConeGeometry(0.5, 1.5, 8);
		var flameMat = new THREE.MeshBasicMaterial({ color: 0xFF6B35, emissive: 0xFF4500 });
		var flame = new THREE.Mesh(flameGeom, flameMat);
		flame.position.y = 0.8;
		flameGroup.add(flame);

		return flameGroup;
	}

	function createMagmaVents() {
		var vents = new THREE.Group();
		var positions = [
			[-4, -0.05, -4], [4, -0.05, -4],
			[4, -0.05, 4], [-4, -0.05, 4],
			[0, -0.05, 0]
		];

		for (var i = 0; i < positions.length; i++) {
			var v = spawnMagmaVent();
			v.position.set(positions[i][0], positions[i][1], positions[i][2]);
			v.userData = { eruptTimer: Math.random() * 3, eruptCycle: 3 + Math.random() * 2, scale: 0 };
			vents.add(v);
			magmaVents.push(v);
		}

		return vents;
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		ashParticles = [];
		magmaVents = [];
		ashDrifts = [];

		// Floor void
		var floorGeom = new THREE.BoxGeometry(20, 0.3, 16);
		var floor = new THREE.Mesh(floorGeom, voidMat);
		floor.position.y = -0.15;
		scene.add(floor);

		// Build environment
		scene.add(buildWalls());
		scene.add(buildColumns());
		scene.add(buildAshDrifts());
		scene.add(buildLavaChannels());
		scene.add(buildThroneRoom());
		scene.add(createMagmaVents());

		// Initial ash particles
		for (var i = 0; i < 40; i++) {
			var p = spawnAshParticle();
			scene.add(p);
		}

		// Ambient lighting
		var ambLight = new THREE.AmbientLight(0x444444);
		scene.add(ambLight);

		// Lava glow
		var lavaLight = new THREE.PointLight(0xFF6B35, 1.2, 15);
		lavaLight.position.set(0, 1, 0);
		scene.add(lavaLight);

		// Volcanic haze fog
		scene.fog = new THREE.Fog(0x3a3a3a, 25, 35);
	}

	function update(delta) {
		var i;

		// Update falling ash
		for (i = ashParticles.length - 1; i >= 0; i--) {
			var ap = ashParticles[i];
			ap.life += delta;

			ap.mesh.position.x += ap.vx;
			ap.mesh.position.y += ap.vy * delta;
			ap.mesh.position.z += ap.vz;

			var fadeStart = ap.maxLife * 0.7;
			if (ap.life > fadeStart) {
				ap.mesh.material.opacity = 0.7 * (1 - (ap.life - fadeStart) / (ap.maxLife - fadeStart));
			}

			if (ap.life > ap.maxLife) {
				scene.remove(ap.mesh);
				ashParticles.splice(i, 1);
			}
		}

		// Spawn new ash
		if (ashParticles.length < 50) {
			var p = spawnAshParticle();
			scene.add(p);
		}

		// Update magma vents
		for (i = 0; i < magmaVents.length; i++) {
			var mv = magmaVents[i];
			mv.userData.eruptTimer += delta;

			var cycle = mv.userData.eruptCycle;
			if (mv.userData.eruptTimer > cycle) {
				mv.userData.eruptTimer = 0;
				mv.userData.scale = 0;
			}

			var eruptPhase = mv.userData.eruptTimer / cycle;
			if (eruptPhase < 0.3) {
				mv.userData.scale = eruptPhase / 0.3;
			} else if (eruptPhase < 0.7) {
				mv.userData.scale = 1;
			} else {
				mv.userData.scale = Math.max(0, 1 - (eruptPhase - 0.7) / 0.3);
			}

			mv.children[1].scale.y = 0.8 + mv.userData.scale * 0.6;
			mv.children[1].material.opacity = mv.userData.scale;
		}

		// Animate ash drifts slightly
		for (i = 0; i < ashDrifts.length; i++) {
			var drift = ashDrifts[i];
			drift.mesh.position.y = drift.baseY + Math.sin(Date.now() * 0.0005 + i) * 0.15;
		}
	}

	function reset() {
		for (var i = ashParticles.length - 1; i >= 0; i--) {
			scene.remove(ashParticles[i].mesh);
		}
		ashParticles = [];

		for (var i = scene.children.length - 1; i >= 0; i--) {
			var child = scene.children[i];
			if (child.userData && child.userData.eruptTimer !== undefined) {
				scene.remove(child);
			}
		}
		magmaVents = [];
		ashDrifts = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
