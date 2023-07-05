import * as THREE from 'three';
import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { World } from '../world/World';
import { Helicopter } from '../vehicles/Helicopter';
import { Airplane } from '../vehicles/Airplane';
import { Car } from '../vehicles/Car';
import * as Utils from '../core/FunctionLibrary';
import { Vehicle } from '../vehicles/Vehicle';
import { Character } from '../characters/Character';
import { FollowPath } from '../characters/character_ai/FollowPath';
import { LoadingManager } from '../core/LoadingManager';
import { IWorldEntity } from '../interfaces/IWorldEntity';

export class VehicleSpawnPoint implements ISpawnPoint
{
	public type: string;
	public driver: string;
	public firstAINode: string;

	private object: THREE.Object3D;

	constructor(object: THREE.Object3D)
	{
		this.object = object;
	}

	public spawn(loadingManager: LoadingManager, world: World): void
	{
		loadingManager.loadGLTF('build/assets/' + this.type + '.glb', (model: any) =>
		{
			// 通过类型获取车辆
			let vehicle: Vehicle = this.getNewVehicleByType(model, this.type);
			// 设置当前重生点为当前的空对象
			vehicle.spawnPoint = this.object;

			let worldPos = new THREE.Vector3();
			let worldQuat = new THREE.Quaternion();
			this.object.getWorldPosition(worldPos);
			this.object.getWorldQuaternion(worldQuat);
			// 获取空对象的世界坐标和世界旋转设置到车辆上
			vehicle.setPosition(worldPos.x, worldPos.y + 1, worldPos.z);
			vehicle.collision.quaternion.copy(Utils.cannonQuat(worldQuat));
			world.add(vehicle);
			// 如果有驾驶员，就创建一个新的角色
			if (this.driver !== undefined)
			{
				loadingManager.loadGLTF('build/assets/boxman01.glb', (charModel) =>
				{
					let character = new Character(charModel);
					world.add(character);
					// 设置角色到车辆上
					character.teleportToVehicle(vehicle, vehicle.seats[0]);
					// 如果有驾驶员，就让驾驶员进行操控
					if (this.driver === 'player')
					{
						character.takeControl();
					}
					// 如果是ai，就让ai进行操控
					else if (this.driver === 'ai')
					{
						if (this.firstAINode !== undefined)
						{
							let nodeFound = false;
							for (const pathName in world.paths) {
								if (world.paths.hasOwnProperty(pathName)) {
									const path = world.paths[pathName];
									
									for (const nodeName in path.nodes) {
										if (Object.prototype.hasOwnProperty.call(path.nodes, nodeName)) {
											const node = path.nodes[nodeName];
											
											if (node.object.name === this.firstAINode)
											{
												character.setBehaviour(new FollowPath(node, 10));
												nodeFound = true;
											}
										}
									}
								}
							}

							if (!nodeFound)
							{
								console.error('Path node ' + this.firstAINode + 'not found.');
							}
						}
					}
				});
			}
		});
	}

	private getNewVehicleByType(model: any, type: string): Vehicle
	{
		switch (type)
		{
			case 'car': return new Car(model);
			case 'heli': return new Helicopter(model);
			case 'airplane': return new Airplane(model);
		}
	}
}