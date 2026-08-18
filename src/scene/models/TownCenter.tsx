export function TownCenterModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 1.4, 3.4]} />
        <meshStandardMaterial color="#c4a574" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[2.6, 0.7, 2.6]} />
        <meshStandardMaterial color="#b08958" roughness={0.75} />
      </mesh>
      <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.15, 1.3, 4]} />
        <meshStandardMaterial color="#8b3a2a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[0.22, 3.55, 0]} castShadow>
        <boxGeometry args={[0.55, 0.35, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.1, 1.15, 1.75]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color="#3f2a14" />
      </mesh>
    </group>
  )
}
