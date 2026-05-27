'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const projects = [
  {
    id: 'lead-intelligence',
    name: 'Lead Intelligence Agent',
    desc: 'Analyze companies and generate business insights.',
    tags: ['Sales Agent', 'Data Intelligence', 'Automation'],
    position: [-2.5, 1.2, 0.5] as [number, number, number],
    buttonText: 'Try Demo'
  },
  {
    id: 'outreach-assistant',
    name: 'AI Outreach Assistant',
    desc: 'Generate personalized outreach automatically.',
    tags: ['Personalization', 'Email Agent', 'Copywriting'],
    position: [2.2, 1.5, -0.8] as [number, number, number],
    buttonText: 'Try Demo'
  },
  {
    id: 'client-dashboard',
    name: 'Client Dashboard',
    desc: 'Track project progress in real time.',
    tags: ['Next.js', 'Firebase', 'Real-time sync'],
    position: [-1.8, -1.5, 1.2] as [number, number, number],
    buttonText: 'Open Demo'
  },
  {
    id: 'website-builder',
    name: 'Website Builder',
    desc: 'Launch modern landing pages rapidly.',
    tags: ['Web Design', 'UI Frameworks', 'Tailwind CSS'],
    position: [2.4, -1.2, 0.2] as [number, number, number],
    buttonText: 'View Project'
  },
  {
    id: 'student-automation',
    name: 'Student Automation Suite',
    desc: 'Automate repetitive workflows and save time.',
    tags: ['Productivity', 'Agentic Workflow', 'Education'],
    position: [0.2, 0, -1.5] as [number, number, number],
    buttonText: 'Try Demo'
  }
];

function BackgroundNetwork() {
  const group = useRef<THREE.Group>(null);
  const particleCount = 60;
  
  const [positions, linesData] = useMemo(() => {
    const pos = [];
    for (let i = 0; i < particleCount; i++) {
        // eslint-disable-next-line react-hooks/purity
        const x = (Math.random() - 0.5) * 10;
        // eslint-disable-next-line react-hooks/purity
        const y = (Math.random() - 0.5) * 10;
        // eslint-disable-next-line react-hooks/purity
        const z = (Math.random() - 0.5) * 10;
        pos.push(new THREE.Vector3(x, y, z));
    }

    const linePositions = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        if (pos[i].distanceTo(pos[j]) < 2.5) {
          linePositions.push(pos[i].x, pos[i].y, pos[i].z);
          linePositions.push(pos[j].x, pos[j].y, pos[j].z);
        }
      }
    }
    
    const posArray = new Float32Array(particleCount * 3);
    pos.forEach((v, i) => {
        posArray[i*3] = v.x;
        posArray[i*3+1] = v.y;
        posArray[i*3+2] = v.z;
    });

    return [posArray, new Float32Array(linePositions)];
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.05;
      group.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh 
          key={i} 
          position={[positions[i*3], positions[i*3+1], positions[i*3+2]]}
        >
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshBasicMaterial color="#0F172A" opacity={0.15} transparent wireframe />
        </mesh>
      ))}
      <lineSegments>
        <bufferGeometry>
           <bufferAttribute
             attach="attributes-position"
             count={linesData.length / 3}
             array={linesData}
             itemSize={3}
             args={[linesData, 3]}
           />
        </bufferGeometry>
        <lineBasicMaterial color="#0F172A" opacity={0.06} transparent />
      </lineSegments>
    </group>
  );
}

function ProjectNode({ 
  project, 
  isActive, 
  onClick 
}: { 
  project: typeof projects[0]; 
  isActive: boolean; 
  onClick: () => void; 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.4;
      
      const targetScale = isActive ? 1.6 : hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  return (
    <group position={project.position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial 
          color={hovered || isActive ? "#C6A15B" : "#0F172A"} 
          wireframe={!isActive && !hovered}
          opacity={isActive || hovered ? 0.9 : 0.7}
          transparent
        />
      </mesh>
      
      {!isActive && (
        <Html position={[0, -0.6, 0]} center className="pointer-events-none z-0">
          <div className={`transition-all duration-300 font-heading text-xs whitespace-nowrap tracking-widest uppercase drop-shadow-sm ${hovered ? 'text-brand-accent opacity-100 font-bold' : 'text-slate-500 opacity-70 font-medium'}`}>
            {project.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function SystemScene({ 
  activeProject, 
  setActiveProject 
}: { 
  activeProject: string | null; 
  setActiveProject: (id: string | null) => void; 
}) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (group.current && !activeProject) {
      group.current.rotation.y += delta * 0.08;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    } else if (group.current && activeProject) {
      // Ease rotation to stop when interacting
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, group.current.rotation.y, 0.1);
    }
  });

  return (
    <group ref={group} onClick={() => setActiveProject(null)}>
      <BackgroundNetwork />
      {projects.map((p) => (
        <ProjectNode 
          key={p.id} 
          project={p} 
          isActive={activeProject === p.id} 
          onClick={() => setActiveProject(p.id)} 
        />
      ))}
      
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={16}
            array={(() => {
              const arr = new Float32Array([
                ...projects[0].position, ...projects[1].position,
                ...projects[1].position, ...projects[2].position,
                ...projects[2].position, ...projects[3].position,
                ...projects[3].position, ...projects[4].position,
                ...projects[4].position, ...projects[0].position,
                ...projects[0].position, ...projects[2].position,
                ...projects[1].position, ...projects[3].position,
                ...projects[2].position, ...projects[4].position,
              ]);
              return arr;
            })()}
            itemSize={3}
            args={[
              new Float32Array([
                ...projects[0].position, ...projects[1].position,
                ...projects[1].position, ...projects[2].position,
                ...projects[2].position, ...projects[3].position,
                ...projects[3].position, ...projects[4].position,
                ...projects[4].position, ...projects[0].position,
                ...projects[0].position, ...projects[2].position,
                ...projects[1].position, ...projects[3].position,
                ...projects[2].position, ...projects[4].position,
              ]),
              3
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#C6A15B" opacity={0.15} transparent />
      </lineSegments>
    </group>
  );
}

export default function ProjectNetwork() {
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const selectedProject = projects.find(p => p.id === activeProject);

  return (
    <div className="relative w-full h-[600px] md:h-[800px] bg-brand-primary overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 7.5], fov: 50 }}>
          <ambientLight intensity={1} />
          <SystemScene activeProject={activeProject} setActiveProject={setActiveProject} />
        </Canvas>
      </div>
      
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/2 right-6 md:right-12 -translate-y-1/2 w-full max-w-[calc(100%-3rem)] md:max-w-sm z-10 pointer-events-auto"
          >
            <div className="glass p-8 rounded-2xl border border-brand-accent/20 shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white/80 backdrop-blur-xl">
              <div className="flex justify-between items-start mb-6">
                 <div className="inline-flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                    <span className="text-brand-accent font-heading font-medium tracking-widest text-xs uppercase">Node Selected</span>
                 </div>
                 <button 
                   onClick={() => setActiveProject(null)}
                   className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                 >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
              </div>
              
              <h3 className="font-heading text-2xl font-medium text-brand-secondary mb-3">
                {selectedProject.name}
              </h3>
              
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {selectedProject.desc}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedProject.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-1 rounded-sm bg-slate-100/80 text-slate-500 font-medium tracking-wider uppercase border border-slate-200/50">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col gap-3">
                <Link 
                  href="/projects" 
                  className="inline-flex items-center justify-center w-full bg-brand-secondary text-white py-3 rounded-lg text-sm tracking-wide font-medium hover:bg-brand-accent transition-colors gap-2"
                >
                  {selectedProject.buttonText}
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center justify-center w-full bg-slate-50 border border-slate-200 text-brand-secondary py-3 rounded-lg text-sm tracking-wide font-medium hover:bg-slate-100 transition-colors gap-2"
                >
                  Request Similar Solution
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {!selectedProject && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10"
            >
               <span className="text-slate-500 font-heading text-xs md:text-sm tracking-widest uppercase bg-white/70 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-200/50 shadow-sm inline-flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  Select a node to inspect
               </span>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
