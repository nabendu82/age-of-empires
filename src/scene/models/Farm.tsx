export function FarmModel({ color = '#3b82f6' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.12, 2.6]} />
        <meshStandardMaterial color="#6b4a2a" roughness={0.95} />
      </mesh>
      {[-0.7, 0, 0.7].map((z) =>
        [-0.7, 0, 0.7].map((x) => (
          <mesh key={`${x}:${z}`} position={[x, 0.28, z]} castShadow>
            <boxGeometry args={[0.45, 0.4, 0.18]} />
            <meshStandardMaterial color="#4d7c3f" roughness={0.7} />
          </mesh>
        )),
      )}
      <mesh position={[1.05, 0.22, 1.05]} castShadow>
        <boxGeometry args={[0.18, 0.35, 0.18]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}
