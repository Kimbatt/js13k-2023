export const globalCanvas = document.createElement("canvas");

const gl = globalCanvas.getContext("webgl2")!;

export const
    gl_createProgram = gl.createProgram.bind(gl),
    gl_useProgram = gl.useProgram.bind(gl),
    gl_linkProgram = gl.linkProgram.bind(gl),
    gl_deleteProgram = gl.deleteProgram.bind(gl),
    gl_getProgramParameter = gl.getProgramParameter.bind(gl),
    gl_getProgramInfoLog = gl.getProgramInfoLog.bind(gl),

    gl_createShader = gl.createShader.bind(gl),
    gl_shaderSource = gl.shaderSource.bind(gl),
    gl_compileShader = gl.compileShader.bind(gl),
    gl_attachShader = gl.attachShader.bind(gl),
    gl_deleteShader = gl.deleteShader.bind(gl),
    gl_getShaderInfoLog = gl.getShaderInfoLog.bind(gl),

    gl_createVertexArray = gl.createVertexArray.bind(gl),
    gl_bindVertexArray = gl.bindVertexArray.bind(gl),
    gl_enableVertexAttribArray = gl.enableVertexAttribArray.bind(gl),
    gl_vertexAttribPointer = gl.vertexAttribPointer.bind(gl),
    gl_getAttribLocation = gl.getAttribLocation.bind(gl),

    gl_enable = gl.enable.bind(gl),
    gl_disable = gl.disable.bind(gl),

    gl_drawElements = gl.drawElements.bind(gl),
    gl_drawArrays = gl.drawArrays.bind(gl),

    gl_createBuffer = gl.createBuffer.bind(gl),
    gl_deleteBuffer = gl.deleteBuffer.bind(gl),
    gl_bindBuffer = gl.bindBuffer.bind(gl),
    gl_bufferData = gl.bufferData.bind(gl),

    gl_createTexture = gl.createTexture.bind(gl),
    gl_activeTexture = gl.activeTexture.bind(gl),
    gl_bindTexture = gl.bindTexture.bind(gl),
    gl_deleteTexture = gl.deleteTexture.bind(gl),
    gl_texImage2D = gl.texImage2D.bind(gl),
    gl_texParameteri = gl.texParameteri.bind(gl),
    gl_texParameterf = gl.texParameterf.bind(gl),
    gl_generateMipmap = gl.generateMipmap.bind(gl),

    gl_createFramebuffer = gl.createFramebuffer.bind(gl),
    gl_bindFramebuffer = gl.bindFramebuffer.bind(gl),
    gl_framebufferTexture2D = gl.framebufferTexture2D.bind(gl),

    gl_uniform1i = gl.uniform1i.bind(gl),
    gl_uniform1f = gl.uniform1f.bind(gl),
    gl_uniform3f = gl.uniform3f.bind(gl),
    gl_uniform3fv = gl.uniform3fv.bind(gl),
    gl_uniform4f = gl.uniform4f.bind(gl),
    gl_uniformMatrix3fv = gl.uniformMatrix3fv.bind(gl),
    gl_uniformMatrix4fv = gl.uniformMatrix4fv.bind(gl),
    gl_getUniformLocation = gl.getUniformLocation.bind(gl),

    gl_depthFunc = gl.depthFunc.bind(gl),
    gl_depthMask = gl.depthMask.bind(gl),
    gl_cullFace = gl.cullFace.bind(gl),
    gl_viewport = gl.viewport.bind(gl),

    gl_clear = gl.clear.bind(gl),
    gl_clearColor = gl.clearColor.bind(gl),

    gl_blendFunc = gl.blendFunc.bind(gl),

    gl_getExtension = gl.getExtension.bind(gl),
    gl_getParameter = gl.getParameter.bind(gl),

    gl_readPixels = gl.readPixels.bind(gl);

export const {
    LINK_STATUS: gl_LINK_STATUS,

    VERTEX_SHADER: gl_VERTEX_SHADER,
    FRAGMENT_SHADER: gl_FRAGMENT_SHADER,

    ARRAY_BUFFER: gl_ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER: gl_ELEMENT_ARRAY_BUFFER,

    TRIANGLES: gl_TRIANGLES,
    TRIANGLE_STRIP: gl_TRIANGLE_STRIP,
    UNSIGNED_BYTE: gl_UNSIGNED_BYTE,
    UNSIGNED_INT: gl_UNSIGNED_INT,
    UNSIGNED_INT_24_8: gl_UNSIGNED_INT_24_8,
    FLOAT: gl_FLOAT,
    RGB10_A2: gl_RGB10_A2,
    UNSIGNED_INT_2_10_10_10_REV: gl_UNSIGNED_INT_2_10_10_10_REV,

    STATIC_DRAW: gl_STATIC_DRAW,
    MAX_TEXTURE_SIZE: gl_MAX_TEXTURE_SIZE,

    TEXTURE0: gl_TEXTURE0,
    TEXTURE_2D: gl_TEXTURE_2D,
    DEPTH_STENCIL: gl_DEPTH_STENCIL,
    DEPTH24_STENCIL8: gl_DEPTH24_STENCIL8,
    TEXTURE_MIN_FILTER: gl_TEXTURE_MIN_FILTER,
    TEXTURE_MAG_FILTER: gl_TEXTURE_MAG_FILTER,
    LINEAR: gl_LINEAR,
    LINEAR_MIPMAP_NEAREST: gl_LINEAR_MIPMAP_NEAREST,
    TEXTURE_COMPARE_MODE: gl_TEXTURE_COMPARE_MODE,
    COMPARE_REF_TO_TEXTURE: gl_COMPARE_REF_TO_TEXTURE,
    TEXTURE_WRAP_S: gl_TEXTURE_WRAP_S,
    TEXTURE_WRAP_T: gl_TEXTURE_WRAP_T,
    REPEAT: gl_REPEAT,
    LINEAR_MIPMAP_LINEAR: gl_LINEAR_MIPMAP_LINEAR,
    RGBA: gl_RGBA,

    FRAMEBUFFER: gl_FRAMEBUFFER,
    DEPTH_STENCIL_ATTACHMENT: gl_DEPTH_STENCIL_ATTACHMENT,
    COLOR_ATTACHMENT0: gl_COLOR_ATTACHMENT0,

    DEPTH_TEST: gl_DEPTH_TEST,
    LEQUAL: gl_LEQUAL,
    LESS: gl_LESS,

    CULL_FACE: gl_CULL_FACE,
    BACK: gl_BACK,
    FRONT: gl_FRONT,

    COLOR_BUFFER_BIT: gl_COLOR_BUFFER_BIT,
    DEPTH_BUFFER_BIT: gl_DEPTH_BUFFER_BIT,

    BLEND: gl_BLEND,
    SRC_ALPHA: gl_SRC_ALPHA,
    ONE_MINUS_SRC_ALPHA: gl_ONE_MINUS_SRC_ALPHA,
} = gl;
