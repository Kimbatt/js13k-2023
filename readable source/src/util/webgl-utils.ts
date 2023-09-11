import
{
    gl_attachShader,
    gl_compileShader,
    gl_createProgram,
    gl_createShader,
    gl_FRAGMENT_SHADER,
    gl_getProgramInfoLog,
    gl_getProgramParameter,
    gl_getShaderInfoLog,
    gl_getUniformLocation,
    gl_linkProgram,
    gl_LINK_STATUS,
    gl_shaderSource,
    gl_VERTEX_SHADER
} from "../scenegraph/global-canvas.js";

export const webglDebugMode = true; // using a const bool so relevant parts can be easily removed by the minifier

export function CreateShader(shaderType: number, shaderSource: string)
{
    const shaderObj = gl_createShader(shaderType)!;

    if (webglDebugMode)
    {
        if (shaderObj === null)
        {
            throw new Error("Cannot create shader object");
        }
    }

    gl_shaderSource(shaderObj, shaderSource);
    gl_compileShader(shaderObj);

    if (webglDebugMode)
    {
        const shaderError = gl_getShaderInfoLog(shaderObj);
        if (shaderError && shaderError.length !== 0)
        {
            console.error(shaderError);

            // log shader with line numbers
            const lines = shaderSource.split("\n");
            const padCount = Math.log10(lines.length + 1) | 0 + 4;
            console.error("\n" + lines.map((line, idx) => (idx + 1).toString().padEnd(padCount, " ") + line).join("\n"));

            throw new Error(`Error compiling ${shaderType === gl_VERTEX_SHADER ? "vertex" : "fragment"} shader`);
        }
    }

    return shaderObj;
}

export function CreateAndLinkProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader)
{
    const program = gl_createProgram()!;

    gl_attachShader(program, vertexShader);
    gl_attachShader(program, fragmentShader);
    gl_linkProgram(program);

    if (webglDebugMode)
    {
        const success = gl_getProgramParameter(program, gl_LINK_STATUS) as boolean;

        const programInfo = gl_getProgramInfoLog(program);
        if (programInfo && programInfo.length !== 0)
        {
            if (success)
            {
                console.warn(programInfo);
            }
            else
            {
                console.error(programInfo);
                throw new Error("Error linking program");
            }
        }
    }

    return program;
}

export function CreateWebglProgram(vertexShaderSource: string, fragmentShaderSource: string, ...uniforms: string[])
{
    const vertShaderObj = CreateShader(gl_VERTEX_SHADER, vertexShaderSource);
    const fragShaderObj = CreateShader(gl_FRAGMENT_SHADER, fragmentShaderSource);

    const program = CreateAndLinkProgram(vertShaderObj, fragShaderObj);

    // gl_useProgram(program);

    const uniformLocations = new Map<string, WebGLUniformLocation>();
    uniforms.forEach(u => uniformLocations.set(u, gl_getUniformLocation(program, u)!));

    return { program, uniformLocations };
}
