/**
 * WebGL Shader Programs for GPU-accelerated graph rendering
 *
 * Provides vertex and fragment shaders for rendering nodes and edges efficiently on GPU.
 * Supports instanced rendering, level-of-detail, and viewport transformations.
 */

// === Node Shaders ===

/**
 * Node Vertex Shader
 * Transforms node positions and handles instanced rendering
 */
export const NODE_VERTEX_SHADER = `#version 300 es
precision highp float;

// Per-instance attributes
in vec2 a_position;        // Node world position
in float a_radius;         // Node radius
in vec4 a_color;           // Node color (RGBA)
in float a_shape;          // Shape type (0=circle, 1=square, 2=diamond, 3=triangle)

// Per-vertex attributes (for instanced quad)
in vec2 a_vertex;          // Quad vertex (-1,-1 to 1,1)

// Uniforms
uniform mat3 u_transform;   // Viewport transformation matrix
uniform vec2 u_viewport;    // Viewport size (width, height)
uniform float u_pixelRatio; // Device pixel ratio

// Varying outputs
out vec2 v_texCoord;        // Texture coordinates
out vec4 v_color;          // Interpolated color
out float v_shape;         // Shape type
out float v_radius;        // Radius in pixels

void main() {
  // Transform node position to screen space
  vec3 worldPos = vec3(a_position, 1.0);
  vec3 screenPos = u_transform * worldPos;

  // Convert to normalized device coordinates
  vec2 ndc = screenPos.xy / u_viewport * 2.0 - 1.0;

  // Scale vertex by radius and pixel ratio
  vec2 scaledVertex = a_vertex * a_radius * u_pixelRatio / u_viewport;

  // Final position
  gl_Position = vec4(ndc + scaledVertex, 0.0, 1.0);

  // Pass varying data
  v_texCoord = a_vertex;
  v_color = a_color;
  v_shape = a_shape;
  v_radius = a_radius;
}
`;

/**
 * Node Fragment Shader
 * Renders different node shapes with anti-aliasing
 */
export const NODE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

// Varying inputs
in vec2 v_texCoord;
in vec4 v_color;
in float v_shape;
in float v_radius;

// Output color
out vec4 fragColor;

// Shape constants
const float CIRCLE = 0.0;
const float SQUARE = 1.0;
const float DIAMOND = 2.0;
const float TRIANGLE = 3.0;

// Anti-aliasing factor
const float AA_FACTOR = 1.0;

float circleSDF(vec2 p) {
  return length(p) - 1.0;
}

float squareSDF(vec2 p) {
  vec2 d = abs(p) - 1.0;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float diamondSDF(vec2 p) {
  return abs(p.x) + abs(p.y) - 1.0;
}

float triangleSDF(vec2 p) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0/k;
  if(p.x + k*p.y > 0.0) p = vec2(p.x - k*p.y, -k*p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  vec2 uv = v_texCoord;
  float sdf = 0.0;

  // Calculate signed distance field based on shape
  if (v_shape < 0.5) {
    sdf = circleSDF(uv);
  } else if (v_shape < 1.5) {
    sdf = squareSDF(uv);
  } else if (v_shape < 2.5) {
    sdf = diamondSDF(uv);
  } else {
    sdf = triangleSDF(uv);
  }

  // Anti-aliased alpha
  float alpha = 1.0 - smoothstep(-AA_FACTOR / v_radius, AA_FACTOR / v_radius, sdf);

  // Output final color
  fragColor = vec4(v_color.rgb, v_color.a * alpha);

  // Discard transparent pixels for performance
  if (fragColor.a < 0.01) {
    discard;
  }
}
`;

// === Edge Shaders ===

/**
 * Edge Vertex Shader
 * Renders lines between nodes with thickness
 */
export const EDGE_VERTEX_SHADER = `#version 300 es
precision highp float;

// Per-edge attributes
in vec2 a_start;           // Start position
in vec2 a_end;             // End position
in vec4 a_color;           // Edge color
in float a_width;          // Edge width

// Per-vertex attributes (for line quad)
in vec2 a_vertex;          // Line vertex (-1,-1 to 1,1)

// Uniforms
uniform mat3 u_transform;   // Viewport transformation matrix
uniform vec2 u_viewport;    // Viewport size
uniform float u_pixelRatio; // Device pixel ratio

// Varying outputs
out vec2 v_texCoord;
out vec4 v_color;
out float v_width;

void main() {
  // Transform edge positions to screen space
  vec3 startWorld = vec3(a_start, 1.0);
  vec3 endWorld = vec3(a_end, 1.0);

  vec3 startScreen = u_transform * startWorld;
  vec3 endScreen = u_transform * endWorld;

  // Calculate line direction and normal
  vec2 direction = normalize(endScreen.xy - startScreen.xy);
  vec2 normal = vec2(-direction.y, direction.x);

  // Interpolate position along line
  vec2 position = mix(startScreen.xy, endScreen.xy, (a_vertex.x + 1.0) * 0.5);

  // Add width offset
  position += normal * a_vertex.y * a_width * u_pixelRatio * 0.5;

  // Convert to NDC
  vec2 ndc = position / u_viewport * 2.0 - 1.0;

  gl_Position = vec4(ndc, 0.0, 1.0);

  // Pass varying data
  v_texCoord = a_vertex;
  v_color = a_color;
  v_width = a_width;
}
`;

/**
 * Edge Fragment Shader
 * Renders lines with anti-aliasing
 */
export const EDGE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

// Varying inputs
in vec2 v_texCoord;
in vec4 v_color;
in float v_width;

// Output color
out vec4 fragColor;

void main() {
  // Distance from center line
  float distance = abs(v_texCoord.y);

  // Anti-aliased alpha based on distance from edge
  float alpha = 1.0 - smoothstep(1.0 - 1.0/v_width, 1.0, distance);

  // Output color
  fragColor = vec4(v_color.rgb, v_color.a * alpha);

  // Discard transparent pixels
  if (fragColor.a < 0.01) {
    discard;
  }
}
`;

// === Picking Shader (for GPU-based node selection) ===

/**
 * Picking Vertex Shader
 * Same as node vertex shader but outputs node IDs as colors
 */
export const PICKING_VERTEX_SHADER = `#version 300 es
precision highp float;

// Per-instance attributes
in vec2 a_position;
in float a_radius;
in float a_nodeId;         // Node ID encoded as float

// Per-vertex attributes
in vec2 a_vertex;

// Uniforms
uniform mat3 u_transform;
uniform vec2 u_viewport;
uniform float u_pixelRatio;

// Varying outputs
out vec2 v_texCoord;
out float v_nodeId;
out float v_radius;

void main() {
  // Transform position (same as node shader)
  vec3 worldPos = vec3(a_position, 1.0);
  vec3 screenPos = u_transform * worldPos;
  vec2 ndc = screenPos.xy / u_viewport * 2.0 - 1.0;
  vec2 scaledVertex = a_vertex * a_radius * u_pixelRatio / u_viewport;

  gl_Position = vec4(ndc + scaledVertex, 0.0, 1.0);

  v_texCoord = a_vertex;
  v_nodeId = a_nodeId;
  v_radius = a_radius;
}
`;

/**
 * Picking Fragment Shader
 * Outputs node ID as color for GPU picking
 */
export const PICKING_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in float v_nodeId;
in float v_radius;

out vec4 fragColor;

// Encode node ID as RGBA color
vec4 encodeId(float id) {
  int iid = int(id);
  return vec4(
    float((iid >> 0) & 0xFF) / 255.0,
    float((iid >> 8) & 0xFF) / 255.0,
    float((iid >> 16) & 0xFF) / 255.0,
    float((iid >> 24) & 0xFF) / 255.0
  );
}

void main() {
  // Simple circle test for picking
  float distance = length(v_texCoord);
  if (distance > 1.0) {
    discard;
  }

  fragColor = encodeId(v_nodeId);
}
`;

// === Shader Compilation Utilities ===

export interface ShaderProgram {
  program: WebGLProgram;
  attributes: { [name: string]: number };
  uniforms: { [name: string]: WebGLUniformLocation | null };
}

/**
 * Compile a WebGL shader from source
 */
export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${error}`);
  }

  return shader;
}

/**
 * Create and link a shader program
 */
export function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: string[],
  uniforms: string[]
): ShaderProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create shader program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${error}`);
  }

  // Clean up individual shaders
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  // Get attribute and uniform locations
  const attributeLocations: { [name: string]: number } = {};
  const uniformLocations: { [name: string]: WebGLUniformLocation | null } = {};

  for (const attribute of attributes) {
    attributeLocations[attribute] = gl.getAttribLocation(program, attribute);
  }

  for (const uniform of uniforms) {
    uniformLocations[uniform] = gl.getUniformLocation(program, uniform);
  }

  return {
    program,
    attributes: attributeLocations,
    uniforms: uniformLocations
  };
}

// === Shader Program Configurations ===

export const NODE_SHADER_CONFIG = {
  attributes: ['a_position', 'a_radius', 'a_color', 'a_shape', 'a_vertex'],
  uniforms: ['u_transform', 'u_viewport', 'u_pixelRatio']
};

export const EDGE_SHADER_CONFIG = {
  attributes: ['a_start', 'a_end', 'a_color', 'a_width', 'a_vertex'],
  uniforms: ['u_transform', 'u_viewport', 'u_pixelRatio']
};

export const PICKING_SHADER_CONFIG = {
  attributes: ['a_position', 'a_radius', 'a_nodeId', 'a_vertex'],
  uniforms: ['u_transform', 'u_viewport', 'u_pixelRatio']
};