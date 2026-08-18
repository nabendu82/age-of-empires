export function HouseModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.1, 1.6]} />
        <meshStandardMaterial color="#d4b483" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.45, 0.95, 4]} />
        <meshStandardMaterial color="#a33b2a" roughness={0.55} />
      </mesh>
      <mesh position={[0.55, 0.45, 0.82]} castShadow>
        <boxGeometry args={[0.35, 0.55, 0.08]} />
        <meshStandardMaterial color="#5b3a1e" />
      </mesh>
      <mesh position={[-0.45, 0.7, 0.82]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
