import { ISpawnPoint } from '../interfaces/ISpawnPoint';
import { VehicleSpawnPoint } from './VehicleSpawnPoint';
import { CharacterSpawnPoint } from './CharacterSpawnPoint';
import { World } from '../world/World';
import { LoadingManager } from '../core/LoadingManager';
import { LuckyTrigger } from '../trigger/LuckyTrigger';
import {ActorTrigger} from '../trigger/ActorTrigger'
import {ConveyerTrigger} from '../trigger/ConveyerTrigger'
import {MoveTrigger} from '../trigger/MoveTrigger'
import { UIManager } from '../core/UIManager';

export class Scenario
{
	public id: string;
	public name: string;
	public spawnAlways: boolean = false;
	public default: boolean = false;
	public world: World;
	public descriptionTitle: string;
	public descriptionContent: string;
	
	private rootNode: THREE.Object3D;
	private spawnPoints: ISpawnPoint[] = [];
	private invisible: boolean = false;
	private initialCameraAngle: number;

	constructor(root: THREE.Object3D, world: World)
	{
		this.rootNode = root;
		this.world = world;
		this.id = root.name;

		// Scenario
		if (root.userData.hasOwnProperty('name')) 
		{
			this.name = root.userData.name;
		}
		if (root.userData.hasOwnProperty('default') && root.userData.default === 'true') 
		{
			this.default = true;
		}
		if (root.userData.hasOwnProperty('spawn_always') && root.userData.spawn_always === 'true') 
		{
			this.spawnAlways = true;
		}
		if (root.userData.hasOwnProperty('invisible') && root.userData.invisible === 'true') 
		{
			this.invisible = true;
		}
		if (root.userData.hasOwnProperty('desc_title')) 
		{
			this.descriptionTitle = root.userData.desc_title;
		}
		if (root.userData.hasOwnProperty('desc_content')) 
		{
			this.descriptionContent = root.userData.desc_content;
		}
		if (root.userData.hasOwnProperty('camera_angle')) 
		{
			this.initialCameraAngle = root.userData.camera_angle;
		}
		// 场景可见的话，就创建启动链接函数
		if (!this.invisible) this.createLaunchLink();

		// Find all scenario spawns and enitites
		root.traverse((child) => {
			if (child.hasOwnProperty('userData') && child.userData.hasOwnProperty('data'))
			{
				if (child.userData.data === 'spawn')
				{
					if (child.userData.type === 'car' || child.userData.type === 'airplane' || child.userData.type === 'heli')
					{
						let sp = new VehicleSpawnPoint(child);

						if (child.userData.hasOwnProperty('type')) 
						{
							sp.type = child.userData.type;
						}

						if (child.userData.hasOwnProperty('driver')) 
						{
							sp.driver = child.userData.driver;

							if (child.userData.driver === 'ai' && child.userData.hasOwnProperty('first_node'))
							{
								sp.firstAINode = child.userData.first_node;
							}
						}

						this.spawnPoints.push(sp);
					}
					else if (child.userData.type === 'player')
					{
						let sp = new CharacterSpawnPoint(child);
						this.spawnPoints.push(sp);
					}
				}

				if(child.userData.data === 'trigger'&&child.userData.type==='lucky'){
					let trigger = new LuckyTrigger(child,world)
				}

				if(child.userData.data === 'trigger'&&child.userData.type==='actor'){
					let trigger = new ActorTrigger(child,world)
				}
				if(child.userData.data === 'trigger'&&child.userData.type==='conveyer'){
					let trigger = new ConveyerTrigger(child,world)
				}
				if(child.userData.data === 'trigger'&&child.userData.type==='move'){
					let trigger = new MoveTrigger(child,world)
				}
			}
		});
	}

	public createLaunchLink(): void
	{
		// 在世界对象里，创建一个启动链接函数，通过名字来启动场景
		this.world.params[this.name] = () =>
		{
			
			this.world.launchScenario(this.id);
		};
		// 并且往gui里添加一个按钮
		this.world.scenarioGUIFolder.add(this.world.params, this.name);
	}

	public launch(loadingManager: LoadingManager, world: World): void
	{
		console.log('Launching scenario: ' + this.name);
		console.log(this.spawnPoints);
		this.spawnPoints.forEach((sp) => {
			sp.spawn(loadingManager, world);
		});

		if (!this.spawnAlways)
		{
			console.log(this.spawnAlways)
			// 如果这个场景是不会总是重生，那么每次加载进来就会显示欢迎界面
			loadingManager.createWelcomeScreenCallback(this);
			
			world.cameraOperator.theta = this.initialCameraAngle;
			
			world.cameraOperator.phi =world.mobile?45: 15;

			

		}

		
	}
}