export function WatchTowerModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 2.3, 1.4]} />
        <meshStandardMaterial color="#8d7a62" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[1.7, 0.28, 1.7]} />
        <meshStandardMaterial color="#6b5844" />
      </mesh>
      {[-0.7, 0.7].map((x) =>
        [-0.7, 0.7].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 2.7, z]} castShadow>
            <boxGeometry args={[0.28, 0.45, 0.28]} />
            <meshStandardMaterial color="#5c4a38" />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.85, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[0.2, 3.05, 0]} castShadow>
        <boxGeometry args={[0.42, 0.26, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.55, 1.1, 0.72]} castShadow>
        <boxGeometry args={[0.28, 0.45, 0.08]} />
        <meshStandardMaterial color="#3f2a14" />
      </mesh>
    </group>
  )
}
