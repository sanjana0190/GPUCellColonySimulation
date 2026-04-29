{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab560
\pard\pardeftab560\pardirnatural\partightenfactor0

\f0\fs26 \cf0 # \uc0\u55358 \u56812  GPU Cell Lifecycle Simulation \'97 Prompt Guide\
\
This file contains all prompts to build the project step-by-step.\
Follow them in order. DO NOT skip steps.\
\
For each step:\
1. Paste the prompt into ChatGPT\
2. Implement the code\
3. Run it\
4. Verify output\
5. Move to next prompt\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 1 \'97 Project Setup + WebGPU Initialization\
\
I am building a WebGPU-based Cell Lifecycle Simulation project using TypeScript.\
\
I want you to act as an expert WebGPU instructor and guide me step-by-step like a course. I want to deeply understand the code, not just copy it.\
\
Constraints:\
- Use TypeScript\
- Use Vite for setup\
- Keep code modular and clean\
- Follow best practices (separation of concerns, readable structure)\
- Explain clearly but concisely\
\
For this step, ONLY do the following:\
1. Help me set up the project (folder structure + dependencies)\
2. Create a minimal HTML + canvas setup\
3. Initialize WebGPU (adapter, device, context)\
4. Clear the canvas with a color\
\
DO NOT move ahead.\
\
After giving code:\
- Explain each file\
- Explain adapter, device, context\
- Tell expected output\
\
Wait for confirmation.\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 2 \'97 Render a Grid\
\
Continue from previous step.\
\
For this step:\
1. Create a render pipeline\
2. Render a 2D grid on canvas\
3. Use vertex + fragment shaders (WGSL)\
4. Keep grid simple (lines or squares)\
\
Explain:\
- Render pipeline\
- Vertex buffer\
- Shader basics\
\
Tell expected output.\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 3 \'97 GPU Cell Buffer\
\
Continue from previous step.\
\
For this step:\
1. Create a GPU buffer to store grid cell states\
2. Initialize with random values (0 or 1)\
3. Pass buffer to shader\
4. Render grid based on buffer state\
\
Explain:\
- Storage buffers\
- How GPU reads data\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 4 \'97 First Compute Shader\
\
Continue from previous step.\
\
For this step:\
1. Create a compute shader\
2. Read from cell buffer\
3. Write updated values to another buffer\
4. Dispatch compute workgroups\
\
Explain:\
- Compute pipeline\
- Workgroups\
- Thread mapping\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 5 \'97 Game of Life Rules\
\
Continue from previous step.\
\
For this step:\
1. Implement neighbor checking\
2. Apply Game of Life rules\
3. Update cell states accordingly\
\
Explain:\
- Neighbor indexing\
- Grid boundary handling\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 6 \'97 Double Buffering\
\
Continue from previous step.\
\
For this step:\
1. Create two buffers (current + next)\
2. Swap them every frame\
3. Ensure correct read/write separation\
\
Explain:\
- Why double buffering is needed\
- Common mistakes\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 7 \'97 Cell Lifecycle Extension\
\
Continue from previous step.\
\
For this step:\
1. Add multiple states:\
   - Dead (0)\
   - Alive (1)\
   - Dividing (2)\
   - Dying (3)\
2. Add age property\
3. Update rules to include lifecycle transitions\
\
Explain:\
- State modeling\
- Why this is beyond Game of Life\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 8 \'97 Rendering Improvements\
\
Continue from previous step.\
\
For this step:\
1. Update fragment shader to color based on state\
2. Add smooth transitions (if possible)\
3. Improve visuals\
\
Explain:\
- Color mapping\
- GPU rendering flow\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 9 \'97 Animation Loop\
\
Continue from previous step.\
\
For this step:\
1. Add render loop using requestAnimationFrame\
2. Run compute + render every frame\
3. Control simulation speed\
\
Explain:\
- Frame loop\
- Sync between compute and render\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 10 \'97 UI Controls\
\
Continue from previous step.\
\
For this step:\
1. Add:\
   - Start/Pause button\
   - Reset button\
   - Speed slider\
2. Connect UI to simulation\
\
Explain:\
- State control\
- UI \uc0\u8594  GPU interaction\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 11 \'97 Mouse Interaction\
\
Continue from previous step.\
\
For this step:\
1. Add click interaction\
2. Toggle cells on click\
3. Convert mouse position \uc0\u8594  grid coordinates\
\
Explain:\
- Coordinate mapping\
- Interaction handling\
\
---\
\
# \uc0\u55357 \u57314  PROMPT 12 \'97 Final Optimization + Cleanup\
\
Continue from previous step.\
\
For this step:\
1. Optimize buffer usage\
2. Clean code structure\
3. Add comments for explanation\
4. Prepare for presentation\
\
Explain:\
- Performance considerations\
- Final architecture\
\
---\
\
# \uc0\u55358 \u56800  FINAL STEP \'97 Presentation Help\
\
After completing all steps, ask:\
\
"Help me explain this project in a 2\'963 minute presentation and also prepare for possible questions from the professor."\
\
---\
\
# \uc0\u55357 \u56960  Notes\
\
- Do NOT skip steps\
- Ask for help if something breaks\
- Focus on understanding, not speed}