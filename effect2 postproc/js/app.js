import * as THREE from 'three';
import imagesLoaded from 'imagesloaded';
import FontFaceObserver from 'fontfaceobserver';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Scroll from './scroll';
import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'

import ocean from '../img/ocean.jpg';

export default class Sketch {
    constructor(options) {
        this.time = 0;
        this.container = options.dom;
        this.scene = new THREE.Scene();

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 100, 2000);
        this.camera.position.z = 600;

        this.camera.fov = 2 * Math.atan((this.height / 2) / 600) * (180 / Math.PI);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        // this.renderer.setSize( this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)

        this.images = [...document.querySelectorAll('img')];

        const fontOpen = new Promise(resolve => {
            new FontFaceObserver("Open sans").load().then(() => {
                resolve();
            });
        });

        const fontPlayfair = new Promise(resolve => {
            new FontFaceObserver("Playfair Display").load().then(() => {
                resolve();
            });
        });

        //Preload images 
        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('img'), { background: true }, resolve);
        });

        let allDone = [fontOpen, fontPlayfair, preloadImages];
        this.currentScroll = 0;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        Promise.all(allDone).then(() => {
            this.scroll = new Scroll();
            this.addImages();
            this.setPosition();

            this.mouseMovement();
            this.resize();
            this.setupResize();
            // this.addObjects();
            this.render();

            // window.addEventListener('scroll', ()=>{
            //     this.currentScroll = window.scrollY;
            //     this.setPosition();
            // });
        })
    }

    mouseMovement() {
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / this.width) * 2 - 1;
            this.mouse.y = - (event.clientY / this.height) * 2 + 1;

            // ??????????????????????????????????????????
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // ??????????????????????????????
            const intersects = this.raycaster.intersectObjects(this.scene.children);

            if(intersects.length > 0){
                console.log(intersects[0]);
                let obj = intersects[0].object;
                obj.material.hover.value = intersects[0].uv;
            };
        }, false);
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this))
    }

    addImages() {
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                uImage: { value: 0},
                hover: { value: new THREE.Vector2(0.5,0.5)},
                oceanTexture: { value: new THREE.TextureLoader().load(ocean) }
            },
            side: THREE.DoubleSide,
            fragmentShader: fragment,
            vertexShader: vertex,
            // wireframe: true,
        });

        this.materials = [];

        this.imageStore = this.images.map(img => {
            let bounds = img.getBoundingClientRect();
            let geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height, 10, 10);
            let texture = new THREE.Texture(img);
            texture.needsUpdate = true;
            // let material = new THREE.MeshBasicMaterial({
            //     // color: 0xff0000,
            //     map: texture,
            // });

            let material = this.material.clone();
            this.materials.push(material);
            material.uniforms.uImage.value = texture;
            let mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);

            return {
                img: img,
                mesh: mesh,
                top: bounds.top,
                left: bounds.left,
                height: bounds.height,
                width: bounds.width,
            }
        })
    }

    setPosition() {
        this.imageStore.forEach(o => {
            o.mesh.position.y = this.currentScroll - o.top + this.height / 2 - o.height / 2;
            o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
        });
    };

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    };
    addObjects() {
        this.geometry = new THREE.PlaneBufferGeometry(200, 400, 10, 10);
        // this.geometry = new THREE.SphereBufferGeometry(0.4, 40,40);
        this.material = new THREE.MeshNormalMaterial();
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                oceanTexture: { value: new THREE.TextureLoader().load(ocean) }
            },
            side: THREE.DoubleSide,
            fragmentShader: fragment,
            vertexShader: vertex,
            wireframe: true
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    };
    render() {
        this.time += 0.05;
        this.scroll.render();
        this.currentScroll = this.scroll.scrollToRender;
        // console.log(this.scroll.scrollToRender);
        this.setPosition();

        // this.material.uniforms.time.value = this.time;

        this.materials.forEach(m=>{
            m.uniforms.time.value = this.time;
        })

        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.render.bind(this))
    };
}

new Sketch({
    dom: document.getElementById('container')
})
