import
{
    globalCanvas,
    gl_activeTexture,
    gl_ARRAY_BUFFER,
    gl_attachShader,
    gl_bindBuffer,
    gl_bindFramebuffer,
    gl_bindTexture,
    gl_bufferData,
    gl_COLOR_ATTACHMENT0,
    gl_createBuffer,
    gl_createFramebuffer,
    gl_createProgram,
    gl_createTexture,
    gl_deleteProgram,
    gl_deleteShader,
    gl_deleteTexture,
    gl_drawArrays,
    gl_enableVertexAttribArray,
    gl_FLOAT,
    gl_FRAGMENT_SHADER,
    gl_FRAMEBUFFER,
    gl_framebufferTexture2D,
    gl_generateMipmap,
    gl_getAttribLocation,
    gl_getExtension,
    gl_getParameter,
    gl_getUniformLocation,
    gl_LINEAR_MIPMAP_LINEAR,
    gl_linkProgram,
    gl_readPixels,
    gl_REPEAT,
    gl_RGB10_A2,
    gl_RGBA,
    gl_STATIC_DRAW,
    gl_texImage2D,
    gl_texParameterf,
    gl_texParameteri,
    gl_TEXTURE0,
    gl_TEXTURE_2D,
    gl_TEXTURE_MIN_FILTER,
    gl_TEXTURE_WRAP_S,
    gl_TEXTURE_WRAP_T,
    gl_TRIANGLE_STRIP,
    gl_uniform1f,
    gl_uniform1i,
    gl_UNSIGNED_BYTE,
    gl_UNSIGNED_INT_2_10_10_10_REV,
    gl_useProgram,
    gl_vertexAttribPointer,
    gl_VERTEX_SHADER,
    gl_viewport
} from "../scenegraph/global-canvas.js";
import { min } from "./math.js";
import { CreateAndLinkProgram, CreateShader, webglDebugMode } from "./webgl-utils.js";

function CreateWebglCanvas()
{
    const vertexShader = `#version 300 es
in vec2 aVertexPosition;
uniform float uAspect;
out vec2 vPixelCoord;
void main()
{
    vPixelCoord = (aVertexPosition + vec2(1)) * 0.5;
    gl_Position = vec4(aVertexPosition, 0, 1);
}`;

    const vertShaderObj = CreateShader(gl_VERTEX_SHADER, vertexShader);

    const vertexBuffer = gl_createBuffer()!;
    const vertexPositions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl_bindBuffer(gl_ARRAY_BUFFER, vertexBuffer);
    gl_bufferData(gl_ARRAY_BUFFER, vertexPositions, gl_STATIC_DRAW);

    const framebuffer = gl_createFramebuffer()!;

    function DrawWithShader(shaderFunctions: string[], shaderMainImage: string, width: number, height: number,
        inputTextures: WebGLTexture[], resultTexture: WebGLTexture)
    {
        // size setup
        globalCanvas.width = width;
        globalCanvas.height = height;
        gl_viewport(0, 0, width, height);

        // shader and program setup
        const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 vPixelCoord;
out vec4 outColor;

uniform float uAspect;
const vec2 pixelSize = vec2(${1 / width}, ${1 / height});

${inputTextures.map((_, idx) => `uniform sampler2D t${idx};`).join("\n")}

${shaderFunctions.join("\n")}

void main()
{
${shaderMainImage}
}`;

        const fragShaderObj = CreateShader(gl_FRAGMENT_SHADER, fragmentShaderSource);
        const program = CreateAndLinkProgram(vertShaderObj, fragShaderObj);

        gl_useProgram(program);

        // setup attributes and uniforms
        const vertexLocation = gl_getAttribLocation(program, "aVertexPosition");
        gl_uniform1f(gl_getUniformLocation(program, "uAspect"), width / height);

        // textures
        inputTextures.forEach((tex, idx) =>
        {
            gl_activeTexture(gl_TEXTURE0 + idx);
            gl_bindTexture(gl_TEXTURE_2D, tex);
            const loc = gl_getUniformLocation(program, "t" + idx);
            gl_uniform1i(loc, idx);
        });

        gl_bindFramebuffer(gl_FRAMEBUFFER, framebuffer);
        gl_framebufferTexture2D(gl_FRAMEBUFFER, gl_COLOR_ATTACHMENT0, gl_TEXTURE_2D, resultTexture, 0);

        // draw
        gl_bindBuffer(gl_ARRAY_BUFFER, vertexBuffer);
        gl_enableVertexAttribArray(vertexLocation);
        gl_vertexAttribPointer(vertexLocation, 2, gl_FLOAT, false, 0, 0);
        gl_drawArrays(gl_TRIANGLE_STRIP, 0, vertexPositions.length / 2);

        // cleanup
        gl_deleteShader(fragShaderObj);
        gl_deleteProgram(program);
        gl_bindFramebuffer(gl_FRAMEBUFFER, null);

        gl_bindTexture(gl_TEXTURE_2D, resultTexture);
        gl_generateMipmap(gl_TEXTURE_2D);
        gl_bindTexture(gl_TEXTURE_2D, null);
    }

    function CreateTexture(width: number, height: number)
    {
        const tex = gl_createTexture()!;
        gl_bindTexture(gl_TEXTURE_2D, tex);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_S, gl_REPEAT);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_T, gl_REPEAT);
        gl_texImage2D(gl_TEXTURE_2D, 0, gl_RGB10_A2, width, height, 0, gl_RGBA, gl_UNSIGNED_INT_2_10_10_10_REV, null);

        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_LINEAR_MIPMAP_LINEAR);

        // only needed for non power of 2 textures
        // {
        //     gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_LINEAR);
        //     gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_S, gl_REPEAT);
        //     gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_T, gl_REPEAT);
        // }

        const ext = gl_getExtension("EXT_texture_filter_anisotropic");
        ext && gl_texParameterf(gl_TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, min(16, gl_getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

        return tex;
    }

    function DeleteTexture(texture: WebGLTexture)
    {
        gl_deleteTexture(texture);
    }

    interface ReturnObject
    {
        DrawWithShader: typeof DrawWithShader;
        CreateTexture: typeof CreateTexture;
        DeleteTexture: typeof DeleteTexture;
        canvas: HTMLCanvasElement;
        GetTexturePixels?: (texture: WebGLTexture, width: number, height: number, pixels?: Uint8ClampedArray) => Uint8ClampedArray;
        DrawTexture?: (texture: WebGLTexture, width: number, height: number) => void;
        TextureToImage?: (texture: WebGLTexture, width: number, height: number) => Promise<HTMLImageElement>;
    }

    const returnObject: ReturnObject = { DrawWithShader, CreateTexture, DeleteTexture, canvas: globalCanvas };

    if (webglDebugMode)
    {
        // for debug
        function GetTexturePixels(texture: WebGLTexture, width: number, height: number, pixels?: Uint8ClampedArray)
        {
            pixels ??= new Uint8ClampedArray(width * height * 4);
            gl_framebufferTexture2D(gl_FRAMEBUFFER, gl_COLOR_ATTACHMENT0, gl_TEXTURE_2D, texture, 0);
            gl_readPixels(0, 0, width, height, gl_RGBA, gl_UNSIGNED_BYTE, pixels);
            return pixels;
        }

        async function TextureToImage(texture: WebGLTexture, width: number, height: number)
        {
            DrawTexture(texture, width, height);
            const dataUrl = globalCanvas.toDataURL();

            return await new Promise<HTMLImageElement>((resolve, reject) =>
            {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = dataUrl;
            });
        }

        const debugDrawVertexShader = `attribute vec2 aVertexPosition;
varying vec2 vPixelCoord;
void main()
{
    vPixelCoord = (aVertexPosition + vec2(1.0)) * 0.5;
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}`;

        const debugDrawFragmentShader = `precision highp float;
varying vec2 vPixelCoord;
uniform sampler2D tex;

void main()
{
    gl_FragColor = texture2D(tex, vPixelCoord);
}`;

        const debugDrawProgram = gl_createProgram()!;
        gl_attachShader(debugDrawProgram, CreateShader(gl_VERTEX_SHADER, debugDrawVertexShader));
        gl_attachShader(debugDrawProgram, CreateShader(gl_FRAGMENT_SHADER, debugDrawFragmentShader));
        gl_linkProgram(debugDrawProgram);

        const debugDrawVertexLocation = gl_getAttribLocation(debugDrawProgram, "aVertexPosition");

        function DrawTexture(texture: WebGLTexture, width: number, height: number)
        {
            globalCanvas.width = width;
            globalCanvas.height = height;
            gl_viewport(0, 0, width, height);

            gl_useProgram(debugDrawProgram);
            gl_activeTexture(gl_TEXTURE0);
            gl_bindTexture(gl_TEXTURE_2D, texture);

            // draw
            gl_bindBuffer(gl_ARRAY_BUFFER, vertexBuffer);
            gl_enableVertexAttribArray(debugDrawVertexLocation);
            gl_vertexAttribPointer(debugDrawVertexLocation, 2, gl_FLOAT, false, 0, 0);
            gl_drawArrays(gl_TRIANGLE_STRIP, 0, vertexPositions.length / 2);
        }

        returnObject.GetTexturePixels = GetTexturePixels;
        returnObject.DrawTexture = DrawTexture;
        returnObject.TextureToImage = TextureToImage;
    }

    return returnObject;
}

export const ca = CreateWebglCanvas();
