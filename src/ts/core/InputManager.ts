import { World } from '../world/World';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { EntityType } from '../enums/EntityType';
import { IUpdatable } from '../interfaces/IUpdatable';
import * as THREE from 'three';

export class InputManager implements IUpdatable
{
	public updateOrder: number = 3;

	public world: World;
	public domElement: any;
	public pointerLock: any;
	public isLocked: boolean;
	public inputReceiver: IInputReceiver;
	public mouse: any;
	public raycaster: THREE.Raycaster;

	public boundOnMouseDown: (evt: any) => void;
	public boundOnMouseMove: (evt: any) => void;
	public boundOnMouseUp: (evt: any) => void;
	public boundOnMouseWheelMove: (evt: any) => void;
	public boundOnPointerlockChange: (evt: any) => void;
	public boundOnPointerlockError: (evt: any) => void;
	public boundOnKeyDown: (evt: any) => void;
	public boundOnKeyUp: (evt: any) => void;
	public boundOnDblClick: (evt: any) => void;
	public boundOntouchstart: (evt: any) => void;
	public clock = new THREE.Clock();
	
	constructor(world: World, domElement: HTMLElement)
	{
		this.world = world;
		this.pointerLock = world.params.Pointer_Lock;
		this.domElement = domElement || document.body;
		this.isLocked = false;
		
		// Bindings for later event use
		// Mouse
		this.boundOnMouseDown = (evt) => this.onMouseDown(evt);
		this.boundOnMouseMove = (evt) => this.onMouseMove(evt);
		this.boundOnMouseUp = (evt) => this.onMouseUp(evt);
		this.boundOnMouseWheelMove = (evt) => this.onMouseWheelMove(evt);

		// Pointer lock
		this.boundOnPointerlockChange = (evt) => this.onPointerlockChange(evt);
		this.boundOnPointerlockError = (evt) => this.onPointerlockError(evt);

		// Keys
		this.boundOnKeyDown = (evt) => this.onKeyDown(evt);
		this.boundOnKeyUp = (evt) => this.onKeyUp(evt);
		this.boundOnDblClick = (evt) => this.ondblclick(evt);
		this.boundOntouchstart = (evt) => this.ontouchstart(evt);
		this.mouse = new THREE.Vector2();
		this.raycaster = new THREE.Raycaster();

		// Init event listeners
		// Mouse
		this.domElement.addEventListener('mousedown', this.boundOnMouseDown, false);
		document.addEventListener('wheel', this.boundOnMouseWheelMove, false);
		document.addEventListener('pointerlockchange', this.boundOnPointerlockChange, false);
		document.addEventListener('pointerlockerror', this.boundOnPointerlockError, false);
		document.addEventListener('dblclick', this.boundOnDblClick, false);
		document.addEventListener('touchstart', this.boundOntouchstart, false);
		// Keys
		document.addEventListener('keydown', this.boundOnKeyDown, false);
		document.addEventListener('keyup', this.boundOnKeyUp, false);

		this.clock = new THREE.Clock();

		world.registerUpdatable(this);
	}

	public update(timestep: number, unscaledTimeStep: number): void
	{
		if (this.inputReceiver === undefined && this.world !== undefined && this.world.cameraOperator !== undefined)
		{
			this.setInputReceiver(this.world.cameraOperator);
		}

		this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
	}

	public setInputReceiver(receiver: IInputReceiver): void
	{
		this.inputReceiver = receiver;
		this.inputReceiver.inputReceiverInit();
	}

	public setPointerLock(enabled: boolean): void
	{
		this.pointerLock = enabled;
	}

	public onPointerlockChange(event: MouseEvent): void
	{
		if (document.pointerLockElement === this.domElement)
		{
			this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
			this.isLocked = true;
		}
		else
		{
			this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
			this.isLocked = false;
		}
	}

	public onPointerlockError(event: MouseEvent): void
	{
		console.error('PointerLockControls: Unable to use Pointer Lock API');
	}

	public ondblclick(event: MouseEvent): void{
		console.log("ondblclick");
		if(this.world.mobile){
			
			this.inputReceiver.triggerAction('up', false);
		}
	}
	public ontouchstart(event: any): void{
		let time = this.clock.getDelta();
		if(time < 0.2){
			this.ondblclick(event);
			return;
		}
		if(this.world.mobile){
			// 获取鼠标点击的位置
			let x = event.touches[0].clientX;
			let y = event.touches[0].clientY;
			// 将屏幕坐标转换为标准的设备坐标
			this.mouse.x = ( x / window.innerWidth ) * 2 - 1;
			this.mouse.y = - ( y / window.innerHeight ) * 2 + 1;
			// 设置射线的起点和方向
			this.raycaster.setFromCamera( this.mouse, this.world.camera );
			// 计算射线和物体的交点
			let intersects = this.raycaster.intersectObjects( this.world.graphicsWorld.children ,true);
			// 如果有交点
			if(intersects.length > 0){
				// 控制输入接受者，角色移动到交点
				this.inputReceiver?.inputReceiverMove(event,intersects[0].point);
			}
		}
		
	}

	public onMouseDown(event: MouseEvent): void
	{
		// 判断是否是移动端
		if(!this.world.mobile){
			if (this.pointerLock)
			{
				this.domElement.requestPointerLock();
			}
			else
			{
				this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
				this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
			}
	
			if (this.inputReceiver !== undefined)
			{
				this.inputReceiver.handleMouseButton(event, 'mouse' + event.button, true);
			}
		}
		
	}

	public onMouseMove(event: MouseEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseMove(event, event.movementX, event.movementY);
		}
	}

	public onMouseUp(event: MouseEvent): void
	{
		if (!this.pointerLock)
		{
			this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
			this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
		}

		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseButton(event, 'mouse' + event.button, false);
		}
	}

	public onKeyDown(event: KeyboardEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleKeyboardEvent(event, event.code, true);
		}
	}

	public onKeyUp(event: KeyboardEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleKeyboardEvent(event, event.code, false);
		}
	}

	public onMouseWheelMove(event: WheelEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseWheel(event, event.deltaY);
		}
	}
}