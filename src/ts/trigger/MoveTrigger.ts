import * as THREE from 'three';
import { LoadingManager } from '../core/LoadingManager';
import { World } from '../world/World';
import gsap from 'gsap';
import { IUpdatable } from '../interfaces/IUpdatable';
import Swal from 'sweetalert2';
import * as CANNON from 'cannon';

export class MoveTrigger extends THREE.Object3D implements IUpdatable
{
    public updateOrder: number;
    public world:World;
    public isInner:boolean;
    public loadingManager;
    constructor(gltf:THREE.Object3D, world:World)
    {
        super();
        this.updateOrder = 0;
        this.name = 'ConveyerTrigger';
        let loadingManager = new LoadingManager(world);
        this.loadingManager = loadingManager;
        let object = gltf;
        let worldPos = new THREE.Vector3();
        object.position.add(object.parent.position);
        this.world = world;
       
		object.getWorldPosition(worldPos);
        this.position.set(worldPos.x, worldPos.y+0.2, worldPos.z);
        let texture = new THREE.TextureLoader().load('build/assets/imgs/trigger1.png');
        // 旋转纹理
        texture.rotation = -Math.PI / 2;
        texture.offset.x = 0.5;
        texture.repeat.set(0.5,1)
        loadingManager.loadGLTF('build/assets/trigger.glb', (gltf) =>
		{
            // 设置基础材质
            let material = new THREE.MeshBasicMaterial({
                // color: 0x00ff00, 
                map: texture,
                alphaMap: texture,
                transparent: true, 
                opacity:1,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            gltf.scene.children[0].material = material;
			this.add(gltf.scene);
		});
        // 加载礼物盒
        loadingManager.loadGLTF('build/assets/gifts.glb', (gltf) =>
        {
            this.add(gltf.scene);
            gsap.to(gltf.scene.position,{
                y:0.2,
                duration:1,
                yoyo:true,
                repeat:-1,
    
            })
        });
        world.graphicsWorld.add(this);
        world.registerUpdatable(this)
        console.log('moveTrigger',world);

        
        this.isInner = false;

    }
    update(timestep: number, unscaledTimeStep: number): void {
        let character = this.world.characters[0]
        if(character){
           let length = character.position.distanceTo(this.position)
           if(length<1&& this.isInner==false){
            console.log('length',length);
             this.isInner= true;
             this.enterHandler()
           }
           if(length>1&& this.isInner==true){
            this.isInner= false;
           }
        }
        
    }
    enterHandler(){
        Swal.fire({
            title: '传送门',
            text: '传送至灯塔',
            confirmButtonText: '确定',
            buttonsStyling: false,
            onClose: () => {
                let newPos =  new CANNON.Vec3(185, 84, 0);
                let newQuat = new CANNON.Quaternion(0, 0, 0, 1);
                let character = this.world.characters[0]
                let body = character.characterCapsule.body;
                // 重置位置
                body.position.copy(newPos);
                // 重置插值位置
                body.interpolatedPosition.copy(newPos);
                // 重置旋转
                body.quaternion.copy(newQuat);
                // 重置插值旋转
                body.interpolatedQuaternion.copy(newQuat);
                // 重置速度
                body.velocity.setZero();
                // 重置角速度
                body.angularVelocity.setZero();
            }
        });
    }
    
}

	
