import * as THREE from 'three';
import { LoadingManager } from '../core/LoadingManager';
import { World } from '../world/World';
import gsap from 'gsap';
import { IUpdatable } from '../interfaces/IUpdatable';
import Swal from 'sweetalert2';

export class ActorTrigger extends THREE.Object3D implements IUpdatable
{
    public updateOrder: number;
    public world:World;
    public isInner:boolean;
    public mixer:any;
    public action:any;
    public gifts:any;
    public triggerCircle:any;
    public rabbit:any;
    constructor(gltf:THREE.Object3D, world:World)
    {
        super();
        this.updateOrder = 0;
        this.name = 'LuckyTrigger';
        let loadingManager = new LoadingManager(world);
        let object = gltf;
        let worldPos = new THREE.Vector3();
        object.position.add(object.parent.position);
        this.world = world;
       
		object.getWorldPosition(worldPos);
        this.position.set(worldPos.x, worldPos.y, worldPos.z);
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
            gltf.scene.position.set(0,0.2,0)
            gltf.scene.children[0].material = material;
            this.triggerCircle = gltf.scene;
			this.add(gltf.scene);
		});
        // 加载礼物盒
        loadingManager.loadGLTF('build/assets/gifts.glb', (gltf) =>
        {
            this.gifts = gltf.scene;
            gltf.scene.position.set(0,0.2,0)
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
        console.log('ActorTrigger',this);

        
        this.isInner = false;


        // 加载兔女郎
        loadingManager.loadGLTF('build/assets/rabbit.glb', (gltf) =>{
            // 创建动画
            console.log('rabbit',gltf);
            this.mixer = new THREE.AnimationMixer(gltf.scene);
            this.action = this.mixer.clipAction(gltf.animations[0])
            this.action.stop()
            let rabbit = gltf.scene;
            rabbit.position.set(3,0,3)
            rabbit.children[0].position.set(0,0,0);
            rabbit.scale.set(0.004,0.004,0.004)
            this.add(rabbit);
            this.rabbit = rabbit;
            this.rabbit.visible = false;
            console.log(rabbit)

            // 创建一个cube
            // let geometry = new THREE.BoxGeometry( 1,1,1 );
            // let material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
            // let cube = new THREE.Mesh( geometry, material );
            // cube.position.set(0,0,0);
            // this.add(cube);
            this.action.setLoop(THREE.LoopOnce);

            this.mixer.addEventListener('finished', (e) => {
                // console.log('finished',e);
                this.action.stop();
                this.rabbit.visible = false;
            });
        })


        

    }
    update(timestep: number, unscaledTimeStep: number): void {
        let character = this.world.characters[0]
        if(this.mixer){
            this.mixer.update(timestep)
        }
        if(character){
           let length = character.position.distanceTo(this.position)
        //    判断进入光阵
           if(length<1&& this.isInner==false){
             this.isInner= true;
             this.enterHandler()
             this.triggerCircle.visible = false;
                this.gifts.visible = false;
                
           }
        //   出去光阵 
           if(length>1&& this.isInner==true){
            this.isInner= false;
            this.triggerCircle.visible = true;
            this.gifts.visible = true;
           }
        }
        
    }
    enterHandler(){
        Swal.fire({
            title: '特大奖励，攒劲节目！',
            text: '花费1000金币，即可观看攒劲节目，是否观看？',
            confirmButtonText: '确定',
            buttonsStyling: false,
            onClose: () => {
               this.action.play()
               this.rabbit.visible = true;
            }
        });
    }
    
}

	
