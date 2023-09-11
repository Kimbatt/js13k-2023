Using shader minifier 1.3.6: https://github.com/laurentlb/Shader_Minifier

Command (run for each shader):  
`shader_minifier.exe --aggressive-inlining --field-names xyzw --format js -o shader_code.js vert.glsl frag.glsl`

Also changing class field and function names, object keys, etc. because those are not renamed by closure compiler  
Plus other manual modifications that make the code smaller
