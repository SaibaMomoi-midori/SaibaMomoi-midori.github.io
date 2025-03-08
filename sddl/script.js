// WebGL鐫€鑹插櫒婧愮爜
const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    
    varying highp vec2 vTextureCoord;
    
    void main(void) {
        gl_Position = aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`;

const fsSource = `
    precision highp float;
    
    varying highp vec2 vTextureCoord;
    
    uniform sampler2D uSampler;
    uniform vec2 uResolution;
    uniform float uScale;
    uniform vec3 uRotation;
    uniform vec2 uOffset;
    uniform float uRadius;
    
    const float PI = 3.14159265359;
    const float TWO_PI = 6.28318530718;
    
    mat3 computeRotationMatrix(vec3 rotation) {
        float cosA = cos(rotation.x);
        float sinA = sin(rotation.x);
        float cosB = cos(rotation.y);
        float sinB = sin(rotation.y);
        float cosG = cos(rotation.z);
        float sinG = sin(rotation.z);
        
        return mat3(
            cosG * cosB,
            cosG * sinB * sinA - sinG * cosA,
            cosG * sinB * cosA + sinG * sinA,
            sinG * cosB,
            sinG * sinB * sinA + cosG * cosA,
            sinG * sinB * cosA - cosG * sinA,
            -sinB,
            cosB * sinA,
            cosB * cosA
        );
    }
    
    vec3 projectToSphere(vec2 pixel) {
        vec2 adjusted = pixel + (uOffset - 0.5) * uResolution;
        float r = min(uResolution.x, uResolution.y) / 10.0 * uScale;
        vec3 point = vec3(adjusted, 0.0);
        float k = 2.0 * r * r / (dot(point.xy, point.xy) + r * r);
        return vec3(k * point.xy, (k - 1.0) * r);
    }
    
    vec2 getPixOnImg(vec3 point) {
        float r = uRadius;
        vec3 p = point;
        p.z = clamp(p.z, -r, r);
        
        float row = acos(p.z / r) / PI;
        float col = atan(p.y, p.x) / TWO_PI + 0.5;
        
        return vec2(col, row);
    }
    
    // 瓒呴噰鏍锋姉閿娇
    vec4 sampleTexture(vec2 coord) {
        const int SAMPLES = 4;
        const float STEP = 0.5 / float(SAMPLES);
        vec4 color = vec4(0.0);
        
        for(int i = 0; i < SAMPLES; i++) {
            for(int j = 0; j < SAMPLES; j++) {
                vec2 offset = vec2(float(i), float(j)) * STEP - vec2(0.5);
                vec2 sampleCoord = coord + offset / uResolution;
                color += texture2D(uSampler, sampleCoord);
            }
        }
        
        return color / float(SAMPLES * SAMPLES);
    }
    
    void main(void) {
        vec2 pixCoord = vTextureCoord * uResolution;
        vec3 spherePoint = projectToSphere(pixCoord);
        mat3 rotMat = computeRotationMatrix(uRotation);
        vec3 rotatedPoint = rotMat * spherePoint;
        vec2 imgCoord = getPixOnImg(rotatedPoint);
        
        // 澶勭悊杈圭晫鎯呭喌
        if (any(lessThan(imgCoord, vec2(0.0))) || any(greaterThan(imgCoord, vec2(1.0)))) {
            discard;
        }
        
        gl_FragColor = sampleTexture(imgCoord);
    }
`;

class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', {
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        });
        
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }
        
        // 璁剧疆瑙嗗彛浠ュ尮閰嶇敾甯冨昂瀵�
        this.resizeViewport();
        
        // 鍒濆鍖栫潃鑹插櫒绋嬪簭
        this.initShaderProgram();
        // 鍒濆鍖栫紦鍐插尯
        this.initBuffers();
        // 鍒濆鍖栫汗鐞嗙紦瀛�
        this.textureCache = new Map();
        
        // 鎬ц兘鐩戞帶
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
    }
    
    resizeViewport() {
        // 鑾峰彇鐢诲竷鐨勬樉绀哄昂瀵�
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        // 璁剧疆鐢诲竷鐨勭粯鍒剁紦鍐插尯灏哄鍖归厤鏄剧ず灏哄
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        
        // 璁剧疆瑙嗗彛灏哄
        this.gl.viewport(0, 0, displayWidth, displayHeight);
    }
    
    initShaderProgram() {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error('Shader program initialization failed');
        }
        
        this.program = program;
        this.locations = {
            attributes: {
                position: this.gl.getAttribLocation(program, 'aVertexPosition'),
                texCoord: this.gl.getAttribLocation(program, 'aTextureCoord')
            },
            uniforms: {
                sampler: this.gl.getUniformLocation(program, 'uSampler'),
                resolution: this.gl.getUniformLocation(program, 'uResolution'),
                scale: this.gl.getUniformLocation(program, 'uScale'),
                rotation: this.gl.getUniformLocation(program, 'uRotation'),
                offset: this.gl.getUniformLocation(program, 'uOffset'),
                radius: this.gl.getUniformLocation(program, 'uRadius')
            }
        };
    }
    
    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Shader compilation failed: ${info}`);
        }
        
        return shader;
    }
    
    initBuffers() {
        // 椤剁偣浣嶇疆缂撳啿鍖�
        const positions = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0
        ]);
        
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        // 绾圭悊鍧愭爣缂撳啿鍖�
        const textureCoords = new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            1.0, 0.0
        ]);
        
        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, textureCoords, this.gl.STATIC_DRAW);
    }
    
    setupBuffers() {
        // 璁剧疆椤剁偣浣嶇疆灞炴€�
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(
            this.locations.attributes.position,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.locations.attributes.position);
        
        // 璁剧疆绾圭悊鍧愭爣灞炴€�
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.vertexAttribPointer(
            this.locations.attributes.texCoord,
            2,
            this.gl.FLOAT,
            false,
            0,
            0
        );
        this.gl.enableVertexAttribArray(this.locations.attributes.texCoord);
    }
    
    loadTexture(image) {
        const cacheKey = image.src;
        let texture = this.textureCache.get(cacheKey);
        
        if (texture) {
            return texture;
        }
        
        texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // 璁剧疆鍙傛暟
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        
        // 涓婁紶鍥惧儚
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            image
        );
        
        this.textureCache.set(cacheKey, texture);
        return texture;
    }
    
    render(params) {
        const { image, scale, alpha, beta, gamma, offsetHor, offsetVer } = params;
        
        // 鏇存柊瑙嗗彛灏哄
        this.resizeViewport();
        
        // 娓呴櫎鐢诲竷
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // 浣跨敤鐫€鑹插櫒绋嬪簭
        this.gl.useProgram(this.program);
        
        // 璁剧疆缂撳啿鍖�
        this.setupBuffers();
        
        // 璁剧疆uniforms
        this.gl.uniform2f(
            this.locations.uniforms.resolution,
            this.canvas.width,
            this.canvas.height
        );
        this.gl.uniform1f(this.locations.uniforms.scale, scale);
        this.gl.uniform3f(this.locations.uniforms.rotation, alpha, beta, gamma);
        this.gl.uniform2f(this.locations.uniforms.offset, offsetHor, offsetVer);
        this.gl.uniform1f(
            this.locations.uniforms.radius,
            Math.min(this.canvas.height, this.canvas.width) / 10 * scale
        );
        
        // 璁剧疆绾圭悊
        const texture = this.loadTexture(image);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.locations.uniforms.sampler, 0);
        
        // 缁樺埗
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        // 鏇存柊鎬ц兘璁℃暟
        this.updatePerformanceMetrics();
    }
    
    updatePerformanceMetrics() {
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;
        
        if (elapsed >= 1000) {
            this.fps = (this.frameCount * 1000) / elapsed;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // 鍙互鍦ㄨ繖閲屾坊鍔燜PS鏄剧ず
            if (window.DEBUG) {
                console.log(`FPS: ${this.fps.toFixed(1)}`);
            }
        }
    }
    
    destroy() {
        // 娓呯悊绾圭悊
        this.textureCache.forEach(texture => {
            this.gl.deleteTexture(texture);
        });
        this.textureCache.clear();
        
        // 娓呯悊缂撳啿鍖�
        this.gl.deleteBuffer(this.positionBuffer);
        this.gl.deleteBuffer(this.texCoordBuffer);
        
        // 娓呯悊鐫€鑹插櫒绋嬪簭
        this.gl.deleteProgram(this.program);
    }
}

// Main Application
$(document).ready(function() {
    const canvas = document.getElementById('outputCanvas');
    const renderer = new WebGLRenderer(canvas);
    
    let img = new Image();
    let isProcessing = false;
    let animationFrameId = null;
    let pendingUpdate = false;
    
    const outputWidth = 800;
    const outputHeight = 600;
    
    // 璁剧疆canvas灏哄
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    function showLoading() {
        $('.loading-indicator').show();
        canvas.classList.remove('loaded');
    }
    
    function hideLoading() {
        $('.loading-indicator').hide();
        canvas.classList.add('loaded');
    }
    
    function loadDefaultImage() {
        showLoading();
        img.crossOrigin = "anonymous";
        img.src = 'otto.png';
        img.onerror = function() {
            console.error('Failed to load default image');
            hideLoading();
        };
        img.onload = function() {
            console.log('Default image loaded');
            requestUpdate();
            hideLoading();
        };
    }
    
    loadDefaultImage();
    
    // 鏂囦欢涓婁紶澶勭悊
    const fileInput = document.getElementById('imageUpload');
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showLoading();
            const reader = new FileReader();
            reader.onload = function(event) {
                img = new Image();
                img.onload = function() {
                    requestUpdate();
                    hideLoading();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 涓嬭浇鍔熻兘
    document.getElementById('downloadBtn').addEventListener('click', function() {
        const link = document.createElement('a');
        link.download = 'projected_image.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    });

    // 鎬ц兘浼樺寲鐨勬洿鏂拌姹傚嚱鏁�
    function requestUpdate() {
        if (isProcessing) {
            pendingUpdate = true;
            return;
        }
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(updateProjection);
    }

    function updateProjection() {
        if (!img.complete || isProcessing) {
            if (pendingUpdate) {
                animationFrameId = requestAnimationFrame(updateProjection);
            }
            return;
        }

        isProcessing = true;
        pendingUpdate = false;

        const params = {
            image: img,
            scale: parseFloat($('#scaleInput').val()),
            alpha: parseFloat($('#alphaInput').val()) * Math.PI / 180,
            beta: parseFloat($('#betaInput').val()) * Math.PI / 180,
            gamma: parseFloat($('#gammaInput').val()) * Math.PI / 180,
            offsetHor: parseFloat($('#offsetHorInput').val()),
            offsetVer: parseFloat($('#offsetVerInput').val())
        };

        try {
            renderer.render(params);
        } catch (error) {
            console.error('Render error:', error);
        }
        
        isProcessing = false;
        
        if (pendingUpdate) {
            requestAnimationFrame(updateProjection);
        }
    }

    // 浼樺寲鐨勬粦鍧楀€兼洿鏂�
    function updateSliderValue(input) {
        const value = parseFloat(input.value);
        const label = input.parentElement.previousElementSibling;
        const originalText = label.textContent.split('锛�')[0];
        label.textContent = `${originalText}锛�${value.toFixed(1)}`;
    }

    // 浣跨敤 requestAnimationFrame 浼樺寲婊戝潡鐩戝惉
    let rafPending = false;
    
    function handleSliderChange(input) {
        updateSliderValue(input);
        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
                requestUpdate();
                rafPending = false;
            });
        }
    }

    // 鐩戝惉鎵€鏈夋粦鍧楃殑鍙樺寲
    document.querySelectorAll('input[type="range"]').forEach(input => {
        updateSliderValue(input);
        input.addEventListener('input', () => handleSliderChange(input));
    });

    // 浼樺寲璋冩暣鎸夐挳鐨勭偣鍑诲鐞�
    document.querySelectorAll('.adjust-btn').forEach(btn => {
        let intervalId = null;
        let lastUpdateTime = 0;
        const updateInterval = 1000 / 60; // 闄愬埗鍒�60fps

        const startAdjust = () => {
            const currentTime = performance.now();
            if (currentTime - lastUpdateTime < updateInterval) {
                return;
            }
            
            const input = document.getElementById(btn.dataset.input);
            const adjust = parseFloat(btn.dataset.adjust);
            let value = parseFloat(input.value) + adjust;
            value = Math.max(parseFloat(input.min), Math.min(parseFloat(input.max), value));
            input.value = value;
            
            handleSliderChange(input);
            lastUpdateTime = currentTime;
        };

        btn.addEventListener('mousedown', () => {
            startAdjust();
            intervalId = setInterval(startAdjust, updateInterval);
        });

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startAdjust();
            intervalId = setInterval(startAdjust, updateInterval);
        });

        const stopAdjust = () => {
            if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        btn.addEventListener('mouseup', stopAdjust);
        btn.addEventListener('mouseleave', stopAdjust);
        btn.addEventListener('touchend', stopAdjust);
        btn.addEventListener('touchcancel', stopAdjust);
    });

    // 瀵艰埅鍒囨崲鍔熻兘
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.controls-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabId = btn.dataset.tab;
            document.querySelector(`[data-content="${tabId}"]`).classList.add('active');
        });
    });

    // 娣诲姞閿洏鎺у埗鏀寔
    document.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 0.1 : 1.0;
        let input = null;
        
        switch(e.key) {
            case 'ArrowLeft':
                input = document.getElementById('offsetHorInput');
                input.value = parseFloat(input.value) - step;
                break;
            case 'ArrowRight':
                input = document.getElementById('offsetHorInput');
                input.value = parseFloat(input.value) + step;
                break;
            case 'ArrowUp':
                input = document.getElementById('offsetVerInput');
                input.value = parseFloat(input.value) - step;
                break;
            case 'ArrowDown':
                input = document.getElementById('offsetVerInput');
                input.value = parseFloat(input.value) + step;
                break;
            case 'q':
                input = document.getElementById('alphaInput');
                input.value = parseFloat(input.value) - step;
                break;
            case 'w':
                input = document.getElementById('alphaInput');
                input.value = parseFloat(input.value) + step;
                break;
            case 'a':
                input = document.getElementById('betaInput');
                input.value = parseFloat(input.value) - step;
                break;
            case 's':
                input = document.getElementById('betaInput');
                input.value = parseFloat(input.value) + step;
                break;
            case 'z':
                input = document.getElementById('gammaInput');
                input.value = parseFloat(input.value) - step;
                break;
            case 'x':
                input = document.getElementById('gammaInput');
                input.value = parseFloat(input.value) + step;
                break;
            case '-':
                input = document.getElementById('scaleInput');
                input.value = parseFloat(input.value) - step * 0.1;
                break;
            case '=':
                input = document.getElementById('scaleInput');
                input.value = parseFloat(input.value) + step * 0.1;
                break;
        }
        
        if (input) {
            e.preventDefault();
            input.value = Math.max(
                parseFloat(input.min),
                Math.min(parseFloat(input.max), parseFloat(input.value))
            );
            handleSliderChange(input);
        }
    });

    // 娣诲姞瑙︽懜鎵嬪娍鏀寔
    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchDistance = 0;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            lastTouchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // 鍙嶈浆 deltaX 鍜� deltaY 鐨勮绠�
            const deltaX = (touchStartX - e.touches[0].clientX) / canvas.width * 2;
            const deltaY = (touchStartY - e.touches[0].clientY) / canvas.height * 2;
            
            const horInput = document.getElementById('offsetHorInput');
            const verInput = document.getElementById('offsetVerInput');
            
            horInput.value = parseFloat(horInput.value) + deltaX;
            verInput.value = parseFloat(verInput.value) + deltaY;
            
            handleSliderChange(horInput);
            handleSliderChange(verInput);
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            const scale = currentDistance / lastTouchDistance;
            const scaleInput = document.getElementById('scaleInput');
            scaleInput.value = parseFloat(scaleInput.value) * scale;
            handleSliderChange(scaleInput);
            
            lastTouchDistance = currentDistance;
        }
    });
        // 绐楀彛澶у皬鏀瑰彉鏃堕噸鏂拌绠梒anvas灏哄
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                requestUpdate();
            }, 250);
        });

    // 椤甸潰鍗歌浇鏃舵竻鐞嗚祫婧�
    window.addEventListener('beforeunload', () => {
        renderer.destroy();
    });
});
